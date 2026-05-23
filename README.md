# PersonaForge

A local-first desktop AI chat app for Windows. Talk to a local Ollama model
through three switchable personas (Assistant, Tutor, Thinker), with a
creativity slider that controls how literal or exploratory the responses get,
optional DuckDuckGo web search, and on-device voice synthesis with optional
voice cloning via Coqui XTTS v2. Everything runs on your machine — no API keys,
no cloud calls.

## Features

- **Multi-persona chat** — switch between Assistant, Tutor, and Thinker.
  Each persona has its own colour theme, ten system-prompt presets, and a set
  of in-character "decline" responses.
- **Creativity slider (1–10)** — drives two things in parallel:
  1. Which of the persona's ten system prompts is used (1 = literal/focused,
     10 = wild/divergent).
  2. A random-refusal probability of `level × 10%`. At higher creativity, the
     model occasionally declines with a short in-persona message, giving the
     personality more presence in the conversation.
- **Streaming chat** — SSE streaming from FastAPI to a React frontend, with
  abort support and auto-generated conversation titles after the first
  exchange.
- **Web search** — optional DuckDuckGo-backed retrieval (news + text, past
  week). Results are prepended as context and surfaced in an expandable card
  under the response.
- **On-device TTS with voice cloning** — Coqui XTTS v2 running on the GPU.
  Each persona can use either the built-in XTTS speaker or a custom reference
  WAV you drop into `voices/<persona>.wav` for voice cloning.
- **GPU coordination** — Ollama is unloaded before TTS synthesis so the 8 GB
  VRAM budget on a single GPU is enough for both, then released so Ollama
  auto-reloads on the next chat message.
- **Conversation history** — SQLite via SQLModel, with rename and delete.
- **Per-persona theming** — accent colours, taglines, slider labels, and
  empty-state copy all change with the active persona.

## Tech Stack

- **Frontend:** React + TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend:** Python 3.10+, FastAPI, SQLModel (SQLite)
- **LLM:** Ollama (`/api/chat`, streaming)
- **Web search:** `duckduckgo-search`
- **TTS:** Coqui XTTS v2 (multilingual, GPU)
- **Desktop shell:** Electron
- **Packaging:** PyInstaller (backend exe) + electron-builder (NSIS installer)

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) running locally
- (Optional) NVIDIA GPU with CUDA for TTS

### Install

```powershell
# Python environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Node dependencies
npm install
npm --prefix frontend install

# Pull a base model in Ollama
ollama pull llama3.1:8b
```

### Run in dev mode

All-in-one (backend + frontend + Electron):

```powershell
.\run_app.bat
```

Or separately:

```powershell
.\run_backend.bat
.\run_frontend.bat
```

The frontend dev server is at <http://localhost:5173>, the backend API at
<http://127.0.0.1:8123/api>.

## Adding a voice for cloning

Drop a clean 5–15 second WAV file at one of these paths and the matching
persona will use it as the voice-clone reference on next TTS synthesis:

```
voices/assistant.wav
voices/tutor.wav
voices/thinker.wav
```

If a file isn't present, that persona falls back to the bundled XTTS default
speaker, so TTS still works out of the box.

## Building for Windows

```powershell
.\build_windows.ps1
```

This will:

1. Build a single-file backend executable with PyInstaller.
2. Build the React frontend.
3. Package the Electron app with electron-builder.

The NSIS installer ends up in `dist/`.

## Project Layout

```
backend/
  app/
    api/         FastAPI routers (chat, conversations, models, personas,
                 settings, status, tts)
    core/        config + logging
    services/    ollama, search, tts
    services/personas/   assistant, tutor, thinker + registry
    db.py        SQLite + SQLModel setup
    main.py      FastAPI app factory
  runner.py      uvicorn entry point (used by Electron + PyInstaller)

frontend/
  src/
    components/  React UI (ChatLayout, ChatSidebar, ChatMain, ChatInput,
                 MessageBubble, PersonaSwitcher, CreativitySlider, ...)
    lib/         api client + persona config
    styles/      Tailwind + per-persona CSS variables

desktop/
  main.js        Electron main process (spawns backend, loads frontend)
  preload.js     Electron preload bridge

build/pyinstaller/  PyInstaller spec
voices/             Reference WAVs for voice cloning (optional)
data/               SQLite DB + logs (gitignored)
```

## Configuration

`config.yaml` (project root) controls defaults:

```yaml
app:
  data_dir: data
  log_level: INFO

ollama:
  base_url: http://127.0.0.1:11434
  default_model: "llama3.1:8b"
  temperature: 0.7
  max_tokens: 1024

creativity:
  default_level: 3
  web_search: false
```

Environment variables (overrides for the above):

- `OLLAMA_BASE_URL`
- `OLLAMA_DEFAULT_MODEL`

## API

| Method     | Path                                       | Notes                              |
|------------|--------------------------------------------|------------------------------------|
| `GET`      | `/api/status`                              | health check                       |
| `GET`      | `/api/models`                              | available Ollama models            |
| `GET`/`POST` | `/api/settings`                          | app settings (creativity, model, …)|
| `GET`      | `/api/personas`                            | persona metadata                   |
| `POST`     | `/api/chat`                                | non-streaming chat                 |
| `POST`     | `/api/chat/stream`                         | SSE streaming chat                 |
| `GET`/`POST`/`DELETE`/`PATCH` | `/api/conversations[/{id}[/messages]]` | history CRUD     |
| `POST`     | `/api/tts`                                 | text → WAV (voice clone or default)|

## Architecture notes

- **Persona instruction injection.** The system prompt is appended as a
  `user`/`assistant` exchange at the start of the message list rather than as
  a `system` message, so it composes with any underlying Modelfile SYSTEM
  directive without overriding it. Refusal messages are stripped from history
  before being sent back to the model to prevent the model from mimicking
  them.
- **GPU sharing.** A single `threading.Lock` gates all GPU work. TTS
  acquires the lock, unloads any active Ollama model via
  `/api/generate?keep_alive=0`, loads XTTS v2 onto CUDA, synthesises, and
  then frees VRAM so Ollama auto-reloads on the next chat call.
- **Auto-naming.** After the fourth message (two exchanges), a background
  thread asks Ollama for a 3-word title and writes it back into SQLite. The
  frontend polls and picks it up.

## License

This project is published as a CV piece. Adapt it as you like.
