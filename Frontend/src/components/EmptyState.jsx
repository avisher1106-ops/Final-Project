import Logo from "./Logo";
import "./EmptyState.css";

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state__logo">
        <Logo size={72} animated />
      </div>

      <h1>How can I help today?</h1>
      <p className="empty-state__lead">
        Ask anything - code, explanations, ideas, or help with your writing.
      </p>
    </div>
  );
}
