import * as THREE from 'three';
import { getScene, registerTick, unregisterTick } from './scene.js';
import { skills } from '../data/skills.js';

// Fish swim in front of the camera when it reaches the midwater depth (z=-85).
// Centre the school at z=-92 so they're always 7+ units ahead of the lens.
const SCHOOL_CENTER_Z = -120;
const SCHOOL_CENTER_Y = -3.5; // camera y ≈ -2.5 at midwater

// Lissajous figure-eight amplitudes in XZ space
const FIG8_X = 9;
const FIG8_Z = 5;

let fishMeshes = [];
let raycaster  = null;
let onHover    = null;

export function createFishSchool(onHoverCallback) {
  onHover   = onHoverCallback;
  raycaster = new THREE.Raycaster();

  fishMeshes = skills.map((skill, i) => {
    const geo = new THREE.ConeGeometry(0.25, 0.8, 6);
    geo.rotateX(Math.PI / 2); // tip now points in +Z (forward direction)

    const mat = new THREE.MeshStandardMaterial({
      color:             new THREE.Color(skill.color),
      emissive:          new THREE.Color(skill.color),
      emissiveIntensity: 0.4,
      roughness:         0.3,
      metalness:         0.1,
    });

    const mesh    = new THREE.Mesh(geo, mat);
    mesh.userData = { skill, index: i, hovered: false };
    // Scatter fish vertically so the school has depth
    mesh.position.y = SCHOOL_CENTER_Y + (Math.random() - 0.5) * 4;
    mesh.castShadow = true;
    getScene().add(mesh);
    return mesh;
  });

  const tick = (elapsed) => {
    fishMeshes.forEach((mesh) => {
      if (mesh.userData.hovered) return;

      const idx    = mesh.userData.index;
      const speed  = 0.28 + idx * 0.06;
      const offset = (idx / fishMeshes.length) * Math.PI * 2;
      const t      = elapsed * speed + offset;

      // Lissajous figure-eight: x at 1× freq, z at 2× freq
      mesh.position.x = Math.sin(t)     * FIG8_X;
      mesh.position.z = Math.sin(2 * t) * FIG8_Z + SCHOOL_CENTER_Z;

      // Velocity (derivatives) for heading — speed factor cancels in atan2
      const vx = Math.cos(t)       * FIG8_X;
      const vz = Math.cos(2 * t) * 2 * FIG8_Z;

      if (Math.abs(vx) > 0.001 || Math.abs(vz) > 0.001) {
        mesh.rotation.y = Math.atan2(vx, vz);
      }
    });
  };

  registerTick(tick);

  return {
    meshes: fishMeshes,
    handleMouseMove(mouseNDC, camera) {
      raycaster.setFromCamera(mouseNDC, camera);
      const hits = raycaster.intersectObjects(fishMeshes);

      fishMeshes.forEach((m) => {
        const wasHovered = m.userData.hovered;
        const isHovered  = hits.some((h) => h.object === m);
        m.userData.hovered = isHovered;

        if (isHovered && !wasHovered) {
          m.material.emissiveIntensity = 1.5;
          onHover?.(m.userData.skill);
        } else if (!isHovered && wasHovered) {
          m.material.emissiveIntensity = 0.4;
          onHover?.(null);
        }
      });
    },
    dispose() {
      unregisterTick(tick);
      fishMeshes.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
        getScene().remove(m);
      });
      fishMeshes = [];
    },
  };
}
