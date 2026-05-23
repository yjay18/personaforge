from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.utcnow()


class Conversation(SQLModel, table=True):
    id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=utc_now, index=True)
    title: str = Field(default="New Chat")
    creativity_level: int = Field(default=3)
    model: str = Field(default="")
    persona: str = Field(default="assistant")


class ChatMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=utc_now)
    role: str = Field(default="user")
    content: str = Field(default="")
    message_type: str = Field(default="text")
    image_data: Optional[str] = Field(default=None)
    search_results: Optional[str] = Field(default=None)
    refused: bool = Field(default=False)


class AppSetting(SQLModel, table=True):
    id: Optional[int] = Field(default=1, primary_key=True)
    default_model: str = Field(default="")
    creativity_level: int = Field(default=3)
    web_search_enabled: bool = Field(default=False)
    temperature: float = Field(default=0.7)
    max_tokens: int = Field(default=1024)
    persona: str = Field(default="assistant")
