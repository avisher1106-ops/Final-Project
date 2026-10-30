import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import About from "./pages/About";
import Home from "./pages/Home";

const ACCENT_IDS = ["blue", "emerald", "violet", "rose", "amber"];

function getInitialTheme() {
  try {
    return localStorage.getItem("echo-theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function getInitialAccent() {
  try {
    const savedAccent = localStorage.getItem("echo-accent");
    return ACCENT_IDS.includes(savedAccent) ? savedAccent : "blue";
  } catch {
    return "blue";
  }
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [accent, setAccent] = useState(getInitialAccent);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.accent = accent;

    try {
      localStorage.setItem("echo-theme", theme);
      localStorage.setItem("echo-accent", accent);
    } catch {
      // The interface still works when storage is unavailable.
    }

    const styles = getComputedStyle(root);
    const accentColor = styles.getPropertyValue("--accent").trim() || "#2563eb";
    const accentContrast =
      styles.getPropertyValue("--accent-contrast").trim() || "#ffffff";

    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor?.setAttribute("content", accentColor);

    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      const svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
        `<circle cx="32" cy="32" r="32" fill="${accentColor}"/>`,
        `<rect x="16.5" y="24" width="5" height="16" rx="2.5" fill="${accentContrast}"/>`,
        `<rect x="23" y="19" width="5" height="26" rx="2.5" fill="${accentContrast}"/>`,
        `<rect x="29.5" y="13" width="5" height="38" rx="2.5" fill="${accentContrast}"/>`,
        `<rect x="36" y="19" width="5" height="26" rx="2.5" fill="${accentContrast}"/>`,
        `<rect x="42.5" y="24" width="5" height="16" rx="2.5" fill="${accentContrast}"/>`,
        "</svg>",
      ].join("");
      favicon.setAttribute(
        "href",
        `data:image/svg+xml,${encodeURIComponent(svg)}`,
      );
    }
  }, [theme, accent]);

  return (
    <div className="app-shell">
      <Navbar
        theme={theme}
        accent={accent}
        onThemeChange={setTheme}
        onAccentChange={setAccent}
      />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
