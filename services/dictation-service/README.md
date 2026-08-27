# dictation-service

Service local de transcription vocale (dictee) pour l'Atelier documentaire de Rebond. Utilise [faster-whisper](https://github.com/SYSTRAN/faster-whisper) avec le modele fine-tune francais de bofenghuang (variante distillee par defaut).

Stateless : recoit un enregistrement audio complet via une requete HTTP, le transcrit, renvoie le texte, oublie tout. Aucune retention audio cote serveur.

Repris de zero apres une premiere version streaming (VAD cote client + WebSocket segmente) qui n'a jamais fonctionne de bout en bout en usage reel (plusieurs bugs distincts en cascade). Cette version a beaucoup moins de pieces mobiles : un enregistrement, une requete, une reponse.

## Prerequis

- Python 3.10+ (teste avec 3.12 ; ctranslate2 4.4.0 n'a pas de wheel 3.13 au moment de l'ecriture)
- Optionnel : GPU NVIDIA + CUDA/cuDNN installes au niveau systeme si vous voulez l'acceleration GPU. **`pip install` seul ne suffit pas** pour le support GPU : les librairies CUDA/cuDNN doivent etre presentes sur la machine independamment de ce projet. En leur absence, le service bascule automatiquement sur CPU (int8) sans erreur bloquante.

> **CPU sans AVX-512 (ex. Intel 8e/9e gen type i5-8350U) : `ctranslate2` doit rester en 4.4.0.**
> Constate en pratique : les versions plus recentes de `ctranslate2` (4.5+, teste jusqu'a 4.8.1)
> plantent (crash natif, pas d'exception Python) au chargement de n'importe quel modele sur
> CPU sur ce type de machine - reproduit avec le modele "tiny" standard, independamment du
> `compute_type` (`int8` et `float32` plantent tous les deux). `requirements.txt` epingle donc
> `ctranslate2==4.4.0` (qui necessite `setuptools<81` pour `pkg_resources`). A retester sans le
> pin si une version plus recente corrige ce probleme, ou si vous etes sur un CPU avec AVX-512/GPU.

## Installation

### Windows (PowerShell)

```powershell
cd services/dictation-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

### macOS / Linux

```bash
cd services/dictation-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Lancement

```bash
uvicorn main:app --port 8000 --reload
```

Au premier lancement, le modele est telecharge depuis Hugging Face (sous-dossier `ctranslate2/` du repo) dans `.model-cache/` local au service - ca peut prendre plusieurs minutes selon la connexion et la taille du modele choisi.

Verifier que ca tourne :

```bash
curl http://localhost:8000/health
```

Doit renvoyer le device reellement utilise (`cuda` ou `cpu`) - c'est la source de verite pour savoir si l'acceleration GPU est active, pas une supposition.

## Configuration (`.env`)

- `MODEL_ID` - repo Hugging Face du modele. Par defaut une variante distillee (`whisper-large-v3-french-distil-dec4`), plus rapide sur CPU. Passer a `bofenghuang/whisper-large-v3-french` (modele complet) si vous avez un GPU et voulez la meilleure qualite.
- `MODEL_LOCAL_PATH` - pour pointer directement sur un checkpoint deja telecharge, sans repasser par Hugging Face.
- `CORS_ORIGIN` - origine autorisee pour les connexions (par defaut le serveur vite de rebond, `http://localhost:5173`).

## API

- `GET /health` → `{"status":"ok","device":"cuda|cpu","computeType":"...","modelId":"..."}`
- `POST /transcribe` (`multipart/form-data`, champ `file` = l'enregistrement audio, n'importe quel format lisible par ffmpeg — webm/opus depuis `MediaRecorder`, wav, etc.) → `{"text":"..."}` ou une erreur HTTP (4xx/5xx) avec `{"detail":"..."}`.

Exemple :

```bash
curl -F "file=@test.webm" http://localhost:8000/transcribe
```
