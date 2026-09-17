"""Service de transcription vocale (dictee) pour l'Atelier documentaire Rebond.

Service local, stateless : recoit un enregistrement audio complet (webm) via
une simple requete HTTP POST, le transcrit, renvoie le texte. Pas de
websocket ni de segmentation - repris de zero apres une version streaming
(VAD + WebSocket) qui n'a jamais fonctionne de bout en bout en usage reel.
L'enregistrement est fait dans son entierete cote client (MediaRecorder),
envoye une seule fois a la fin de la dictee.
"""

import asyncio
import json
import logging
import os
import tempfile

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from correction import apply_keyword_corrections
from model import LoadedModel, load_model, transcribe
from numbers_fr import spell_out_numbers

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dictation-service")

CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "http://localhost:5173")

app = FastAPI(title="dictation-service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CORS_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

_loaded_model: LoadedModel | None = None
# Un seul modele charge en memoire : on serialise les appels transcribe()
# entre eux (thread-safety non garantie par ctranslate2 pour des appels
# concurrents sur la meme instance).
_model_lock = asyncio.Lock()


@app.on_event("startup")
def _startup() -> None:
    global _loaded_model
    _loaded_model = load_model()


@app.get("/health")
def health():
    if _loaded_model is None:
        return {"status": "loading"}
    return {
        "status": "ok",
        "device": _loaded_model.device,
        "computeType": _loaded_model.compute_type,
        "modelId": _loaded_model.model_id,
    }


MAX_PROMPT_CHARS = 2000
MAX_KEYWORDS = 60


@app.post("/transcribe")
async def transcribe_endpoint(
    file: UploadFile = File(...),
    prompt: str | None = Form(None),
    keywords: str | None = Form(None),
):
    if _loaded_model is None:
        raise HTTPException(status_code=503, detail="Modele en cours de chargement, reessayez dans un instant.")

    data = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    initial_prompt = prompt[:MAX_PROMPT_CHARS] if prompt else None

    keyword_list: list[str] = []
    if keywords:
        try:
            parsed = json.loads(keywords)
            if isinstance(parsed, list):
                keyword_list = [str(k) for k in parsed if isinstance(k, str)][:MAX_KEYWORDS]
        except (json.JSONDecodeError, TypeError):
            pass  # keywords malforme : on ignore plutot que d'echouer toute la transcription

    try:
        async with _model_lock:
            text = await asyncio.get_event_loop().run_in_executor(
                None, transcribe, _loaded_model, tmp_path, initial_prompt,
            )
        # Corrige les mots proches d'un mot-cle mais mal reconnus - voir
        # correction.py pour la methode et ses limites (pas une vraie
        # comparaison phonetique).
        text = apply_keyword_corrections(text, keyword_list)
        # Convention des actes anciens : nombres toujours en toutes lettres,
        # jamais en chiffres (voir numbers_fr.py) - demande explicite.
        text = spell_out_numbers(text)
        return {"text": text}
    except Exception as exc:
        logger.exception("Echec transcription")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        os.unlink(tmp_path)
