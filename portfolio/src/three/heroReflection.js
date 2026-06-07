import * as THREE from 'three';
import { getScene, registerTick, unregisterTick } from './scene.js';

// Canvas size: wide-ratio text banner
const CW = 1024;
const CH = 200;

function drawTextToCanvas(name, title) {
  const canvas = document.createElement('canvas');
  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, CW, CH);

  // Name
  ctx.font         = '600 82px "Space Grotesk", sans-serif';
  ctx.fillStyle    = 'rgba(232, 244, 248, 0.90)';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(name, CW / 2, 14);

  // Title
  ctx.font      = '400 24px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(0, 245, 196, 0.75)';
  ctx.fillText(title.toUpperCase(), CW / 2, 116);

  return canvas;
}

// Identical wave equations to water.vert.glsl — keeps reflection in sync with the surface
const REFLECTION_VERT = /* glsl */`
  uniform float uTime;
  uniform float uWaveHeight;
  varying vec2  vUv;
  varying vec3  vNormal;

  float wH(vec2 xz, vec2 d, float f, float s, float a) {
    return sin(dot(d, xz) * f + uTime * s) * a;
  }
  float wDx(vec2 xz, vec2 d, float f, float s, float a) {
    return cos(dot(d, xz) * f + uTime * s) * a * f * d.x;
  }
  float wDz(vec2 xz, vec2 d, float f, float s, float a) {
    return cos(dot(d, xz) * f + uTime * s) * a * f * d.y;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    vec2 xz  = vec2(pos.x, pos.z);

    float h=0., dx=0., dz=0.;
    vec2 d1=normalize(vec2( 1.0, 0.6));  h+=wH(xz,d1,0.55,0.38,0.55); dx+=wDx(xz,d1,0.55,0.38,0.55); dz+=wDz(xz,d1,0.55,0.38,0.55);
    vec2 d2=normalize(vec2(-0.5, 1.0));  h+=wH(xz,d2,0.85,0.52,0.28); dx+=wDx(xz,d2,0.85,0.52,0.28); dz+=wDz(xz,d2,0.85,0.52,0.28);
    vec2 d3=normalize(vec2( 0.7,-0.7));  h+=wH(xz,d3,2.10,0.80,0.10); dx+=wDx(xz,d3,2.10,0.80,0.10); dz+=wDz(xz,d3,2.10,0.80,0.10);
    vec2 d4=normalize(vec2(-0.3,-0.9));  h+=wH(xz,d4,0.28,0.18,0.22); dx+=wDx(xz,d4,0.28,0.18,0.22); dz+=wDz(xz,d4,0.28,0.18,0.22);
    vec2 d5=normalize(vec2( 0.9,-0.4));  h+=wH(xz,d5,3.50,1.10,0.04); dx+=wDx(xz,d5,3.50,1.10,0.04); dz+=wDz(xz,d5,3.50,1.10,0.04);

    pos.y += h * uWaveHeight;

    // Surface normal — same as water.vert.glsl
    vNormal = normalize(vec3(-dx * uWaveHeight, 1.0, -dz * uWaveHeight));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const REFLECTION_FRAG = /* glsl */`
  uniform sampler2D uTex;
  uniform float     uTime;
  varying vec2      vUv;
  varying vec3      vNormal;

  void main() {
    vec2 uv = vUv;

    // Flip Y — a water reflection of text above the surface is vertically inverted
    uv.y = 1.0 - uv.y;

    // Wave distortion from surface normal + time ripple
    float rx = sin(vUv.x * 22.0 + uTime * 2.4) * 0.011;
    float ry = cos(vUv.y * 17.0 - uTime * 1.9) * 0.013;
    uv.x += vNormal.x * 0.065 + rx;
    uv.y += vNormal.z * 0.065 + ry;
    uv = clamp(uv, 0.01, 0.99);

    vec4 col = texture2D(uTex, uv);

    // Fade to nothing at the edges so the reflection blends into the water naturally
    float fadeX = 1.0 - pow(abs(vUv.x * 2.0 - 1.0), 2.5);
    float fadeY = 1.0 - pow(abs(vUv.y * 2.0 - 1.0), 2.0);
    float alpha  = col.a * fadeX * fadeY * 0.22;

    gl_FragColor = vec4(col.rgb, alpha);
  }
`;

export function createHeroReflection(name, title) {
  let mesh = null, geo = null, mat = null, texture = null, tick = null;

  function build() {
    const canvas = drawTextToCanvas(name, title);
    texture = new THREE.CanvasTexture(canvas);

    // Wide horizontal plane centred at z=0 on the water surface.
    // Camera is at z=6 looking toward z=-3; z=0 is between them, visible below screen-centre.
    // Width 26: wide enough to cover the viewport at that distance.
    // Depth 12: spans z=[−6, 6]; the UV strip visible from camera angle shows the text at UV.y≈0.5.
    geo = new THREE.PlaneGeometry(26, 12, 64, 32);
    geo.rotateX(-Math.PI / 2); // lay flat in XZ, same as the water mesh

    mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:       { value: 0 },
        uTex:        { value: texture },
        uWaveHeight: { value: 0.42 },
      },
      vertexShader:   REFLECTION_VERT,
      fragmentShader: REFLECTION_FRAG,
      transparent:    true,
      depthWrite:     false,
      side:           THREE.FrontSide,
    });

    mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0.04, 0); // y=0.04 — float 4 cm above the water to avoid z-fighting

    getScene().add(mesh);

    tick = (elapsed) => { if (mat) mat.uniforms.uTime.value = elapsed; };
    registerTick(tick);
  }

  // Defer until Google Fonts are loaded so canvas text uses the right face
  document.fonts.ready.then(build);

  return {
    dispose() {
      if (tick)    unregisterTick(tick);
      if (mesh)    getScene().remove(mesh);
      if (geo)     geo.dispose();
      if (mat)     mat.dispose();
      if (texture) texture.dispose();
    },
  };
}
