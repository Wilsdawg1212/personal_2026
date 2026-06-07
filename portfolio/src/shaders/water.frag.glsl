uniform float uTime;
uniform float uWaveHeight;
uniform vec3  uDeepColor;
uniform vec3  uPeakColor;

varying vec2  vUv;
varying float vElevation;
varying vec3  vNormal;

void main() {
  // ── Elevation-based color mixing ─────────────────────────────────────────
  // vElevation is in world Y units; normalise to [0,1]
  float t = clamp((vElevation / uWaveHeight) * 0.5 + 0.5, 0.0, 1.0);
  vec3 color = mix(uDeepColor, uPeakColor, t * t); // squared for deeper contrast

  // ── Moonlight specular (Blinn-Phong, world-space) ─────────────────────────
  vec3 moonDir = normalize(vec3(-0.4, 1.0, 0.6));
  float diff   = max(dot(vNormal, moonDir), 0.0);
  // Soft diffuse glow
  color += vec3(0.01, 0.03, 0.05) * diff;
  // Sharp specular sparkle
  float spec = pow(diff, 120.0);
  color += vec3(spec * 0.12, spec * 0.22, spec * 0.32);

  // ── Bioluminescent caustics (only at wave peaks) ──────────────────────────
  float cx = sin(vUv.x * 28.0 + uTime * 1.4 + sin(vUv.y * 18.0));
  float cz = sin(vUv.y * 22.0 - uTime * 1.1 + cos(vUv.x * 14.0));
  float caustic = smoothstep(0.78, 1.0, cx * cz) * t; // masked to peaks
  color += vec3(0.0, caustic * 0.22, caustic * 0.14);

  // ── Fresnel rim (surface edges catch more light) ──────────────────────────
  float fresnel = pow(1.0 - clamp(vNormal.y, 0.0, 1.0), 5.0);
  color += vec3(0.02, 0.08, 0.12) * fresnel * 0.5;

  // ── Horizon darkening ─────────────────────────────────────────────────────
  // UV edges = far plane = darken slightly so horizon blends into fog
  vec2 edge = abs(vUv - 0.5) * 2.0;
  float vignette = 1.0 - smoothstep(0.7, 1.0, max(edge.x, edge.y)) * 0.5;
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
