import { useEffect, useRef } from "react";
import "./ChatInput.css";

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <path
        d="M12 19V5M6.5 10.5 12 5l5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  isSending,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }, [value]);

  function handleSubmit(event) {
    event.preventDefault();
    const content = value.trim();

    if (!content || disabled) {
      return;
    }

    onSend(content);
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSubmit(event);
    }
  }

  return (
    <form
      className={`chat-input ${disabled ? "is-disabled" : ""}`}
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="echo-chat-input">
        Chat message
      </label>

      <textarea
        ref={textareaRef}
        id="echo-chat-input"
        className="chat-input__field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isSending ? "Echo is thinking..." : "Ask anything..."}
        rows={1}
        maxLength={4000}
        disabled={disabled}
        dir="auto"
      />

      <button
        type="submit"
        className="chat-input__send"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <SendIcon />
      </button>
    </form>
  );
}
