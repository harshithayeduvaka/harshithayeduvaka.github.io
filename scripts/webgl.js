// webgl.js — Token Stream + wireframe globe (Three.js)
import * as THREE from "three";
import { meta, corpus, geography } from "./content.js";

const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const lowEnd =
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) ||
  !document.createElement("canvas").getContext("webgl2");

const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
const MOBILE = matchMedia("(max-width: 860px)").matches;

// ------------------------------------------------------------------
// Derive target points from rendered text — tokens land on letterforms.
// ------------------------------------------------------------------
function sampleTextPoints(lines, count) {
  const c = document.createElement("canvas");
  const W = (c.width = 1024);
  const H = (c.height = 512);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 190px 'Bricolage Grotesque', system-ui, sans-serif";
  const lh = 200;
  const startY = H / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * lh));

  const data = ctx.getImageData(0, 0, W, H).data;
  const hits = [];
  for (let y = 0; y < H; y += 3) {
    for (let x = 0; x < W; x += 3) {
      if (data[(y * W + x) * 4] > 128) hits.push([x, y]);
    }
  }
  // map to world space: x in [-aspect,aspect]-ish, y in [-1,1]
  const aspect = W / H;
  const pts = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const h = hits[(Math.random() * hits.length) | 0] || [W / 2, H / 2];
    pts[i * 3] = ((h[0] / W) * 2 - 1) * aspect * 0.85;
    pts[i * 3 + 1] = -((h[1] / H) * 2 - 1) * 0.85;
    pts[i * 3 + 2] = 0;
  }
  return pts;
}

function wordTexture(text, color, red) {
  const c = document.createElement("canvas");
  const pad = 24;
  const ctx = c.getContext("2d");
  ctx.font = "500 40px 'Martian Mono', monospace";
  const w = ctx.measureText(text.toUpperCase()).width;
  c.width = w + pad * 2;
  c.height = 80;
  const g = c.getContext("2d");
  g.font = "500 40px 'Martian Mono', monospace";
  g.textBaseline = "middle";
  g.fillStyle = red ? "#E2372B" : color;
  g.fillText(text.toUpperCase(), pad, 44);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  return { tex, ratio: c.width / c.height };
}

