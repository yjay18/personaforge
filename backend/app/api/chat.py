import json
import logging
import threading
import uuid
from typing import Any, Dict, List

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from sqlmodel import Session, func, select

from ..core.config import APP_CONFIG
from ..db import engine
from ..models import AppSetting, ChatMessage, Conversation
from ..services.ollama import OllamaService
from ..services.personas import get_refusal_message, get_system_prompt, should_refuse
from ..services.personas.registry import DEFAULT_PERSONA
from ..services.search import SearchService

router = APIRouter()
logger = logging.getLogger("api.chat")

# How many messages before auto-generating a conversation title
_AUTO_NAME_THRESHOLD = 4

# Words that are too vague to be a useful search query on their own.
_FILLER_WORDS = {
    "please", "thanks", "thank", "you", "ok", "okay", "yes", "no",
    "sure", "what", "how", "why", "tell", "me", "more", "go", "ahead",
    "continue", "elaborate", "explain", "again", "huh", "idk", "hmm",
}


def _build_search_query(message: str, history: List[Dict[str, str]]) -> str:
    """Build a useful search query from the message, falling back to recent history."""
    words = [w for w in message.lower().split() if w.strip(".,!?\"'()") not in _FILLER_WORDS]
    # If the message has enough meaningful words, use it directly
    if len(words) >= 3:
        return message.strip()
    # Otherwise pull context from the last user messages in history
    for turn in reversed(history[-10:]):
        if turn.get("role") == "user":
            prev = turn.get("content", "").strip()
            prev_words = [w for w in prev.lower().split() if w.strip(".,!?\"'()") not in _FILLER_WORDS]
            if len(prev_words) >= 3:
                # Combine: use the previous substantive query + current short message for specificity
                if words:
                    return f"{prev} {message.strip()}"
                return prev
    # Nothing useful in history either, just use the raw message
    return message.strip()


def _get_settings() -> AppSetting:
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


def _ensure_conversation(
    conversation_id: str,
    model: str,
    creativity_level: int,
    persona: str = DEFAULT_PERSONA,
) -> str:
    with Session(engine) as session:
        conv = session.get(Conversation, conversation_id)
        if not conv:
            conv = Conversation(
                id=conversation_id,
                model=model,
                creativity_level=creativity_level,
                persona=persona,
            )
            session.add(conv)
            session.commit()
    return conversation_id


def _save_message(
    conversation_id: str,
    role: str,
    content: str,
    message_type: str = "text",
    search_results: str = None,
    refused: bool = False,
) -> None:
    with Session(engine) as session:
        msg = ChatMessage(
            conversation_id=conversation_id,
            role=role,
            content=content,
            message_type=message_type,
            search_results=search_results,
            refused=refused,
        )
        session.add(msg)
        session.commit()


def _maybe_auto_name(conversation_id: str, model: str) -> None:
    """Check if conversation needs auto-naming and fire a background thread if so."""
    with Session(engine) as session:
        conv = session.get(Conversation, conversation_id)
        if not conv or conv.title != "New Chat":
            return  # already named

        count = session.exec(
            select(func.count(ChatMessage.id)).where(
                ChatMessage.conversation_id == conversation_id
            )
        ).one()

        if count < _AUTO_NAME_THRESHOLD:
            return

        # Grab the first few messages for context
        msgs = session.exec(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at)
            .limit(6)
        ).all()
        snippet = []
        for m in msgs:
            if m.refused:
                continue
            snippet.append(f"{m.role}: {m.content[:200]}")

    thread = threading.Thread(
        target=_generate_title,
        args=(conversation_id, model, "\n".join(snippet)),
        daemon=True,
    )
    thread.start()


def _generate_title(conversation_id: str, model: str, snippet: str) -> None:
    """Background thread: ask Ollama for a short conversation title."""
    try:
        ollama = OllamaService()
        messages = [
            {
                "role": "user",
                "content": (
                    "Below is the start of a conversation. Write a very short title for it "
                    "(max 3 words, Capitalize Each Word, no quotes, no punctuation). "
                    "Just output the title, nothing else.\n\n"
                    f"{snippet}"
                ),
            },
        ]
        title = ollama.chat(messages=messages, model=model, temperature=0.3, max_tokens=20)
        title = title.strip().strip('"').strip("'").strip(".").strip()
        # Truncate if model got chatty
        if len(title) > 50:
            title = title[:50].rsplit(" ", 1)[0]
        if not title:
            return

        with Session(engine) as session:
            conv = session.get(Conversation, conversation_id)
            if conv and conv.title == "New Chat":
                conv.title = title
                session.add(conv)
                session.commit()
                logger.info(f"Auto-named conversation {conversation_id[:8]}: '{title}'")
    except Exception:
        logger.exception("Auto-naming failed")


def _build_messages(
    history: List[Dict[str, str]],
    message: str,
    system_prompt: str,
    search_context: str = "",
) -> List[Dict[str, str]]:
    # Inject the persona prompt as a user/assistant exchange rather than a
    # `system` message so we don't override the underlying model's own SYSTEM
    # directive (which Ollama's /api/chat replaces wholesale when a system role
    # is provided).
    messages = [
        {
            "role": "user",
            "content": (
                f"[PERSONA INSTRUCTIONS]: {system_prompt}\n"
                "Follow these instructions for every response in this conversation."
            ),
        },
        {
            "role": "assistant",
            "content": "Understood — I'll follow that style for the whole conversation.",
        },
    ]

    if search_context:
        messages.append({"role": "user", "content": search_context})
        messages.append(
            {"role": "assistant", "content": "Got it, I'll use those search results."}
        )

    # Drop refusal messages from history so the model doesn't mimic them.
    for turn in history[-20:]:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        refused = turn.get("refused", False)
        msg_type = turn.get("type", "text")
        if refused or msg_type == "refusal":
            continue
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})
    return messages


