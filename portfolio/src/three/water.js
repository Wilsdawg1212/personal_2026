import * as THREE from 'three';
import waterVert from '../shaders/water.vert.glsl?raw';
import waterFrag from '../shaders/water.frag.glsl?raw';
import { registerTick, unregisterTick, getScene } from './scene.js';

let waterMesh = null;
let material  = null;

export function createWater() {
  const geometry = new THREE.PlaneGeometry(160, 160, 128, 128);
  geometry.rotateX(-Math.PI / 2);

  material = new THREE.ShaderMaterial({
    vertexShader:   waterVert,
    fragmentShader: waterFrag,
    transparent:    false,
    side:           THREE.DoubleSide, // visible from both above AND below — no disappearing on dive
    uniforms: {
      uTime:       { value: 0 },
      uWaveHeight: { value: 0.42 },
      uDeepColor:  { value: new THREE.Color(0x05101e) },
      uPeakColor:  { value: new THREE.Color(0x0e3258) },
    },
  });

  waterMesh            = new THREE.Mesh(geometry, material);
  waterMesh.position.y = 0;

  getScene().add(waterMesh);

  const tick = (elapsed) => {
    if (material) material.uniforms.uTime.value = elapsed;
  };
  registerTick(tick);

  return {
    mesh: waterMesh,
    dispose() {
      unregisterTick(tick);
      geometry.dispose();
      material.dispose();
      getScene().remove(waterMesh);
      waterMesh = null;
      material  = null;
    },
  };
}
