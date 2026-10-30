import { useEffect } from "react";
import "./Sidebar.css";

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M4 7h16M9 7V4h6v3M6.5 7l.8 13h9.4l.8-13M10 11v5M14 11v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getTitle(conversation) {
  return conversation.title?.trim() || "New chat";
}

export default function Sidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNewChat,
  onDelete,
  isLoading,
  error,
  onReload,
  isOpen,
  onClose,
  isBusy,
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <button
        type="button"
        className={`sidebar-overlay ${isOpen ? "is-open" : ""}`}
        onClick={onClose}
        aria-label="Close conversations"
        tabIndex={isOpen ? 0 : -1}
      />

      <aside className={`sidebar ${isOpen ? "is-open" : ""}`}>
        <div className="sidebar__top">
          <button
            type="button"
            className="sidebar__new-chat"
            onClick={onNewChat}
            disabled={isBusy}
          >
            <PlusIcon />
            <span>New chat</span>
          </button>

          <button
            type="button"
            className="sidebar__close"
            onClick={onClose}
            aria-label="Close conversations"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="sidebar__label">Recent chats</p>

        {error && (
          <div className="sidebar__error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={onReload}>
              Try again
            </button>
          </div>
        )}

        <div className="sidebar__list">
          {isLoading ? (
            <div
              className="sidebar__skeletons"
              aria-label="Loading conversations"
            >
              {[0, 1, 2, 3].map((item) => (
                <span className="sidebar__skeleton" key={item} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            !error && (
              <div className="sidebar__empty">
                <p>No conversations yet.</p>
                <span>
                  Your first chat will appear as soon as you send a message.
                </span>
              </div>
            )
          ) : (
            conversations.map((conversation) => {
              const title = getTitle(conversation);
              const isActive = conversation.id === activeConversationId;

              return (
                <div
                  className={`conversation-item ${isActive ? "is-active" : ""}`}
                  key={conversation.id}
                >
                  <button
                    type="button"
                    className="conversation-item__select"
                    onClick={() => onSelect(conversation)}
                    disabled={isBusy}
                    aria-current={isActive ? "page" : undefined}
                    title={title}
                  >
                    <span className="conversation-item__title" dir="auto">
                      {title}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="conversation-item__delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(conversation);
                    }}
                    disabled={isBusy}
                    aria-label={`Delete conversation ${title}`}
                    title="Delete conversation"
                  >
                    <TrashIcon />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="sidebar__footer">
          <span>Echo</span>
          <small>Chats are saved to the server</small>
        </div>
      </aside>
    </>
  );
}
