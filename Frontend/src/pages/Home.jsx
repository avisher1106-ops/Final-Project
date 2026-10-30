import { useCallback, useEffect, useRef, useState } from "react";
import ChatWindow from "../components/ChatWindow";
import Sidebar from "../components/Sidebar";
import {
  createConversation,
  deleteConversation,
  getApiErrorMessage,
  getConversations,
  getMessages,
  sendMessage,
} from "../services/api";
import "./Home.css";

function buildTitle(content) {
  const singleLine = content.replace(/\s+/g, " ").trim();

  if (singleLine.length <= 60) {
    return singleLine;
  }

  return `${singleLine.slice(0, 57).trim()}...`;
}

function createOptimisticMessage(content) {
  return {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: "user",
    content,
    created_at: new Date().toISOString(),
  };
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
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

export default function Home() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeTitle, setActiveTitle] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState("");
  const [chatError, setChatError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeIdRef = useRef(null);
  const sendingRef = useRef(false);
  const loadRequestRef = useRef(0);

  const loadConversations = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingConversations(true);
    }

    setConversationsError("");

    try {
      const data = await getConversations();
      setConversations(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      setConversationsError(getApiErrorMessage(error));
      return [];
    } finally {
      if (showLoading) {
        setIsLoadingConversations(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!pendingDelete) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isDeleting) {
        setPendingDelete(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pendingDelete, isDeleting]);

  function resetConversation({ closeSidebar = false } = {}) {
    loadRequestRef.current += 1;
    activeIdRef.current = null;

    setActiveConversationId(null);
    setActiveTitle("");
    setMessages([]);
    setInputValue("");
    setChatError(null);
    setIsLoadingMessages(false);

    if (closeSidebar) {
      setSidebarOpen(false);
    }
  }

  function handleNewChat() {
    if (sendingRef.current) {
      return;
    }

    // Lazy creation: the actual POST happens when the first message is sent.
    resetConversation({ closeSidebar: true });
  }

  async function handleSelectConversation(conversation) {
    if (sendingRef.current) {
      return;
    }

    const requestId = ++loadRequestRef.current;

    setSidebarOpen(false);
    setChatError(null);
    setInputValue("");
    setMessages([]);
    setIsLoadingMessages(true);

    activeIdRef.current = conversation.id;
    setActiveConversationId(conversation.id);
    setActiveTitle(conversation.title?.trim() || "");

    try {
      const data = await getMessages(conversation.id);

      if (requestId !== loadRequestRef.current) {
        return;
      }

      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      if (requestId !== loadRequestRef.current) {
        return;
      }

      setChatError({
        message: getApiErrorMessage(error),
        retry: () => handleSelectConversation(conversation),
      });
    } finally {
      if (requestId === loadRequestRef.current) {
        setIsLoadingMessages(false);
      }
    }
  }

  async function handleSend(rawContent) {
    const content = rawContent.trim();

    if (!content || sendingRef.current || isLoadingMessages) {
      return;
    }

    sendingRef.current = true;
    setIsSending(true);
    setChatError(null);
    setInputValue("");

    const optimisticMessage = createOptimisticMessage(content);
    setMessages((current) => [...current, optimisticMessage]);

    let conversationId = activeIdRef.current;

    try {
      if (!conversationId) {
        const conversation = await createConversation();
        conversationId = conversation.id;

        activeIdRef.current = conversationId;
        setActiveConversationId(conversationId);

        const title = conversation.title?.trim() || buildTitle(content);
        setActiveTitle(title);
        setConversations((current) => [
          {
            id: conversation.id,
            title,
            created_at: conversation.created_at,
          },
          ...current.filter((item) => item.id !== conversation.id),
        ]);
      }

      const result = await sendMessage(conversationId, content);

      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticMessage.id),
        result.user_message,
        result.assistant_message,
      ]);

      void loadConversations(false);
    } catch (error) {
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticMessage.id),
      );
      setInputValue(content);

      if (error?.status === 404) {
        activeIdRef.current = null;
        setActiveConversationId(null);
        setActiveTitle("");
      }

      setChatError({
        message: getApiErrorMessage(error),
        retry: () => handleSend(content),
      });
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }

  function handleDeleteConversation(conversation) {
    if (sendingRef.current) {
      return;
    }

    setPendingDelete(conversation);
  }

  async function confirmDeleteConversation() {
    if (!pendingDelete || isDeleting) {
      return;
    }

    const conversation = pendingDelete;
    setIsDeleting(true);
    setConversationsError("");

    try {
      await deleteConversation(conversation.id);
      setConversations((current) =>
        current.filter((item) => item.id !== conversation.id),
      );

      if (activeIdRef.current === conversation.id) {
        resetConversation({ closeSidebar: true });
      }

      setPendingDelete(null);
    } catch (error) {
      setConversationsError(getApiErrorMessage(error));
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleRetryError() {
    const retry = chatError?.retry;

    if (!retry) {
      return;
    }

    setChatError(null);
    retry();
  }

  return (
    <div className="home">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        isLoading={isLoadingConversations}
        error={conversationsError}
        onReload={() => void loadConversations()}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isBusy={isSending || isLoadingMessages}
      />

      <div className="home__chat">
        <ChatWindow
          messages={messages}
          isLoadingMessages={isLoadingMessages}
          isSending={isSending}
          error={chatError}
          onRetryError={chatError ? handleRetryError : undefined}
          onDismissError={() => setChatError(null)}
          onOpenSidebar={() => setSidebarOpen(true)}
          conversationTitle={activeTitle}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={(content) => void handleSend(content)}
        />
      </div>

      {pendingDelete && (
        <div
          className="delete-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setPendingDelete(null);
            }
          }}
        >
          <div
            className="delete-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <div className="delete-modal__icon">
              <TrashIcon />
            </div>

            <span className="delete-modal__eyebrow">Delete conversation</span>

            <h2 id="delete-dialog-title">
              Remove “{pendingDelete.title?.trim() || "New chat"}”?
            </h2>

            <p id="delete-dialog-description">
              Every message in this conversation will be permanently removed.
              This action cannot be undone.
            </p>

            <div className="delete-modal__actions">
              <button
                type="button"
                className="delete-modal__cancel"
                onClick={() => setPendingDelete(null)}
                disabled={isDeleting}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className="delete-modal__confirm"
                onClick={() => void confirmDeleteConversation()}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete conversation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
