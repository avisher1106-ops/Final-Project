"""
REST endpoints for conversations and messages.

Request flow for a new message:
1. Validate the request body with Pydantic.
2. Verify that the conversation exists.
3. Save the user message and update the conversation metadata.
4. Load the complete history from MySQL.
5. Ask OpenAI for a reply using that history.
6. Save and return both messages.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import Conversation, Message, get_db
from schemas import (
    ChatResponse,
    ConversationListItem,
    ConversationRead,
    MessageCreate,
    MessageRead,
)
from services.openai_service import OpenAIServiceError, generate_reply

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])


def _utc_now_naive() -> datetime:
    """Return UTC time without tzinfo, matching MySQL DATETIME columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _build_title(first_message: str, max_length: int = 60) -> str:
    """Create a compact one-line title from the first user message."""
    single_line = " ".join(first_message.split())
    if len(single_line) <= max_length:
        return single_line
    return f"{single_line[: max_length - 3].rstrip()}..."


def _get_conversation_or_404(
    db: Session, conversation_id: int
) -> Conversation:
    """Fetch a conversation or raise a clear 404/500 HTTP error."""
    try:
        conversation = db.get(Conversation, conversation_id)
    except SQLAlchemyError as exc:
        logger.exception("Failed to load conversation %s.", conversation_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not access the database. Please try again.",
        ) from exc

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with id {conversation_id} was not found.",
        )

    return conversation


@router.post(
    "",
    response_model=ConversationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new conversation",
)
def create_conversation(db: Session = Depends(get_db)) -> Conversation:
    """Create an empty chat (the New Chat button in the client)."""
    conversation = Conversation(title="")

    try:
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Failed to create a conversation.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create the conversation. Please try again.",
        ) from exc

    logger.info("Created conversation %s.", conversation.id)
    return conversation


@router.get(
    "",
    response_model=list[ConversationListItem],
    summary="List all conversations",
)
def list_conversations(db: Session = Depends(get_db)) -> list[Conversation]:
    """Return all conversations from newest to oldest for the sidebar."""
    try:
        statement = select(Conversation).order_by(
            Conversation.created_at.desc(),
            Conversation.id.desc(),
        )
        return list(db.scalars(statement).all())
    except SQLAlchemyError as exc:
        logger.exception("Failed to list conversations.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load conversations. Please try again.",
        ) from exc


@router.get(
    "/{conversation_id}/messages",
    response_model=list[MessageRead],
    summary="Get a conversation's message history",
)
def list_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
) -> list[Message]:
    """Return one conversation's messages in chronological order."""
    _get_conversation_or_404(db, conversation_id)

    try:
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc(), Message.id.asc())
        )
        return list(db.scalars(statement).all())
    except SQLAlchemyError as exc:
        logger.exception(
            "Failed to load messages for conversation %s.", conversation_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load messages. Please try again.",
        ) from exc


@router.post(
    "/{conversation_id}/messages",
    response_model=ChatResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send a message and receive Echo's reply",
)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Save a user message, continue the context, and persist Echo's reply."""
    conversation = _get_conversation_or_404(db, conversation_id)

    # 1. Persist the user's message. The title is derived from the first one.
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=payload.content,
    )

    try:
        db.add(user_message)
        if not conversation.title:
            conversation.title = _build_title(payload.content)
        # Keep the latest question/answer pair on the conversation row as well
        # as the complete message history in the messages table.
        conversation.question = payload.content
        conversation.answer = None
        conversation.updated_at = _utc_now_naive()
        db.commit()
        db.refresh(user_message)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception(
            "Failed to save a user message in conversation %s.", conversation_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save your message. Please try again.",
        ) from exc

    # 2. Load all messages of this conversation, including the one just saved.
    try:
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc(), Message.id.asc())
        )
        stored_messages = list(db.scalars(statement).all())
    except SQLAlchemyError as exc:
        logger.exception(
            "Failed to load history for conversation %s.", conversation_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load the conversation history. Please try again.",
        ) from exc

    history = [
        {"role": message.role, "content": message.content}
        for message in stored_messages
    ]

    # 3. The OpenAI key and network call remain entirely on the server.
    try:
        reply_text = generate_reply(history)
    except OpenAIServiceError as exc:
        logger.warning(
            "OpenAI reply failed for conversation %s: %s", conversation_id, exc
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    # 4. Persist Echo's answer and update the conversation timestamp.
    assistant_message = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=reply_text,
    )

    try:
        db.add(assistant_message)
        conversation.answer = reply_text
        conversation.updated_at = _utc_now_naive()
        db.commit()
        db.refresh(assistant_message)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception(
            "Failed to save Echo's reply in conversation %s.", conversation_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Echo replied, but the answer could not be saved. Please retry.",
        ) from exc

    logger.info(
        "Conversation %s: saved user message %s and assistant message %s.",
        conversation_id,
        user_message.id,
        assistant_message.id,
    )

    return ChatResponse(
        user_message=MessageRead.model_validate(user_message),
        assistant_message=MessageRead.model_validate(assistant_message),
    )


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation and all of its messages",
)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
) -> Response:
    """Delete a conversation; ON DELETE CASCADE removes its messages."""
    conversation = _get_conversation_or_404(db, conversation_id)

    try:
        db.delete(conversation)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Failed to delete conversation %s.", conversation_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete the conversation. Please try again.",
        ) from exc

    logger.info("Deleted conversation %s.", conversation_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
