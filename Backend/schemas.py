"""
Pydantic request and response schemas.

These schemas define the public JSON contract of the API and perform input
validation before a request reaches the database or OpenAI.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ConversationRead(BaseModel):
    """Conversation object returned after creating a new chat."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationListItem(BaseModel):
    """Compact conversation representation used in the sidebar list."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime


class MessageRead(BaseModel):
    """A stored message returned to the client."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class MessageCreate(BaseModel):
    """Request body for sending a new user message."""

    # Reject overly large payloads before they reach the model or the database.
    model_config = ConfigDict(extra="forbid")

    content: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="The user's message (1-4000 characters).",
    )

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        """Trim surrounding whitespace and reject whitespace-only messages."""
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Message content cannot be empty.")
        return cleaned


class ChatResponse(BaseModel):
    """Both messages produced by a successful send-message operation."""

    user_message: MessageRead
    assistant_message: MessageRead
