import argparse
import logging
import sys

import uvicorn

from app.core.logging import setup_logging
from app.main import app as fastapi_app
from app.services.ollama import OllamaService


setup_logging()
logger = logging.getLogger("runner")


def test_ollama() -> int:
    service = OllamaService()
    models = service.list_models()
    logger.info("Ollama models: %s", models)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8123)
    parser.add_argument("--test-ollama", action="store_true")
    args = parser.parse_args()

    if args.test_ollama:
        return test_ollama()

    uvicorn.run(fastapi_app, host=args.host, port=args.port, reload=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
