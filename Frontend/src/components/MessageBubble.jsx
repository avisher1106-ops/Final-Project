import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Logo from "./Logo";
import "./MessageBubble.css";

const REMARK_PLUGINS = [remarkGfm];

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="11"
        height="11"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="m5 12.5 4.2 4.2L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle
        cx="12"
        cy="8.5"
        r="3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.2 20a6.8 6.8 0 0 1 13.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy failed");
  }
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for browsers that block the Clipboard API.
    }
  }

  fallbackCopy(text);
}

function getLanguage(children) {
  const codeElement = Array.isArray(children) ? children[0] : children;
  const className = codeElement?.props?.className || "";
  const match = /language-([\w-]+)/.exec(className);
  return match?.[1] || "code";
}

function formatTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFullDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef(null);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleCopy() {
    const text = preRef.current?.innerText || "";

    if (!text) {
      return;
    }

    try {
      await copyToClipboard(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="code-block">
      <div className="code-block__header">
        <span className="code-block__language">{getLanguage(children)}</span>
        <button
          type="button"
          className={`code-block__copy ${copied ? "is-copied" : ""}`}
          onClick={handleCopy}
          aria-label={copied ? "Code copied" : "Copy code"}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre ref={preRef}>{children}</pre>
    </div>
  );
}

const MARKDOWN_COMPONENTS = {
  pre: CodeBlock,
  a: ({ node: _node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
};

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const content = message.content || "";
  const [messageCopied, setMessageCopied] = useState(false);
  const timeLabel = formatTime(message.created_at);
  const fullDate = formatFullDate(message.created_at);

  useEffect(() => {
    if (!messageCopied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setMessageCopied(false), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [messageCopied]);

  async function handleCopyMessage() {
    if (!content) {
      return;
    }

    try {
      await copyToClipboard(content);
      setMessageCopied(true);
    } catch {
      setMessageCopied(false);
    }
  }

  return (
    <article
      className={`message-row message-row--${isUser ? "user" : "assistant"}`}
      aria-label={isUser ? "Your message" : "Echo's response"}
    >
      {!isUser && (
        <div className="message-row__avatar">
          <Logo size={30} animated />
        </div>
      )}

      <div className="message-body">
        <div className="message-meta">
          <span className="message-meta__name">
            {isUser ? "You" : "Echo"}
          </span>
          {!isUser && (
            <span className="message-meta__badge">AI assistant</span>
          )}
          {timeLabel && (
            <time className="message-meta__time" dateTime={message.created_at}>
              {timeLabel}
            </time>
          )}
          <button
            type="button"
            className={`message-copy ${messageCopied ? "is-copied" : ""}`}
            onClick={handleCopyMessage}
            aria-label={messageCopied ? "Message copied" : "Copy message"}
            title={fullDate}
          >
            {messageCopied ? <CheckIcon /> : <CopyIcon />}
            <span>{messageCopied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <div
          className={`message-content ${isUser ? "message-content--user" : "message-content--assistant"}`}
        >
          {isUser ? (
            <p className="user-message__text" dir="auto">
              {content}
            </p>
          ) : (
            <div className="markdown" dir="auto">
              <ReactMarkdown
                remarkPlugins={REMARK_PLUGINS}
                components={MARKDOWN_COMPONENTS}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="message-row__avatar message-row__avatar--user">
          <UserIcon />
        </div>
      )}
    </article>
  );
}
