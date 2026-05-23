from fastapi import APIRouter

from ..services.ollama import OllamaService

router = APIRouter()


@router.get("")
def get_status():
    ollama = OllamaService()
    models = ollama.list_models()
    return {
        "status": "ok",
        "ollama_connected": len(models) > 0,
        "models_count": len(models),
    }