// ------------------------------------------------------------------
// Token field
// ------------------------------------------------------------------
export function initField(canvas, sharedTick) {
  if (lowEnd) {
    canvas.style.display = "none";
    return { condense: () => {}, tps: () => 0, dropRed: () => {}, disposed: true };
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();

  let aspect = window.innerWidth / window.innerHeight;
  const cam = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
  cam.position.z = 3;

  // ---- Points that resolve into the name ----
  const N = MOBILE ? 800 : 2600;
  const target = sampleTextPoints([meta.first, meta.last], N);
  const home = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    home[i * 3] = (Math.random() * 2 - 1) * aspect * 1.4;
    home[i * 3 + 1] = (Math.random() * 2 - 1) * 1.3;
    home[i * 3 + 2] = (Math.random() * 2 - 1) * 0.5;
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute("home", new THREE.BufferAttribute(home, 3));
  geo.setAttribute("target", new THREE.BufferAttribute(target, 3));
  geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));

  const uniforms = {
    uTime: { value: 0 },
    uCondense: { value: 0 },
    uSize: { value: DPR * (MOBILE ? 2.2 : 3.0) },
    uColor: { value: new THREE.Color("#1B21D8") },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute vec3 home;
      attribute vec3 target;
      attribute float seed;
      uniform float uTime;
      uniform float uCondense;
      uniform float uSize;
      varying float vSeed;
      void main(){
        vSeed = seed;
        // divergence-y drift (cheap curl approximation)
        vec3 drift = home + vec3(
          sin(uTime*0.30 + seed*6.2831)*0.16,
          cos(uTime*0.23 + seed*4.10)*0.16,
          sin(uTime*0.19 + seed*3.30)*0.10);
        vec3 pos = mix(drift, target, uCondense);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.55 + 0.9*seed);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vSeed;
      void main(){
        vec2 d = gl_PointCoord - 0.5;
        float m = smoothstep(0.5, 0.32, length(d));
        if(m < 0.02) discard;
        gl_FragColor = vec4(uColor, m * (0.5 + 0.5*vSeed));
      }`,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // ---- Readable drifting word tokens ----
  const sprites = [];
  const pick = corpus.slice(0, MOBILE ? 10 : 20);
  pick.forEach((word, i) => {
    const { tex, ratio } = wordTexture(word, "#1B21D8");
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.0 });
    const s = new THREE.Sprite(m);
    const h = 0.055;
    s.scale.set(h * ratio, h, 1);
    s.position.set((Math.random() * 2 - 1) * aspect * 1.2, (Math.random() * 2 - 1) * 1.1, 0.2);
    s.userData = { sp: 0.02 + Math.random() * 0.03, ph: Math.random() * 6.28, base: s.position.y };
    scene.add(s);
    sprites.push(s);
  });

  // ---- The "generic CV" reject token (signal-red #1) ----
  const { tex: rt, ratio: rr } = wordTexture("generic CV", "#E2372B", true);
  const redMat = new THREE.SpriteMaterial({ map: rt, transparent: true, opacity: 0 });
  const red = new THREE.Sprite(redMat);
  red.scale.set(0.07 * rr, 0.07, 1);
  red.position.set(aspect * 0.55, 0.35, 0.3);
  scene.add(red);
  let redFall = -1; // >=0 while falling

  function resize() {
    aspect = window.innerWidth / window.innerHeight;
    cam.left = -aspect; cam.right = aspect; cam.top = 1; cam.bottom = -1;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  resize();
  window.addEventListener("resize", resize);

  let frames = 0, tps = 0, lastSec = performance.now();
  function render(t) {
    uniforms.uTime.value = t;
    const cond = uniforms.uCondense.value;
    sprites.forEach((s) => {
      s.material.opacity = 0.55 * (1 - cond * 0.7);
      s.position.x -= s.userData.sp * 0.016;
      if (s.position.x < -aspect * 1.3) s.position.x = aspect * 1.3;
      s.position.y = s.userData.base + Math.sin(t * 0.5 + s.userData.ph) * 0.04;
    });
    if (redFall >= 0) {
      redFall += 0.016;
      red.material.opacity = Math.max(0, 1 - redFall * 0.7);
      red.position.y = 0.35 - redFall * redFall * 3;
      red.position.x += 0.004;
    } else {
      red.material.opacity = Math.min(0.9, red.material.opacity + 0.01) * (1 - cond);
    }
    renderer.render(scene, cam);
    frames++;
    if (t * 1000 - lastSec > 1000) { tps = frames; frames = 0; lastSec = t * 1000; }
  }

  // static resolved frame for reduced motion
  if (prefersReduced) {
    uniforms.uCondense.value = 1;
    renderer.render(scene, cam);
    return { condense: () => {}, tps: () => N, dropRed: () => {}, render, uniforms, static: true };
  }

  return {
    render,
    uniforms,
    condense: (v) => (uniforms.uCondense.value = v),
    dropRed: () => { if (redFall < 0) redFall = 0; },
    tps: () => (tps ? Math.round(tps * N) / 100 : N),
    dispose: () => { geo.dispose(); mat.dispose(); renderer.dispose(); },
  };
}

// ------------------------------------------------------------------
// Wireframe globe — Hyderabad → Berlin → Paris
// ------------------------------------------------------------------
function llToVec(lat, lon, r) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

export function initGlobe(container) {
  if (lowEnd) { container.innerHTML = '<div class="mono" style="padding:24px;color:var(--espresso)">HYDERABAD → BERLIN → PARIS</div>'; return { render: () => {} }; }
  const w = container.clientWidth || 360;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(DPR);
  renderer.setSize(w, w, false);
  const cvs = renderer.domElement;
  cvs.style.width = "100%"; cvs.style.height = "auto";
  cvs.setAttribute("aria-hidden", "true");
  container.appendChild(cvs);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  cam.position.set(0, 0.4, 4.4);

  const R = 1.4;
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R, 3)),
    new THREE.LineBasicMaterial({ color: 0x5a3825, transparent: true, opacity: 0.3 })
  );
  const group = new THREE.Group();
  group.add(wire);
  scene.add(group);

  const arcs = [];
  for (let i = 0; i < geography.length - 1; i++) {
    const a = llToVec(geography[i].lat, geography[i].lon, R);
    const b = llToVec(geography[i + 1].lat, geography[i + 1].lon, R);
    const mid = a.clone().add(b).multiplyScalar(0.5).setLength(R * 1.35);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const pts = curve.getPoints(80);
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    g.setDrawRange(0, 0);
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xa8692e, linewidth: 2 }));
    group.add(line);
    arcs.push({ line, total: pts.length, progress: 0 });
  }
  geography.forEach((city) => {
    const v = llToVec(city.lat, city.lon, R);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x5a3825 })
    );
    dot.position.copy(v);
    group.add(dot);
  });

  new ResizeObserver(() => {
    const s = container.clientWidth;
    renderer.setSize(s, s, false);
  }).observe(container);

  let drawing = false;
  function startArcs() { drawing = true; }
  function render(t) {
    if (!prefersReduced) group.rotation.y = t * 0.12;
    if (drawing) {
      arcs.forEach((a, i) => {
        const delay = i * 60;
        if (a.progress < a.total) {
          a.progress += 1.4;
          a.line.geometry.setDrawRange(0, Math.max(0, a.progress - delay));
        }
      });
    }
    renderer.render(scene, cam);
  }
  return { render, startArcs };
}
