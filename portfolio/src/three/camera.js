import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setFogDensity } from './scene.js';

gsap.registerPlugin(ScrollTrigger);

// Z-depth for each section (camera moves into the screen = negative Z)
export const DEPTH_MAP = {
  surface:  0,
  shallow:  -35,
  midwater: -85,
  reef:     -145,
  abyss:    -200,
};

// Fog density at each depth level
const FOG_BASE    = 0.008;
const FOG_MAX     = 0.028;

let camera = null;
const depthListeners = new Set();

export function initCamera() {
  camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  // Low and close to the water surface — dramatic horizon view
  camera.position.set(0, 1.8, 6);
  camera.lookAt(0, 0, -3);
  return camera;
}

export function bindScrollCamera(scrollContainer) {
  if (!camera) throw new Error('initCamera() must be called before bindScrollCamera()');
  if (!scrollContainer) return;

  // ── Master depth scroll ──────────────────────────────────────────────────
  // Drives camera.position.z from DEPTH_MAP.surface → DEPTH_MAP.abyss
  // as the user scrolls the full page height.
  gsap.to(camera.position, {
    z: DEPTH_MAP.abyss,
    ease: 'none',
    scrollTrigger: {
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 2,
      onUpdate(self) {
        const fog = FOG_BASE + self.progress * (FOG_MAX - FOG_BASE);
        setFogDensity(fog);

        // Drive underwater overlay opacity via CSS custom property.
        // Triangle wave peaking at camY=0 (the exact moment of crossing the surface).
        // Fades in as the camera approaches y=0 and fades back out once below —
        // so the overlay is a cinematic flash, not a persistent dark layer.
        const camY = camera.position.y;
        const cross = Math.max(0, 1.0 - Math.abs(camY) / 0.75);
        document.documentElement.style.setProperty('--underwater', cross.toFixed(3));

        const currentDepth = camera.position.z;
        depthListeners.forEach((cb) => cb(currentDepth, self.progress));
      },
    },
  });

  // ── Y drift (camera sinks as it dives) ──────────────────────────────────
  gsap.to(camera.position, {
    y: -8,
    ease: 'none',
    scrollTrigger: {
      trigger: scrollContainer,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 2,
    },
  });

  // ── Per-section tilt ─────────────────────────────────────────────────────
  const sectionTilts = [
    { selector: '#hero',     rotX: 0      },
    { selector: '#about',    rotX: -0.08  },
    { selector: '#skills',   rotX: -0.14  },
    { selector: '#projects', rotX: -0.18  },
    { selector: '#contact',  rotX: -0.22  },
  ];

  sectionTilts.forEach(({ selector, rotX }) => {
    const el = document.querySelector(selector);
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top center',
      end: 'bottom center',
      scrub: true,
      onEnter: () => gsap.to(camera.rotation, { x: rotX, duration: 1.2, ease: 'power2.out' }),
      onEnterBack: () => gsap.to(camera.rotation, { x: rotX, duration: 1.2, ease: 'power2.out' }),
    });
  });
}

// Register a callback that fires every frame with (depth: number, progress: number)
export function onDepthChange(callback) {
  depthListeners.add(callback);
  return () => depthListeners.delete(callback); // returns cleanup fn
}

export function getCamera() {
  return camera;
}

export function refreshScrollTriggers() {
  ScrollTrigger.refresh();
}
