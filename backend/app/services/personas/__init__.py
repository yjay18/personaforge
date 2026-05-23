"""Persona convenience functions used by chat.py and other API routes."""

import random
from typing import Any, Dict, List

from .registry import DEFAULT_PERSONA, PERSONAS


def list_personas() -> List[Dict[str, Any]]:
    """Return metadata for all personas (for the /api/personas endpoint)."""
    result = []
    for p in PERSONAS.values():
        result.append({
            "id": p["id"],
            "name": p["name"],
            "slider_name": p["slider_name"],
            "tts_language": p.get("tts_language", "en"),
        })
    return result


# Appended to every system prompt to keep TTS-friendly output.
NO_ACTION_MARKERS = (
    " Never use asterisk action markers like *thinks*, *laughs*, *pauses*, etc. "
    "Express everything through words only. Do not describe your own physical "
    "actions in asterisks or parentheses."
)


def _get_persona(persona: str) -> Dict[str, Any]:
    return PERSONAS.get(persona, PERSONAS[DEFAULT_PERSONA])


def get_system_prompt(persona: str, level: int) -> str:
    """Get the system prompt for a persona at a given creativity level (1-10)."""
    p = _get_persona(persona)
    level = max(1, min(10, level))
    return p["system_prompts"][level] + NO_ACTION_MARKERS


def should_refuse(persona: str, level: int) -> bool:
    """Random refusal — probability scales with the creativity slider.

    At low levels the model stays on-task. At high levels, it occasionally
    declines and replies with a persona-appropriate stall — this is a deliberate
    feature that surfaces the persona's voice in addition to its content.
    """
    probability = level * 0.10
    return random.random() < probability


def get_refusal_message(persona: str) -> str:
    """Pick a random refusal message for the given persona."""
    p = _get_persona(persona)
    return random.choice(p["refusal_messages"])
