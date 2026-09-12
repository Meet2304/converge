/**
 * Converge — the field.
 *
 * Single source of the field's behaviour. The tuning harness (field.html)
 * and the application both use this file, so what you tune is what ships.
 *
 * Framework-free ES module, no dependencies, no build step.
 * Specification and reasoning: ../field.md
 */

/* ------------------------------------------------------------------ shaders */

export const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uResolution;
uniform vec2  uOrigin;
uniform float uWaist, uFlare, uSigma, uFreq, uGain, uGamma;
uniform float uHalo, uHaloSigma, uRing, uBloom;
uniform float uLevels, uGrain;
uniform float uVigInner, uVigOuter;
uniform int   uNoiseMode;
uniform float uTimeSeed;
uniform sampler2D uBlue;
uniform float uBlueSize;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Interleaved gradient noise — texture-free, near blue-noise quality.
float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

float noiseAt(vec2 frag) {
  vec2 f = frag + uTimeSeed;
  if (uNoiseMode == 0) return hash(f);
  if (uNoiseMode == 1) return ign(f);
  return texture(uBlue, f / uBlueSize).r;
}

// Two mirrored beams on parabolic axes: pinch to uWaist at centre, flare
// outward as |p.y| grows. See field.md §2.2.
float beamField(vec2 p, float waist, float flare, float sigma, float freq) {
  float axis = waist + flare * p.y * p.y;
  float d    = abs(abs(p.x) - axis);

  // Narrow ridge — the caustic itself. uRing is the harmonic amplitude and
  // is capped deliberately: past ~0.2 the satellite bands detach and read as
  // a second wave system overlapping the ridge rather than as one body of
  // light. Taste bounds this, not the data.
  float core = exp(-(d * d) / (2.0 * sigma * sigma))
             * ((1.0 - uRing) + uRing * cos(d * freq));

  // Broad halo — the scattered light that carries to the frame edges.
  // Without it the corners go black and the image reads as two crescents.
  float halo = exp(-(d * d) / (2.0 * uHaloSigma * uHaloSigma));

  return core + uHalo * halo;
}

