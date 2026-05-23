"""TTS service using Coqui XTTS v2 for voice cloning.

Shares GPU with Ollama — unloads Ollama before synthesis, then frees VRAM
so Ollama auto-reloads on next chat request.
"""

import logging
import os
import re
import threading
from pathlib import Path

from .ollama import OllamaService

logger = logging.getLogger("service.tts")

# Project root (backend/../voices/)
_VOICES_DIR = Path(__file__).resolve().parents[3] / "voices"
_VOICES_DIR.mkdir(parents=True, exist_ok=True)

# Global lock — only one GPU-heavy task at a time
_gpu_lock = threading.Lock()


def _preprocess_text(text: str) -> str:
    """Clean text for TTS: convert numbers to English words, strip action markers."""
    # Remove *action* markers (safety net)
    text = re.sub(r"\*[^*]+\*", "", text)
    # Convert numbers to English words (avoids num2words Hindi/lang bugs)
    try:
        from num2words import num2words as n2w
        text = re.sub(r"\d+", lambda m: n2w(int(m.group(0)), lang="en"), text)
    except Exception:
        text = re.sub(r"\d+", "", text)
    # Collapse multiple spaces
    text = re.sub(r"  +", " ", text).strip()
    return text


class TTSService:
    _model = None

    @classmethod
    def _load_model(cls):
        if cls._model is not None:
            return cls._model
        logger.info("Loading XTTS v2 model (first use)...")
        from TTS.api import TTS as CoquiTTS

        cls._model = CoquiTTS("tts_models/multilingual/multi-dataset/xtts_v2").to("cuda")
        logger.info("XTTS v2 model loaded on GPU")
        return cls._model

    @classmethod
    def _unload_model(cls):
        import torch

        if cls._model is not None:
            del cls._model
            cls._model = None
        torch.cuda.empty_cache()
        logger.info("XTTS v2 model unloaded, VRAM freed")

    def synthesize(self, text: str, persona: str, language: str = "en") -> bytes:
        """Synthesize speech from text using the persona's reference voice.

        If the persona's WAV file is missing, falls back to the XTTS v2
        built-in default speaker so TTS still works out-of-the-box.

        Returns WAV bytes.
        """
        from .personas import PERSONAS
        from .personas.registry import DEFAULT_PERSONA

        p = PERSONAS.get(persona, PERSONAS[DEFAULT_PERSONA])
        voice_file = p.get("tts_voice_file")
        lang = p.get("tts_language", language)

        # Resolve voice file path; if it doesn't exist on disk we'll quietly
        # fall back to the bundled XTTS default speaker rather than raising.
        speaker_wav = None
        if voice_file:
            candidate = str(_VOICES_DIR / Path(voice_file).name)
            if os.path.exists(candidate):
                speaker_wav = candidate
            else:
                logger.info(
                    "No reference voice for persona '%s' at %s — using XTTS default speaker",
                    persona,
                    candidate,
                )

        acquired = _gpu_lock.acquire(timeout=120)
        if not acquired:
            raise TimeoutError("GPU is busy, try again later")

        try:
            # 1. Unload Ollama to free VRAM
            ollama = OllamaService()
            ollama.unload_model()
            logger.info("Ollama unloaded for TTS synthesis")

            # 2. Load XTTS model
            model = self._load_model()

            # 3. Synthesize
            logger.info(f"Synthesizing TTS: persona={persona}, lang={lang}, text_len={len(text)}")

            # Truncate very long text to avoid OOM
            if len(text) > 1000:
                text = text[:1000] + "..."

            # Preprocess: numbers → words, strip *actions*
            text = _preprocess_text(text)
            if not text:
                raise ValueError("No speakable text after preprocessing")

            wav_path = str(_VOICES_DIR / "_temp_output.wav")

            if speaker_wav:
                model.tts_to_file(
                    text=text,
                    speaker_wav=speaker_wav,
                    language=lang,
                    file_path=wav_path,
                )
            else:
                # No reference voice — use XTTS v2's built-in default speaker.
                # The XTTS multilingual model ships with a generic speaker that
                # works without any reference WAV.
                model.tts_to_file(
                    text=text,
                    speaker="Claribel Dervla",
                    language=lang,
                    file_path=wav_path,
                )

            # 4. Read the output WAV into memory
            with open(wav_path, "rb") as f:
                wav_bytes = f.read()

            # Cleanup temp file
            try:
                os.remove(wav_path)
            except OSError:
                pass

            logger.info(f"TTS synthesis complete: {len(wav_bytes)} bytes")
            return wav_bytes

        finally:
            # 5. Always unload TTS model and free VRAM
            self._unload_model()
            _gpu_lock.release()
