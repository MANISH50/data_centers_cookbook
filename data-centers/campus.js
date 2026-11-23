/* INSIDE THE CLOUD: the 3D data-center campus, built from simple three.js shapes (no downloaded models, no logos).
   buildCampus() returns { apply(beat, p, t), labelsFor } . apply() sets the whole scene from (beat, cue progress, time),
   so any moment of the film can be shown by scrubbing. 1 unit = 1 metre; the building's centre is (0, 0, 0). */
import * as THREE from '../vendor/three.min.js';

const C = { bg: 0x060a12, rack: 0x262d3d, led: 0x3fe0ff, cold: 0x4db8ff, hot: 0xff6a3d, a: 0xff4d5e, b: 0x4d8bff, ok: 0x2fd47a, warn: 0xffb347,
  amber: 0xffb347, violet: 0x9b7bff, gold: 0xe8b84a, copper: 0xd9824a, wall: 0x8a96b0, ground: 0x0b1018, grass: 0x10201a, fibre: 0xffd23f };

/* ---------- helpers ---------- */
const geoCache = new Map();
const geo = (k, make) => { let g = geoCache.get(k); if (!g) { g = make(); geoCache.set(k, g); } return g; };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? .6, metalness: o.metal ?? .15, emissive: o.emissive ?? 0, emissiveIntensity: o.ei ?? 1, transparent: o.opacity != null, opacity: o.opacity ?? 1, depthWrite: o.opacity == null || o.opacity > .5, side: o.side ?? THREE.FrontSide });
const glow = (color, ei = 1.6, opacity) => std(color, { emissive: color, ei, opacity });
const mesh = (g, m, x = 0, y = 0, z = 0, parent) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); parent?.add(o); return o; };
const box = (w, h, d, m, x, y, z, parent) => mesh(geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m, x, y, z, parent);
const cyl = (rt, rb, h, m, x, y, z, parent, seg = 24, open = false) => mesh(geo(`c${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)), m, x, y, z, parent);
const sph = (r, m, x, y, z, parent, seg = 16) => mesh(geo(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(8, seg >> 1))), m, x, y, z, parent);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const tube = (pts, r, m, parent, seg = 64) => { const o = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => V(...p))), seg, r, 6, false), m); parent?.add(o); return o; };
const curve = pts => new THREE.CatmullRomCurve3(pts.map(p => V(...p)), false, 'catmullrom', .2);
const setE = (m, color, ei) => { m.emissive.setHex(color); m.emissiveIntensity = ei; };
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const clamp01 = x => Math.max(0, Math.min(1, x));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), P = new THREE.Vector3(), COL = new THREE.Color();

/* Particles travelling along a curve: an InstancedMesh of small spheres. */
function stream(scene, n, r, color) {
  const im = new THREE.InstancedMesh(geo(`s${r},8`, () => new THREE.SphereGeometry(r, 8, 6)), glow(color, 2.2), n);
  im.frustumCulled = false; im.visible = false; scene.add(im);
  return {
    im,
    show(curves, t, speed = .25, colorFn) {
      im.visible = true; const per = Math.ceil(n / curves.length);
      for (let i = 0; i < n; i++) {
        const c = curves[i % curves.length], k = ((t * speed + Math.floor(i / curves.length) / per + (i % curves.length) * .37) % 1 + 1) % 1;
        c.getPointAt(k, P); M4.compose(P, Q, S); im.setMatrixAt(i, M4);
        if (colorFn) { im.setColorAt(i, COL.setHex(colorFn(k))); }
      }
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    },
    hide() { im.visible = false; }
  };
}

/* ================= BUILD ================= */
export function buildCampus(scene, renderer, { soft = false } = {}) {
  scene.background = new THREE.Color(C.bg);
  scene.fog = new THREE.Fog(C.bg, 120, 600);
  if (!soft) {
    const env = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer);
    env.background = new THREE.Color(0x2a3248);
    [[0xc8d4ff, 0, 9, 0], [0xffc890, 10, 2, 4], [0x8fe0ff, -10, 3, -4], [0x5a6680, 0, 2, 10]].forEach(([c, x, y, z]) => sph(3, new THREE.MeshBasicMaterial({ color: c }), x, y, z, env));
    scene.environment = pm.fromScene(env, .04).texture; pm.dispose();
  }
  scene.add(new THREE.HemisphereLight(0xb8ccff, 0x1a2030, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(80, 140, 60); scene.add(sun);

  const ground = mesh(new THREE.PlaneGeometry(2000, 2000), std(C.ground, { rough: 1 }), 0, -.02, 0, scene); ground.rotation.x = -Math.PI / 2;
  const lawn = mesh(new THREE.PlaneGeometry(150, 110), std(C.grass, { rough: 1 }), 0, -.01, 0, scene); lawn.rotation.x = -Math.PI / 2;
  const grid = new THREE.GridHelper(2000, 200, 0x1a2440, 0x0f1628); grid.position.y = .005; scene.add(grid);

  const O = {}; // everything the cues touch

  /* ---- building shell ---- */
  const bld = new THREE.Group(); scene.add(bld); O.bld = bld;
  const wallMat = std(C.wall, { rough: .8, opacity: 1 }); O.wallMat = wallMat;
  const walls = new THREE.Group(); bld.add(walls); O.walls = walls;
  box(62, 9, .4, wallMat, 0, 4.5, -18.2, walls); box(62, 9, .4, wallMat, 0, 4.5, 18.2, walls); box(.4, 9, 36.4, wallMat, -31, 4.5, 0, walls); box(.4, 9, 36.4, wallMat, 31, 4.5, 0, walls);
  const roof = new THREE.Group(); bld.add(roof); O.roof = roof;
  const roofMat = std(0x5d6880, { rough: .8, opacity: 1 }); O.roofMat = roofMat;
  box(62.4, .5, 36.8, roofMat, 0, 9.25, 0, roof);
  const fanMat = std(0x2a3040, { metal: .6 }), fans = [];
  for (let i = 0; i < 6; i++) { const u = box(6, 1.6, 3.4, std(0x9aa4b8, { metal: .5, rough: .4 }), -15 + i * 6, 10.3, -6, roof); void u; for (let k = 0; k < 2; k++) { const f = cyl(1.1, 1.1, .12, fanMat, -16.4 + i * 6 + k * 2.8, 11.15, -6, roof, 16); fans.push(f); } }
  O.fans = fans;
  const floor = box(62, .3, 36, std(0x1a2130, { rough: .9 }), 0, .15, 0, bld); void floor;
  // interior walls between rooms
  const inner = std(0x46516a, { rough: .8 });
  box(.2, 4.5, 36, inner, -8, 2.25, 0, bld); box(22.8, 4.5, .2, inner, -19.5, 2.25, 1, bld); box(22.8, 4.5, .2, inner, -19.5, 2.25, 9, bld);

  /* ---- data hall: 8 rows × 24 racks ---- */
  const rowsZ = [-13, -9.6, -6.4, -3, 0.2, 3.6, 6.8, 10.2], RACKS = 24, rw = .8;
  const racks = new THREE.InstancedMesh(geo('b0.78,2.2,1.2', () => new THREE.BoxGeometry(.78, 2.2, 1.2)), std(0xffffff, { metal: .35, rough: .5 }), rowsZ.length * RACKS);
  const leds = new THREE.InstancedMesh(geo('b0.6,0.05,0.02', () => new THREE.BoxGeometry(.6, .05, .02)), new THREE.MeshBasicMaterial({ color: 0xffffff }), rowsZ.length * RACKS * 5);
  const rackPos = []; let li = 0;
  rowsZ.forEach((z, r) => { for (let i = 0; i < RACKS; i++) {
    const x = -5 + i * rw * 1.25, face = r % 2 === 0 ? 1 : -1; rackPos.push({ x, z, r, i, face });
    M4.makeTranslation(x, 1.4, z); racks.setMatrixAt(r * RACKS + i, M4); racks.setColorAt(r * RACKS + i, COL.setHex(C.rack));
    for (let k = 0; k < 5; k++) { M4.makeTranslation(x, .8 + k * .38, z + face * .61); leds.setMatrixAt(li, M4); leds.setColorAt(li, COL.setHex(C.led)); li++; }
  } });
  bld.add(racks, leds); O.racks = racks; O.leds = leds; O.rackPos = rackPos; O.RACKS = RACKS; O.rowsZ = rowsZ;
  // cold-aisle tiles + containment roofs over hot aisles
  const tileMat = std(0x3a5878, { rough: .7, emissive: 0x0a2440, ei: .6 });
  [0, 2, 4, 6].forEach(r => box(29, .02, 2, tileMat, 9.4, .31, (rowsZ[r] + rowsZ[r + 1]) / 2, bld));
  const contain = std(0x9fc3ff, { opacity: .12, rough: .1 });
  [1, 3, 5].forEach(r => box(29, .06, 2, contain, 9.4, 2.55, (rowsZ[r] + rowsZ[r + 1]) / 2, bld));
  // CRAH units on the far wall
  const crahs = []; for (let i = 0; i < 8; i++) crahs.push(box(1.2, 2.4, 2.6, std(0xb8c2d6, { rough: .5 }), 29.6, 1.5, -14 + i * 4, bld));
  O.crahs = crahs;
  // VESDA pipe along the ceiling
  O.vesda = tube([[-6, 4.6, -4], [28, 4.6, -4]], .05, std(0xd14b4b, { emissive: 0, rough: .4 }), bld);
  // cages around part of rows 6–7
  const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(10, 2.6, 6.2)), new THREE.LineBasicMaterial({ color: 0x6b7a99 })); cage.position.set(20, 1.6, 8.5); bld.add(cage); O.cage = cage;
  // fire: smoke + flame + gas
  O.smoke = []; for (let i = 0; i < 6; i++) O.smoke.push(sph(.25, std(0x9aa0aa, { opacity: .5 }), 14, 2.4, -3, bld, 10));
  O.flame = cyl(0, .25, .7, glow(0xff7a1f, 2.5), 14, 2.9, -3.4, bld, 10);
  O.gas = box(36, 4.4, 34, std(0xdfe8ff, { opacity: .0 }), 11, 2.4, 0, bld); O.gas.visible = false;
  O.alarm = []; [[-6, 4.4, -15], [28, 4.4, 15], [-6, 4.4, 15]].forEach(p => O.alarm.push(sph(.25, glow(C.a, 0), ...p, bld, 10)));

  /* ---- power room (UPS, batteries, switchgear, PDUs) ---- */
  O.ups = []; for (let i = 0; i < 6; i++) O.ups.push(box(1, 2, .9, std(0x3b4458, { metal: .4 }), -28 + i * 1.2, 1.3, -12, bld));
  O.batt = []; for (let i = 0; i < 6; i++) O.batt.push(box(1, 1.8, .7, std(0x2b3346, { metal: .3 }), -28 + i * 1.2, 1.2, -5, bld));
  O.swg = []; for (let i = 0; i < 4; i++) O.swg.push(box(1.1, 2.2, .8, std(0x55607a, { metal: .4 }), -29 + i * 1.3, 1.4, -15.8, bld));
  O.pdu = []; for (let i = 0; i < 3; i++) O.pdu.push(box(.8, 1.8, .8, std(0x4a5468, { metal: .3 }), -15 + i * 2, 1.2, -9, bld));
  O.gasCyl = []; for (let i = 0; i < 6; i++) O.gasCyl.push(cyl(.22, .22, 1.6, std(0xc8372f, { metal: .5, rough: .4 }), -29.8, 1.1, -1 - i * .6, bld, 12));
  /* ---- meet-me room, NOC, mantrap, dock ---- */
  for (let i = 0; i < 4; i++) box(.7, 2, 1, std(0x30384a, { metal: .3 }), -27 + i * 1.1, 1.3, 5, bld);
  O.fibreIn = tube([[-34, .2, 6], [-31, .4, 6], [-27, 2.4, 5.4], [-25, 2.4, 5.4]], .07, glow(C.fibre, .4), scene);
  const nocTex = dashTexture(false), nocAlarm = dashTexture(true);
  O.nocScreens = []; for (let i = 0; i < 3; i++) { const s = box(3, 1.7, .08, new THREE.MeshBasicMaterial({ map: nocTex }), -27.5 + i * 3.2, 2.8, 16.6, bld); O.nocScreens.push(s); }
  O.nocTex = nocTex; O.nocAlarm = nocAlarm;
  for (let i = 0; i < 3; i++) box(2.6, .8, 1, std(0x3b4458), -27.5 + i * 3.2, .7, 12.5, bld);
  O.mantrap = box(3, 2.6, 3, std(0x9fd3ff, { opacity: .25, rough: .1 }), -12, 1.6, 16, bld);
  O.badge = box(.2, 1.2, .2, glow(C.ok, 0), -13.8, .9, 17.6, bld);
  O.dockDoor = box(5, 3.5, .2, std(0x6a7488, { metal: .4 }), -12, 2, -18.3, bld);
  O.truck = new THREE.Group(); O.truck.position.set(-12, 0, -26); scene.add(O.truck);
  box(3, 3, 7, std(0xd8dde6), 0, 1.9, 0, O.truck); box(2.8, 2.2, 2, std(0x3a6ea5), 0, 1.4, -4.4, O.truck);

  /* ---- outside: substation, grid, generators, cooling, fence ---- */
  const sub = new THREE.Group(); sub.position.set(-55, 0, -26); scene.add(sub); O.sub = sub;
  O.trafo = []; for (let i = 0; i < 3; i++) O.trafo.push(box(3, 3, 3, std(0x6c7690, { metal: .5 }), -4 + i * 4, 1.5, 0, sub));
  const lineMat = glow(0x9fb8ff, .2); O.lineMat = lineMat;
  for (let i = 0; i < 4; i++) { const x = -120 + i * 18; box(.5, 16, .5, std(0x8a93a8, { metal: .6 }), x, 8, -26, scene); box(5, .3, .3, std(0x8a93a8), x, 15.5, -26, scene); }
  O.gridLine = tube([[-140, 15, -26], [-102, 13.5, -26], [-84, 15, -26], [-66, 13.5, -26], [-55, 6, -26]], .12, lineMat, scene);
  O.feed = tube([[-52, 2, -26], [-40, 1, -20], [-31, 1.5, -15]], .14, lineMat, scene);
  O.gens = []; for (let i = 0; i < 4; i++) {
    const g = new THREE.Group(); g.position.set(-49 + i * 6.2, 0, 30); scene.add(g);
    box(5.2, 2.6, 2.4, std(0x4f7a5f, { metal: .3 }), 0, 1.3, 0, g); cyl(.2, .2, 1.6, std(0x333a46, { metal: .6 }), 1.8, 3.3, 0, g, 10);
    const lamp = sph(.18, glow(C.ok, 0), -2.2, 2.4, 1.25, g, 8);
    const puffs = []; for (let k = 0; k < 4; k++) puffs.push(sph(.35, std(0x8e959f, { opacity: .45, emissive: 0x4a5160, ei: .6 }), 1.8, 4.2, 0, g, 8));
    O.gens.push({ g, lamp, puffs });
  }
  for (let i = 0; i < 2; i++) { const t = cyl(1.4, 1.4, 7, std(0xc0c6d2, { metal: .5 }), -47 + i * 4, 1.4, 36, scene, 20); t.rotation.z = Math.PI / 2; }
  O.genFeed = tube([[-40, 1, 28], [-34, 1, 18], [-31, 1.4, -10]], .12, std(0x39424f, { emissive: C.ok, ei: 0 }), scene);
  O.towers = []; for (let i = 0; i < 3; i++) {
    const g = new THREE.Group(); g.position.set(42 + i * 5.5, 0, -28); scene.add(g);
    cyl(2, 2.3, 5, std(0xb8c0cc, { rough: .6 }), 0, 2.5, 0, g, 24); const f = cyl(1.6, 1.6, .2, fanMat, 0, 5.1, 0, g, 16);
    const steam = []; for (let k = 0; k < 6; k++) steam.push(sph(.9, std(0xeef3fb, { opacity: .35, emissive: 0x8a99b0, ei: .7 }), 0, 6, 0, g, 10));
    O.towers.push({ g, f, steam });
  }
  O.chillers = []; for (let i = 0; i < 3; i++) O.chillers.push(box(4, 2.4, 2.2, std(0x7d8aa6, { metal: .4 }), 34 + i * 4.6, 1.2, -21, scene));
  O.heatPipe = tube([[30, 2, -10], [36, 2, -20], [44, 3, -26]], .2, std(0xb0b8c8, { metal: .5 }), scene);
  // fence + gate + guard house
  const posts = new THREE.InstancedMesh(geo('b0.15,2.6,0.15', () => new THREE.BoxGeometry(.15, 2.6, .15)), std(0x6b7a99, { metal: .5 }), 140);
  let pi = 0; const fx = [-70, 70], fz = [-50, 48];
  for (let x = fx[0]; x <= fx[1] && pi < 140; x += 4) { M4.makeTranslation(x, 1.3, fz[0]); posts.setMatrixAt(pi++, M4); if (Math.abs(x + 10) > 4) { M4.makeTranslation(x, 1.3, fz[1]); posts.setMatrixAt(pi++, M4); } }
  for (let z = fz[0]; z <= fz[1] && pi < 140; z += 4) { M4.makeTranslation(fx[0], 1.3, z); posts.setMatrixAt(pi++, M4); M4.makeTranslation(fx[1], 1.3, z); posts.setMatrixAt(pi++, M4); }
  posts.count = pi; scene.add(posts);
  const fenceLine = new THREE.LineBasicMaterial({ color: 0x6b7a99 });
  [[[-70, 2.4, -50], [70, 2.4, -50]], [[70, 2.4, -50], [70, 2.4, 48]], [[70, 2.4, 48], [-6, 2.4, 48]], [[-14, 2.4, 48], [-70, 2.4, 48]], [[-70, 2.4, 48], [-70, 2.4, -50]]].forEach(([a, b2]) => scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(...a), V(...b2)]), fenceLine)));
  O.gateArm = box(8, .2, .2, std(0xffd23f, { emissive: 0x332200 }), -10, 1.2, 48, scene);
  box(3, 2.8, 3, std(0x8a96b0), -18, 1.4, 50, scene);
  O.cams = []; [[-70, 3, 48], [70, 3, 48], [-70, 3, -50], [70, 3, -50]].forEach(p => O.cams.push(sph(.3, glow(C.a, .3), ...p, scene, 8)));

  /* ---- the wider world: mast + phone, renewables, town, second site ---- */
  cyl(.4, .7, 18, std(0x9aa4b8, { metal: .6 }), -95, 9, -62, scene, 8); box(2, 1.2, .3, std(0xdde3ee), -95, 16.6, -61.6, scene);
  O.phone = box(.5, 1, .08, glow(0x3fe0ff, .6), -100, 1.6, -68, scene);
  O.rotors = []; for (let i = 0; i < 5; i++) { const x = 150 + i * 22, z = -150 + i * 8; cyl(.6, 1, 40, std(0xe8edf4), x, 20, z, scene, 10); const r = new THREE.Group(); r.position.set(x, 40, z + 1); scene.add(r); for (let k = 0; k < 3; k++) { const bl = box(.8, 14, .2, std(0xe8edf4), 0, 7, 0); const h = new THREE.Group(); h.rotation.z = k * 2.094; h.add(bl); r.add(h); } O.rotors.push(r); }
  const solar = new THREE.InstancedMesh(geo('b3,0.1,1.6', () => new THREE.BoxGeometry(3, .1, 1.6)), std(0x1b3a6b, { metal: .6, rough: .25, emissive: 0x0a1a35 }), 120);
  for (let i = 0; i < 120; i++) { P.set(95 + (i % 12) * 4, 1, 70 + Math.floor(i / 12) * 3.2); Q.setFromAxisAngle(V(1, 0, 0), -.4); M4.compose(P, Q, S); solar.setMatrixAt(i, M4); } scene.add(solar); O.solar = solar;
  O.greenLine = tube([[150, 2, -140], [60, 3, -80], [-40, 3, -40], [-55, 4, -28]], .25, std(0x39424f, { emissive: C.ok, ei: 0 }), scene);
  O.greenLine2 = tube([[110, 1, 75], [60, 2, 50], [-20, 2, 45], [-50, 3, -20]], .25, std(0x39424f, { emissive: C.ok, ei: 0 }), scene);
  O.houses = []; for (let i = 0; i < 14; i++) { const x = -165 + (i % 5) * 8, z = 80 + Math.floor(i / 5) * 9; const hm = std(0xc9b79a, { emissive: 0xff9a3d, ei: 0 }); box(5, 3.5, 5, hm, x, 1.75, z, scene); const rf = cyl(0, 4, 2, std(0x8a4b3a), x, 4.5, z, scene, 4); rf.rotation.y = Math.PI / 4; O.houses.push(hm); }
  O.districtPipe = tube([[-31, .6, 12], [-75, .6, 14], [-120, .6, 60], [-150, .6, 92]], .4, std(0xb07a4a, { emissive: 0xff7a1f, ei: 0 }), scene);
  O.dr = new THREE.Group(); O.dr.position.set(-220, 0, -230); scene.add(O.dr); box(40, 8, 24, std(C.wall), 0, 4, 0, O.dr); O.dr.visible = false;
  O.drLink = tube([[-30, 2, -18], [-120, 30, -120], [-200, 4, -220]], .4, glow(C.fibre, 1.4), scene); O.drLink.visible = false;

  /* ---- studio sets (z = -320): close-ups for ideas that aren't rooms ---- */
  buildStudio(scene, O);

  /* ---- flows ---- */
  const pPath = {
    req: curve([[-100, 1.6, -68], [-95, 16.5, -62], [-80, 2, -45], [-62, .4, -12], [-34, .3, 6], [-26, 2.4, 5.4], [-18, 2, 4], [4, 2.6, 1.2], [10, 2.6, 3.6], [16, 2.6, -5.4]]),
    powerA: curve([[-140, 15, -26.5], [-66, 13.5, -26.5], [-55, 4, -26.5], [-40, 1.2, -20.5], [-28, 2.6, -15.6], [-22, 2.6, -12.6], [-15, 2.4, -9.5], [-5, 2.8, -13.6], [26, 2.8, -13.6]]),
    powerB: curve([[-140, 15, -25.5], [-66, 13.5, -25.5], [-55, 4, -25.5], [-40, 1.8, -19.5], [-27, 2.6, -14.8], [-21, 2.6, -11.4], [-14, 2.4, -8.5], [-5, 2.8, -12.4], [26, 2.8, -12.4]]),
    gen: curve([[-40, 2, 29], [-34, 1.2, 18], [-31, 1.4, -8], [-24, 2.4, -11.6], [-15, 2.4, -9.5], [-5, 2.8, -13], [26, 2.8, -13]]),
    heat: curve([[16, 3.6, -8], [29, 3.6, -10], [36, 2.2, -20], [44, 5.6, -27], [47, 9, -28]]),
    tokens: curve([[20, 3, 10.2], [10, 6, 14], [-20, 6, 6], [-60, 6, -30], [-100, 2, -68]])
  };
  const air = []; [0, 2, 4, 6].forEach(r => {
    const zc = (rowsZ[r] + rowsZ[r + 1]) / 2, zh1 = (rowsZ[r + 1] + (rowsZ[r + 2] ?? rowsZ[r + 1] + 3.2)) / 2;
    air.push(curve([[29, .2, zc], [10, .2, zc], [8, .5, zc], [6, 1.6, zc], [6, 1.6, rowsZ[r + 1]], [6, 2.6, zh1], [6, 4.2, zh1], [20, 4.4, zh1], [29, 3, zh1], [29.4, 1, zc]]));
  });
  O.flows = {
    req: stream(scene, 14, .35, 0x3fe0ff), powerA: stream(scene, 60, .22, C.a), powerB: stream(scene, 60, .22, C.b), gen: stream(scene, 40, .22, C.ok),
    air: stream(scene, 240, .1, C.cold), heat: stream(scene, 40, .3, C.hot), tokens: stream(scene, 40, .2, 0xb794ff)
  };

  /* ================= APPLY: scene state from (beat, p, t) ================= */
  let lastColorKey = '';
  function rackColors(key, fn) {
    if (key === lastColorKey) return; lastColorKey = key;
    rackPos.forEach((r, i) => racks.setColorAt(i, COL.setHex(fn(r) ?? C.rack)));
    racks.instanceColor.needsUpdate = true;
  }
  function apply(beat, p, t, { tl } = {}) {
    const cue = beat.cue || '';
    // --- defaults ---
    const roofOpen = beat.roof === 0;
    roof.position.y = roofOpen ? 26 : 0; roof.visible = !roofOpen; roofMat.opacity = 1;
    wallMat.opacity = roofOpen ? .14 : 1; wallMat.transparent = true; wallMat.depthWrite = !roofOpen;
    bld.scale.y = 1; walls.visible = true;
    Object.values(O.flows).forEach(f => f.hide());
    O.fans.forEach(f => { f.rotation.y = t * 6; });
    O.rotors.forEach((r, i) => { r.rotation.z = t * .6 + i; });
    O.towers.forEach(tw => { tw.f.rotation.y = t * 4; tw.steam.forEach(s => { s.visible = false; }); });
    O.gens.forEach(g => { setE(g.lamp.material, C.ok, 0); g.puffs.forEach(s => { s.visible = false; }); });
    setE(lineMat, 0x9fb8ff, .25); setE(O.genFeed.material, C.ok, 0); setE(O.greenLine.material, C.ok, 0); setE(O.greenLine2.material, C.ok, 0);
    O.ups.forEach(u => setE(u.material, 0, 0)); O.batt.forEach(u => setE(u.material, 0, 0)); O.swg.forEach(u => setE(u.material, 0, 0)); O.pdu.forEach(u => setE(u.material, 0, 0));
    O.crahs.forEach(c => setE(c.material, 0, 0)); O.chillers.forEach(c => setE(c.material, 0, 0)); O.trafo.forEach(c => setE(c.material, 0, 0));
    setE(O.vesda.material, 0, 0); O.smoke.forEach(s => { s.visible = false; }); O.flame.visible = false; O.gas.visible = false; O.alarm.forEach(a => setE(a.material, C.a, 0));
    O.cage.material.color.setHex(0x6b7a99); O.mantrap.material.opacity = .25; setE(O.badge.material, C.ok, 0); O.gateArm.rotation.z = 0;
    O.nocScreens.forEach(s => { s.material.map = O.nocTex; });
    O.houses.forEach(h => setE(h, 0xff9a3d, 0)); setE(O.districtPipe.material, 0xff7a1f, 0);
    O.dr.visible = false; O.drLink.visible = false; O.truck.position.z = -26;
    setE(O.fibreIn.material, C.fibre, .4); O.phone.material.emissiveIntensity = .6;
    O.studio.reset(t);
    let colorKey = 'base', colorFn = () => null;

    // --- cues ---
    switch (cue) {
      case 'smc': { const k = Math.floor(p * 3) % 3; colorKey = 'smc' + k; colorFn = r => k === 0 ? (r.r >= 6 ? 0x2c6fd6 : null) : k === 1 ? null : (r.r === 1 || r.r === 7 ? 0xff8a3d : null); if (k === 1) setE(O.fibreIn.material, C.fibre, 2.5); break; }
      case 'fans': break;
      case 'zones': {
        const zones = [['hall'], ['power'], ['batt'], ['meetme'], ['noc'], ['security'], ['dock'], ['gens'], ['cool']], k = Math.min(zones.length - 1, Math.floor(p * zones.length)), z = zones[k][0];
        if (z === 'hall') { colorKey = 'zhall'; colorFn = () => 0x3a7bd5; }
        if (z === 'power') { O.ups.forEach(u => setE(u.material, C.warn, .9)); O.swg.forEach(u => setE(u.material, C.warn, .9)); }
        if (z === 'batt') O.batt.forEach(u => setE(u.material, C.ok, .9));
        if (z === 'meetme') setE(O.fibreIn.material, C.fibre, 3);
        if (z === 'noc') O.nocScreens.forEach(s => { s.material.map = O.nocTex; });
        if (z === 'security') { O.mantrap.material.opacity = .7; setE(O.badge.material, C.ok, 2); }
        if (z === 'dock') O.truck.position.z = -20;
        if (z === 'gens') O.gens.forEach(g => setE(g.lamp.material, C.ok, 2));
        if (z === 'cool') O.crahs.forEach(c => setE(c.material, C.cold, .8));
        O.zoneLabel = ['Server hall', 'Power and UPS', 'Batteries', 'Meet-me room', 'Control room (NOC)', 'Security', 'Loading dock', 'Generators (outside)', 'Cooling units'][k];
        break;
      }
      case 'roles': colorKey = 'roles'; colorFn = r => [0x3fa9ff, 0x3fa9ff, 0x2fd47a, 0x2fd47a, 0xffb347, 0xffb347, 0xb794ff, 0xb794ff][r.r]; break;
      case 'req': {
        const f = O.flows.req; f.im.visible = true; const going = p < .82, k = going ? p / .82 : 1 - (p - .82) / .18;
        for (let i = 0; i < 14; i++) { pPath.req.getPointAt(clamp01(k - i * .006 * (going ? 1 : -1)), P); M4.compose(P, Q, S.setScalar(1 - i / 16)); f.im.setMatrixAt(i, M4); }
        S.setScalar(1); f.im.instanceMatrix.needsUpdate = true; O.phone.material.emissiveIntensity = 2;
        if (k > .55) setE(O.fibreIn.material, C.fibre, 2.5);
        colorKey = 'req' + Math.floor(k * 10); colorFn = r => (k > .7 && r.r === 4 && r.i < 4) || (k > .8 && r.r === 5 && r.i > 6 && r.i < 10) || (k > .9 && r.r === 2 && r.i > 16) ? 0x3fe0ff : null;
        break;
      }
      case 'chat': O.flows.tokens.show([pPath.tokens], t, .35); colorKey = 'chat' + Math.floor(t * 2) % 2; colorFn = r => r.r === 7 ? ((r.i + Math.floor(t * 4)) % 3 ? 0xb794ff : 0x6a4fd0) : null; break;
      case 'power': O.flows.powerA.show([pPath.powerA], t, .18); setE(lineMat, C.a, 1.2); O.trafo.forEach(c => setE(c.material, C.warn, .5)); break;
      case 'ab': O.flows.powerA.show([pPath.powerA], t, .18); O.flows.powerB.show([pPath.powerB], t + .5, .18); setE(lineMat, 0xffffff, 1); O.ups.forEach((u, i) => setE(u.material, i < 3 ? C.a : C.b, .9)); break;
      case 'ups': O.flows.powerA.show([pPath.powerA], t, .18); O.ups.forEach(u => setE(u.material, C.ok, .9)); O.batt.forEach(u => setE(u.material, C.ok, .5 + .4 * Math.sin(t * 3))); break;
      case 'cut': {
        const gridOff = p >= .02 && p < .9, gensOn = p >= .45 && p < .95;
        setE(lineMat, gridOff ? 0x331010 : 0x9fb8ff, gridOff ? .1 : 1.2); O.trafo.forEach(c => setE(c.material, gridOff ? 0 : C.warn, gridOff ? 0 : .5));
        if (!gridOff) O.flows.powerA.show([pPath.powerA], t, .18);
        if (gridOff && !gensOn) { O.ups.forEach(u => setE(u.material, C.warn, 1.2)); O.batt.forEach(u => setE(u.material, C.warn, .6 + .5 * Math.sin(t * 8))); }
        if (gensOn) { O.gens.forEach((g, i) => { setE(g.lamp.material, C.ok, 2.5); g.puffs.forEach((s, k) => { s.visible = true; const u = ((t * .8 + k / 4 + i * .2) % 1); s.position.set(1.8 + u * .6, 4.2 + u * 3, 0); s.scale.setScalar(.6 + u * 1.4); }); }); setE(O.genFeed.material, C.ok, 1.6); O.flows.gen.show([pPath.gen], t, .2); }
        O.cutClock = p < .02 ? 'Grid: on' : p < .45 ? `Grid: OFF · servers on UPS batteries · ${Math.round(seg(p, .02, .45) * 10)} s` : p < .9 ? 'Grid: OFF · generators carrying the load' : 'Grid: back · load returned to the grid';
        break;
      }
      case 'air': O.flows.air.show(air, t, .08, k => k < .45 ? C.cold : k < .55 ? 0xc9a0ff : C.hot); O.crahs.forEach(c => setE(c.material, C.cold, .6)); break;
      case 'heatout': O.flows.air.show(air, t, .08, k => k < .45 ? C.cold : C.hot); O.flows.heat.show([pPath.heat], t, .2); O.chillers.forEach(c => setE(c.material, C.cold, .5)); O.towers.forEach(tw => steamOn(tw, t)); break;
      case 'steam': O.towers.forEach(tw => steamOn(tw, t)); O.flows.heat.show([pPath.heat], t, .2); break;
      case 'airack': case 'gpu': case 'crowd': case 'rack': case 'shapes': case 'inside': case 'storage': case 'copies': case 'spineleaf': case 'eastwest':
      case 'sizes': case 'red': case 'nines': case 'tiers': case 'virt': case 'globe': case 'pue': case 'site':
        O.studio.apply(cue, p, t, beat); break;
      case 'sec': { O.gateArm.rotation.z = -Math.PI / 2 * seg(p, .1, .3); O.cams.forEach(c => setE(c.material, C.a, 1 + Math.sin(t * 6))); O.mantrap.material.opacity = p > .4 ? .7 : .25; setE(O.badge.material, C.ok, p > .55 ? 2.5 : 0); break; }
      case 'cages': O.cage.material.color.setHex(C.warn); colorKey = 'cage'; colorFn = r => (r.r >= 6 && r.i >= 13 && r.i <= 22) ? 0x6b5a2a : null; break;
      case 'fire': {
        const sniff = p > .05, confirm = p > .3, alarm = p > .5, gas = seg(p, .6, .85);
        O.flame.visible = p < .85; O.flame.scale.setScalar(1 - gas * .9);
        O.smoke.forEach((s, i) => { s.visible = p < .9; const u = (t * .3 + i / 6) % 1; s.position.set(14 + Math.sin(i) * .3, 2.6 + u * 2, -3.2); s.scale.setScalar(.5 + u); });
        setE(O.vesda.material, C.a, sniff ? 1.5 + Math.sin(t * 8) * .5 : 0); if (confirm) O.alarm.forEach(a => setE(a.material, C.a, Math.sin(t * 10) > 0 ? 3 : .2));
        if (alarm) O.gasCyl.forEach(c => setE(c.material, C.a, .6));
        O.gas.visible = gas > 0; O.gas.material.opacity = gas * .35;
        O.fireStep = !sniff ? 'Normal' : !confirm ? 'Sniff: VESDA detects smoke' : !alarm ? 'Confirm: a second detector agrees' : gas < 1 ? 'Warn + suppress: gas floods the room' : 'Fire out';
        break;
      }
      case 'noc': O.nocScreens.forEach((s, i) => { s.material.map = i === 1 && Math.sin(t * 4) > 0 ? O.nocAlarm : O.nocTex; }); colorKey = 'noc'; colorFn = r => r.r === 0 && r.i === 14 ? C.warn : null; break;
      case 'dr': O.dr.visible = true; O.drLink.visible = true; setE(O.drLink.material, C.fibre, 1 + Math.sin(t * 3) * .5); break;
      case 'trace': {
        const m = beat.mode;
        if (m === 'stream') { colorKey = 'tS'; colorFn = r => r.r === 5 || r.r === 6 ? 0x2fd47a : null; O.phone.material.emissiveIntensity = 2.5; O.flows.req.show([pPath.req], t, .12); }
        if (m === 'pay') { colorKey = 'tP'; colorFn = r => r.r === 2 || r.r === 3 ? 0xffb347 : null; O.dr.visible = true; O.drLink.visible = true; }
        if (m === 'ai') { colorKey = 'tA' + Math.floor(t * 3) % 2; colorFn = r => r.r === 7 ? ((r.i + Math.floor(t * 3)) % 2 ? 0xb794ff : 0x7b5ce6) : null; O.flows.tokens.show([pPath.tokens], t, .3); }
        if (m === 'spark') { colorKey = 'tK'; colorFn = r => r.r === 4 || r.r === 5 ? 0x3fa9ff : r.r === 6 ? 0x2fd47a : null; O.flows.air.show(air.slice(0, 2), t, .2, () => 0xffd23f); }
        break;
      }
      case 'renew': setE(O.greenLine.material, C.ok, 1.6); setE(O.greenLine2.material, C.ok, 1.6); O.solar.material.emissiveIntensity = 1.4; break;
      case 'heat': setE(O.districtPipe.material, 0xff7a1f, 1.4 + Math.sin(t * 2) * .4); O.houses.forEach((h, i) => setE(h, 0xff9a3d, .35 + .25 * Math.sin(t * 2 + i))); break;
      case 'build': {
        // construction time-lapse: foundation → shell → roof → fit-out
        bld.scale.y = Math.max(.02, seg(p, .1, .55)); roof.visible = p > .55; walls.visible = p > .15;
        O.gens.forEach((g, i) => { g.g.visible = p > .65 + i * .06; }); O.towers.forEach((tw, i) => { tw.g.visible = p > .7 + i * .05; });
        colorKey = 'build'; colorFn = () => 0x161b26; break;
      }
      case 'commission': O.gens.forEach((g, i) => { setE(g.lamp.material, C.ok, 2.5); g.puffs.forEach((s, k) => { s.visible = true; const u = ((t * .8 + k / 4 + i * .2) % 1); s.position.set(1.8 + u * .6, 4.2 + u * 3, 0); s.scale.setScalar(.6 + u * 1.4); }); }); setE(lineMat, 0x331010, .1); O.studio.loadBanks(true); break;
      case 'golive': { const n = Math.floor(p * rowsZ.length * RACKS); colorKey = 'gl' + Math.floor(n / 6); colorFn = r => (r.r * RACKS + r.i) < n ? null : 0x10141c; O.truck.position.z = -20; break; }
      case 'day': { const times = ['07:00 Shift handover', '08:00 Walk-around', '10:00 Swap a failed drive', '13:00 Generator test', '15:00 Deliveries', '18:00 Planned maintenance', '02:00 Night alarm: the spare already took over']; O.dayClock = times[Math.min(times.length - 1, Math.floor(p * times.length))]; if (O.dayClock.startsWith('13')) O.gens[0].puffs.forEach(s => { s.visible = true; }); break; }
      case 'finale': colorKey = 'fin' + Math.floor(t) % 4; colorFn = r => ((r.i + r.r + Math.floor(t)) % 7 === 0) ? 0x3fe0ff : null; break;
    }
    if (cue !== 'build') { O.gens.forEach(g => { g.g.visible = true; }); O.towers.forEach(tw => { tw.g.visible = true; }); }
    if (cue !== 'commission') O.studio.loadBanks(false);
    O.solar.material.emissiveIntensity = cue === 'renew' ? 1.4 : .3;
    rackColors(colorKey, colorFn);
    // LEDs twinkle
    void tl;
  }
  function steamOn(tw, t) { tw.steam.forEach((s, k) => { s.visible = true; const u = (t * .25 + k / 6) % 1; s.position.set(Math.sin(k * 2) * .6, 5.6 + u * 7, Math.cos(k * 2) * .6); s.scale.setScalar(.6 + u * 1.6); s.material.opacity = .35 * (1 - u); }); }

  /* Overlay text some cues provide (live status lines). */
  const status = cue => cue === 'cut' ? O.cutClock : cue === 'fire' ? O.fireStep : cue === 'zones' ? O.zoneLabel : cue === 'day' ? O.dayClock : O.studio.status(cue);
  return { apply, status, objects: O };
}

/* A NOC dashboard drawn on a canvas (no images). */
function dashTexture(alarm) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 288; const x = c.getContext('2d');
  x.fillStyle = '#081221'; x.fillRect(0, 0, 512, 288);
  x.fillStyle = alarm ? '#ff4d5e' : '#2fd47a'; x.font = 'bold 22px sans-serif'; x.fillText(alarm ? '⚠ CRAH-07 FAULT · spare running' : 'ALL SYSTEMS NORMAL', 18, 36);
  x.strokeStyle = '#3fe0ff'; x.lineWidth = 3; x.beginPath(); for (let i = 0; i < 40; i++) x.lineTo(18 + i * 12, 150 - Math.sin(i * .5) * 30 - i); x.stroke();
  for (let i = 0; i < 8; i++) { x.fillStyle = i === 3 && alarm ? '#ff4d5e' : '#2c6fd6'; x.fillRect(18 + i * 60, 200, 46, 60); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ================= STUDIO SETS ================= */
function buildStudio(scene, O) {
  const Z = -320, root = new THREE.Group(); scene.add(root);
  const deck = mesh(new THREE.PlaneGeometry(320, 40), std(0x0d1322, { rough: .9 }), 140, .01, Z, root); deck.rotation.x = -Math.PI / 2;
  const S = {};
  /* rack set (x = 0): 42U rack, servers, blade, tower, AI rack, GPU crowd wall */
  const rack = new THREE.Group(); rack.position.set(0, 0, Z); root.add(rack);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.8, 4.2, 1.2)), new THREE.LineBasicMaterial({ color: 0x9fb0d0 })); frame.position.y = 2.1; rack.add(frame);
  S.servers = []; for (let u = 0; u < 20; u++) { const s = box(.74, .17, 1.1, std(u % 5 === 0 ? 0x4a556e : 0x343d52, { metal: .4, rough: .45 }), 0, .3 + u * .19, 0, rack); S.servers.push(s); }
  S.pull = S.servers[11];
  // the pulled-out server's parts (shown in 'inside')
  const parts = new THREE.Group(); parts.position.set(0, 2.6, 2.1); rack.add(parts); parts.visible = false; S.parts = parts;
  box(.74, .04, 1.1, std(0x2a3142), 0, -.05, 0, parts);
  [[-.2, .05, -.1, .18, .1, .2, 0xb0b8c8], [.2, .05, -.1, .18, .1, .2, 0xb0b8c8]].forEach(([x, y, z, w, h, d, c]) => box(w, h, d, std(c, { metal: .8 }), x, y, z, parts));
  for (let i = 0; i < 6; i++) box(.02, .08, .3, std(0x2fd47a), .35 + (i - 3) * .03 + .1, .04, -.1, parts);
  for (let i = 0; i < 4; i++) box(.12, .05, .2, std(0x5a6478), -.27 + i * .18, .03, .42, parts);
  for (let i = 0; i < 5; i++) cyl(.06, .06, .05, std(0x1a1f2a), -.28 + i * .14, .05, -.38, parts, 12).rotation.x = Math.PI / 2;
  box(.18, .08, .22, std(0x6c7690), -.25, .04, -.48, parts); box(.18, .08, .22, std(0x6c7690), -.05, .04, -.48, parts); box(.14, .05, .1, glow(0x3fe0ff, .8), .27, .03, -.5, parts);
  // blade chassis + tower
  const blade = new THREE.Group(); blade.position.set(3.2, 0, Z); root.add(blade); box(1.4, 1.6, 1, std(0x2b3346, { metal: .4 }), 0, 1.6, 0, blade);
  S.blades = []; for (let i = 0; i < 8; i++) S.blades.push(box(.13, 1.4, .9, std(0x5a6478, { metal: .5 }), -.6 + i * .17, 1.6, .06, blade));
  S.tower = box(.5, 1.1, 1, std(0x3a4356, { metal: .3 }), 5.8, .55, Z, root);
  // GPU server (8 GPUs on top)
  S.gpus = []; const gpuSet = new THREE.Group(); gpuSet.position.set(1.9, .9, Z + 1.7); root.add(gpuSet); box(.9, .1, .7, std(0x2a3142, { metal: .4 }), 0, .08, .1, gpuSet);
  for (let i = 0; i < 8; i++) S.gpus.push(box(.15, .14, .5, std(0x1d2433, { metal: .5 }), -.3 + (i % 4) * .2, .2 + Math.floor(i / 4) * .17, .1, gpuSet));
  // AI rack with liquid pipes (x = -4)
  const ai = new THREE.Group(); ai.position.set(-4, 0, Z); root.add(ai);
  S.trays = []; for (let i = 0; i < 18; i++) S.trays.push(box(.76, .17, 1.1, std(0x2a3346, { metal: .5 }), 0, .3 + i * .22, 0, ai));
  S.pipeIn = tube([[-.6, .2, .9], [-.5, .4, .6], [-.5, 4, .6]], .05, std(0x3d7bff, { emissive: 0x3d7bff, ei: 0 }), ai);
  S.pipeOut = tube([[.5, .4, .6], [.5, 4, .6], [.6, 4.6, .9]], .05, std(0xff6a3d, { emissive: 0xff6a3d, ei: 0 }), ai);
  // GPU crowd wall
  S.crowd = new THREE.InstancedMesh(geo('b0.16,0.16,0.04', () => new THREE.BoxGeometry(.16, .16, .04)), new THREE.MeshBasicMaterial({ color: 0xffffff }), 24 * 14);
  for (let i = 0; i < 24 * 14; i++) { M4.makeTranslation(-.8 + (i % 24) * .2 + 1, 4.2 + Math.floor(i / 24) * .2, Z - 4); S.crowd.setMatrixAt(i, M4); S.crowd.setColorAt(i, COL.setHex(0x1a2030)); }
  root.add(S.crowd); S.cpuCores = []; for (let i = 0; i < 8; i++) S.cpuCores.push(box(.36, .36, .05, std(0x1a2030, { emissive: 0xffb347, ei: 0 }), -7 + (i % 4) * .45, 5 + Math.floor(i / 4) * .45, Z - 4, root));

  /* storage set (x = 30): RAM, SSD, HDD, tape + copies */
  const st = new THREE.Group(); st.position.set(30, 0, Z); root.add(st);
  S.tiers = [];
  [[-4.5, 0x2fd47a], [-1.5, 0x3fa9ff], [1.5, 0x9aa4b8], [4.5, 0xffb347]].forEach(([x, c], i) => {
    cyl(1, 1.1, .4, std(0x1b2337), x, .2, 0, st, 24);
    const it = i === 0 ? box(1.2, .3, .08, std(c), x, 1.1, 0, st) : i === 1 ? box(.7, .08, 1, std(c, { metal: .4 }), x, .9, 0, st) : i === 2 ? cyl(.55, .55, .08, std(c, { metal: .9, rough: .15 }), x, 1, 0, st, 32) : box(.9, .25, .9, std(c), x, .8, 0, st);
    S.tiers.push(it);
  });
  S.copies = []; for (let i = 0; i < 3; i++) S.copies.push(box(.8, .5, 1, std(0x46557a), -1.6 + i * 1.6, 1.1, 3.2, st));
  /* network set (x = 60): spine / leaf / servers */
  const net = new THREE.Group(); net.position.set(60, 0, Z); root.add(net);
  S.spines = []; for (let i = 0; i < 4; i++) S.spines.push(box(1.6, .4, .8, std(0x46557a, { metal: .4 }), -4.5 + i * 3, 6, 0, net));
  S.leaves = []; for (let i = 0; i < 8; i++) S.leaves.push(box(1, .3, .6, std(0x46557a, { metal: .4 }), -7 + i * 2, 3, 2, net));
  for (let i = 0; i < 16; i++) box(.6, .4, .6, std(0x2a3346), -7.5 + i, .7, 3, net);
  const linkMat = new THREE.LineBasicMaterial({ color: 0x3fe0ff, transparent: true, opacity: .35 }); S.linkMat = linkMat;
  const pts = []; S.leaves.forEach(l => S.spines.forEach(s => { pts.push(l.position.clone(), s.position.clone()); }));
  net.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), linkMat));
  S.netPkts = []; for (let i = 0; i < 10; i++) S.netPkts.push(sph(.16, glow(0xffd23f, 2.5), 0, 0, 0, net, 8));
  /* sizes set (x = 92) */
  const sz = new THREE.Group(); sz.position.set(92, 0, Z); root.add(sz); S.sizes = [];
  [[-16, 1, 2, 1], [-8, 6, 3, 5], [4, 16, 8, 12], [24, 26, 11, 16]].forEach(([x, w, h, d], i) => { const g = new THREE.Group(); g.position.x = x; sz.add(g); box(w, h, d, std(0x8a96b0, { rough: .7 }), 0, h / 2, 0, g); if (i === 3) { box(w, h, d, std(0x8a96b0, { rough: .7 }), 0, h / 2, -20, g); box(w, h, d, std(0x8a96b0, { rough: .7 }), 0, h / 2, -40, g); } S.sizes.push(g); });
  /* redundancy set (x = 124): up to 9 cooling units */
  const red = new THREE.Group(); red.position.set(124, 0, Z); root.add(red); S.units = [];
  for (let i = 0; i < 9; i++) { const u = box(1.1, 1.6, 1.1, std(0xb8c2d6, { rough: .5 }), 0, .8, 0, red); const l = sph(.16, glow(C.ok, 2), 0, 1.8, .45, u, 8); S.units.push({ u, l }); }
  S.capBar = box(8, .3, .3, glow(C.ok, 1.2), 0, 3.2, -1.5, red);
  /* tiers set (x = 152) */
  const tr = new THREE.Group(); tr.position.set(152, 0, Z); root.add(tr); S.tierBlocks = [];
  for (let i = 0; i < 4; i++) S.tierBlocks.push(box(3, 1 + i, 3, std([0x6c7690, 0x3fa9ff, 0x2fd47a, 0xffd23f][i], { rough: .5 }), -6 + i * 4, (1 + i) / 2, 0, tr));
  /* virtualization set (x = 182) */
  const vt = new THREE.Group(); vt.position.set(182, 0, Z); root.add(vt);
  S.oldServers = []; for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.position.set(-4.5 + i * 3, 0, 0); vt.add(g); box(2, 1.2, 1.4, std(0x343d52), 0, .6, 0, g); const bar = box(.3, 1, .1, glow(C.ok, 1), .7, .6, .72, g); S.oldServers.push({ g, bar }); }
  S.host = box(4, 1, 2, std(0x343d52, { metal: .4 }), 0, .5, 0, vt); S.hyper = box(4, .2, 2, glow(C.violet, .8), 0, 1.1, 0, vt);
  S.vms = []; for (let i = 0; i < 4; i++) S.vms.push(box(1.8, .8, .9, std([0x3fa9ff, 0x2fd47a, 0xffb347, 0xb794ff][i], { opacity: .85 }), -.95 + (i % 2) * 1.9, 1.7 + Math.floor(i / 2) * .9, 0, vt));
  S.ctrs = []; for (let i = 0; i < 12; i++) S.ctrs.push(box(.45, .45, .45, std([0x3fa9ff, 0x2fd47a, 0xffb347][i % 3]), 0, 0, 0, vt));
  S.hosts3 = []; for (let i = 0; i < 3; i++) S.hosts3.push(box(2.4, .8, 1.6, std(0x343d52), -3.2 + i * 3.2, .4, 0, vt));
  /* globe set (x = 214) */
  const gl = new THREE.Group(); gl.position.set(214, 5, Z); root.add(gl); S.globe = gl;
  mesh(geo('globe', () => new THREE.SphereGeometry(4, 32, 16)), std(0x16305a, { rough: .7, emissive: 0x0a1a35, ei: .6 }), 0, 0, 0, gl);
  gl.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(4.02, 16, 10)), new THREE.LineBasicMaterial({ color: 0x3fa9ff, transparent: true, opacity: .35 })));
  S.regions = []; [[.35, 1.2], [.2, 1.4], [.9, -.4], [-.3, .4], [.75, 2.4]].forEach(([lat, lon]) => { const m = sph(.22, glow(C.warn, 2), 4 * Math.cos(lat) * Math.sin(lon), 4 * Math.sin(lat), 4 * Math.cos(lat) * Math.cos(lon), gl, 10); S.regions.push(m); });
  S.zones = []; for (let i = 0; i < 3; i++) S.zones.push(box(.9, .6, .7, std(0x8a96b0), 6.5 + i * 1.4, -3.6, 1.2, gl));
  /* PUE set (x = 244) */
  const pu = new THREE.Group(); pu.position.set(244, 0, Z); root.add(pu);
  S.pueA = [box(2, 4, 2, std(0x3fa9ff), -3, 2, 0, pu), box(2, 1.2, 2, std(0x3fe0ff, { opacity: .8 }), -3, 4.6, 0, pu), box(2, 1, 2, std(C.warn, { opacity: .8 }), -3, 5.7, 0, pu)];
  S.pueB = [box(2, 4, 2, std(0x3fa9ff), 3, 2, 0, pu), box(2, .22, 2, std(0x3fe0ff, { opacity: .8 }), 3, 4.11, 0, pu), box(2, .14, 2, std(C.warn, { opacity: .8 }), 3, 4.29, 0, pu)];
  /* site set (x = 276) */
  const si = new THREE.Group(); si.position.set(276, 0, Z); root.add(si);
  const terrain = mesh(new THREE.PlaneGeometry(26, 12, 26, 12), std(0x2a4a35, { rough: .9 }), 0, .05, 0, si); terrain.rotation.x = -Math.PI / 2;
  S.factors = []; [[-10, -2, 0xffd23f], [-6, 2, 0xffd23f], [-2, -2, 0x3fa9ff], [2, 2, C.a], [6, -2, 0x9fe0ff], [10, 2, C.ok]].forEach(([x, z, c]) => S.factors.push(box(.8, 4, .8, glow(c, 1), x, 2, z, si)));
  S.loadBanks = []; for (let i = 0; i < 3; i++) { const lb = box(2.4, 1.6, 1.6, std(0xd14b4b, { emissive: 0xff5a2a, ei: 0 }), -40 + i * 4, .8, 22, scene); lb.visible = false; S.loadBanks.push(lb); }

  let statusLine = '';
  O.studio = {
    reset(t) {
      S.pull.position.z = 0; S.pull.visible = true; S.parts.visible = false; S.pueB.forEach(m => { m.visible = true; }); S.servers.forEach(s => setE(s.material, 0, 0)); S.blades.forEach(b2 => { b2.position.z = .06; setE(b2.material, 0, 0); }); setE(S.tower.material, 0, 0);
      S.gpus.forEach(g => setE(g.material, 0, 0)); S.trays.forEach(tr2 => setE(tr2.material, 0, 0)); setE(S.pipeIn.material, 0x3d7bff, 0); setE(S.pipeOut.material, 0xff6a3d, 0);
      S.tiers.forEach(it => setE(it.material, 0, 0)); S.copies.forEach(c => { c.visible = true; setE(c.material, 0, 0); });
      S.spines.forEach(s => setE(s.material, 0, 0)); S.leaves.forEach(l => setE(l.material, 0, 0)); S.netPkts.forEach(p => { p.visible = false; }); S.linkMat.opacity = .35;
      S.sizes.forEach(g => { g.scale.setScalar(1); g.visible = false; }); S.units.forEach(({ u }) => { u.visible = false; }); S.capBar.visible = false;
      S.tierBlocks.forEach(b2 => { b2.scale.y = 1; b2.visible = true; });
      S.oldServers.forEach(o => { o.g.visible = false; }); S.host.visible = S.hyper.visible = false; S.vms.forEach(v => { v.visible = false; }); S.ctrs.forEach(c => { c.visible = false; }); S.hosts3.forEach(h => { h.visible = false; });
      S.globe.rotation.y = t * .15; S.zones.forEach(z => { z.visible = false; });
      S.factors.forEach(f => { f.scale.y = .05; f.position.y = .1; });
      statusLine = '';
    },
    loadBanks(on) { S.loadBanks.forEach(l => { l.visible = on; setE(l.material, 0xff5a2a, on ? 1.2 : 0); }); },
    status() { return statusLine; },
    apply(cue, p, t, beat) {
      switch (cue) {
        case 'rack': { const k = seg(p, .3, .8); S.pull.position.z = .9 * (1 - k); setE(S.pull.material, 0x3fe0ff, .8); break; }
        case 'shapes': { const k = Math.floor(p * 3); setE(S.pull.material, 0x3fe0ff, k === 0 ? 1 : 0); S.pull.position.z = k === 0 ? .7 : 0; S.blades.forEach((b2, i) => { setE(b2.material, 0x3fe0ff, k === 1 ? 1 : 0); if (k === 1 && i === 3) b2.position.z = .7; }); setE(S.tower.material, 0x3fe0ff, k === 2 ? 1 : 0); break; }
        case 'inside': S.pull.position.z = 2.1; S.pull.visible = false; S.parts.visible = true; break;
        case 'gpu': S.gpus.forEach((g, i) => setE(g.material, 0x76ff7a, .4 + .6 * Math.abs(Math.sin(t * 2 + i)))); break;
        case 'crowd': { const k = Math.floor(t * 6), n = 24 * 14; for (let i = 0; i < n; i++) S.crowd.setColorAt(i, COL.setHex(((i + k) % 7) < 3 ? 0x3fe0ff : 0x7b5ce6)); S.crowd.instanceColor.needsUpdate = true; S.cpuCores.forEach((c, i) => setE(c.material, C.warn, (k + i) % 8 < 2 ? 1.6 : .2)); return; }
        case 'airack': S.trays.forEach((tr2, i) => setE(tr2.material, 0x76ff7a, .3 + .3 * Math.abs(Math.sin(t * 2 + i * .4)))); setE(S.pipeIn.material, 0x3d7bff, 1.6); setE(S.pipeOut.material, 0xff6a3d, 1.6); break;
        case 'storage': { const k = Math.min(3, Math.floor(p * 4)); S.tiers.forEach((it, i) => setE(it.material, [0x2fd47a, 0x3fa9ff, 0x9aa4b8, 0xffb347][i], i === k ? 1.4 : 0)); S.tiers[2].rotation.y = t * 8; break; }
        case 'copies': { const fail = p > .3 && p < .7; S.copies.forEach((c, i) => setE(c.material, i === 1 && fail ? C.a : C.ok, i === 1 && p >= .7 ? .4 + .4 * Math.sin(t * 6) : .7)); statusLine = p < .3 ? '3 copies: all healthy' : fail ? 'One drive failed: the other copies keep your data safe' : 'Drive swapped: the copy rebuilds'; break; }
        case 'spineleaf': case 'eastwest': {
          const failSpine = cue === 'spineleaf' && p > .55;
          S.spines.forEach((s, i) => setE(s.material, i === 1 && failSpine ? C.a : 0x3fe0ff, .5)); S.leaves.forEach(l => setE(l.material, 0x3fe0ff, .4));
          S.netPkts.forEach((pk, i) => { pk.visible = true; const u = (t * .45 + i / 10) % 1, a = S.leaves[(i * 3) % 8].position, sp = S.spines[failSpine && i % 4 === 1 ? 2 : i % 4].position, b2 = S.leaves[(i * 5 + 2) % 8].position;
            if (cue === 'eastwest') pk.position.set(a.x + (b2.x - a.x) * u, 3 + Math.sin(u * Math.PI) * 3, 2 - Math.sin(u * Math.PI) * 2); else if (u < .5) pk.position.lerpVectors(a, sp, u * 2); else pk.position.lerpVectors(sp, b2, (u - .5) * 2); });
          statusLine = failSpine ? 'One spine fails: traffic takes the other spines' : ''; break;
        }
        case 'sizes': S.sizes.forEach((g, i) => { g.visible = true; g.scale.setScalar(Math.max(.01, seg(p, i * .2, i * .2 + .25))); }); break;
        case 'red': {
          const mode = beat.mode, n = mode === 'N' ? 4 : mode === 'N+1' ? 5 : 8; const fail = p > .45;
          S.units.forEach(({ u, l }, i) => { u.visible = i < n; u.position.set(mode === '2N' ? (i % 4) * 1.6 - 2.4 : i * 1.6 - (n - 1) * .8, .8, mode === '2N' ? (i < 4 ? -1.5 : 1.5) : 0); const broken = fail && (mode === '2N' ? i < 4 && p > .7 : i === 0); setE(l.material, broken ? C.a : C.ok, 2); });
          const working = mode === 'N' ? (fail ? 3 : 4) : mode === 'N+1' ? (fail ? 4 : 5) : (p > .7 ? 4 : 8), ok = working >= 4;
          S.capBar.visible = true; S.capBar.scale.x = Math.min(1.5, working / 4); setE(S.capBar.material, ok ? C.ok : C.a, 1.4);
          statusLine = `Cooling units working: ${working} of the 4 needed${ok ? ' ✓' : ' ✗ the hall overheats'}${mode === '2N' && p > .7 ? ' (all of side A lost)' : ''}`;
          break;
        }
        case 'nines': { const rows = [['99.9%', '≈ 8.8 hours a year'], ['99.99%', '≈ 53 minutes a year'], ['99.999%', '≈ 5.3 minutes a year']], k = Math.min(2, Math.floor(p * 3)); statusLine = `Uptime ${rows[k][0]} → downtime ${rows[k][1]}`; S.units.forEach(({ u }, i) => { u.visible = i < 8; u.position.set((i % 4) * 1.6 - 2.4, .8, i < 4 ? -1.5 : 1.5); }); break; }
        case 'tiers': S.tierBlocks.forEach((b2, i) => { const k = seg(p, i * .22, i * .22 + .2); b2.visible = k > 0; b2.scale.y = Math.max(.01, k); b2.position.y = (1 + i) * k / 2; }); break;
        case 'virt': {
          const stage = beat.stage;
          if (stage === 0) S.oldServers.forEach((o, i) => { o.g.visible = true; o.bar.scale.y = .12 + .06 * Math.abs(Math.sin(t + i)); o.bar.position.y = .1 + o.bar.scale.y / 2; });
          if (stage === 1 || stage === 3) { S.host.visible = S.hyper.visible = true; S.vms.forEach((v, i) => { v.visible = seg(p, i * .15, i * .15 + .1) > 0 || stage === 3; }); }
          if (stage === 2) { S.hosts3.forEach(h => { h.visible = true; }); S.ctrs.forEach((c, i) => { c.visible = true; const hop = Math.floor(t * .5 + i * .3) % 3, h = S.hosts3[(i + hop) % 3].position; c.position.set(h.x - .8 + (i % 4) * .5, 1.05 + Math.floor(i / 4) % 3 * .5, 0); }); }
          if (stage === 3) statusLine = 'Rented by the minute: one server, many customers';
          break;
        }
        case 'globe': S.zones.forEach((z, i) => { z.visible = p > .4 + i * .1; }); S.regions.forEach((r, i) => setE(r.material, C.warn, 1 + Math.sin(t * 3 + i))); break;
        case 'pue': { const k = seg(p, .3, .6); S.pueB.forEach(m => { m.visible = k > 0; }); break; }
        case 'site': S.factors.forEach((f, i) => { const k = seg(p, .15 + i * .12, .25 + i * .12); f.scale.y = Math.max(.05, k); f.position.y = 2 * k; }); break;
      }
      if (cue !== 'inside') S.pull.visible = true;
    }
  };
}
