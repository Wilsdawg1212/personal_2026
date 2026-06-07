import * as THREE from 'three';
import { gsap } from 'gsap';
import { getScene, getCamera, registerTick, unregisterTick } from './scene.js';
import { projects } from '../data/projects.js';

// Depth range (camera z) in which corals are visible and interactive.
// Entry when camera passes -110, exit when it passes -195 (near abyss).
const REEF_ENTRY_Z = -110;
const REEF_EXIT_Z  = -195;

// How far ahead of the camera the coral cluster sits (units in -z)
const CORAL_LEAD   = 12;
const FLOOR_Y      = -10;

let coralMeshes = [];
let coralAngles = []; // precomputed x-spread angle per coral
let raycaster   = null;
let onClick     = null;
let pointLight  = null;

function buildCoralGeometry() {
  const points = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const r = Math.sin(t * Math.PI) * 0.6 + 0.05;
    points.push(new THREE.Vector2(r, t * 2.5));
  }
  return new THREE.LatheGeometry(points, 10);
}

export function createReef(onClickCallback) {
  onClick   = onClickCallback;
  raycaster = new THREE.Raycaster();

  pointLight = new THREE.PointLight(0x00f5c4, 1.5, 20);
  getScene().add(pointLight);

  coralMeshes = projects.map((project, i) => {
    const geo = buildCoralGeometry();
    const mat = new THREE.MeshStandardMaterial({
      color:             new THREE.Color(project.color),
      emissive:          new THREE.Color(project.color),
      emissiveIntensity: 0.3,
      roughness:         0.6,
      metalness:         0.0,
    });

    const mesh         = new THREE.Mesh(geo, mat);
    mesh.userData      = { project, index: i };
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    mesh.visible       = false; // hidden until camera enters reef range

    // Spread in a fan across x; z is set dynamically in tick
    const angle = (i / projects.length) * Math.PI * 1.6 - Math.PI * 0.8;
    coralAngles.push(angle);
    mesh.position.set(Math.sin(angle) * 5, FLOOR_Y, 0);
    mesh.scale.setScalar(0.85 + (i * 0.17) % 0.55);

    getScene().add(mesh);
    return mesh;
  });

  const tick = (elapsed) => {
    const cam = getCamera();
    if (!cam) return;

    const camZ   = cam.position.z;
    const inReef = camZ < REEF_ENTRY_Z && camZ > REEF_EXIT_Z;

    coralMeshes.forEach((mesh, i) => {
      mesh.visible = inReef;
      if (!inReef) return;

      // Keep corals locked CORAL_LEAD units ahead of the camera every frame
      mesh.position.z = camZ - CORAL_LEAD + Math.cos(coralAngles[i]) * 3;

      // Gentle sway
      mesh.rotation.z = Math.sin(elapsed * 0.4 + i * 1.1) * 0.04;
    });

    if (pointLight) {
      pointLight.visible = inReef;
      if (inReef) {
        pointLight.position.set(0, FLOOR_Y + 4, camZ - CORAL_LEAD);
        pointLight.intensity = 1.2 + Math.sin(elapsed * 1.2) * 0.3;
      }
    }
  };

  registerTick(tick);

  return {
    meshes: coralMeshes,
    handleClick(mouseNDC, camera) {
      raycaster.setFromCamera(mouseNDC, camera);
      // Only test visible corals
      const visible = coralMeshes.filter((m) => m.visible);
      const hits = raycaster.intersectObjects(visible);
      if (hits.length === 0) return;

      const mesh = hits[0].object;
      surfaceCoral(mesh, () => onClick?.(mesh.userData.project));
    },
    dispose() {
      unregisterTick(tick);
      getScene().remove(pointLight);
      coralMeshes.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
        getScene().remove(m);
      });
      coralMeshes = [];
      coralAngles = [];
    },
  };
}

function surfaceCoral(mesh, onComplete) {
  const originalY = mesh.position.y;
  const tl = gsap.timeline({
    onComplete() {
      onComplete();
      gsap.to(mesh.position, { y: originalY, duration: 0.6, ease: 'bounce.out', delay: 0.1 });
      gsap.to(mesh.material, { emissiveIntensity: 0.3, duration: 0.5 });
    },
  });
  tl.to(mesh.material, { emissiveIntensity: 1.5, duration: 0.2 });
  tl.to(mesh.position, { y: originalY + 3, duration: 0.4, ease: 'power2.out' }, '<');
}
