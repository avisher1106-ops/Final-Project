import { useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import EmptyState from "./EmptyState";
import Logo from "./Logo";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import "./ChatWindow.css";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="m6 6 12 12M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ChatWindow({
  messages,
  isLoadingMessages,
  isSending,
  error,
  onRetryError,
  onDismissError,
  onOpenSidebar,
  conversationTitle,
  inputValue,
  onInputChange,
  onSend,
}) {
  const scrollRef = useRef(null);
  const isEmpty = !isLoadingMessages && messages.length === 0;
  const isBusy = isSending || isLoadingMessages;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: messages.length > 1 ? "smooth" : "auto",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [messages, isSending, isLoadingMessages]);

  return (
    <section className="chat-window" aria-label="Chat area">
      <header className="chat-mobile-bar">
        <button
          type="button"
          className="chat-mobile-bar__menu"
          onClick={onOpenSidebar}
          aria-label="Open conversations"
        >
          <MenuIcon />
        </button>

        <span className="chat-mobile-bar__title" dir="auto">
          {conversationTitle || "New chat"}
        </span>

        <span className="chat-mobile-bar__spacer" aria-hidden="true" />
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        <div
          className={`chat-inner ${isEmpty ? "chat-inner--empty" : ""}`}
          aria-live="polite"
          aria-busy={isLoadingMessages || isSending}
        >
          {isLoadingMessages ? (
            <div className="chat-loading">
              <Logo size={50} animated />
              <p>Loading conversation...</p>
            </div>
          ) : isEmpty ? (
            <EmptyState />
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}

          {isSending && <TypingIndicator />}
        </div>
      </div>

      <div className="chat-composer">
        <div className="chat-composer__inner">
          {error && (
            <div className="chat-error" role="alert">
              <p>{error.message}</p>

              {onRetryError && (
                <button
                  type="button"
                  className="chat-error__retry"
                  onClick={onRetryError}
                >
                  Try again
                </button>
              )}

              <button
                type="button"
                className="chat-error__close"
                onClick={onDismissError}
                aria-label="Dismiss error"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          <ChatInput
            value={inputValue}
            onChange={onInputChange}
            onSend={onSend}
            disabled={isBusy}
            isSending={isSending}
          />

          <p className="chat-disclaimer">
            Echo is an AI assistant and can make mistakes. Check important
            information.
          </p>
        </div>
      </div>
    </section>
  );
}
