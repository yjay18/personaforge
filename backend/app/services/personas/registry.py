"""Central persona registry — imports all personas into one dict."""

from .assistant import PERSONA as ASSISTANT
from .thinker import PERSONA as THINKER
from .tutor import PERSONA as TUTOR

PERSONAS = {
    "assistant": ASSISTANT,
    "tutor": TUTOR,
    "thinker": THINKER,
}

DEFAULT_PERSONA = "assistant"
