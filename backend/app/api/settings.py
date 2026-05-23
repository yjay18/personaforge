from fastapi import APIRouter
from sqlmodel import Session, select

from ..core.config import APP_CONFIG
from ..db import engine
from ..models import AppSetting

router = APIRouter()


@router.get("")
def get_settings():
    with Session(engine) as session:
        settings = session.exec(select(AppSetting)).first()
        if not settings:
            settings = AppSetting(
                default_model=APP_CONFIG.ollama.default_model,
                creativity_level=APP_CONFIG.creativity.default_level,
                web_search_enabled=APP_CONFIG.creativity.web_search,
                temperature=APP_CONFIG.ollama.temperature,
                max_tokens=APP_CONFIG.ollama.max_tokens,
            )
            session.add(settings)
            session.commit()
            session.refresh(settings)
    return settings


@router.post("")
def update_settings(payload: dict):
    with Session(engine) as session:
        settings = session.exec(select(AppSetting)).first()
        if not settings:
            settings = AppSetting()
        if "default_model" in payload:
            settings.default_model = payload["default_model"]
        if "creativity_level" in payload:
            settings.creativity_level = int(payload["creativity_level"])
        if "web_search_enabled" in payload:
            settings.web_search_enabled = bool(payload["web_search_enabled"])
        if "temperature" in payload:
            settings.temperature = float(payload["temperature"])
        if "max_tokens" in payload:
            settings.max_tokens = int(payload["max_tokens"])
        if "persona" in payload:
            settings.persona = payload["persona"]
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return settings
