import * as THREE from 'three';
import { gsap } from 'gsap';
import { getScene, getCamera, registerTick, unregisterTick } from './scene.js';
import { projects } from '../data/projects.js';

// Camera z range in which wrecks are visible and interactive
const WRECK_ENTRY_Z = -110;
const WRECK_EXIT_Z  = -195;
const WRECK_LEAD    = 15;   // units ahead of camera (-z)
const FLOOR_Y       = -9;   // ocean floor relative to world origin
const SPREAD_X      = 12;   // horizontal gap between wrecks

// ── Hull materials ─────────────────────────────────────────────────────────
function hullMat(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color:     new THREE.Color(hex),
    roughness: opts.roughness ?? 0.92,
    metalness: opts.metalness ?? 0.30,
    ...opts,
  });
}

// ── Ship hulls (low-poly primitives) ──────────────────────────────────────
function buildCargoHull() {
  const g    = new THREE.Group();
  const hull = hullMat(0x4a1a10);   // rust brown
  const deck = hullMat(0x3a1208);   // darker

  // Main hull body
  const body = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.3, 3.0), hull);
  body.position.y = 0.65;
  g.add(body);

  // Stern superstructure
  const stern = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 2.8), hull);
  stern.position.set(2.8, 2.15, 0);
  g.add(stern);

  // Cargo hatches
  [-0.6, -2.3].forEach((x) => {
    const hatch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 1.8), deck);
    hatch.position.set(x, 1.4, 0);
    g.add(hatch);
  });

  // Crane mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.5, 6), hull);
  mast.position.set(0.7, 2.65, 0);
  g.add(mast);

  g.rotation.z = 0.14;
  g.rotation.y = 0.06;
  return g;
}

function buildSailboatHull() {
  const g    = new THREE.Group();
  const hull = hullMat(0x1c3020);   // dark teal
  const cab  = hullMat(0x2a4030);

  const body = new THREE.Mesh(new THREE.BoxGeometry(6.0, 1.0, 2.2), hull);
  body.position.y = 0.5;
  g.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.8), cab);
  cabin.position.set(-0.3, 1.45, 0);
  g.add(cabin);

  // Broken mast leaning sideways
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.5, 6), hull);
  mast.position.set(0.8, 2.55, 0);
  mast.rotation.z = 0.22;
  g.add(mast);

  g.rotation.z = -0.20;
  g.rotation.y = -0.08;
  return g;
}

function buildModernHull() {
  const g      = new THREE.Group();
  const hull   = hullMat(0x0d1f3a);   // dark navy
  const bridge = hullMat(0x162840);

  const body = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.7, 2.6), hull);
  body.position.y = 0.85;
  g.add(body);

  const pilothouse = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.4), bridge);
  pilothouse.position.set(1.2, 2.75, 0);
  g.add(pilothouse);

  // Radar mast
  const radar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6), hull);
  radar.position.set(1.2, 4.25, 0);
  g.add(radar);

  // Porthole — subtle emissive ring
  const portMat = new THREE.MeshStandardMaterial({
    color:             0x1a3050,
    emissive:          new THREE.Color(0x0a1828),
    emissiveIntensity: 0.4,
    roughness:         0.5,
  });
  const port = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 10), portMat);
  port.rotation.z = Math.PI / 2;
  port.position.set(-1.2, 0.9, 1.32);
  g.add(port);

  g.rotation.z = 0.09;
  g.rotation.y = 0.14;
  return g;
}

function buildHull(shipStyle) {
  if (shipStyle === 'sailboat') return buildSailboatHull();
  if (shipStyle === 'modern')   return buildModernHull();
  return buildCargoHull();
}

// ── Treasure chest ─────────────────────────────────────────────────────────
function buildChest(glowColor) {
  const group   = new THREE.Group();
  const meshes  = [];

  const woodMat = hullMat(0x3d2001, { roughness: 0.88, metalness: 0.08 });
  const lidMat  = hullMat(0x4e2c05, { roughness: 0.85, metalness: 0.08 });
  const bandMat = new THREE.MeshStandardMaterial({
    color:     new THREE.Color(0x8a6914),
    roughness: 0.5,
    metalness: 0.75,
  });

  // Base — sits at y=0 (floor of wreck group)
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.52, 0.68), woodMat);
  base.position.y = 0.26;
  group.add(base);
  meshes.push(base);

  // Horizontal iron band around base
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.07, 0.70), bandMat);
  band.position.y = 0.26;
  group.add(band);

  // Lid pivot positioned at the back-top edge of the base (z = -0.34, y = 0.52)
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.52, -0.34);
  group.add(lidPivot);

  // Lid geometry: pivot is at its back edge → offset forward by half depth
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 0.68), lidMat);
  lid.position.set(0, 0.13, 0.34);
  lidPivot.add(lid);
  meshes.push(lid);

  // Gold trim on lid's front edge
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.04), bandMat);
  trim.position.set(0, 0.04, 0.66);
  lidPivot.add(trim);
  meshes.push(trim);

  // Interior glow point light
  const light = new THREE.PointLight(new THREE.Color(glowColor), 0.5, 3.0);
  light.position.set(0, 0.5, 0);
  group.add(light);

  return { group, lidPivot, light, meshes };
}

