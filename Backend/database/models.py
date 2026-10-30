"""
SQLAlchemy ORM models for conversations and chat messages.
"""

from __future__ import annotations

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import relationship

from .database import Base


class Conversation(Base):
    """A single independent chat thread."""

    __tablename__ = "conversations"
    __table_args__ = {
        "mysql_engine": "InnoDB",
        "mysql_charset": "utf8mb4",
        "mysql_collate": "utf8mb4_unicode_ci",
    }

    id = Column(Integer, primary_key=True, autoincrement=True)
    # An empty title is replaced with a short version of the first user message.
    title = Column(
        String(255),
        nullable=False,
        default="",
        server_default=text("''"),
    )
    question = Column(Text, nullable=True)
    answer = Column(Text, nullable=True)
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        onupdate=func.now(),
    )

    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Message.created_at, Message.id",
    )

    def __repr__(self) -> str:
        return f"<Conversation id={self.id} title={self.title!r}>"


class Message(Base):
    """One message inside a conversation, authored by a user or by Echo."""

    __tablename__ = "messages"
    __table_args__ = (
        # Speeds up loading the complete history of one conversation.
        Index("idx_messages_conversation_id", "conversation_id"),
        {
            "mysql_engine": "InnoDB",
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci",
        },
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    role = Column(
        Enum("user", "assistant", name="message_role"),
        nullable=False,
    )
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self) -> str:
        return (
            f"<Message id={self.id} conversation_id={self.conversation_id} "
            f"role={self.role!r}>"
        )
