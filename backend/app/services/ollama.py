import json
import logging
from typing import Any, Dict, Generator, List

import requests

from ..core.config import APP_CONFIG

logger = logging.getLogger("service.ollama")


class OllamaService:
    def __init__(self) -> None:
        self.base_url = APP_CONFIG.ollama.base_url.rstrip("/")

    def list_models(self) -> List[Dict[str, Any]]:
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return data.get("models", [])
        except Exception:
            logger.exception("Ollama list models failed")
            return []

    def unload_model(self, model: str = "") -> None:
        try:
            resp = requests.get(f"{self.base_url}/api/ps", timeout=5)
            if resp.ok:
                for m in resp.json().get("models", []):
                    name = m.get("name", "")
                    if name:
                        requests.post(
                            f"{self.base_url}/api/generate",
                            json={"model": name, "keep_alive": 0, "prompt": ""},
                            timeout=10,
                        )
        except Exception:
            logger.warning("Failed to unload Ollama models")

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        if not model:
            models = self.list_models()
            if models:
                model = models[0].get("name", "")

        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        resp = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=300)
        resp.raise_for_status()
        data = resp.json()
        return data.get("message", {}).get("content", "")

    def chat_stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> Generator[str, None, None]:
        if not model:
            models = self.list_models()
            if models:
                model = models[0].get("name", "")

        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        with requests.post(
            f"{self.base_url}/api/chat",
            json=payload,
            timeout=300,
            stream=True,
        ) as resp:
            resp.raise_for_status()
            for line in resp.iter_lines():
                if line:
                    data = json.loads(line)
                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield content
                    if data.get("done", False):
                        break
