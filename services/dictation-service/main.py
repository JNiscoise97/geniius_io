"""Service de transcription vocale (dictee) pour l'Atelier documentaire Rebond.

Service local, stateless : recoit un enregistrement audio complet (webm) via
une simple requete HTTP POST, le transcrit, renvoie le texte. Pas de
websocket ni de segmentation - repris de zero apres une version streaming
(VAD + WebSocket) qui n'a jamais fonctionne de bout en bout en usage reel.
L'enregistrement est fait dans son entierete cote client (MediaRecorder),
envoye une seule fois a la fin de la dictee.
"""

import asyncio
import logging
import os
import tempfile

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from model import LoadedModel, load_model, transcribe

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


@app.post("/transcribe")
async def transcribe_endpoint(file: UploadFile = File(...), prompt: str | None = Form(None)):
    if _loaded_model is None:
        raise HTTPException(status_code=503, detail="Modele en cours de chargement, reessayez dans un instant.")

    data = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    initial_prompt = prompt[:MAX_PROMPT_CHARS] if prompt else None

    try:
        async with _model_lock:
            text = await asyncio.get_event_loop().run_in_executor(
                None, transcribe, _loaded_model, tmp_path, initial_prompt,
            )
        return {"text": text}
    except Exception as exc:
        logger.exception("Echec transcription")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        os.unlink(tmp_path)
