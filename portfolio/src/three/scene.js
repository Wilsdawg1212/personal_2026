import * as THREE from 'three';
import { initCamera } from './camera.js';

let renderer, scene, camera;
let animationId = null;
const clock = new THREE.Clock();
const tickCallbacks = new Set();

export function initScene(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050f1c); // slightly darker than deep-navy
  scene.fog = new THREE.FogExp2(0x050f1c, 0.008);

  camera = initCamera();

  // Dim blue-black ambient — base fill for the abyss
  const ambient = new THREE.AmbientLight(0x0a1830, 1.0);
  scene.add(ambient);

  // Moonlight — cold directional from above, very subtle
  const moon = new THREE.DirectionalLight(0x3355aa, 0.5);
  moon.position.set(-6, 18, 8);
  scene.add(moon);

  // Bioluminescent under-glow — warm teal point light just below surface
  const bioGlow = new THREE.PointLight(0x00f5c4, 0.4, 30);
  bioGlow.position.set(0, -1, 0);
  scene.add(bioGlow);

  window.addEventListener('resize', onResize);
  animate();

  return { scene, camera, renderer };
}

function animate() {
  animationId = requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  tickCallbacks.forEach((cb) => cb(elapsed));
  renderer.render(scene, camera);
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function registerTick(callback) {
  tickCallbacks.add(callback);
}

export function unregisterTick(callback) {
  tickCallbacks.delete(callback);
}

export function setFogDensity(density) {
  if (scene?.fog) scene.fog.density = density;
}

export function getScene() {
  return scene;
}

export function getCamera() {
  return camera;
}

export function getRenderer() {
  return renderer;
}

export function destroyScene() {
  if (animationId !== null) cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onResize);
  tickCallbacks.clear();
  renderer?.dispose();
  renderer = null;
  scene = null;
  camera = null;
}