void main() {
  vec2 p  = (gl_FragCoord.xy - 0.5 * uResolution) / (0.5 * uResolution.y);
  vec2 q2 = p - uOrigin;

  float L = beamField(q2, uWaist, uFlare, uSigma, uFreq);
  L *= smoothstep(uVigOuter, uVigInner, dot(p, p));

  // Team formed. uBloom goes NEGATIVE during the gather, which runs every
  // term backwards: the field contracts and darkens before it releases.
  // See field.md §4.2.
  L  = pow(clamp(L, 0.0, 1.0), max(0.05, uGamma - uBloom * 0.26))
     * (uGain * (1.0 + uBloom * 1.15));
  L += uBloom * 0.30 * exp(-dot(q2, q2) / 1.10);
  L  = max(L, 0.0);

  // Quantize, then dither. Never composite grain on top — that is the whole
  // effect, and the reason the grain lives in the midtones and nowhere else.
  float n = noiseAt(gl_FragCoord.xy);
  float q = floor(L * uLevels + 0.5 + (n - 0.5) * uGrain) / uLevels;

  fragColor = vec4(vec3(clamp(q, 0.0, 1.0)), 1.0);
}`;

/* --------------------------------------------------------------- constants */

export const NOISE_MODES = ["white", "ign", "blue"];

/**
 * Locked values. The light field was derived by auto-fit against
 * Converge Header_v0.1.png; ring, levels, grain and noise are judgement
 * calls made by eye. See field.md §10.
 */
export const FIELD_DEFAULTS = {
  waist: 0.548,
  flare: 0.46,
  sigma: 0.142,
  freq: 14.26,
  gain: 0.426,
  gamma: 0.626,
  halo: 0.053,
  haloSigma: 0.74,
  ring: 0.14,
  levels: 10,
  grain: 1.7,
  vigInner: 0.0,
  vigOuter: 4.0,
  noise: 1, // ign
};

/** Convergence 0 → 1 maps onto this waist range. */
export const WAIST_OPEN = 0.85,
  WAIST_CLOSED = 0.06;

/**
 * Aspect the locked parameters were fitted at (the reference header).
 *
 * Coordinates normalise by height, so a squarer viewport has less horizontal
 * room and the lobes — which flare as |y| grows — end up filling the frame
 * instead of sweeping out of it. Scaling flare by aspect keeps the beams in
 * the same relationship to the frame at any shape. At the reference aspect
 * the multiplier is exactly 1, so nothing about the fitted look changes.
 */
export const REFERENCE_ASPECT = 2.3337;
export const aspectFlare = (w, h) => Math.max(0.4, Math.min(1.15, w / h / REFERENCE_ASPECT));

/** Damping time constants, seconds. field.md §3.1. */
export const TAU = { origin: 0.18, gain: 0.45, flare: 0.25, waist: 0.9 };

/** Team-formed response. field.md §4.2. */
export const BLOOM = {
  amount: 0.95,
  delay: 0.6,
  gather: 0.38,
  attack: 0.32,
  decay: 2.2,
  slowdown: 1.8, // waist tau multiplier while the sequence runs
  haloLift: 2.2, // halo multiplier at peak — scale, not just brightness
};

/** Held-state breathing. */
export const BREATHE = { amp: 0.06, period: 9.0 };

export const DPR_CAP = 1.5;

/* ----------------------------------------------------------------- helpers */

/**
 * Frame-rate independent exponential smoothing.
 * Never `cur += (target - cur) * 0.1` — that settles twice as fast at 120Hz
 * as at 60Hz, so the field becomes a different object on different hardware.
 */
export function damp(cur, target, tau, dt) {
  return cur + (target - cur) * (1 - Math.exp(-dt / tau));
}

/**
 * Staged envelope for the team-formed response.
 *   t < 0   gather — a negative lobe; the field contracts and darkens
 *   t >= 0  release — attack/decay, normalised so its peak is exactly 1
 * Normalisation is derived from attack and decay rather than hardcoded, so
 * the shape survives those being tuned.
 */
export function bloomEnvelope(t, attack, decay, gather) {
  if (t < -0.6) return 0;
  const g = -gather * Math.exp(-((t + 0.22) * (t + 0.22)) / (2 * 0.16 * 0.16));
  if (t < 0) return g;
  const peakT = attack * Math.log(1 + decay / attack);
  const peakV = (1 - Math.exp(-peakT / attack)) * Math.exp(-peakT / decay);
  return ((1 - Math.exp(-t / attack)) * Math.exp(-t / decay)) / Math.max(peakV, 1e-6) + g;
}

/**
 * Blue noise by filter-and-rank — the cheap approximation to void-and-cluster,
 * which is more than good enough at 64². Returns a Uint8Array tile.
 */
export function makeBlueNoise(size = 64, passes = 4) {
  const n = size * size;
  let v = new Float32Array(n);
  for (let i = 0; i < n; i++) v[i] = Math.random();

  const R = 3,
    sig = 1.5,
    K = [];
  for (let d = -R; d <= R; d++) K.push(Math.exp(-(d * d) / (2 * sig * sig)));

  for (let pass = 0; pass < passes; pass++) {
    const tmp = new Float32Array(n),
      low = new Float32Array(n);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        let s = 0,
          w = 0;
        for (let d = -R; d <= R; d++) {
          const k = K[d + R];
          s += k * v[y * size + ((x + d + size) % size)];
          w += k;
        }
        tmp[y * size + x] = s / w;
      }
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        let s = 0,
          w = 0;
        for (let d = -R; d <= R; d++) {
          const k = K[d + R];
          s += k * tmp[((y + d + size) % size) * size + x];
          w += k;
        }
        low[y * size + x] = s / w;
      }
    const hi = new Float32Array(n),
      idx = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      hi[i] = v[i] - low[i];
      idx[i] = i;
    }
    const order = Array.from(idx).sort((a, b) => hi[a] - hi[b]);
    const out = new Float32Array(n);
    for (let r = 0; r < n; r++) out[order[r]] = r / n;
    v = out;
  }

  const bytes = new Uint8Array(n);
  for (let i = 0; i < n; i++) bytes[i] = Math.min(255, (v[i] * 256) | 0);
  return bytes;
}

const UNIFORM_NAMES = [
  "uResolution",
  "uOrigin",
  "uWaist",
  "uFlare",
  "uSigma",
  "uFreq",
  "uGain",
  "uGamma",
  "uHalo",
  "uHaloSigma",
  "uRing",
  "uBloom",
  "uLevels",
  "uGrain",
  "uVigInner",
  "uVigOuter",
  "uNoiseMode",
  "uTimeSeed",
  "uBlue",
  "uBlueSize",
];

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

/* -------------------------------------------------------------------- field */

/**
 * Create a live field on a canvas.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} [opts]
 * @param {object} [opts.params]        overrides for FIELD_DEFAULTS
 * @param {number} [opts.convergence]   0..1, see field.md §4
 * @param {number} [opts.influence]     0..1 pointer response, 0 disables
 * @param {boolean} [opts.ambient]      breathe at any convergence, not just held
 * @param {Element} [opts.pointerTarget] defaults to the canvas
 * @param {boolean} [opts.autoStart]    default true
 * @param {boolean} [opts.observe]      pause offscreen / on tab blur, default true
 * @returns The field handle, or `null` when WebGL2 is unavailable — callers
 * must fall back to a baked still (field.md §8) rather than assume success.
 */
export function createField(canvas, opts = {}) {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program));
  // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL call, not a React hook.
  gl.useProgram(program);
  gl.bindVertexArray(gl.createVertexArray());

  const uniforms = {};
  for (const n of UNIFORM_NAMES) uniforms[n] = gl.getUniformLocation(program, n);

  const BLUE_SIZE = 64;
  const blueTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, blueTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R8,
    BLUE_SIZE,
    BLUE_SIZE,
    0,
    gl.RED,
    gl.UNSIGNED_BYTE,
    makeBlueNoise(BLUE_SIZE, 4),
  );
  gl.uniform1i(uniforms.uBlue, 0);
  gl.uniform1f(uniforms.uBlueSize, BLUE_SIZE);

  const params = { ...FIELD_DEFAULTS, ...(opts.params || {}) };
  const tau = { ...TAU };
  const bloomCfg = { ...BLOOM };
  const breathe = { ...BREATHE };

  const reduced =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    convergence: opts.convergence ?? null,
    influence: opts.influence ?? 1,
    frozen: reduced,
    shimmer: false,
    bloomAt: -1e9,
    bloomHold: null,
    // Breathing normally marks the held team-formed state. `ambient` makes it
    // available at any convergence, so a hero can stay alive without
    // pretending a team just formed.
    ambient: opts.ambient ?? false,
  };

  const cur = {
    waist: params.waist,
    gain: params.gain,
    flare: params.flare,
    ox: 0,
    oy: 0,
    aperture: 0,
    flareBoost: 0,
  };
  const pointer = { x: 0, y: 0, speed: 0, active: false };

  let W = 0,
    H = 0,
    raf = 0,
    last = performance.now(),
    frame = 0,
    running = false;

  function waistFor(convergence) {
    return WAIST_OPEN + (WAIST_CLOSED - WAIST_OPEN) * convergence;
  }
  if (state.convergence !== null) {
    params.waist = waistFor(state.convergence);
    cur.waist = params.waist;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round((r.width || canvas.clientWidth) * dpr));
    const h = Math.max(1, Math.round((r.height || canvas.clientHeight) * dpr));
    if (w === W && h === H) return;
    W = canvas.width = w;
    H = canvas.height = h;
    gl.viewport(0, 0, W, H);
  }

  /** Push a parameter set to the GPU. Exposed so tooling can render variants. */
  function applyUniforms(p, extra = {}) {
    const u = uniforms;
    gl.uniform2f(u.uOrigin, extra.ox ?? 0, extra.oy ?? 0);
    gl.uniform1f(u.uWaist, extra.waist ?? p.waist);
    gl.uniform1f(u.uFlare, extra.flare ?? p.flare);
    gl.uniform1f(u.uSigma, p.sigma);
    gl.uniform1f(u.uFreq, p.freq);
    gl.uniform1f(u.uGain, extra.gain ?? p.gain);
    gl.uniform1f(u.uGamma, p.gamma);
    gl.uniform1f(u.uHalo, extra.halo ?? p.halo);
    gl.uniform1f(u.uHaloSigma, p.haloSigma);
    gl.uniform1f(u.uRing, p.ring);
    gl.uniform1f(u.uBloom, extra.bloom ?? 0);
    gl.uniform1f(u.uLevels, extra.levels ?? p.levels);
    gl.uniform1f(u.uGrain, extra.grain ?? p.grain);
    gl.uniform1f(u.uVigInner, p.vigInner);
    gl.uniform1f(u.uVigOuter, p.vigOuter);
    gl.uniform1i(u.uNoiseMode, p.noise | 0);
    gl.uniform1f(u.uTimeSeed, extra.timeSeed ?? 0);
  }

  function step(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    resize();

    const seq = now / 1000 - state.bloomAt;
    const tb = seq - bloomCfg.delay;
    const bloom =
      state.bloomHold !== null
        ? state.bloomHold * bloomCfg.amount
        : state.frozen || tb > bloomCfg.decay * 6
          ? 0
          : bloomEnvelope(tb, bloomCfg.attack, bloomCfg.decay, bloomCfg.gather) * bloomCfg.amount;

    const inf = state.influence;
    const px = pointer.active ? pointer.x : 0;
    const py = pointer.active ? pointer.y : 0;
    const apertureT = pointer.active
      ? Math.max(0, 1 - Math.min(1, Math.hypot(px, py) / 1.2)) * inf
      : 0;
    const flareT = pointer.active ? pointer.speed * inf : 0;
    pointer.speed *= Math.exp(-dt / 0.12);

    if (state.frozen) {
      cur.waist = params.waist;
      cur.gain = params.gain;
      cur.flare = params.flare;
      cur.ox = cur.oy = cur.aperture = cur.flareBoost = 0;
    } else {
      cur.aperture = damp(cur.aperture, apertureT, tau.gain, dt);
      cur.flareBoost = damp(cur.flareBoost, flareT, tau.flare, dt);
      cur.ox = damp(cur.ox, px * 0.35 * inf, tau.origin, dt);
      cur.oy = damp(cur.oy, py * 0.35 * inf, tau.origin, dt);
      // The close is ceremonial while the team-formed sequence runs.
      const tauW =
        seq >= 0 && seq < bloomCfg.delay + bloomCfg.decay * 3
          ? tau.waist * bloomCfg.slowdown
          : tau.waist;
      cur.waist = damp(cur.waist, params.waist * (1 - 0.35 * cur.aperture), tauW, dt);
      cur.gain = damp(cur.gain, params.gain * (1 + 0.25 * cur.aperture), tau.gain, dt);
      cur.flare = damp(cur.flare, params.flare * (1 + 0.6 * cur.flareBoost), tau.flare, dt);
    }

    const held = state.ambient || (state.convergence !== null && state.convergence >= 0.98);
    const breathMul =
      held && !state.frozen
        ? 1 + breathe.amp * Math.sin((now / 1000) * ((2 * Math.PI) / breathe.period))
        : 1;

    gl.uniform2f(uniforms.uResolution, W, H);
    applyUniforms(params, {
      ox: cur.ox,
      oy: cur.oy,
      waist: cur.waist,
      flare: cur.flare * aspectFlare(W, H),
      gain: cur.gain * breathMul,
      halo: params.halo * (1 + Math.max(0, bloom) * bloomCfg.haloLift),
      bloom,
      timeSeed: state.shimmer && !state.frozen ? ((frame * 0.61803398875) % 1) * 64 : 0,
    });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frame++;

    if (running) raf = requestAnimationFrame(step);
  }

  /* --------------------------------------------------------------- pointer */

  const target = opts.pointerTarget || canvas;
  const onMove = (e) => {
    const r = target.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / (r.height / 2);
    const y = -((e.clientY - r.top - r.height / 2) / (r.height / 2));
    pointer.speed = Math.min(1, Math.hypot(x - pointer.x, y - pointer.y) * 6);
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
  };
  const onLeave = () => {
    pointer.active = false;
  };
  target.addEventListener("pointermove", onMove);
  target.addEventListener("pointerleave", onLeave);

  /* ---------------------------------------------------------- lifecycle */

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  // A field nobody is looking at costs zero. field.md §9.
  let io = null;
  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };
  if (opts.observe !== false && typeof IntersectionObserver === "function") {
    io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
  }

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  resize();
  if (opts.autoStart !== false) start();

  return {
    gl,
    program,
    uniforms,
    params,
    tau,
    bloom: bloomCfg,
    breathe,
    state,
    cur,
    applyUniforms,
    get width() {
      return W;
    },
    get height() {
      return H;
    },
    resize,
    draw: () => gl.drawArrays(gl.TRIANGLES, 0, 3),
    renderOnce: () => step(performance.now()),

    /** Set convergence 0..1. Pass {bloom:true} to fire the team-formed response. */
    setConvergence(v, o = {}) {
      state.convergence = v;
      params.waist = waistFor(v);
      if (o.bloom || (o.bloom !== false && v >= 0.98)) state.bloomAt = performance.now() / 1000;
    },
    triggerBloom() {
      state.bloomAt = performance.now() / 1000;
    },

    /**
     * Drive convergence from scroll. Never fires the team-formed bloom —
     * scrolling past 0.98 is not a team forming.
     */
    setScrollConvergence(v) {
      state.convergence = v;
      params.waist = waistFor(v);
    },

    setAmbient(v) {
      state.ambient = v;
    },
    setInfluence(v) {
      state.influence = v;
    },
    setFrozen(v) {
      state.frozen = v;
    },
    setShimmer(v) {
      state.shimmer = v;
    },
    /** Pin the bloom envelope at a phase, for inspecting it as a still. */
    holdBloom(v) {
      state.bloomHold = v;
    },
    start,
    stop,
    destroy() {
      stop();
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (io) io.disconnect();
      gl.deleteProgram(program);
      gl.deleteTexture(blueTex);
    },
  };
}
