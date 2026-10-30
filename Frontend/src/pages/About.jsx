import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import "./About.css";

const DESIGNER_NAME = "Avigail Shermaister";

const TECHNOLOGIES = [
  {
    name: "React",
    tag: "Frontend",
    monogram: "R",
    description:
      "A responsive interface with smooth chat state, routing, and personalized theming.",
  },
  {
    name: "Python FastAPI",
    tag: "Backend",
    monogram: "Py",
    description:
      "A fast, clear REST layer that handles conversations, messages, and validation.",
  },
  {
    name: "MySQL",
    tag: "Database",
    monogram: "SQL",
    description:
      "Persistent storage for every conversation and message, with indexes and clean relationships.",
  },
  {
    name: "OpenAI API",
    tag: "AI",
    monogram: "AI",
    description:
      "Server-side answer generation that keeps the full conversation context in mind.",
  },
];

export default function About() {
  return (
    <div className="about">
      <section className="about__hero">
        <div className="about__hero-logo">
          <Logo size={82} animated />
        </div>

        <span className="about__eyebrow">Full Stack Final Project</span>
        <h1>Meet Echo</h1>
        <p>
          Echo is a modern AI chat experience built around a simple idea:
          conversations should feel focused, fast, and personal on every screen.
        </p>
      </section>

      <div className="about__grid">
        <article className="about-card">
          <span className="about-card__label">About the project</span>
          <h2>Conversations that keep their context</h2>
          <p>
            Echo stores the complete chat history on the server, so every new
            message reaches the model with the full context. Start separate
            conversations, return to them later, delete them, and begin again
            whenever you want.
          </p>

          <ul className="about-card__list">
            <li>Saved conversations with automatic titles</li>
            <li>Markdown answers with copy-ready code blocks</li>
            <li>Light and dark themes with five accent colors</li>
            <li>Responsive layouts for desktop, tablet, and mobile</li>
          </ul>
        </article>

        <article className="about-card about-card--person">
          <span className="about-card__label">About the developer</span>

          <div className="about-person">
            <div className="about-person__avatar">
              <span className="about-person__initials">AS</span>
            </div>
            <div>
              <h2>{DESIGNER_NAME}</h2>
              <p className="about-person__role">Full Stack Student</p>
            </div>
          </div>

          <p>
            Avigail built Echo as a Full Stack final project, connecting a modern
            React interface, a structured REST API, and a real MySQL database
            into one complete product.
          </p>
        </article>
      </div>

      <section className="about__tech">
        <div className="about__section-heading">
          <span className="about-card__label">Under the hood</span>
          <h2>The technology behind Echo</h2>
        </div>

        <div className="about__tech-grid">
          {TECHNOLOGIES.map((technology) => (
            <article className="tech-card" key={technology.name}>
              <div className="tech-card__top">
                <span className="tech-card__monogram">
                  {technology.monogram}
                </span>
                <span className="tech-card__tag">{technology.tag}</span>
              </div>
              <h3>{technology.name}</h3>
              <p>{technology.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about__cta">
        <div>
          <h2>Ready to start a conversation?</h2>
          <p>Head back to the chat and ask Echo anything.</p>
        </div>
        <Link className="about__cta-button" to="/">
          Back to chat
        </Link>
      </section>
    </div>
  );
}
