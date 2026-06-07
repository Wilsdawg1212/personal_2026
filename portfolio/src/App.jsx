import { useEffect, useRef, useState } from 'react';
import { initScene, destroyScene, getCamera } from './three/scene.js';
import { bindScrollCamera } from './three/camera.js';
import { createWater } from './three/water.js';
import { createHeroReflection } from './three/heroReflection.js';
import { createFishSchool } from './three/fish.js';
import { createWrecks } from './three/wrecks.js';
import { createLure } from './three/lure.js';
import { useMouseNDC } from './hooks/useMousePosition.js';
import { useScrollDepth } from './hooks/useScrollDepth.js';

import Hero        from './components/Hero/index.jsx';
import About       from './components/About/index.jsx';
import Skills      from './components/Skills/index.jsx';
import Projects    from './components/Projects/index.jsx';
import Contact     from './components/Contact/index.jsx';
import FishingLine from './components/FishingLine/index.jsx';
import AudioToggle from './components/AudioToggle/index.jsx';
import BiteCounter, { useBiteCounter } from './components/BiteCounter/index.jsx';

export default function App() {
  const canvasRef      = useRef(null);
  const pageRef        = useRef(null);
  const mouseNDC       = useMouseNDC();
  const scrollProgress = useScrollDepth();
  const { bites, bite } = useBiteCounter();

  const [hoveredSkill,  setHoveredSkill]  = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [contactOpen,   setContactOpen]   = useState(false);

  const fishRef       = useRef(null);
  const reefRef       = useRef(null);
  const lureRef       = useRef(null);
  const reflectionRef = useRef(null);

  // ── Boot Three.js ────────────────────────────────────────────────────────
  useEffect(() => {
    initScene(canvasRef.current);
    bindScrollCamera(pageRef.current);

    createWater();

    // Hero text reflection rendered on the 3D water surface
    reflectionRef.current = createHeroReflection('Your Name', 'Full-Stack Developer');

    fishRef.current = createFishSchool(setHoveredSkill);

    reefRef.current = createWrecks((project) => {
      bite();
      setActiveProject(project);
    });

    lureRef.current = createLure(() => setContactOpen(true));

    return () => {
      reflectionRef.current?.dispose();
      fishRef.current?.dispose();
      reefRef.current?.dispose();
      lureRef.current?.dispose();
      destroyScene();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hover raycasting on every mouse move ────────────────────────────────
  useEffect(() => {
    function onMouseMove() {
      const cam = getCamera();
      if (!cam) return;
      fishRef.current?.handleMouseMove(mouseNDC.current, cam);
      reefRef.current?.handleMouseMove(mouseNDC.current, cam);
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [mouseNDC]);

  // ── Canvas click → coral + lure raycasting ───────────────────────────────
  function handleCanvasClick() {
    const cam = getCamera();
    if (!cam) return;
    reefRef.current?.handleClick(mouseNDC.current, cam);
    lureRef.current?.handleClick(mouseNDC.current, cam);
  }

  return (
    <>
      {/* Fixed Three.js canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        onClick={handleCanvasClick}
        style={{ position: 'fixed', inset: 0, zIndex: 0, display: 'block' }}
      />

      {/*
        Underwater transition overlay.
        Opacity is driven by the CSS custom property --underwater (0→1) which
        camera.js sets via onUpdate as camera.position.y crosses the surface.
        No React state needed — camera.js writes directly to the CSS var.
      */}
      <div className="underwater-overlay" aria-hidden="true" />

      {/* Scrollable content — drives GSAP ScrollTrigger depth.
          pointer-events:none lets canvas clicks fall through; interactive
          elements inside sections re-enable via section > * { pointer-events: auto } */}
      <div ref={pageRef} style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
        <Hero />
        <About />
        <Skills hoveredSkill={hoveredSkill} />
        <Projects
          activeProject={activeProject}
          onClose={() => {
            setActiveProject(null);
            reefRef.current?.closeActiveChest();
          }}
        />
        <Contact isOpen={contactOpen} onClose={() => setContactOpen(false)} />
      </div>

      {/* HUD overlays */}
      <FishingLine />
      <AudioToggle />
      <BiteCounter bites={bites} />

      {scrollProgress > 0.05 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          style={{
            position:        'fixed',
            bottom:          '1.5rem',
            right:           '1.5rem',
            zIndex:          100,
            background:      'transparent',
            border:          '1px solid var(--color-amber)',
            color:           'var(--color-amber)',
            padding:         '0.4rem 0.8rem',
            cursor:          'pointer',
            fontFamily:      'JetBrains Mono, monospace',
            fontSize:        '0.8rem',
            letterSpacing:   '0.05em',
          }}
        >
          ↑ Surface
        </button>
      )}
    </>
  );
}
