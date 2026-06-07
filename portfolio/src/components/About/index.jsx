import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Carousel, { DEFAULT_CAROUSEL_ITEMS } from '../Carousel/index.jsx';

// ── Edit carousel items here ───────────────────────────────────────────────
// Replace `image` with a path like '/assets/highlight-1.jpg'
// Replace `caption` with your own text.
const CAROUSEL_ITEMS = DEFAULT_CAROUSEL_ITEMS;

// ── Caustic light animation ────────────────────────────────────────────────
const PATCHES = [
  { x: 0.18, y: 0.15, r: 0.22 },
  { x: 0.65, y: 0.28, r: 0.18 },
  { x: 0.82, y: 0.60, r: 0.20 },
  { x: 0.35, y: 0.70, r: 0.24 },
  { x: 0.10, y: 0.55, r: 0.16 },
  { x: 0.55, y: 0.88, r: 0.19 },
];

function useCaustics(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let raf, t = 0;

    function resize() {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function draw() {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      PATCHES.forEach(({ x, y, r }, i) => {
        const phase = t * 0.25 + i * 1.1;
        const px = (x + Math.sin(phase * 1.0) * 0.07) * W;
        const py = (y + Math.cos(phase * 0.7) * 0.05) * H;
        const pr = r * Math.min(W, H);
        const brightness = 0.055 + Math.sin(phase * 1.8 + 0.5) * 0.025;

        const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0,   `rgba(245, 195, 80, ${brightness})`);
        g.addColorStop(0.3, `rgba(180, 220, 255, ${brightness * 0.5})`);
        g.addColorStop(1,   'rgba(245, 195, 80, 0)');

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });

      t  += 0.016;
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

// ── Scroll-linked brightness ───────────────────────────────────────────────
// Content fades in as the section enters and peaks when the content block
// is centred in the viewport. Stays at full opacity through the section body.
function useScrollBrightness(innerRef, triggerRef) {
  useEffect(() => {
    const el      = innerRef.current;
    const trigger = triggerRef.current;
    if (!el || !trigger) return;

    const ctx = gsap.context(() => {
      // Fade/slide triggered on the heading element so the animation fires
      // when actual content is in view, not when the padded wrapper top is.
      gsap.fromTo(
        el,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger,
            start: 'top 88%',
            end:   'top 40%',
            scrub: 1.4,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [innerRef, triggerRef]);
}

// ── Component ──────────────────────────────────────────────────────────────
export default function About() {
  const causticRef  = useRef(null);
  const innerRef    = useRef(null);
  const triggerRef  = useRef(null);

  useCaustics(causticRef);
  useScrollBrightness(innerRef, triggerRef);

  return (
    <section id="about">
      <canvas ref={causticRef} className="caustic-canvas" aria-hidden="true" />

      <div ref={innerRef} className="about-inner">

        {/* ── Left column: photo + location ── */}
        <div className="about-photo-col">
          <div className="about-photo-frame">
            {/* ✏️  Replace src with your photo, e.g. "/assets/profile-photo.jpg" */}
            <img
              src="/assets/profile-photo.jpg"
              alt="Portrait of [Your Name]"
              className="about-photo"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="about-photo-placeholder" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="18" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M4 44c0-11 9-18 20-18s20 7 20 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>profile-photo.jpg</span>
            </div>
          </div>

          <div className="about-meta">
            <div className="about-meta-item">
              <span className="about-label">BASED IN</span>
              {/* ✏️  Your city / country */}
              <span className="about-value">City, Country</span>
            </div>
            <div className="about-meta-item">
              <span className="about-label">EXPERIENCE</span>
              {/* ✏️  Years of experience */}
              <span className="about-value">X+ years</span>
            </div>
          </div>
        </div>

        {/* ── Right column: text ── */}
        <div className="about-text-col">
          <h2 ref={triggerRef} className="about-heading">
            {/* ✏️  Your name */}
            Hi, I&apos;m <em>Your Name</em>
          </h2>

          <div className="about-bio">
            {/* ✏️  2–3 short paragraphs. First sentence = hook. */}
            <p>
              I&apos;m a full-stack developer who believes the best software feels
              inevitable — like the solution was always obvious, you just had to find
              it. My background in [your background] gives me an edge in [your specialty].
            </p>
            <p>
              I&apos;ve built [what you&apos;ve built] for [types of clients/companies],
              shipping [outcome]. I care deeply about [values] and bring that to
              everything I ship.
            </p>
            <p>
              When I&apos;m not at the keyboard I&apos;m [hobby / interest]. Probably
              also thinking about [thing you&apos;re obsessed with right now].
            </p>
          </div>

          <div className="about-group">
            <span className="about-label">CURRENTLY FISHING FOR</span>
            <div className="about-tags">
              {/* ✏️  What you're open to */}
              <span className="about-tag">Full-time roles</span>
              <span className="about-tag">Freelance contracts</span>
              <span className="about-tag">Open-source collab</span>
            </div>
          </div>

          <div className="about-group">
            <span className="about-label">FAVOURITE BAIT</span>
            <div className="about-tags">
              {/* ✏️  Your go-to tools */}
              <span className="about-tag about-tag--amber">TypeScript</span>
              <span className="about-tag about-tag--amber">React</span>
              <span className="about-tag about-tag--amber">Node.js</span>
              <span className="about-tag about-tag--amber">PostgreSQL</span>
            </div>
          </div>

          <div className="about-cta">
            {/* ✏️  Point to your actual resume */}
            <a href="/assets/resume.pdf" className="about-resume-link" target="_blank" rel="noopener noreferrer">
              View Resume →
            </a>
          </div>
        </div>

      </div>

      {/* ── Floating image carousel ──────────────────────────────────────── */}
      <div className="about-carousel-row">
        <span className="about-label">HIGHLIGHTS</span>
        <Carousel items={CAROUSEL_ITEMS} />
      </div>

    </section>
  );
}
