"""TTS API endpoint — POST /api/tts to synthesize speech."""

import logging
from typing import Any, Dict

from fastapi import APIRouter
from fastapi.responses import Response

from ..services.personas.registry import DEFAULT_PERSONA

router = APIRouter()
logger = logging.getLogger("api.tts")


@router.post("")
def synthesize(payload: Dict[str, Any]):
    text: str = payload.get("text", "").strip()
    persona: str = payload.get("persona", DEFAULT_PERSONA)

    if not text:
        return Response(content="No text provided", status_code=400)

    try:
        from ..services.tts import TTSService

        svc = TTSService()
        wav_bytes = svc.synthesize(text=text, persona=persona)
        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=tts.wav"},
        )
    except FileNotFoundError as e:
        logger.error(f"TTS voice file error: {e}")
        return Response(content=str(e), status_code=404)
    except TimeoutError:
        return Response(content="GPU busy, try again later", status_code=503)
    except Exception:
        logger.exception("TTS synthesis failed")
        return Response(content="TTS synthesis failed", status_code=500)