@router.post("")
def chat(payload: Dict[str, Any]):
    message: str = payload.get("message", "")
    model: str = payload.get("model", "")
    history: List[Dict[str, str]] = payload.get("history", [])
    creativity_level: int = int(payload.get("creativity_level", 3))
    web_search: bool = bool(payload.get("web_search", False))
    conversation_id: str = payload.get("conversation_id", str(uuid.uuid4()))
    persona: str = payload.get("persona", DEFAULT_PERSONA)

    settings = _get_settings()
    if not model:
        model = settings.default_model or APP_CONFIG.ollama.default_model

    _ensure_conversation(conversation_id, model, creativity_level, persona)
    _save_message(conversation_id, "user", message)

    # Refusal check
    if should_refuse(persona, creativity_level):
        refusal = get_refusal_message(persona)
        _save_message(conversation_id, "assistant", refusal, message_type="refusal", refused=True)
        return {
            "response": refusal,
            "refused": True,
            "search_results": None,
            "conversation_id": conversation_id,
        }

    # Web search
    search_results = None
    search_context = ""
    if web_search and message.strip():
        query = _build_search_query(message, history)
        logger.info(f"Search query: '{query}' (original: '{message[:50]}')")
        search_svc = SearchService()
        search_results = search_svc.search(query)
        search_context = search_svc.format_for_context(search_results)

    # Build messages and call Ollama
    system_prompt = get_system_prompt(persona, creativity_level)
    messages = _build_messages(history, message, system_prompt, search_context)

    ollama = OllamaService()
    try:
        response = ollama.chat(
            messages=messages,
            model=model,
            temperature=settings.temperature,
            max_tokens=settings.max_tokens,
        )
    except Exception as exc:
        logger.exception("Chat generation failed")
        response = f"Something went wrong: {exc}"

    _save_message(
        conversation_id,
        "assistant",
        response,
        search_results=json.dumps(search_results) if search_results else None,
    )

    _maybe_auto_name(conversation_id, model)

    return {
        "response": response,
        "refused": False,
        "search_results": search_results,
        "conversation_id": conversation_id,
    }


@router.post("/stream")
def chat_stream(payload: Dict[str, Any]):
    message: str = payload.get("message", "")
    model: str = payload.get("model", "")
    history: List[Dict[str, str]] = payload.get("history", [])
    creativity_level: int = int(payload.get("creativity_level", 3))
    web_search: bool = bool(payload.get("web_search", False))
    conversation_id: str = payload.get("conversation_id", str(uuid.uuid4()))
    persona: str = payload.get("persona", DEFAULT_PERSONA)

    settings = _get_settings()
    if not model:
        model = settings.default_model or APP_CONFIG.ollama.default_model

    _ensure_conversation(conversation_id, model, creativity_level, persona)
    _save_message(conversation_id, "user", message)

    # Refusal check
    if should_refuse(persona, creativity_level):
        refusal = get_refusal_message(persona)
        _save_message(conversation_id, "assistant", refusal, message_type="refusal", refused=True)

        def refusal_stream():
            data = json.dumps({"token": refusal, "done": False, "refused": True, "search_results": None})
            yield f"data: {data}\n\n"
            done = json.dumps({"token": "", "done": True, "refused": True, "conversation_id": conversation_id})
            yield f"data: {done}\n\n"

        return StreamingResponse(refusal_stream(), media_type="text/event-stream")

    # Web search
    search_results = None
    search_context = ""
    if web_search and message.strip():
        query = _build_search_query(message, history)
        logger.info(f"Stream search query: '{query}' (original: '{message[:50]}')")
        search_svc = SearchService()
        search_results = search_svc.search(query)
        search_context = search_svc.format_for_context(search_results)

    system_prompt = get_system_prompt(persona, creativity_level)
    messages = _build_messages(history, message, system_prompt, search_context)

    def generate():
        full_response = ""
        ollama = OllamaService()

        # Send search results first if available
        if search_results:
            sr_data = json.dumps({"token": "", "done": False, "search_results": search_results})
            yield f"data: {sr_data}\n\n"

        try:
            for token in ollama.chat_stream(
                messages=messages,
                model=model,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens,
            ):
                full_response += token
                data = json.dumps({"token": token, "done": False})
                yield f"data: {data}\n\n"
        except Exception as exc:
            logger.exception("Stream generation failed")
            err = f"Something went wrong: {exc}"
            full_response = err
            data = json.dumps({"token": err, "done": False})
            yield f"data: {data}\n\n"

        # Save full response
        _save_message(
            conversation_id,
            "assistant",
            full_response,
            search_results=json.dumps(search_results) if search_results else None,
        )

        _maybe_auto_name(conversation_id, model)

        done = json.dumps({"token": "", "done": True, "conversation_id": conversation_id})
        yield f"data: {done}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