// ── Dive marker sign ───────────────────────────────────────────────────────
function buildSignTexture(project) {
  const W = 512, H = 256;
  const c   = document.createElement('canvas');
  c.width   = W;
  c.height  = H;
  const ctx = c.getContext('2d');

  // Weathered wood background
  ctx.fillStyle = '#2c1a08';
  ctx.fillRect(0, 0, W, H);

  // Subtle wood grain
  ctx.strokeStyle = 'rgba(70,38,10,0.45)';
  ctx.lineWidth   = 1;
  for (let y = 0; y < H; y += 9) {
    ctx.beginPath();
    ctx.moveTo(0,  y + (Math.random() - 0.5));
    ctx.lineTo(W,  y + (Math.random() - 0.5));
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = '#5a3210';
  ctx.lineWidth   = 7;
  ctx.strokeRect(10, 10, W - 20, H - 20);

  // Project title
  ctx.font        = 'bold 52px "Space Grotesk", sans-serif';
  ctx.fillStyle   = '#e8d5a0';
  ctx.textAlign   = 'center';
  ctx.fillText(project.title, W / 2, 76);

  // Tagline
  ctx.font        = '25px "JetBrains Mono", monospace';
  ctx.fillStyle   = '#00c89e';
  const tagline   = project.tagline || '';
  // Truncate to fit
  let tl = tagline;
  while (ctx.measureText(tl).width > W - 40 && tl.length > 0) tl = tl.slice(0, -1);
  ctx.fillText(tl + (tl !== tagline ? '…' : ''), W / 2, 126);

  // Tech stack
  ctx.font        = '21px "JetBrains Mono", monospace';
  ctx.fillStyle   = '#8a9ab0';
  ctx.fillText(project.tech.slice(0, 4).join('  ·  '), W / 2, 180);

  // Call to action
  ctx.font        = '17px "JetBrains Mono", monospace';
  ctx.fillStyle   = 'rgba(245,166,35,0.75)';
  ctx.fillText('▼  CLICK TO INSPECT', W / 2, 230);

  return new THREE.CanvasTexture(c);
}

function buildSign(project) {
  const group  = new THREE.Group();
  const meshes = [];

  const woodMat = hullMat(0x3d2208, { roughness: 0.95, metalness: 0.0 });

  // Wooden post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 2.8, 8), woodMat);
  post.position.y = 1.4;
  group.add(post);

  // Sign board — MeshBasicMaterial renders the canvas texture without
  // any lighting dependency, so the sign always reads clearly.
  const tex      = buildSignTexture(project);
  const boardMat = new THREE.MeshBasicMaterial({ map: tex });
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 0.1), boardMat);
  board.position.y = 2.55;
  group.add(board);
  meshes.push(board);

  return { group, board, boardMat, tex, meshes };
}

// ── Jellyfish ──────────────────────────────────────────────────────────────
const JELLYFISH_COLORS = ['#00f5c4', '#7060ff', '#d050c8'];

