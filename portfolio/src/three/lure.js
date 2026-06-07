import * as THREE from 'three';
import { gsap } from 'gsap';
import { getScene, registerTick, unregisterTick } from './scene.js';

const LURE_DEPTH_Z = -155;
const LURE_Y       = -8;

let lureMesh  = null;
let lureLight = null;

export function createLure(onClickCallback) {
  // Glowing sphere
  const geo = new THREE.SphereGeometry(0.25, 16, 16);
  const mat = new THREE.MeshStandardMaterial({
    color:             0x00f5c4,
    emissive:          new THREE.Color(0x00f5c4),
    emissiveIntensity: 2.0,
    roughness:         0.0,
    metalness:         0.0,
  });

  lureMesh = new THREE.Mesh(geo, mat);
  lureMesh.position.set(0, LURE_Y, LURE_DEPTH_Z);

  // Point light parented to lure — illuminates nothing but itself
  lureLight = new THREE.PointLight(0x00f5c4, 3, 4);
  lureMesh.add(lureLight);

  getScene().add(lureMesh);

  const tick = (elapsed) => {
    if (!lureMesh) return;
    lureMesh.position.x = Math.sin(elapsed * 0.8) * 0.6;
    lureMesh.position.y = LURE_Y + Math.sin(elapsed * 1.3) * 0.15;
    lureLight.intensity = 2.5 + Math.sin(elapsed * 2.1) * 0.5;
  };

  registerTick(tick);

  // Click handler — animate the "bite" then open form
  function handleClick(mouseNDC, camera) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouseNDC, camera);
    const hits = raycaster.intersectObject(lureMesh);
    if (hits.length === 0) return;
    animateBite(() => onClickCallback?.());
  }

  return {
    mesh: lureMesh,
    handleClick,
    dispose() {
      unregisterTick(tick);
      geo.dispose();
      mat.dispose();
      getScene().remove(lureMesh);
      lureMesh = null;
    },
  };
}

function animateBite(onComplete) {
  const tl = gsap.timeline({ onComplete });
  // Quick jerk upward (fish taking the bait)
  tl.to(lureMesh.position, { y: LURE_Y + 1.5, duration: 0.1, ease: 'power4.in' });
  // Reel in — move up and right quickly
  tl.to(lureMesh.position, { y: LURE_Y + 6, x: 2, duration: 0.4, ease: 'power3.in' });
  // Fade out
  tl.to(lureMesh.material, { emissiveIntensity: 0, duration: 0.3 }, '<0.1');
}
