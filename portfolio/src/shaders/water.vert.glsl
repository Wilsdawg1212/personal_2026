uniform float uTime;
uniform float uWaveHeight;

varying vec2  vUv;
varying float vElevation;
varying vec3  vNormal;

// Single directional sinusoidal wave — returns elevation and stores partials via out params
float waveH(vec2 xz, vec2 dir, float freq, float speed, float amp) {
  return sin(dot(dir, xz) * freq + uTime * speed) * amp;
}
float waveDx(vec2 xz, vec2 dir, float freq, float speed, float amp) {
  return cos(dot(dir, xz) * freq + uTime * speed) * amp * freq * dir.x;
}
float waveDz(vec2 xz, vec2 dir, float freq, float speed, float amp) {
  return cos(dot(dir, xz) * freq + uTime * speed) * amp * freq * dir.y;
}

void main() {
  vUv = uv;

  // After rotateX(-PI/2): pos.x = world X, pos.y = 0, pos.z = world -Z
  // Waves are sampled over the horizontal (XZ) plane
  vec3 pos   = position;
  vec2 xz    = vec2(pos.x, pos.z);
  float h    = 0.0;
  float dydx = 0.0;
  float dydz = 0.0;

  // ── Wave layers (dir is normalized, freq/speed/amp tuned for moody slow ocean) ──
  vec2 d1 = normalize(vec2( 1.0,  0.6)); float f1=0.55, s1=0.38, a1=0.55;
  h += waveH(xz,d1,f1,s1,a1); dydx += waveDx(xz,d1,f1,s1,a1); dydz += waveDz(xz,d1,f1,s1,a1);

  vec2 d2 = normalize(vec2(-0.5,  1.0)); float f2=0.85, s2=0.52, a2=0.28;
  h += waveH(xz,d2,f2,s2,a2); dydx += waveDx(xz,d2,f2,s2,a2); dydz += waveDz(xz,d2,f2,s2,a2);

  vec2 d3 = normalize(vec2( 0.7, -0.7)); float f3=2.10, s3=0.80, a3=0.10;
  h += waveH(xz,d3,f3,s3,a3); dydx += waveDx(xz,d3,f3,s3,a3); dydz += waveDz(xz,d3,f3,s3,a3);

  vec2 d4 = normalize(vec2(-0.3, -0.9)); float f4=0.28, s4=0.18, a4=0.22;
  h += waveH(xz,d4,f4,s4,a4); dydx += waveDx(xz,d4,f4,s4,a4); dydz += waveDz(xz,d4,f4,s4,a4);

  vec2 d5 = normalize(vec2( 0.9, -0.4)); float f5=3.50, s5=1.10, a5=0.04;
  h += waveH(xz,d5,f5,s5,a5); dydx += waveDx(xz,d5,f5,s5,a5); dydz += waveDz(xz,d5,f5,s5,a5);

  // Displace Y (vertical) — the only correct axis after rotateX(-PI/2)
  pos.y     += h * uWaveHeight;
  vElevation = pos.y;

  // Surface normal: N = normalize(-df/dx, 1, -df/dz) for y = f(x,z)
  vNormal = normalize(vec3(
    -dydx * uWaveHeight,
     1.0,
    -dydz * uWaveHeight
  ));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
