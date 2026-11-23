/* FROM SAND TO SIGNAL: the 3D world. Every model is built from simple three.js shapes (no downloaded models).
   buildWorld() returns each station's group, its labels and a small API used by the hands-on controls. */
import * as THREE from './vendor/three.min.js';
import { STATIONS } from './data.js';
import { nandTransistors, rippleAdd, numberPixels } from './logic.js';

const C = {
  bg: 0x05070d, ink: 0xe8eefc, silicon: 0xb4bfd6, melt: 0xff8a1f, amber: 0xffb347, cyan: 0x3fe0ff, violet: 0x9b7bff,
  litho: 0xffd23f, copper: 0xd9824a, gold: 0xe8b84a, green: 0x2fd47a, red: 0xff4d5e, sand: 0xc9a46a, quartz: 0xdfe8ff
};

/* ---------- material + shape helpers ---------- */
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? .55, metalness: o.metal ?? .1, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: o.opacity != null, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, depthWrite: o.opacity == null || o.opacity > .6 });
const glow = (color, ei = 1.6, opacity) => std(color, { emissive: color, ei, rough: .4, opacity });
const mesh = (geo, mat, x = 0, y = 0, z = 0, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; };
/* Identical shapes share one geometry (faster to build, less memory). */
const geoCache = new Map();
const geo = (key, make) => { let g = geoCache.get(key); if (!g) { g = make(); geoCache.set(key, g); } return g; };
const box = (w, h, d, mat, x, y, z, parent) => mesh(geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), mat, x, y, z, parent);
const cyl = (rt, rb, h, mat, x, y, z, parent, seg = 32, open = false) => mesh(geo(`c${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)), mat, x, y, z, parent);
const sph = (r, mat, x, y, z, parent, seg = 20) => mesh(geo(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(8, seg >> 1))), mat, x, y, z, parent);
const tube = (pts, r, mat, parent, seg = 48) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, 8, false), mat); parent?.add(m); return m; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const setEmissive = (m, color, ei) => { m.emissive.setHex(color); m.emissiveIntensity = ei; };
let rnd = 1; const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
const approach = (v, target, dt, speed = 4) => v + (target - v) * Math.min(1, dt * speed);

function pedestal(g, r = 7) {
  cyl(r, r + .3, .4, std(0x0d1322, { rough: .8 }), 0, -.2, 0, g, 64);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r + .1, .05, 8, 96), glow(C.cyan, 1.2, .5)); ring.rotation.x = Math.PI / 2; g.add(ring);
}

/* ================= STATIONS ================= */
function sandStation() {
  const g = new THREE.Group(), labels = [], dune = new THREE.PlaneGeometry(13, 10, 64, 48);
  const h = (x, z) => .55 * Math.sin(x * .55) * Math.cos(z * .4) + .25 * Math.sin(x * 1.7 + z * 1.1) + .45;
  const p = dune.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, h(x, -y) * Math.max(0, 1 - Math.hypot(x / 7, y / 5.5) ** 4)); }
  dune.computeVertexNormals();
  const d = new THREE.Mesh(dune, std(C.sand, { rough: .95 })); d.rotation.x = -Math.PI / 2; g.add(d);
  const grains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.07, 0), std(0xe3c48a, { rough: .7 }), 500), m4 = new THREE.Matrix4();
  for (let i = 0; i < 500; i++) { const x = (rand() - .5) * 11, z = (rand() - .5) * 8; m4.makeTranslation(x, h(x, z) * Math.max(0, 1 - Math.hypot(x / 7, z / 5.5) ** 4) + .05, z); grains.setMatrixAt(i, m4); }
  g.add(grains);
  const crystals = new THREE.Group(), qm = std(C.quartz, { rough: .08, metal: 0, opacity: .62, emissive: 0x1b2a55, ei: .8 });
  [[0, 0, 0, 1, 3.4, 0], [-1.1, 0, .5, .6, 2.2, -.35], [1, 0, .4, .55, 2, .3], [.3, 0, -1, .5, 1.8, .2], [-.5, 0, -.8, .45, 1.6, -.5]].forEach(([x, y, z, r, len, tilt]) => {
    const c = new THREE.Group(); cyl(r, r, len, qm, 0, len / 2, 0, c, 6); const tip = cyl(0, r, r * 1.6, qm, 0, len + r * .8, 0, c, 6); void tip;
    c.position.set(x, 1 + y, z); c.rotation.z = tilt; c.rotation.x = tilt * .5; crystals.add(c);
  });
  g.add(crystals);
  // SiO₂ lattice (simplified): silicon atoms bonded to oxygen atoms.
  const atoms = new THREE.Group(), si = std(0xc9b26b, { metal: .3, rough: .35, emissive: 0x3a2e08 }), ox = std(0xff5a5f, { rough: .4, emissive: 0x3a0a0e }), bond = std(0x8a93a8, { rough: .5 });
  const sp = 1.1;
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let k = 0; k < 2; k++) {
    const x = i * sp * 1.4, y = 1.5 + k * sp * 1.4, z = j * sp * 1.4; sph(.24, si, x, y, z, atoms, 16);
    if (i < 2) { sph(.17, ox, x + sp * .7, y, z, atoms, 12); cyl(.04, .04, sp * 1.4, bond, x + sp * .7, y, z, atoms, 6).rotation.z = Math.PI / 2; }
    if (j < 2) { sph(.17, ox, x, y, z + sp * .7, atoms, 12); cyl(.04, .04, sp * 1.4, bond, x, y, z + sp * .7, atoms, 6).rotation.x = Math.PI / 2; }
    if (k < 1) { sph(.17, ox, x, y + sp * .7, z, atoms, 12); cyl(.04, .04, sp * 1.4, bond, x, y + sp * .7, z, atoms, 6); }
  }
  atoms.scale.setScalar(.001); atoms.visible = false; g.add(atoms);
  labels.push({ text: 'Quartz crystal', pos: V(0, 5.2, 0) }, { text: 'Silica sand', pos: V(4.5, 1.6, 2.5) });
  let showAtoms = 0, a = 0;
  return { g, labels, api: { atoms(on) { showAtoms = on ? 1 : 0; } }, update(dt, t) {
    a = approach(a, showAtoms, dt, 3); atoms.visible = a > .02; atoms.scale.setScalar(Math.max(.001, a)); atoms.rotation.y = t * .15;
    crystals.children.forEach(c => c.children.forEach(m => { m.material.opacity = .62 * (1 - a) + .05; }));
    crystals.rotation.y = Math.sin(t * .2) * .2;
  } };
}

function purifyStation() {
  const g = new THREE.Group(), labels = [];
  pedestal(g, 8);
  // Arc furnace: quartz + carbon → silicon metal
  const fur = new THREE.Group(); fur.position.set(-4.2, 0, 0); g.add(fur);
  cyl(1.7, 1.9, 2.4, std(0x2a2f3c, { metal: .6, rough: .4 }), 0, 1.2, 0, fur, 32);
  const fglow = cyl(1.5, 1.5, .1, glow(C.melt, 2.2), 0, 2.42, 0, fur);
  for (let i = 0; i < 3; i++) { const a = i * 2.094; cyl(.18, .18, 3, std(0x3b3f48, { metal: .7, rough: .3 }), Math.cos(a) * .7, 3.6, Math.sin(a) * .7, fur, 12); }
  const fl = new THREE.PointLight(C.melt, 18, 10, 2); fl.position.set(0, 3, 0); fur.add(fl);
  // Siemens reactor: glowing rods inside a bell jar
  const rx = new THREE.Group(); rx.position.set(2.6, 0, 0); g.add(rx);
  cyl(1.9, 2, .5, std(0x3a4252, { metal: .7, rough: .35 }), 0, .25, 0, rx);
  const jar = new THREE.Mesh(new THREE.SphereGeometry(1.9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), std(0x9fc3ff, { opacity: .18, rough: .05, side: THREE.DoubleSide })); jar.position.y = 3.6; rx.add(jar);
  cyl(1.9, 1.9, 3.1, std(0x9fc3ff, { opacity: .18, rough: .05, side: THREE.DoubleSide }), 0, 2.05, 0, rx, 32, true);
  const rodMat = glow(C.amber, .6), rods = [];
  [[-.8, 0], [.8, 0]].forEach(([x]) => { const u = new THREE.Group(); u.position.x = x; rx.add(u); rods.push(cyl(.12, .12, 3, rodMat, -.3, 2, 0, u, 16), cyl(.12, .12, 3, rodMat, .3, 2, 0, u, 16), cyl(.12, .12, .72, rodMat, 0, 3.5, 0, u, 16)); rods[rods.length - 1].rotation.z = Math.PI / 2; });
  // Polysilicon chunks
  const chunks = new THREE.Group(); chunks.position.set(6.2, 0, .5); g.add(chunks);
  const cm = std(0x9aa3b5, { metal: .85, rough: .28 });
  for (let i = 0; i < 14; i++) { const m = mesh(new THREE.DodecahedronGeometry(.28 + rand() * .2, 0), cm, (rand() - .5) * 1.6, .25 + rand() * .5, (rand() - .5) * 1.6, chunks); m.rotation.set(rand() * 6, rand() * 6, rand() * 6); }
  chunks.scale.setScalar(.001);
  tube([[-2.4, 3, 0], [-.8, 4.4, 0], [.6, 4.2, 0]], .06, glow(C.cyan, 1.5, .7), g);
  labels.push({ text: 'Furnace: quartz → silicon metal', pos: V(-4.2, 5.4, 0) }, { text: 'Siemens reactor', pos: V(2.6, 6.2, 0) }, { text: 'Polysilicon', pos: V(6.2, 2, .5) });
  let run = 0, k = 0;
  return { g, labels, api: { run() { run = 1; k = 0; } }, update(dt, t) {
    fglow.material.emissiveIntensity = 2 + Math.sin(t * 7) * .4; fl.intensity = 16 + Math.sin(t * 9) * 4;
    if (run) k = Math.min(1, k + dt / 3.2); const s = .45 + k * 1.6;
    rods.forEach((r, i) => { if (i % 3 === 2) r.scale.set(1, s, s); else r.scale.set(s, 1, s); r.material.emissiveIntensity = .6 + k * 2.2; });
    chunks.scale.setScalar(Math.max(.001, run ? Math.max(0, (k - .6) / .4) : 0));
  } };
}

function czoStation() {
  const g = new THREE.Group(), labels = [];
  pedestal(g, 6);
  const quartzMat = std(0xe9eef8, { rough: .3 });
  cyl(2.2, 2, 2, quartzMat, 0, 1, 0, g, 48, true); cyl(2, 2, .15, quartzMat, 0, .07, 0, g, 48);
  const melt = cyl(2.05, 2.05, .2, std(0x5a1a00, { emissive: C.melt, ei: 1.1, rough: .3 }), 0, 1.6, 0, g, 48);
  const heater = new THREE.Mesh(new THREE.TorusGeometry(2.6, .14, 12, 64), glow(C.red, 1.6)); heater.rotation.x = Math.PI / 2; heater.position.y = 1; g.add(heater);
  const light = new THREE.PointLight(C.melt, 30, 12, 2); light.position.set(0, 3, 0); g.add(light);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(3.2, 3.2, 10, 8)), new THREE.LineBasicMaterial({ color: 0x2a3550 })); frame.position.y = 5.2; g.add(frame);
  const siMat = std(C.silicon, { metal: .75, rough: .28 });
  const ingot = new THREE.Group(); g.add(ingot);
  const body = cyl(1.25, 1.25, 1, siMat, 0, 0, 0, ingot, 48), cone = cyl(.12, 1.25, .9, siMat, 0, 0, 0, ingot, 48), tail = cyl(1.25, .5, .4, siMat, 0, 0, 0, ingot, 48);
  const shaft = cyl(.06, .06, 1, std(0xb0b8c8, { metal: .9, rough: .2 }), 0, 0, 0, g, 8);
  labels.push({ text: 'Molten silicon', pos: V(2.6, 2.1, 1.4) }, { text: 'Single-crystal ingot', pos: V(-2.4, 5.2, 0) }, { text: 'Seed + pull rod', pos: V(.6, 10, 0) });
  let pull = .55, shown = .55;
  return { g, labels, api: { pull(v) { pull = v; } }, update(dt, t) {
    shown = approach(shown, pull, dt, 5);
    const L = .3 + shown * 5.4, base = 1.8;
    tail.position.y = base + .2; body.scale.y = L; body.position.y = base + .4 + L / 2; cone.position.y = base + .4 + L + .45;
    const top = base + .4 + L + .9; shaft.scale.y = Math.max(.01, 10.5 - top); shaft.position.y = top + (10.5 - top) / 2;
    ingot.rotation.y = t * .9; melt.rotation.y = -t * .5; melt.material.emissiveIntensity = 1.05 + Math.sin(t * 3) * .15;
    tail.visible = shown > .02;
  } };
}

function sliceStation() {
  const g = new THREE.Group(), labels = []; pedestal(g, 6.5);
  const siMat = std(C.silicon, { metal: .6, rough: .3 }), mirror = std(0xe8eef8, { metal: 1, rough: .04 });
  const ingot = cyl(1.4, 1.4, 6, siMat, -2, 1.8, 0, g, 48); ingot.rotation.z = Math.PI / 2;
  for (let i = 0; i < 9; i++) cyl(.015, .015, 4.4, glow(C.cyan, 2), -4 + i * .5, 1.8, 0, g, 6);
  const d1 = cyl(.35, .35, 6.2, std(0x39414f, { metal: .6 }), -2, 4.1, 0, g, 24); d1.rotation.z = Math.PI / 2;
  const wafers = []; for (let i = 0; i < 7; i++) { const w = cyl(1.4, 1.4, .05, i === 6 ? mirror : siMat, 0, 0, 0, g, 64); w.userData.i = i; wafers.push(w); }
  labels.push({ text: 'Diamond wire saw', pos: V(-2, 4.9, 0) }, { text: 'Polished wafer', pos: V(4.2, 4.6, 0) });
  let k = 0, go = 0;
  const place = () => wafers.forEach((w, i) => {
    const s = Math.min(1, Math.max(0, k * 1.4 - i * .08)), hero = i === 6;
    const start = V(1.03 + i * .06, 1.8, 0), stack = V(3.3, .35 + i * .08, -.6), up = V(4.2, 2.8, .4);
    const p = s < .6 ? start.clone().lerp(stack, s / .6) : hero ? stack.clone().lerp(up, (s - .6) / .4) : stack;
    w.position.copy(p);
    w.rotation.set(0, 0, hero && s > .6 ? Math.PI / 2 * (1 - (s - .6) / .4 * .9) : (1 - Math.min(1, s / .6)) * Math.PI / 2);
  });
  place();
  return { g, labels, api: { slice() { go = 1; k = 0; } }, update(dt, t) {
    if (go) { k = Math.min(1, k + dt / 2.6); place(); }
    wafers[6].rotation.y = go && k > .9 ? t * .6 : 0;
  } };
}

function lithoStation() {
  const g = new THREE.Group(), labels = []; pedestal(g, 7.5);
  const dark = std(0x3a4560, { metal: .5, rough: .35 });
  // EUV source: tin droplets hit by a laser → plasma
  box(2.2, 2.6, 2.2, dark, -5, 1.3, 0, g); const plasma = sph(.35, glow(C.violet, 3), -5, 2.9, 0, g);
  const drops = []; for (let i = 0; i < 6; i++) drops.push(sph(.06, std(0xd0d6e0, { metal: 1, rough: .2 }), -5, 4 - i * .25, 0, g, 8));
  // Mirrors, mask (reticle) and wafer stage
  const mirMat = std(0xe8eef8, { metal: .9, rough: .08, emissive: 0x223355, ei: .6 });
  const m1 = box(1.6, .12, 1.2, mirMat, -1.8, 4.6, 0, g); m1.rotation.z = -.35;
  const maskTex = makeMaskTexture(), mask = box(2.2, .08, 2.2, new THREE.MeshStandardMaterial({ map: maskTex, metalness: .3, roughness: .4, emissive: 0x202020 }), 1, 5.6, 0, g);
  const m2 = box(1.6, .12, 1.2, mirMat, 3.6, 4.3, 0, g); m2.rotation.z = .35;
  box(3.2, .6, 3.2, dark, 3.8, .3, 0, g);
  const expTex = makeExposureTexture(), wafer = cyl(1.4, 1.4, .06, new THREE.MeshStandardMaterial({ map: expTex.tex, color: 0xffffff, roughness: .35, metalness: .3 }), 3.8, .65, 0, g, 64);
  const beamMat = glow(C.cyan, 2, .0), beams = [];
  [[V(-5, 2.9, 0), V(-1.8, 4.6, 0)], [V(-1.8, 4.6, 0), V(1, 5.6, 0)], [V(1, 5.6, 0), V(3.6, 4.3, 0)], [V(3.6, 4.3, 0), V(3.8, .7, 0)]].forEach(([a, b]) => {
    const len = a.distanceTo(b), m = cyl(.09, .09, len, beamMat, 0, 0, 0, g, 8); m.position.copy(a).lerp(b, .5); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); beams.push(m);
  });
  labels.push({ text: 'EUV light source', pos: V(-5, 3.8, 1.4) }, { text: 'Mirror', pos: V(-1.8, 5.2, 0) }, { text: 'Mask (reticle)', pos: V(1, 6.3, 0) }, { text: 'Wafer + resist', pos: V(3.8, 1.5, 1.6) });
  let on = 0, k = 0;
  return { g, labels, api: { expose() { on = 1; k = 0; expTex.reset(); } }, update(dt, t) {
    plasma.material.emissiveIntensity = 2.5 + Math.sin(t * 40) * .8; plasma.scale.setScalar(1 + Math.sin(t * 25) * .1);
    drops.forEach((d, i) => { d.position.y = 4.1 - ((t * 1.6 + i / 6) % 1) * 1.3; });
    if (on) { k = Math.min(1, k + dt / 3); expTex.draw(k); if (k >= 1) on = 0; }
    beamMat.opacity = on ? .55 + Math.sin(t * 30) * .15 : approach(beamMat.opacity, 0, dt, 3);
    beams.forEach(b => { b.visible = beamMat.opacity > .02; });
  } };
}
function makeMaskTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#1b1f2a'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#c9d3e6';
  for (let i = 0; i < 16; i++) x.fillRect(20 + i * 14, 30, 6, 196);
  x.fillRect(20, 120, 216, 10); x.fillRect(20, 60, 100, 6); x.fillRect(136, 180, 100, 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeExposureTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const dies = []; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const cx = 16 + i * 28 + 14, cy = 16 + j * 28 + 14; if (Math.hypot(cx - 128, cy - 128) < 108) dies.push([16 + i * 28, 16 + j * 28]); }
  const reset = () => { x.fillStyle = '#5b3f8a'; x.fillRect(0, 0, 256, 256); tex.needsUpdate = true; };
  const draw = k => {
    const n = Math.floor(k * dies.length);
    for (let i = 0; i < n; i++) { const [a, b] = dies[i]; x.fillStyle = '#ffd23f'; for (let s = 0; s < 5; s++) x.fillRect(a + 3 + s * 5, b + 3, 2, 20); x.fillRect(a + 3, b + 12, 22, 2); }
    tex.needsUpdate = true;
  };
  reset(); return { tex, reset, draw };
}

function layersStation() {
  const g = new THREE.Group(), labels = []; pedestal(g, 6);
  box(8, 1, 4, std(C.silicon, { metal: .5, rough: .3 }), 0, .5, 0, g);
  const film = [], resist = [], doped = [], N = 8, w = 8 / N;
  for (let i = 0; i < N; i++) {
    film.push(box(w - .02, .35, 4, std(0x4fb3a9, { rough: .4, metal: .2 }), -4 + w / 2 + i * w, 1.18, 0, g));
    resist.push(box(w - .02, .25, 4, std(0x7a55c7, { rough: .5 }), -4 + w / 2 + i * w, 1.48, 0, g));
    doped.push(box(w - .1, .3, 3.9, glow(C.cyan, 1.2, .8), -4 + w / 2 + i * w, .86, 0, g));
  }
  const ions = new THREE.InstancedMesh(new THREE.SphereGeometry(.06, 8, 6), glow(C.cyan, 2.5), 160); g.add(ions);
  const ionSeed = Array.from({ length: 160 }, () => [rand(), rand(), rand()]);
  const STEPS = ['Bare silicon', 'Deposit a thin film', 'Coat with resist', 'Expose with light', 'Develop and etch', 'Implant ions', 'Strip the resist'];
  labels.push({ text: 'Silicon wafer (cross-section)', pos: V(-3, -.2, 2.6) });
  let step = 0; const target = { film: 0, resist: 0, lit: 0, etch: 0, ions: 0, dope: 0, strip: 0 }, cur = { ...target };
  const set = s => { step = s; Object.assign(target, { film: +(s >= 1), resist: +(s >= 2), lit: +(s >= 3), etch: +(s >= 4), ions: +(s === 5), dope: +(s >= 5), strip: +(s >= 6) }); };
  const m4 = new THREE.Matrix4();
  return { g, labels, steps: STEPS, api: { next() { set((step + 1) % STEPS.length); return step; }, get step() { return step; } }, update(dt, t) {
    for (const k in cur) cur[k] = approach(cur[k], target[k], dt, 3.5);
    for (let i = 0; i < N; i++) {
      const open = i % 2 === 1, f = film[i], r = resist[i], d = doped[i];
      f.visible = cur.film > .02; f.scale.y = Math.max(.01, cur.film * (open ? 1 - cur.etch : 1)); f.position.y = 1 + .175 * f.scale.y;
      r.visible = cur.resist > .02; r.scale.y = Math.max(.01, cur.resist * (open ? 1 - cur.etch : 1) * (1 - cur.strip)); r.position.y = 1 + .35 * f.scale.y + .125 * r.scale.y;
      setEmissive(r.material, open ? C.litho : 0x000000, open ? cur.lit * (1 - cur.etch) * 1.4 : 0);
      d.visible = open && cur.dope > .02; d.scale.y = Math.max(.01, cur.dope);
    }
    for (let i = 0; i < 160; i++) {
      const [a, b, c] = ionSeed[i], col = 1 + 2 * Math.floor(a * 4), y = 4 - ((t * 1.8 + c) % 1) * 3;
      m4.makeTranslation(-4 + w / 2 + col * w + (b - .5) * w * .6, cur.ions > .05 ? y : -50, (c - .5) * 3.6); ions.setMatrixAt(i, m4);
    }
    ions.instanceMatrix.needsUpdate = true;
  } };
}

function fetStation() {
  const g = new THREE.Group(), labels = []; pedestal(g, 5.5);
  box(7, .6, 5.6, std(0x55607a, { metal: .4, rough: .4 }), 0, .3, 0, g);
  box(7, .25, 5.6, std(0x9fb0d0, { opacity: .55, rough: .2 }), 0, .72, 0, g);
  const finMat = std(C.silicon, { metal: .6, rough: .3 }), chanMat = glow(C.cyan, 0, .95);
  const fins = [-1.5, 0, 1.5];
  fins.forEach(x => { box(.42, 1.4, 5.2, finMat, x, 1.55, 0, g); box(.46, 1.44, 1.3, chanMat, x, 1.55, 0, g); });
  ['Source', 'Drain'].forEach((n, k) => fins.forEach(x => box(.8, 1.6, 1.1, std(k ? 0x6c8bd6 : 0xd66c8b, { rough: .35, metal: .3 }), x, 1.6, k ? 2.2 : -2.2, g)));
  const gateMat = std(C.gold, { metal: .7, rough: .3, opacity: .9 }), gate = new THREE.Group(); g.add(gate);
  box(4.6, .45, 1.1, gateMat, 0, 2.5, 0, gate); [-2.25, -.75, .75, 2.25].forEach(x => box(.6, 1.3, 1.1, gateMat, x, 1.7, 0, gate));
  box(.5, 1.6, .5, std(0xd8dde8, { metal: .6, rough: .25 }), 0, 3.5, 0, g);
  const e = new THREE.InstancedMesh(new THREE.SphereGeometry(.08, 10, 8), glow(C.cyan, 3), 60); g.add(e);
  const eSeed = Array.from({ length: 60 }, () => [rand(), rand()]), m4 = new THREE.Matrix4();
  labels.push({ text: 'Gate', pos: V(0, 4.6, 0) }, { text: 'Source', pos: V(-2.6, 2.7, -2.4) }, { text: 'Drain', pos: V(2.6, 2.7, 2.4) }, { text: 'Silicon fins', pos: V(-3.8, 1.6, 0) });
  let on = 0, k = 0;
  return { g, labels, api: { gate(v) { on = v ? 1 : 0; return on; } }, update(dt, t) {
    k = approach(k, on, dt, 5); chanMat.emissiveIntensity = k * 2.2; chanMat.opacity = .25 + k * .7; gateMat.emissive.setHex(C.amber); gateMat.emissiveIntensity = k * .5;
    for (let i = 0; i < 60; i++) { const [a, b] = eSeed[i], x = fins[i % 3] + (a - .5) * .25; m4.makeTranslation(x, 1.3 + b * .6, k > .3 ? -2.6 + ((t * 1.2 + a + b) % 1) * 5.2 : -50); e.setMatrixAt(i, m4); }
    e.instanceMatrix.needsUpdate = true;
  } };
}

function wiresStation() {
  const g = new THREE.Group(), labels = []; pedestal(g, 6);
  box(6, .5, 6, std(C.silicon, { metal: .5, rough: .35 }), 0, .25, 0, g);
  for (let i = 0; i < 25; i++) box(.3, .3, .3, std(0xd66c8b, { rough: .4 }), -2.4 + (i % 5) * 1.2, .65, -2.4 + Math.floor(i / 5) * 1.2, g);
  const layers = [], cu = std(0xe39a5f, { metal: .6, rough: .3 }), via = std(0xb8c2d6, { metal: .9, rough: .25 }), m4 = new THREE.Matrix4();
  for (let L = 0; L < 7; L++) {
    const lg = new THREE.Group(), n = Math.max(3, 10 - L), wd = .1 + L * .07, along = L % 2 === 0;
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(along ? 5.6 : wd, .12 + L * .03, along ? wd : 5.6), cu, n);
    for (let i = 0; i < n; i++) { const o = -2.6 + i * 5.2 / (n - 1); m4.makeTranslation(along ? 0 : o, 0, along ? o : 0); im.setMatrixAt(i, m4); }
    lg.add(im);
    const vias = new THREE.InstancedMesh(new THREE.CylinderGeometry(.05 + L * .02, .05 + L * .02, 1, 8), via, 6);
    for (let i = 0; i < 6; i++) { m4.makeTranslation(-2.2 + rand() * 4.4, -.5, -2.2 + rand() * 4.4); vias.setMatrixAt(i, m4); }
    lg.add(vias); g.add(lg); layers.push(lg);
  }
  labels.push({ text: 'Transistors', pos: V(3.6, .8, 3.2) }, { text: 'Thin wires (bottom)', pos: V(-4.4, 1.6, 0) }, { text: 'Thick wires (top)', pos: V(-4.4, 5, 0) });
  let spread = 1, s = 1;
  return { g, labels, api: { explode(v) { spread = v; } }, update(dt) {
    s = approach(s, spread, dt, 5);
    layers.forEach((l, i) => { l.position.y = 1.05 + i * .42 * s; l.children[1].scale.y = .42 * s; l.children[1].position.y = 0; });
  } };
}

function packStation() {
  const g = new THREE.Group(), labels = []; pedestal(g, 7);
  const wafer = cyl(2.8, 2.8, .08, std(C.silicon, { metal: .9, rough: .2 }), -3.3, .5, 0, g, 64);
  const dies = [], m4 = new THREE.Matrix4(), col = new THREE.Color();
  for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) if (Math.hypot(i * .4 + .2, j * .4 + .2) < 2.55) dies.push([i * .4 + .2, j * .4 + .2]);
  const dm = new THREE.InstancedMesh(new THREE.BoxGeometry(.34, .04, .34), std(0xffffff, { metal: .5, rough: .3 }), dies.length);
  dies.forEach(([x, z], i) => { m4.makeTranslation(-3.3 + x, .56, z); dm.setMatrixAt(i, m4); dm.setColorAt(i, col.setHex(0x8c9ab8)); }); g.add(dm);
  void wafer;
  const pk = new THREE.Group(); pk.position.set(3.2, 0, 0); g.add(pk);
  const sub = box(3, .3, 3, std(0x2f7a4a, { rough: .6 }), 0, 0, 0, pk);
  const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 10, 8), std(0xc8ccd4, { metal: .9, rough: .3 }), 100);
  for (let i = 0; i < 100; i++) { m4.makeTranslation(-1.3 + (i % 10) * .29, 0, -1.3 + Math.floor(i / 10) * .29); balls.setMatrixAt(i, m4); } pk.add(balls);
  const die = box(1.5, .14, 1.5, std(0x7a86a0, { metal: .7, rough: .25 }), 0, 0, 0, pk);
  const bumps = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 8, 6), std(C.gold, { metal: .9, rough: .3 }), 64);
  for (let i = 0; i < 64; i++) { m4.makeTranslation(-.6 + (i % 8) * .17, 0, -.6 + Math.floor(i / 8) * .17); bumps.setMatrixAt(i, m4); } pk.add(bumps);
  const lid = new THREE.Group(); pk.add(lid);
  const lidMat = std(0xd5dae4, { metal: .65, rough: .3 });
  box(2.7, .12, 2.7, lidMat, 0, .18, 0, lid);
  [[0, 1.3], [0, -1.3], [1.3, 0], [-1.3, 0]].forEach(([x, z]) => box(x ? .1 : 2.7, .3, z ? .1 : 2.7, lidMat, x, 0, z, lid));
  labels.push({ text: 'Wafer of dies', pos: V(-3.3, 1.4, 2.6) }, { text: 'Heat spreader', pos: V(3.2, 4.1, 0) }, { text: 'Die', pos: V(4.8, 2.4, 0) }, { text: 'Substrate', pos: V(4.9, .6, 1.6) });
  let ex = 1, e = 1, tested = 0;
  return { g, labels, api: {
    explode(v) { ex = v; },
    test() { tested = 1; let bad = 0; dies.forEach((_, i) => { const ok = rand() > .12; if (!ok) bad++; dm.setColorAt(i, col.setHex(ok ? C.green : C.red)); }); dm.instanceColor.needsUpdate = true; return bad; }
  }, update(dt, t) {
    e = approach(e, ex, dt, 5);
    sub.position.y = .45; balls.position.y = .25; bumps.position.y = .7 + e * .5; die.position.y = .8 + e * 1; lid.position.y = 1.2 + e * 2.1;
    pk.rotation.y = Math.sin(t * .3) * .25; void tested;
  } };
}

function nandStation() {
  const g = new THREE.Group(), labels = []; pedestal(g, 6.5);
  box(9, 7, .3, std(0x162036, { rough: .8 }), 0, 4, -.4, g);
  const rail = (y, c) => box(7.5, .22, .3, glow(c, 1.2), 0, y, 0, g);
  rail(7, C.red); rail(1, 0x4d8bff);
  const wireMat = () => std(0x8a96b0, { rough: .4, metal: .2 });
  const T = (x, y, name) => { const m = box(1.2, 1, .5, std(0x46557a, { rough: .45, metal: .2 }), x, y, 0, g); return { m, name }; };
  const pA = T(-1.6, 5.6, 'PA'), pB = T(1.6, 5.6, 'PB'), nA = T(0, 3.4, 'NA'), nB = T(0, 2.1, 'NB');
  const w = {
    pA: [box(.12, .9, .12, wireMat(), -1.6, 6.5, 0, g), box(.12, .9, .12, wireMat(), -1.6, 4.75, 0, g)],
    pB: [box(.12, .9, .12, wireMat(), 1.6, 6.5, 0, g), box(.12, .9, .12, wireMat(), 1.6, 4.75, 0, g)],
    out: [box(3.3, .12, .12, wireMat(), 0, 4.3, 0, g), box(2.3, .12, .12, wireMat(), 2.8, 4.3, 0, g), box(.12, .5, .12, wireMat(), 0, 4.05, 0, g)],
    nAB: [box(.12, .5, .12, wireMat(), 0, 2.75, 0, g)], gnd: [box(.12, .6, .12, wireMat(), 0, 1.35, 0, g)]
  };
  const led = sph(.45, glow(C.green, 0), 4.3, 4.3, 0, g);
  const inA = sph(.3, glow(C.litho, 0), -4, 4.5, 0, g), inB = sph(.3, glow(C.litho, 0), -4, 2.8, 0, g);
  tube([[-4, 4.5, 0], [-3, 4.6, .3], [-2.2, 5.6, .3]], .05, wireMat(), g); tube([[-4, 4.5, 0], [-2, 3.8, .3], [-.6, 3.4, .3]], .05, wireMat(), g);
  tube([[-4, 2.8, 0], [-1, 3, .4], [2.2, 5.6, .3]], .05, wireMat(), g); tube([[-4, 2.8, 0], [-2, 2.3, .3], [-.6, 2.1, .3]], .05, wireMat(), g);
  labels.push({ text: 'Supply (1)', pos: V(-4.6, 7.2, 0) }, { text: 'Ground (0)', pos: V(-4.6, 1, 0) }, { text: 'Input A', pos: V(-4.9, 5.1, 0) }, { text: 'Input B', pos: V(-4.9, 3.4, 0) },
    { text: 'Output', pos: V(4.3, 5.2, 0) }, { text: 'P-type (on when input = 0)', pos: V(0, 6.6, .6) }, { text: 'N-type (on when input = 1)', pos: V(2.6, 2.7, .6) });
  const paint = (arr, on, c) => arr.forEach(m => setEmissive(m.material, on ? c : 0, on ? 1.4 : 0));
  let state = nandTransistors(0, 0);
  const show = (a, b) => {
    state = nandTransistors(a, b);
    [[pA, state.pA, C.red], [pB, state.pB, C.red], [nA, state.nA, 0x4d8bff], [nB, state.nB, 0x4d8bff]].forEach(([t, on, c]) => setEmissive(t.m.material, on ? c : 0, on ? .9 : 0));
    paint(w.pA, state.pA, C.red); paint(w.pB, state.pB, C.red); paint(w.out, state.out, C.green);
    paint(w.nAB, state.pullDown || state.nA, 0x4d8bff); paint(w.gnd, state.pullDown, 0x4d8bff);
    led.material.emissiveIntensity = state.out ? 3 : 0; inA.material.emissiveIntensity = a ? 2.5 : 0; inB.material.emissiveIntensity = b ? 2.5 : 0;
    return state;
  };
  show(0, 0);
  return { g, labels, api: { set: show }, update() {} };
}

function adderStation() {
  const g = new THREE.Group(), labels = []; pedestal(g, 7);
  const bit = (x, y, z) => box(.6, .6, .6, std(0x46557a, { rough: .45, metal: .2 }), x, y, z, g);
  const xs = [3.6, 1.2, -1.2, -3.6];
  const A = xs.map(x => bit(x - .45, 4.6, 0)), B = xs.map(x => bit(x + .45, 4.6, 0)), S = xs.map(x => bit(x, .7, .8));
  const FA = xs.map(x => box(1.8, 1.6, 1.4, std(0x34405e, { rough: .45, metal: .2 }), x, 2.6, 0, g));
  const carries = xs.slice(0, 3).map((x, i) => tube([[x - .9, 2.6, .2], [x - 1.2, 3.8, .5], [xs[i + 1] + .9, 2.6, .2]], .07, std(0x5a6478, { rough: .4 }), g));
  const cout = bit(-5.8, 2.6, 0);
  tube([[-4.5, 2.6, .2], [-5, 3.4, .4], [-5.5, 2.6, .2]], .07, std(0x5a6478, { rough: .4 }), g);
  labels.push({ text: 'Bit 3', pos: V(-3.6, 5.6, 0) }, { text: 'Bit 0', pos: V(3.6, 5.6, 0) }, { text: 'A', pos: V(4.5, 4.6, .8) }, { text: 'B', pos: V(4.9, 4.6, -.6) },
    { text: 'Full adder', pos: V(1.2, 1.5, 1.2) }, { text: 'Sum', pos: V(5, .7, .8) }, { text: 'Carry out', pos: V(-5.8, 3.5, 0) });
  const on = (m, v, c) => setEmissive(m.material, v ? c : 0, v ? 1.6 : 0);
  let res = rippleAdd(0, 0), t0 = -1;
  return { g, labels, api: { set(a, b, now) { res = rippleAdd(a, b, 4); t0 = now; return res; } }, update(dt, t) {
    if (t0 < 0) t0 = t;
    const k = (t - t0) / .45; // one adder every 0.45 s
    res.steps.forEach((s, i) => {
      on(A[i], s.a, C.litho); on(B[i], s.b, C.cyan);
      const done = k > i + 1; on(FA[i], k > i && k < i + 1.2, C.violet); on(S[i], done && s.s, C.green);
      if (i < 3) setEmissive(carries[i].material, done && s.cout ? C.amber : 0, done && s.cout ? 1.8 : 0);
    });
    on(cout, k > 4 && res.carryOut, C.amber);
  } };
}

function cpuStation() {
  const g = new THREE.Group(), labels = []; pedestal(g, 7.5);
  const blk = (w, h, d, x, y, z, c = 0x3a4766) => box(w, h, d, std(c, { rough: .45, metal: .2 }), x, y, z, g);
  const mem = Array.from({ length: 8 }, (_, i) => blk(2.4, .42, .9, -4.6, 5.2 - i * .55, 0));
  const pc = blk(1.4, .8, 1, -1.4, 5.4, 0), ir = blk(2.2, .8, 1, 1.2, 5.4, 0), dec = blk(2.2, .8, 1, 1.2, 4, 0);
  const alu = blk(2, 1.4, 1.2, 1.2, 1.8, 0), r0 = blk(1.2, .8, 1, -1.6, 2.6, 0), r1 = blk(1.2, .8, 1, -1.6, 1.4, 0), out = blk(1.3, 1, 1, 4.6, 2.6, 0, 0x4a3a2a);
  const bus = std(0x4a5468, { rough: .4, metal: .5 });
  const buses = {
    fetch: tube([[-3.4, 5.2, 0], [-2.2, 5.6, .4], [.1, 5.5, .4]], .08, bus.clone(), g),
    decode: tube([[1.2, 5, .2], [1.2, 4.4, .2]], .08, bus.clone(), g),
    load: tube([[-3.4, 2.4, 0], [-2.6, 2.4, .3], [-2.2, 2.2, .2]], .08, bus.clone(), g),
    alu: tube([[-1, 2.2, .2], [0, 2, .4], [.2, 1.8, .2]], .08, bus.clone(), g),
    out: tube([[2.2, 1.8, .2], [3.2, 2.4, .4], [3.9, 2.6, .2]], .08, bus.clone(), g)
  };
  labels.push({ text: 'Memory', pos: V(-4.6, 6, 0) }, { text: 'Program counter', pos: V(-1.4, 6.3, 0) }, { text: 'Instruction', pos: V(1.2, 6.3, 0) }, { text: 'Decoder', pos: V(2.9, 4, .8) },
    { text: 'ALU (the adder)', pos: V(1.2, .6, .9) }, { text: 'R0', pos: V(-2.6, 2.6, .6) }, { text: 'R1', pos: V(-2.6, 1.4, .6) }, { text: 'To screen', pos: V(4.6, 3.5, 0) });
  const hl = (m, v, c = C.cyan) => setEmissive(m.material, v ? c : 0, v ? 1.2 : 0);
  return { g, labels, mem, api: {
    show(s) {
      const ph = s.halted ? 'halt' : s.phase, ir0 = s.ir || {};
      mem.forEach((m, i) => hl(m, (ph === 'decode' && i === s.pc - 1) || (ph === 'execute' && ir0.op === 'LOAD' && i === ir0.addr), C.litho));
      hl(pc, ph === 'decode'); hl(ir, ph === 'decode' || ph === 'execute'); hl(dec, ph === 'execute', C.violet);
      hl(alu, ph === 'fetch' && ir0.op === 'ADD' && s.cycle % 3 === 0, C.violet);
      hl(r0, s.reg[0] > 0, C.green); hl(r1, s.reg[1] > 0, C.green); hl(out, s.out != null, C.amber);
      const busOn = { fetch: ph === 'decode', decode: ph === 'execute', load: ph === 'fetch' && ir0.op === 'LOAD', alu: ph === 'fetch' && ir0.op === 'ADD', out: s.out != null };
      for (const k in buses) setEmissive(buses[k].material, busOn[k] ? C.cyan : 0, busOn[k] ? 2 : 0);
    }
  }, update() {} };
}

function screenStation() {
  const g = new THREE.Group(), labels = []; pedestal(g, 7);
  box(1.2, .2, 1.4, std(0x2a3040, { metal: .7 }), 0, .1, 0, g); box(.3, 1.8, .3, std(0x2a3040, { metal: .7 }), 0, 1.1, 0, g);
  box(8.6, 5, .3, std(0x0c0f16, { rough: .5, metal: .4 }), 0, 4.4, 0, g);
  const W = 16, H = 9, px = new THREE.InstancedMesh(new THREE.BoxGeometry(.44, .44, .06), new THREE.MeshBasicMaterial({ color: 0xffffff }), W * H);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { m4.makeTranslation(-3.75 + x * .5, 6.4 - y * .5, .18); px.setMatrixAt(y * W + x, m4); }
  g.add(px);
  // One pixel, magnified: three sub-pixels
  const zoom = new THREE.Group(); zoom.position.set(5.6, 1.5, 1.6); zoom.scale.setScalar(.8); g.add(zoom);
  box(2.2, 2.6, .2, std(0x0c0f16, { rough: .6 }), 0, 0, -.15, zoom);
  const subs = [C.red, C.green, 0x3d7bff].map((c, i) => box(.55, 2.2, .1, new THREE.MeshStandardMaterial({ color: 0x111111, emissive: c, emissiveIntensity: 1 }), -.68 + i * .68, 0, 0, zoom));
  labels.push({ text: 'Frame buffer → screen', pos: V(0, 7.4, 0) }, { text: 'One pixel = red, green, blue', pos: V(5.6, 2.8, 1.6) });
  let n = 12, rgb = [255, 179, 71];
  const paint = () => {
    const on = numberPixels(n, W, H), lit = col.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace).clone(), off = new THREE.Color(0x10141e);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px.setColorAt(y * W + x, on.has(`${x},${y}`) ? lit : off);
    px.instanceColor.needsUpdate = true;
    subs.forEach((s, i) => { s.material.emissiveIntensity = rgb[i] / 255 * 2.2; s.scale.y = Math.max(.02, rgb[i] / 255); s.position.y = -1.1 + 1.1 * s.scale.y; });
  };
  paint();
  return { g, labels, api: { setNumber(v) { n = v; paint(); }, setColor(r, g2, b) { rgb = [r, g2, b]; paint(); } }, update() {} };
}

/* ================= WORLD ================= */
const yieldToMain = () => new Promise(r => (window.scheduler?.yield ? window.scheduler.yield().then(r) : setTimeout(r, 0)));

/* Builds the world in small slices (one station at a time, nearest first) so the page stays responsive. */
export async function buildWorld(scene, renderer, { soft = false, nearX = 0 } = {}) {
  scene.background = new THREE.Color(C.bg);
  scene.fog = new THREE.Fog(C.bg, 60, 260);
  // Soft studio reflections for metal, from a tiny generated environment (no image files).
  const envScene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer);
  [[0xc8d4ff, 0, 9, 0], [0xffc890, 10, 2, 4], [0x8fe0ff, -10, 3, -4], [0x5a6680, 0, 2, 10], [0x303848, 0, -8, 0]].forEach(([c, x, y, z]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 8), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, z); envScene.add(m); });
  envScene.background = new THREE.Color(0x2a3248);
  if (!soft) scene.environment = pm.fromScene(envScene, .04).texture; // skipped without a GPU: too slow in software
  pm.dispose();
  scene.add(new THREE.HemisphereLight(0xb8ccff, 0x1a2030, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(40, 60, 30); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1200, 400), std(0x070a12, { rough: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.set(204, -.45, 0); scene.add(floor);
  const grid = new THREE.GridHelper(1200, 240, 0x1a2440, 0x0f1628); grid.position.set(204, -.43, 0); scene.add(grid);
  // The production line linking every station, with glowing packets travelling along it.
  const keys = Object.keys(STATIONS), pts = keys.map(k => V(STATIONS[k].x, .1, STATIONS[k].z - 10));
  const curve = new THREE.CatmullRomCurve3(pts), line = new THREE.Mesh(new THREE.TubeGeometry(curve, 400, .06, 6, false), glow(C.cyan, .7, .35)); scene.add(line);
  const packets = new THREE.InstancedMesh(new THREE.SphereGeometry(.16, 10, 6), glow(C.amber, 2.5), 40); scene.add(packets);
  const builders = { sand: sandStation, purify: purifyStation, czo: czoStation, slice: sliceStation, litho: lithoStation, layers: layersStation, fet: fetStation, wires: wiresStation, pack: packStation, nand: nandStation, adder: adderStation, cpu: cpuStation, screen: screenStation };
  const stations = {};
  for (const k of [...keys].sort((a, b) => Math.abs(STATIONS[a].x - nearX) - Math.abs(STATIONS[b].x - nearX))) {
    const s = builders[k](); s.g.position.set(STATIONS[k].x, 0, STATIONS[k].z); scene.add(s.g);
    s.labels.forEach(l => l.pos.add(s.g.position)); stations[k] = s;
    await yieldToMain();
  }
  const m4 = new THREE.Matrix4(), path = curve.getSpacedPoints(600);
  return {
    stations,
    update(dt, t, visibleKeys) {
      for (const k of keys) { const s = stations[k], vis = !visibleKeys || visibleKeys.has(k); s.g.visible = vis; if (vis) s.update(dt, t); }
      for (let i = 0; i < 40; i++) { const u = ((t * .012 + i / 40) % 1 + 1) % 1, p = path[Math.min(path.length - 1, Math.floor(u * path.length))]; m4.makeTranslation(p.x, p.y + .1, p.z); packets.setMatrixAt(i, m4); }
      packets.instanceMatrix.needsUpdate = true;
    }
  };
}
export { THREE };
