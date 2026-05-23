import uuid

from fastapi import APIRouter
from sqlmodel import Session, select

from ..db import engine
from ..models import ChatMessage, Conversation

router = APIRouter()


@router.get("")
def list_conversations():
    with Session(engine) as session:
        convs = session.exec(
            select(Conversation).order_by(Conversation.created_at.desc())
        ).all()
    return {"conversations": convs}


@router.post("")
def create_conversation():
    conv_id = str(uuid.uuid4())
    with Session(engine) as session:
        conv = Conversation(id=conv_id)
        session.add(conv)
        session.commit()
        session.refresh(conv)
    return conv


@router.get("/{conversation_id}/messages")
def get_messages(conversation_id: str):
    with Session(engine) as session:
        conv = session.get(Conversation, conversation_id)
        messages = session.exec(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at)
        ).all()
    return {
        "messages": messages,
        "persona": conv.persona if conv else "assistant",
    }


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str):
    with Session(engine) as session:
        msgs = session.exec(
            select(ChatMessage).where(ChatMessage.conversation_id == conversation_id)
        ).all()
        for m in msgs:
            session.delete(m)

        conv = session.get(Conversation, conversation_id)
        if conv:
            session.delete(conv)
        session.commit()
    return {"ok": True}


@router.patch("/{conversation_id}")
def update_conversation(conversation_id: str, payload: dict):
    with Session(engine) as session:
        conv = session.get(Conversation, conversation_id)
        if conv:
            if "title" in payload:
                conv.title = payload["title"]
            session.add(conv)
            session.commit()
            session.refresh(conv)
            return conv
    return {"error": "not found"}
