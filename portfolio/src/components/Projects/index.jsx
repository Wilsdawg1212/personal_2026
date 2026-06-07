import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { projects } from '../../data/projects.js';

function useModal(activeProject, onClose, cardRef) {
  useEffect(() => {
    if (!activeProject) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeProject, onClose]);

  useEffect(() => {
    if (!activeProject || !cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 48, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, [activeProject, cardRef]);
}

export default function Projects({ activeProject, onClose }) {
  const cardRef = useRef(null);
  useModal(activeProject, onClose, cardRef);

  return (
    <section id="projects">

      <div className="projects-inner">
        <span className="projects-depth-label">depth: the reef // -145m</span>
        <h2 className="projects-heading">The Wrecks</h2>
        <p className="projects-subtext">Hover a chest to peek inside · Click to surface the project</p>
      </div>

      <ul className="sr-only" aria-label="Project list">
        {projects.map((p) => (
          <li key={p.id}>{p.title} — {p.description}</li>
        ))}
      </ul>

      {activeProject && (
        <div
          className="project-modal"
          role="dialog"
          aria-modal="true"
          aria-label={activeProject.title}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div ref={cardRef} className="project-card">

            {/* Chest-glow colored accent bar */}
            <div className="project-card-accent" style={{ background: activeProject.chestGlowColor }} />

            <div className="project-card-body">
              <button className="modal-close" onClick={onClose} aria-label="Close project">✕</button>

              <span className="project-card-category" style={{ color: activeProject.chestGlowColor }}>
                {activeProject.type} project
              </span>

              <h3 className="project-card-title">{activeProject.title}</h3>

              {activeProject.tagline && (
                <p className="project-card-tagline">{activeProject.tagline}</p>
              )}

              {activeProject.preview && (
                <div className="project-preview">
                  <img src={activeProject.preview} alt={`${activeProject.title} screenshot`} />
                </div>
              )}

              <p className="project-card-desc">{activeProject.description}</p>

              <ul className="tech-stack">
                {activeProject.tech.map((t) => (
                  <li
                    key={t}
                    style={{
                      borderColor: `${activeProject.chestGlowColor}55`,
                      color:        activeProject.chestGlowColor,
                    }}
                  >
                    {t}
                  </li>
                ))}
              </ul>

              <div className="modal-links">
                <a
                  href={activeProject.github}
                  className="modal-link modal-link--outline"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ '--link-color': activeProject.chestGlowColor }}
                >
                  GitHub →
                </a>
                <a
                  href={activeProject.live}
                  className="modal-link modal-link--fill"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ '--link-color': activeProject.chestGlowColor }}
                >
                  Live Demo →
                </a>
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
