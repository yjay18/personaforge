from fastapi import APIRouter

from ..services.ollama import OllamaService

router = APIRouter()


@router.get("")
def list_models():
    service = OllamaService()
    return {"models": service.list_models()}
