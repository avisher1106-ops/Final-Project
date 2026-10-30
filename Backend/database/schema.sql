-- Echo database schema (MySQL 8.0+)
-- Import with:
--   mysql -u root -p < database/schema.sql
-- The FastAPI application also creates missing tables automatically, but this
-- file is the portable source of truth for the database structure.

CREATE DATABASE IF NOT EXISTS echo_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE echo_db;

CREATE TABLE IF NOT EXISTS conversations (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL DEFAULT '',
    question TEXT NULL,
    answer TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
    id INT NOT NULL AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_messages_conversation_id (conversation_id),
    CONSTRAINT fk_messages_conversation
        FOREIGN KEY (conversation_id)
        REFERENCES conversations (id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
