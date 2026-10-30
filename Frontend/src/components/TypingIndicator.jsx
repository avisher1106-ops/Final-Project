import Logo from "./Logo";
import "./TypingIndicator.css";

export default function TypingIndicator() {
  return (
    <div
      className="typing-indicator"
      role="status"
      aria-label="Echo is thinking"
    >
      <Logo size={30} animated />

      <span className="typing-indicator__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>

      <span className="sr-only">Echo is thinking</span>
    </div>
  );
}
