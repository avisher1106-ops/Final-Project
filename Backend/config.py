"""
Central application configuration.

All secrets are read from environment variables (normally loaded from the
server-side .env file). No credentials or API keys are hard-coded here.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

# Load the .env file that sits next to this module (the project root).
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")


def _env_int(name: str, default: int) -> int:
    """Read an integer environment variable and fail early if it is invalid."""
    raw_value = os.getenv(name, str(default))
    try:
        return int(raw_value)
    except ValueError as exc:
        raise ValueError(f"Environment variable {name} must be an integer.") from exc


@dataclass(frozen=True)
class Settings:
    """Immutable application settings loaded once at import time."""

    openai_api_key: str
    openai_model: str
    db_host: str
    db_port: int
    db_user: str
    db_password: str
    db_name: str
    max_history_messages: int

    @property
    def database_url(self) -> str:
        """Build a safely encoded SQLAlchemy connection URL for MySQL."""
        return (
            "mysql+pymysql://"
            f"{quote_plus(self.db_user)}:{quote_plus(self.db_password)}"
            f"@{self.db_host}:{self.db_port}/{quote_plus(self.db_name)}"
            "?charset=utf8mb4"
        )


settings = Settings(
    openai_api_key=os.getenv("OPENAI_API_KEY", "").strip(),
    openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip(),
    db_host=os.getenv("DB_HOST", "localhost").strip(),
    db_port=_env_int("DB_PORT", 3306),
    db_user=os.getenv("DB_USER", "root").strip(),
    db_password=os.getenv("DB_PASSWORD", ""),
    db_name=os.getenv("DB_NAME", "echo_db").strip(),
    # Keep the model call bounded when a conversation becomes very long.
    max_history_messages=max(1, _env_int("MAX_HISTORY_MESSAGES", 20)),
)
