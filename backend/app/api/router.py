from fastapi import APIRouter

from .chat import router as chat_router
from .conversations import router as conversations_router
from .models import router as models_router
from .personas import router as personas_router
from .settings import router as settings_router
from .status import router as status_router
from .tts import router as tts_router

api_router = APIRouter()

api_router.include_router(status_router, prefix="/status", tags=["status"])
api_router.include_router(models_router, prefix="/models", tags=["models"])
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])
api_router.include_router(conversations_router, prefix="/conversations", tags=["conversations"])
api_router.include_router(personas_router, prefix="/personas", tags=["personas"])
api_router.include_router(tts_router, prefix="/tts", tags=["tts"])