function buildJellyfish(colorHex, idx) {
  const group = new THREE.Group();
  const col   = new THREE.Color(colorHex);

  // Bell: upper hemisphere (dome up, opening down)
  const bellGeo = new THREE.SphereGeometry(0.65, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const bellMat = new THREE.MeshStandardMaterial({
    color:             col,
    emissive:          col,
    emissiveIntensity: 1.6,
    transparent:       true,
    opacity:           0.55,
    side:              THREE.DoubleSide,
    depthWrite:        false,
  });
  group.add(new THREE.Mesh(bellGeo, bellMat));

  // Brighter inner dome
  const innerGeo = new THREE.SphereGeometry(0.38, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const innerMat = new THREE.MeshStandardMaterial({
    color:             col,
    emissive:          col,
    emissiveIntensity: 3.0,
    transparent:       true,
    opacity:           0.4,
    depthWrite:        false,
  });
  group.add(new THREE.Mesh(innerGeo, innerMat));

  // Tentacles — deterministic variation from idx so they don't shift on hot-reload
  const tentMat = new THREE.MeshStandardMaterial({
    color:             col,
    emissive:          col,
    emissiveIntensity: 0.9,
    transparent:       true,
    opacity:           0.38,
    depthWrite:        false,
  });
  const N = 6;
  for (let t = 0; t < N; t++) {
    const angle = (t / N) * Math.PI * 2 + idx * 0.55;
    const r     = 0.22 + (t * 0.09) % 0.22;
    const len   = 1.1 + (t * 0.33 + idx * 0.19) % 1.4;
    const tGeo  = new THREE.CylinderGeometry(0.018, 0.005, len, 4);
    const tent  = new THREE.Mesh(tGeo, tentMat);
    tent.position.set(Math.cos(angle) * r, -len / 2 - 0.05, Math.sin(angle) * r);
    group.add(tent);
  }

  // Point light below the bell — this is the primary wreck illuminator
  const light = new THREE.PointLight(col, 3.2, 22);
  light.position.y = -1.8;
  group.add(light);

  return { group };
}

// ── Gold particle burst ─────────────────────────────────────────────────────
function createGoldParticles(worldPos) {
  const scene = getScene();
  const N     = 30;
  const pos   = new Float32Array(N * 3);
  const vel   = [];

  for (let i = 0; i < N; i++) {
    pos[i * 3]     = worldPos.x + (Math.random() - 0.5) * 0.5;
    pos[i * 3 + 1] = worldPos.y + 0.4;
    pos[i * 3 + 2] = worldPos.z + (Math.random() - 0.5) * 0.5;
    vel.push({
      x: (Math.random() - 0.5) * 0.055,
      y: 0.028 + Math.random() * 0.055,
      z: (Math.random() - 0.5) * 0.055,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    color:      0xf5a623,
    size:       0.1,
    transparent: true,
    opacity:    1.0,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  let age = 0;
  const tick = () => {
    age += 0.016;
    for (let i = 0; i < N; i++) {
      pos[i * 3]     += vel[i].x;
      pos[i * 3 + 1] += vel[i].y;
      pos[i * 3 + 2] += vel[i].z;
      vel[i].y       -= 0.001;
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = Math.max(0, 1 - age / 1.4);
  };

  registerTick(tick);
  setTimeout(() => {
    unregisterTick(tick);
    scene.remove(points);
    geo.dispose();
    mat.dispose();
  }, 1500);
}

// ── Module-level state ─────────────────────────────────────────────────────
let wreckData  = [];
let raycaster  = null;
let onClickCb  = null;
let hoveredIdx = -1;
let activeIdx  = -1;

// ── Main export ────────────────────────────────────────────────────────────
export function createWrecks(onClickCallback) {
  onClickCb = onClickCallback;
  raycaster = new THREE.Raycaster();

  wreckData = projects.map((project, i) => {
    const xOffset = (i - (projects.length - 1) / 2) * SPREAD_X;

    const hull = buildHull(project.shipStyle);

    const { group: chestGroup, lidPivot, light: chestLight, meshes: chestMeshes }
      = buildChest(project.chestGlowColor || '#f5a623');

    // Chest sits inside the hull — offset slightly toward the broken side
    chestGroup.position.set(-1.8, 0, 0.2);

    const { group: signGroup, boardMat, tex: signTex, meshes: signMeshes }
      = buildSign(project);

    // Sign planted in front of the wreck, facing the camera (+z = toward camera)
    signGroup.position.set(0.5, 0, 2.8);

    // Jellyfish floats above the wreck and provides all illumination
    const { group: jellyGroup } = buildJellyfish(
      JELLYFISH_COLORS[i % JELLYFISH_COLORS.length], i
    );
    // Unique height + horizontal offset per wreck so they don't line up perfectly
    const jellyBaseY = 4.2 + (i * 0.9) % 1.4;
    jellyGroup.position.set(
      Math.sin(i * 2.3) * 1.8,
      jellyBaseY,
      Math.cos(i * 1.7) * 1.2
    );

    const group = new THREE.Group();
    group.add(hull);
    group.add(chestGroup);
    group.add(signGroup);
    group.add(jellyGroup);
    group.position.set(xOffset, FLOOR_Y, 0);
    group.visible = false;

    getScene().add(group);

    // Collect all hit-testable meshes
    const hullMeshes = [];
    hull.traverse((obj) => { if (obj.isMesh) hullMeshes.push(obj); });

    return {
      group, hull, chestGroup, lidPivot, chestLight,
      signGroup, boardMat, signTex,
      jellyGroup, jellyBaseY,
      hullMeshes, chestMeshes, signMeshes,
      project,
      textureReady: false,
      lidClicked:   false,
    };
  });

  // Rebuild sign textures once web fonts are confirmed loaded
  document.fonts.ready.then(() => {
    wreckData.forEach((w) => {
      const newTex = buildSignTexture(w.project);
      w.boardMat.map = newTex;
      w.boardMat.needsUpdate = true;
      w.signTex.dispose();
      w.signTex = newTex;
    });
  });

  // ── Tick ──────────────────────────────────────────────────────────────────
  const tick = (elapsed) => {
    const cam = getCamera();
    if (!cam) return;

    const camZ   = cam.position.z;
    const inZone = camZ < WRECK_ENTRY_Z && camZ > WRECK_EXIT_Z;

    wreckData.forEach((w, i) => {
      w.group.visible = inZone;
      if (!inZone) return;

      // Keep wrecks locked WRECK_LEAD units ahead of the camera
      w.group.position.z = camZ - WRECK_LEAD;

      // Sign sway
      w.signGroup.rotation.y = Math.sin(elapsed * 0.55 + i * 1.4) * 0.06;

      // Jellyfish bob and slow spin
      w.jellyGroup.position.y = w.jellyBaseY + Math.sin(elapsed * 0.65 + i * 2.2) * 0.55;
      w.jellyGroup.rotation.y = elapsed * 0.12 + i * 1.1;

      // Idle chest glow pulse
      if (!w.lidClicked && hoveredIdx !== i) {
        w.chestLight.intensity = 0.18 + Math.sin(elapsed * 1.6 + i * 0.8) * 0.1;
      }
    });
  };

  registerTick(tick);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function allHittableMeshes() {
    const out = [];
    wreckData.forEach((w) => {
      if (!w.group.visible) return;
      out.push(...w.hullMeshes, ...w.chestMeshes, ...w.signMeshes);
    });
    return out;
  }

  function wreckIndexForMesh(mesh) {
    for (let i = 0; i < wreckData.length; i++) {
      const w = wreckData[i];
      if ([...w.hullMeshes, ...w.chestMeshes, ...w.signMeshes].includes(mesh)) return i;
    }
    return -1;
  }

  // ── Hover ──────────────────────────────────────────────────────────────────
  function handleMouseMove(mouseNDC, camera) {
    raycaster.setFromCamera(mouseNDC, camera);
    const hits    = raycaster.intersectObjects(allHittableMeshes());
    const newIdx  = hits.length > 0 ? wreckIndexForMesh(hits[0].object) : -1;

    if (newIdx === hoveredIdx) return;

    // Un-hover previous wreck (unless its chest was clicked open)
    if (hoveredIdx >= 0) {
      const prev = wreckData[hoveredIdx];
      if (!prev.lidClicked) {
        gsap.to(prev.lidPivot.rotation, { x: 0, duration: 0.7, ease: 'power2.inOut' });
        gsap.to(prev.chestLight,        { intensity: 0.18,   duration: 0.5 });
      }
    }

    // Hover new wreck
    if (newIdx >= 0) {
      const curr = wreckData[newIdx];
      if (!curr.lidClicked) {
        gsap.to(curr.lidPivot.rotation, { x: -(Math.PI * 40) / 180, duration: 0.8, ease: 'power2.out' });
        gsap.to(curr.chestLight,        { intensity: 1.4, duration: 0.4 });
      }
    }

    hoveredIdx = newIdx;
  }

  // ── Click ──────────────────────────────────────────────────────────────────
  function handleClick(mouseNDC, camera) {
    raycaster.setFromCamera(mouseNDC, camera);
    const hits = raycaster.intersectObjects(allHittableMeshes());
    if (hits.length === 0) return;

    const idx = wreckIndexForMesh(hits[0].object);
    if (idx < 0) return;

    const w = wreckData[idx];
    if (w.lidClicked) return; // already open

    w.lidClicked = true;
    activeIdx    = idx;

    gsap.to(w.lidPivot.rotation, { x: -(Math.PI * 110) / 180, duration: 0.45, ease: 'power3.out' });
    gsap.to(w.chestLight,        { intensity: 3.5,             duration: 0.3 });

    const worldPos = new THREE.Vector3();
    w.chestGroup.getWorldPosition(worldPos);
    createGoldParticles(worldPos);

    onClickCb?.(w.project);
  }

  // ── Close active chest (call when modal dismisses) ─────────────────────────
  function closeActiveChest() {
    if (activeIdx < 0) return;
    const w = wreckData[activeIdx];
    w.lidClicked = false;
    gsap.to(w.lidPivot.rotation, { x: 0,    duration: 0.75, ease: 'power2.inOut' });
    gsap.to(w.chestLight,        { intensity: 0.18, duration: 0.6 });
    activeIdx  = -1;
    hoveredIdx = -1;
  }

  // ── Dispose ────────────────────────────────────────────────────────────────
  function dispose() {
    unregisterTick(tick);
    wreckData.forEach((w) => {
      w.signTex.dispose();
      w.group.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      });
      getScene().remove(w.group);
    });
    wreckData  = [];
    hoveredIdx = -1;
    activeIdx  = -1;
  }

  return { handleMouseMove, handleClick, closeActiveChest, dispose };
}
