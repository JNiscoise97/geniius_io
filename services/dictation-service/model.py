"""Chargement du modele faster-whisper avec bascule automatique GPU -> CPU."""

import logging
import os
from dataclasses import dataclass

from faster_whisper import WhisperModel
from huggingface_hub import snapshot_download

logger = logging.getLogger("dictation-service")

DEFAULT_MODEL_ID = "bofenghuang/whisper-large-v3-french-distil-dec4"
MODEL_CACHE_DIR = os.path.join(os.path.dirname(__file__), ".model-cache")


@dataclass
class LoadedModel:
    model: WhisperModel
    model_id: str
    device: str
    compute_type: str


def _resolve_model_path(model_id: str) -> str:
    """Telecharge (si besoin) le sous-dossier ctranslate2/ du repo HF et
    renvoie le chemin local a passer a WhisperModel.

    Les checkpoints CTranslate2 de bofenghuang vivent sous un sous-dossier
    ctranslate2/ du repo HF plutot qu'a la racine attendue par faster-whisper
    par defaut.
    """
    local_root = snapshot_download(repo_id=model_id, allow_patterns=["ctranslate2/*"], cache_dir=MODEL_CACHE_DIR)
    ct2_path = os.path.join(local_root, "ctranslate2")
    if not os.path.isdir(ct2_path):
        raise RuntimeError(
            f"Aucun sous-dossier ctranslate2/ trouve dans {model_id} (local: {local_root}). "
            "Verifier le layout du repo HuggingFace ou definir MODEL_LOCAL_PATH manuellement."
        )
    return ct2_path


def load_model() -> LoadedModel:
    model_id = os.environ.get("MODEL_ID", DEFAULT_MODEL_ID)
    local_path = os.environ.get("MODEL_LOCAL_PATH")

    if not local_path:
        logger.info(f"dictation-service: telechargement/verification du modele {model_id}...")
        local_path = _resolve_model_path(model_id)

    try:
        model = WhisperModel(local_path, device="cuda", compute_type="float16")
        logger.info("dictation-service: modele charge sur CUDA (float16)")
        return LoadedModel(model=model, model_id=model_id, device="cuda", compute_type="float16")
    except Exception as exc:
        logger.warning(f"dictation-service: CUDA indisponible ({exc}), bascule sur CPU (int8)")
        model = WhisperModel(local_path, device="cpu", compute_type="int8")
        logger.info("dictation-service: modele charge sur CPU (int8)")
        return LoadedModel(model=model, model_id=model_id, device="cpu", compute_type="int8")


def transcribe(loaded: LoadedModel, audio_path: str, initial_prompt: str | None = None) -> str:
    # faster-whisper decode l'audio via PyAV/ffmpeg, donc n'importe quel
    # format (webm/opus depuis MediaRecorder, wav, etc.) fonctionne sans
    # conversion prealable cote client.
    #
    # initial_prompt : biaise la reconnaissance vers un vocabulaire attendu
    # (noms propres rares du document en cours - patronymes, communes) plutot
    # que leur sosie phonetique le plus courant. Construit cote client a
    # partir du contexte du document (voir dictation.prompt.ts).
    #
    # vad_filter=False : le filtre VAD integre de faster-whisper necessite le
    # package Python `onnxruntime`, dont le DLL natif ne charge pas sur cette
    # machine (ImportError DLL load failed sur onnxruntime_pybind11_state) -
    # encore un probleme de dependance native Windows, pas une vraie
    # necessite fonctionnelle. A reessayer si onnxruntime est corrige/reinstalle.
    segments, _info = loaded.model.transcribe(
        audio_path, language="fr", beam_size=5, vad_filter=False, initial_prompt=initial_prompt or None,
    )
    return "".join(segment.text for segment in segments).strip()
