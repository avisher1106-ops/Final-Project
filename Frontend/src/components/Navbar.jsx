import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Logo from "./Logo";
import "./Navbar.css";

const ACCENTS = [
  { id: "blue", name: "Blue", color: "#2563eb" },
  { id: "emerald", name: "Emerald", color: "#047857" },
  { id: "violet", name: "Violet", color: "#7c3aed" },
  { id: "rose", name: "Rose", color: "#e11d48" },
  { id: "amber", name: "Amber", color: "#b45309" },
];

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <path
        d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="3.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.55v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.3V9.55h.1A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.56 3.7l.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.3h4.05v.1A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8.5a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.1v4.05h-.1A1.7 1.7 0 0 0 19.4 15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
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

export default function Navbar({
  theme,
  accent,
  onThemeChange,
  onAccentChange,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const settingsButtonRef = useRef(null);

  useEffect(() => {
    if (!settingsOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!settingsRef.current?.contains(event.target)) {
        setSettingsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        settingsButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen]);

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link className="navbar__brand" to="/" aria-label="Echo home">
          <Logo size={36} animated />
          <span>Echo</span>
        </Link>

        <nav className="navbar__nav" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `navbar__link ${isActive ? "is-active" : ""}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `navbar__link ${isActive ? "is-active" : ""}`
            }
          >
            About
          </NavLink>
        </nav>

        <div className="navbar__settings-wrap" ref={settingsRef}>
          <button
            ref={settingsButtonRef}
            type="button"
            className={`navbar__settings ${settingsOpen ? "is-open" : ""}`}
            onClick={() => setSettingsOpen((current) => !current)}
            aria-label="Open appearance settings"
            aria-expanded={settingsOpen}
            aria-controls="appearance-settings"
            title="Appearance settings"
          >
            <GearIcon />
            <span className="navbar__settings-dot" aria-hidden="true" />
          </button>

          {settingsOpen && (
            <div
              className="settings-panel"
              id="appearance-settings"
              role="dialog"
              aria-label="Appearance settings"
            >
              <div className="settings-panel__head">
                <div>
                  <h2>Appearance</h2>
                  <p>Make Echo feel like yours.</p>
                </div>
                <button
                  type="button"
                  className="settings-panel__close"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="Close settings"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="settings-group">
                <span className="settings-group__label">Theme</span>
                <div className="theme-switch">
                  <button
                    type="button"
                    className={`theme-choice ${theme === "light" ? "is-active" : ""}`}
                    onClick={() => onThemeChange("light")}
                    aria-pressed={theme === "light"}
                  >
                    <SunIcon />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-choice ${theme === "dark" ? "is-active" : ""}`}
                    onClick={() => onThemeChange("dark")}
                    aria-pressed={theme === "dark"}
                  >
                    <MoonIcon />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              <div className="settings-group">
                <span className="settings-group__label">Accent color</span>
                <div className="accent-grid">
                  {ACCENTS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`accent-choice ${accent === item.id ? "is-active" : ""}`}
                      style={{ "--swatch-color": item.color }}
                      onClick={() => onAccentChange(item.id)}
                      aria-pressed={accent === item.id}
                      aria-label={`${item.name} accent color`}
                    >
                      <span className="accent-choice__dot" aria-hidden="true" />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="settings-panel__done"
                onClick={() => setSettingsOpen(false)}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
