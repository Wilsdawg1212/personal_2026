import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { skills } from '../../data/skills.js';

// ── Bioluminescent particle canvas ─────────────────────────────────────────
function useParticles(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let raf;

    const COLORS = ['0,245,196', '80,160,255', '140,220,255'];

    const particles = Array.from({ length: 55 }, () => ({
      x:       Math.random(),
      y:       Math.random(),
      r:       0.6 + Math.random() * 1.8,
      speed:   0.00007 + Math.random() * 0.00014,
      opacity: 0.12 + Math.random() * 0.35,
      color:   COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    function resize() {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function draw() {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }

        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);
}

// ── Scroll-triggered entrance animations ───────────────────────────────────
function useSkillsAnimation(sectionRef) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section fade-in: slide up as it enters the viewport
      gsap.fromTo(
        '.skills-inner',
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end:   'top 30%',
            scrub: 1.4,
          },
        }
      );

      // Proficiency bars scale from 0 → full width once the section is in view
      gsap.fromTo(
        '.skills-bar-fill',
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: 'power2.out',
          stagger: 0.07,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
            toggleActions: 'play none none reset',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [sectionRef]);
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Skills({ hoveredSkill }) {
  const canvasRef  = useRef(null);
  const sectionRef = useRef(null);

  useParticles(canvasRef);
  useSkillsAnimation(sectionRef);

  return (
    <section id="skills" ref={sectionRef}>
      <canvas ref={canvasRef} className="skills-particle-canvas" aria-hidden="true" />

      <div className="skills-inner">

        <div className="skills-header">
          <span className="skills-depth-label">depth: mid-water // -85m</span>
          <h2 className="skills-heading">The School</h2>
          <p className="skills-subtext">Hover the fish to inspect each skill</p>
        </div>

        <div className="skills-grid">
          {skills.map((skill) => (
            <div key={skill.name} className="skills-row">
              <div className="skills-row-header">
                <span className="skills-name">{skill.name}</span>
                <span className="skills-pct" style={{ color: skill.color }}>
                  {skill.proficiency}%
                </span>
              </div>
              <div className="skills-bar-track">
                <div
                  className="skills-bar-fill"
                  style={{
                    width:           `${skill.proficiency}%`,
                    background:      skill.color,
                    transformOrigin: 'left center',
                    boxShadow:       `0 0 8px ${skill.color}88`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Fish hover tooltip — fed from Three.js raycasting via App.jsx */}
      {hoveredSkill && (
        <div className="skill-tooltip" aria-live="polite">
          <strong>{hoveredSkill.name}</strong>
          <span style={{ color: hoveredSkill.color }}>{hoveredSkill.proficiency}%</span>
        </div>
      )}

      {/* Screen-reader accessible list */}
      <ul className="sr-only" aria-label="Skills">
        {skills.map((s) => (
          <li key={s.name}>{s.name} — {s.proficiency}% proficiency</li>
        ))}
      </ul>
    </section>
  );
}
