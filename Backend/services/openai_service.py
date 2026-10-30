"""
Server-side integration with the OpenAI Chat Completions API.

The browser never receives the API key. The router sends the stored
conversation history to this service, and the service returns only the reply
text that should be persisted and displayed.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Sequence

from openai import OpenAI

from config import settings

logger = logging.getLogger(__name__)

# The system prompt gives Echo a stable personality and explains how to use
# the conversation history supplied with each request.
SYSTEM_PROMPT = (
    "You are Echo, a helpful, friendly assistant. "
    "Answer clearly and concisely. When the user sends a follow-up message, "
    "use the previous messages in this conversation as context."
)


class OpenAIServiceError(RuntimeError):
    """A safe, client-facing error raised when a reply cannot be generated."""


@lru_cache(maxsize=1)
def _get_client() -> OpenAI:
    """Create the OpenAI client once and reuse its connection pool."""
    return OpenAI(
        api_key=settings.openai_api_key,
        timeout=60.0,
        max_retries=2,
    )


def _prepare_messages(history: Sequence[dict[str, str]]) -> list[dict[str, str]]:
    """
    Convert stored history to the OpenAI message format.

    Only the newest MAX_HISTORY_MESSAGES messages are sent. This keeps token
    usage and latency bounded for exceptionally long conversations.
    """
    trimmed_history = list(history)[-settings.max_history_messages :]

    if len(trimmed_history) < len(history):
        logger.info(
            "History trimmed for OpenAI: sending %s of %s messages.",
            len(trimmed_history),
            len(history),
        )

    api_messages: list[dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]

    for item in trimmed_history:
        role = item.get("role")
        content = item.get("content", "").strip()
        if role in {"user", "assistant"} and content:
            api_messages.append({"role": role, "content": content})

    return api_messages


def generate_reply(history: Sequence[dict[str, str]]) -> str:
    """
    Generate Echo's next reply from the complete conversation history.

    `history` contains dictionaries in chronological order:
    {"role": "user" | "assistant", "content": "..."}
    """
    if not settings.openai_api_key:
        logger.error("OPENAI_API_KEY is missing; cannot generate a reply.")
        raise OpenAIServiceError(
            "Echo is not configured with an OpenAI API key. "
            "Please contact the administrator."
        )

    api_messages = _prepare_messages(history)
    if len(api_messages) == 1:
        raise OpenAIServiceError("There is no message to send to Echo.")

    try:
        response = _get_client().chat.completions.create(
            model=settings.openai_model,
            messages=api_messages,
        )
        reply = response.choices[0].message.content
    except Exception as exc:
        # Log technical details on the server, but never return them to the
        # client (they may contain provider internals or configuration data).
        logger.exception("OpenAI request failed.")
        raise OpenAIServiceError(
            "Echo could not generate a reply right now. Please try again."
        ) from exc

    if not reply or not reply.strip():
        logger.error("OpenAI returned an empty assistant message.")
        raise OpenAIServiceError("Echo returned an empty reply. Please try again.")

    return reply.strip()
