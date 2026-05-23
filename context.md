# Context for PersonaForge

## 1. Product

A local-first desktop AI chat app for Windows. Three switchable personas
(Assistant, Tutor, Thinker) running against a local Ollama model, with a
creativity slider (1–10) that controls both prompt intensity and a
random-refusal probability, optional DuckDuckGo web search, and on-device
voice synthesis with optional voice cloning via Coqui XTTS v2. Everything
runs on the user's machine.

## 2. Target hardware

Built on a Ryzen 9 + RTX 3070 Laptop (8 GB VRAM). Ollama 8B Q4 quant fits
in ~5 GB; XTTS v2 needs the rest. The two models cannot live in VRAM at
the same time — see §8.

## 3. Tech stack

- Frontend: React + TypeScript + Tailwind CSS + Framer Motion (Vite).
- Backend: Python 3.10+, FastAPI on port 8123, SQLModel + SQLite.
- LLM: Ollama `/api/chat` with streaming.
- Web search: `duckduckgo-search` (no API key).
- TTS: Coqui XTTS v2 (multilingual, GPU).
- Desktop shell: Electron.
- Packaging: PyInstaller for the backend, electron-builder NSIS for the app.

## 4. UI theme

Forced dark mode. Background `#0a0d12`. Glass cards with `backdrop-filter`
blur. The accent colour is a per-persona CSS variable:

- Assistant — cool teal (`#06b6d4`)
- Tutor — warm amber (`#f59e0b`)
- Thinker — vivid violet (`#a855f7`)

The persona class is set via `[data-persona="…"]` on the app shell, so the
entire UI re-themes when the user switches personas. Reusable styles:
`.glass-panel`, `.field`, `.btn-primary`, `.btn-ghost`. Single-page
layout — no router, just `<ChatLayout />`. Vite is configured with
`base: "./"` for Electron `file://` compatibility.

## 5. Architecture

- Electron's main process spawns the Python backend (`backend/runner.py`
  in dev, `personaforge_backend.exe` in production) and then loads the
  built frontend.
- FastAPI provides REST + SSE endpoints (see `backend/app/api/router.py`).
- Chat: the system prompt scales with the creativity slider; refusal
  probability is `level × 10%`.
- Web search: DuckDuckGo news + text (past week) is prepended as context
  to the model and surfaced to the user via a `SearchResultsCard`.
- Auto-naming: after 4 messages (2 exchanges) a background thread asks
  Ollama for a short title and writes it to SQLite.

## 6. Folder structure

```
backend/app/services/   ollama.py, tts.py, search.py
backend/app/services/personas/  assistant.py, tutor.py, thinker.py,
                                registry.py, __init__.py (convenience fns)
backend/app/api/        chat.py, conversations.py, settings.py, status.py,
                        models.py, personas.py, tts.py, router.py
frontend/src/components/    ChatLayout, ChatSidebar, ChatMain, ChatInput,
                            MessageBubble, CreativitySlider, ModelSelector,
                            TypingIndicator, AmbientBackground,
                            SettingsDrawer, SearchResultsCard,
                            PersonaSwitcher, CodeBlock
frontend/src/lib/       api.ts, personas.ts
desktop/                main.js, preload.js
voices/                 optional reference WAVs (assistant.wav, tutor.wav,
                        thinker.wav)
data/                   SQLite DB + logs (gitignored)
```

## 7. Creativity slider mechanic

Slider 1–10 in the sidebar drives two things:

1. **System prompt selection** — each persona defines ten escalating prompts
   in its `system_prompts` dict (see `backend/app/services/personas/<id>.py`).
2. **Random refusal** — `random.random() < level * 0.10`. On refusal the
   model is bypassed and a persona-specific decline message is returned
   instead. Refusal messages are tagged `refused=True` in storage and
   filtered out of subsequent history so the model doesn't mimic them.

Level 1 ≈ literal/focused, 10% refusal. Level 10 ≈ wild/divergent, 100%
refusal — at the top of the slider the persona dominates over the model.

## 8. GPU coordination

A module-level `threading.Lock` in `services/tts.py` serialises all
GPU-heavy work. TTS synthesis path:

1. Acquire `_gpu_lock`.
2. Call `OllamaService.unload_model()` — iterates `/api/ps` and pokes each
   running model with `keep_alive=0` to evict it from VRAM.
3. Load XTTS v2 onto CUDA (cached on the class for repeat calls inside
   the same lock acquisition; freed in step 5).
4. Synthesise to a temp WAV. If the persona's reference voice file exists
   at `voices/<persona>.wav`, it's used for voice cloning; otherwise the
   XTTS built-in default speaker is used so TTS still works without any
   user-supplied audio.
5. `del cls._model; torch.cuda.empty_cache()` — releases VRAM so Ollama
   auto-reloads on the next chat request.

## 9. Persona prompt injection (important)

Ollama's `/api/chat` treats a `system` role message as a wholesale
replacement of any Modelfile SYSTEM directive. To stay compatible with
custom Modelfiles, the persona instructions are injected as a
`user`/`assistant` exchange at the start of the message list:

```python
[
  {"role": "user",
   "content": "[PERSONA INSTRUCTIONS]: …\nFollow these instructions for every response."},
  {"role": "assistant",
   "content": "Understood — I'll follow that style for the whole conversation."},
  …actual chat history…,
  {"role": "user", "content": message},
]
```

This composes with the model's own SYSTEM and works even with persona
authors who later want to swap in a custom Modelfile.

## 10. API endpoints

```
GET    /api/status
GET    /api/models                       — Ollama models
GET    /api/personas                     — persona metadata
GET    /api/settings
POST   /api/settings
POST   /api/chat                         — non-streaming
POST   /api/chat/stream                  — SSE streaming
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/{id}/messages
DELETE /api/conversations/{id}
PATCH  /api/conversations/{id}
POST   /api/tts                          — text → WAV
```

## 11. Config and environment

`config.yaml`:

```yaml
app:        { data_dir, log_level }
ollama:     { base_url, default_model, temperature, max_tokens }
creativity: { default_level, web_search }
```

Environment overrides:

- `OLLAMA_BASE_URL`
- `OLLAMA_DEFAULT_MODEL`

## 12. Build

- Backend: `pyinstaller build/pyinstaller/personaforge_backend.spec
  --distpath dist/backend --clean -y`
- Frontend: `npm --prefix frontend run build`
- Electron: `npm run dist` (runs both of the above and produces an NSIS
  installer in `dist/`).
- One-shot: `.\build_windows.ps1`.

## 13. Files to read first

1. `README.md`
2. `context.md` (this file)
3. `backend/app/services/personas/__init__.py`
4. `backend/app/services/personas/assistant.py` (an example persona module)
5. `backend/app/services/tts.py`
6. `backend/app/api/chat.py`
7. `frontend/src/components/ChatLayout.tsx`
8. `frontend/src/lib/personas.ts`
9. `desktop/main.js`
