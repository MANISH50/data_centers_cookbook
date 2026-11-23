/* HOW THE INTERNET MOVES DATA: the 3D world. A globe with Natural Earth coastlines, cities and an ILLUSTRATIVE
   cable network, plus close-up studio sets on a deck below. Built from simple three.js shapes, no logos.
   apply(beat, p, t, tryState) sets the whole scene from time alone (and from a reader's "Try it" panel). */
import * as THREE from '../vendor/three.min.js';
import { R, POI, CITIES, LINKS } from './data.js';
import { COAST } from './land.js';
import { llToXyz, linkPoints, shortestPath, pathPoints, gcKm, rttMs, DNS_STEPS, dnsStep } from './net.js';

const C = { bg: 0x040814, ocean: 0x0a2448, coast: 0x6fd6ff, grid: 0x1c3a66, city: 0xffd23f, sea: 0x2f8fff, land: 0xc08a3a, route: 0xffd23f, cut: 0xff4d5e,
  ok: 0x2fd47a, cyan: 0x3fe0ff, violet: 0x9b7bff, pink: 0xff6ad5, deck: 0x0d1322 };

const geoCache = new Map();
const geo = (k, make) => { let g = geoCache.get(k); if (!g) { g = make(); geoCache.set(k, g); } return g; };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? .6, metalness: o.metal ?? .1, emissive: o.emissive ?? 0, emissiveIntensity: o.ei ?? 1, transparent: o.opacity != null, opacity: o.opacity ?? 1, depthWrite: o.opacity == null || o.opacity > .5, side: o.side ?? THREE.FrontSide });
const glow = (color, ei = 1.6, opacity) => std(color, { emissive: color, ei, opacity });
const mesh = (g, m, x = 0, y = 0, z = 0, parent) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); parent?.add(o); return o; };
const box = (w, h, d, m, x, y, z, parent) => mesh(geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m, x, y, z, parent);
const cyl = (rt, rb, h, m, x, y, z, parent, seg = 20, open = false) => mesh(geo(`c${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)), m, x, y, z, parent);
const sph = (r, m, x, y, z, parent, seg = 14) => mesh(geo(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(8, seg >> 1))), m, x, y, z, parent);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const setE = (m, color, ei) => { m.emissive.setHex(color); m.emissiveIntensity = ei; };
const clamp01 = x => Math.max(0, Math.min(1, x));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const M4 = new THREE.Matrix4(), COL = new THREE.Color(), P = new THREE.Vector3();
const vecLL = (ll, r = R) => V(...llToXyz(ll, r));

/* A smooth path over the globe's surface through [lat, lon] points, lifted `lift` above the surface. */
function surfaceCurve(lls, lift = .6, arcLift = 0) {
  const pts = [];
  for (let i = 1; i < lls.length; i++) {
    const a = vecLL(lls[i - 1], 1), b = vecLL(lls[i], 1), n = Math.max(4, Math.ceil(a.angleTo(b) * 40));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) { const v = a.clone().lerp(b, k / n).normalize(); pts.push(v); }
  }
  const total = pts.length - 1;
  return new THREE.CatmullRomCurve3(pts.map((v, i) => v.multiplyScalar(R + lift + arcLift * Math.sin(Math.PI * i / total))));
}
function textTex(text, { w = 256, h = 96, bg = '#0f1b33', fg = '#eaf0fb', font = 'bold 44px monospace' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* Packets riding along a curve. */
function rider(parent, n, r, color) {
  const im = new THREE.InstancedMesh(geo(`s${r},8`, () => new THREE.SphereGeometry(r, 8, 6)), glow(color, 2.4), n);
  im.frustumCulled = false; im.visible = false; parent.add(im);
  return {
    im,
    along(curve, k0, spread = .02) { im.visible = true; for (let i = 0; i < n; i++) { curve.getPointAt(clamp01(k0 - i * spread), P); M4.makeTranslation(P.x, P.y, P.z); im.setMatrixAt(i, M4); } im.instanceMatrix.needsUpdate = true; },
    stream(curves, t, speed = .2) { im.visible = true; for (let i = 0; i < n; i++) { const c = curves[i % curves.length], k = ((t * speed + Math.floor(i / curves.length) / Math.ceil(n / curves.length) + i * .13) % 1 + 1) % 1; c.getPointAt(k, P); M4.makeTranslation(P.x, P.y, P.z); im.setMatrixAt(i, M4); } im.instanceMatrix.needsUpdate = true; },
    hide() { im.visible = false; }
  };
}

export function buildWorld(scene, renderer, { soft = false } = {}) {
  scene.background = new THREE.Color(C.bg);
  scene.fog = new THREE.Fog(C.bg, 400, 1400);
  if (!soft) {
    const env = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer); env.background = new THREE.Color(0x2a3248);
    [[0xc8d4ff, 0, 9, 0], [0xffc890, 10, 2, 4], [0x8fe0ff, -10, 3, -4]].forEach(([c, x, y, z]) => sph(3, new THREE.MeshBasicMaterial({ color: c }), x, y, z, env));
    scene.environment = pm.fromScene(env, .04).texture; pm.dispose();
  }
  scene.add(new THREE.HemisphereLight(0xb8ccff, 0x1a2030, 1.3));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(200, 160, 260); scene.add(sun);

  /* ---------- globe ---------- */
  const globe = new THREE.Group(); scene.add(globe);
  mesh(geo('earth', () => new THREE.SphereGeometry(R, 64, 32)), std(C.ocean, { rough: .85, emissive: 0x061630, ei: .8 }), 0, 0, 0, globe);
  mesh(geo('halo', () => new THREE.SphereGeometry(R * 1.06, 48, 24)), new THREE.MeshBasicMaterial({ color: 0x3f8fff, transparent: true, opacity: .08, side: THREE.BackSide, depthWrite: false }), 0, 0, 0, globe);
  const cpts = []; for (const line of COAST) for (let i = 2; i < line.length; i += 2) cpts.push(vecLL([line[i - 1], line[i - 2]], R + .08), vecLL([line[i + 1], line[i]], R + .08));
  const coast = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cpts), new THREE.LineBasicMaterial({ color: C.coast, transparent: true, opacity: .75 })); globe.add(coast);
  const gpts = []; for (let lat = -60; lat <= 60; lat += 30) for (let lon = -180; lon < 180; lon += 6) gpts.push(vecLL([lat, lon], R + .02), vecLL([lat, lon + 6], R + .02));
  for (let lon = -180; lon < 180; lon += 30) for (let lat = -84; lat < 84; lat += 6) gpts.push(vecLL([lat, lon], R + .02), vecLL([lat + 6, lon], R + .02));
  globe.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gpts), new THREE.LineBasicMaterial({ color: C.grid, transparent: true, opacity: .5 })));
  // cities
  const cityM = {}; for (const [k, c] of Object.entries(CITIES)) { const v = vecLL(c.ll, R + .4); cityM[k] = sph(.55, glow(C.city, 1.4), v.x, v.y, v.z, globe, 10); }
  // links
  const linkObj = {};
  for (const l of LINKS) {
    const isSea = !!l.sea, curve = surfaceCurve(linkPoints(l, CITIES), isSea ? .25 : .35);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, (l.sea?.length || 1) * 24), isSea ? .18 : .14, 5, false), std(isSea ? 0x1f5fa8 : 0x7a5a2a, { emissive: isSea ? C.sea : C.land, ei: .35 }));
    globe.add(m); linkObj[l.id] = { m, curve, l };
  }
  // root server instances + CDN caches (illustrative scatter)
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const rootDots = new THREE.InstancedMesh(geo('s0.45,8', () => new THREE.SphereGeometry(.45, 8, 6)), glow(C.violet, 2), 60);
  for (let i = 0; i < 60; i++) { const v = vecLL([Math.asin(rnd() * 1.6 - .8) * 180 / Math.PI, rnd() * 360 - 180], R + .6); M4.makeTranslation(v.x, v.y, v.z); rootDots.setMatrixAt(i, M4); }
  globe.add(rootDots);
  const pkt = rider(globe, 8, .55, C.route), pkt2 = rider(globe, 24, .45, C.cyan), nets = rider(globe, 60, .4, C.pink);

  /* ---------- studio deck ---------- */
  const deck = mesh(new THREE.PlaneGeometry(460, 60), std(C.deck, { rough: .95 }), 0, -600, 0, scene); deck.rotation.x = -Math.PI / 2;
  const deckGrid = new THREE.GridHelper(460, 230, 0x1a2440, 0x111a2e); deckGrid.position.set(0, -599.98, 0); scene.add(deckGrid);
  const S = {};
  /* first mile (x -180) */
  { const g = new THREE.Group(); g.position.set(-180, -600, 0); scene.add(g); S.first = g;
    box(7, 4, 5, std(0x8a96b0, { opacity: .25 }), -5.5, 2, 1, g); cyl(0, 4.6, 2, std(0x8a4b3a), -5.5, 5, 1, g, 4).rotation.y = Math.PI / 4;
    box(1.6, .1, 1, std(0x5a4a3a), -8, 2.6, 2, g); S.phone = box(.25, .45, .05, glow(C.cyan, .4), -8, 2.9, 2, g);
    S.router = box(.8, .25, .5, std(0x2a3346), -2, 2.5, 1.5, g); box(.8, .05, .5, std(0x5a4a3a), -2, 2.3, 1.5, g);
    cyl(.15, .3, 10, std(0x9aa4b8, { metal: .6 }), 4, 5, -1, g, 8); S.mastHead = box(1.2, .8, .3, glow(C.cyan, .2), 4, 9.6, -.8, g);
    S.isp = box(5, 6, 4, std(0x6c7690), 10, 3, 0, g); S.ispSign = box(5.02, .8, 4.02, glow(C.ok, .2), 10, 5.4, 0, g);
    const wire = [V(-2, 2.4, 1.5), V(-1.5, .1, 2.4), V(3, .1, 2.4), V(7.5, .5, 1.2), V(7.6, 2.4, 0)];
    S.wireCurve = new THREE.CatmullRomCurve3(wire); mesh(new THREE.TubeGeometry(S.wireCurve, 40, .07, 6), std(0x7a5a2a, { emissive: C.land, ei: .3 }), 0, 0, 0, g);
    S.radioA = new THREE.CatmullRomCurve3([V(-8, 3, 2), V(-5, 4, 1.8), V(-2, 2.7, 1.5)]); S.radioB = new THREE.CatmullRomCurve3([V(-8, 3, 2), V(-2, 7, 1), V(4, 9.4, -.8)]);
    S.radioC = new THREE.CatmullRomCurve3([V(4, 9.4, -.8), V(7, 8, -.4), V(9, 6, 0)]); S.up = new THREE.CatmullRomCurve3([V(10, 6, 0), V(10, 12, 0), V(10, 20, 0)]);
    S.firstPk = rider(g, 6, .22, C.route); }
  /* packets (x -140) */
  { const g = new THREE.Group(); g.position.set(-140, -600, 0); scene.add(g); S.pkt = g;
    const pc = document.createElement('canvas'); pc.width = 256; pc.height = 192; const x = pc.getContext('2d'); const gr = x.createLinearGradient(0, 0, 256, 192); gr.addColorStop(0, '#ff9a3d'); gr.addColorStop(.5, '#e84a8a'); gr.addColorStop(1, '#3d7bff'); x.fillStyle = gr; x.fillRect(0, 0, 256, 192); x.fillStyle = '#ffe9a8'; x.beginPath(); x.arc(70, 60, 26, 0, 7); x.fill(); x.fillStyle = '#16223f'; x.beginPath(); x.moveTo(0, 192); x.lineTo(90, 100); x.lineTo(160, 150); x.lineTo(210, 90); x.lineTo(256, 130); x.lineTo(256, 192); x.fill();
    const tex = new THREE.CanvasTexture(pc); tex.colorSpace = THREE.SRGBColorSpace;
    S.tiles = []; for (let i = 0; i < 12; i++) { const c = i % 4, r = Math.floor(i / 4), t2 = new THREE.MeshStandardMaterial({ map: tex, roughness: .6 }); const gq = new THREE.PlaneGeometry(1, 1); const uv = gq.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, (c + uv.getX(k)) / 4, (2 - r + uv.getY(k)) / 3); const m = new THREE.Mesh(gq, t2); g.add(m);
      const hdr = box(1, .22, .06, glow(C.cyan, .8), 0, 0, 0, g); S.tiles.push({ m, hdr, c, r }); }
    S.shared = new THREE.CatmullRomCurve3([V(-8, .5, -4), V(0, .5, -4), V(10, .5, -4)]); mesh(new THREE.TubeGeometry(S.shared, 30, .12, 6), std(0x1f5fa8, { emissive: C.sea, ei: .4 }), 0, 0, 0, g);
    S.sharedPk = new THREE.InstancedMesh(geo('b0.7,0.4,0.3', () => new THREE.BoxGeometry(.7, .4, .3)), new THREE.MeshBasicMaterial({ color: 0xffffff }), 14); S.sharedPk.frustumCulled = false; g.add(S.sharedPk);
    for (let i = 0; i < 14; i++) S.sharedPk.setColorAt(i, COL.setHex([C.route, C.pink, C.ok, C.cyan][i % 4])); }
  /* addresses (x -100) */
  { const g = new THREE.Group(); g.position.set(-100, -600, 0); scene.add(g); S.addr = g;
    S.v4 = ['192', '0', '2', '1'].map((t2, i) => { const m = box(1.8, 1, .3, new THREE.MeshBasicMaterial({ map: textTex(t2) }), -3.3 + i * 2.2, 3.6, 0, g); return m; });
    S.v6 = ['2001', 'db8', '0', '0', '0', '0', '0', '1'].map((t2, i) => box(1.5, .8, .3, new THREE.MeshBasicMaterial({ map: textTex(t2, { fg: '#9ff5e8' }) }), -6.1 + i * 1.75, 1.8, 0, g));
    S.bits4 = new THREE.InstancedMesh(geo('b0.18,0.18,0.18', () => new THREE.BoxGeometry(.18, .18, .18)), new THREE.MeshBasicMaterial({ color: 0xffffff }), 32);
    S.bits6 = new THREE.InstancedMesh(geo('b0.18,0.18,0.18', () => new THREE.BoxGeometry(.18, .18, .18)), new THREE.MeshBasicMaterial({ color: 0xffffff }), 128);
    for (let i = 0; i < 32; i++) { M4.makeTranslation(-3.3 + (i % 16) * .3 - 1 + 2, 5 + Math.floor(i / 16) * .3, 0); S.bits4.setMatrixAt(i, M4); S.bits4.setColorAt(i, COL.setHex(C.route)); }
    for (let i = 0; i < 128; i++) { M4.makeTranslation(-6.1 + (i % 32) * .4, .4 + Math.floor(i / 32) * .3 - .2, .8); S.bits6.setMatrixAt(i, M4); S.bits6.setColorAt(i, COL.setHex(C.cyan)); }
    g.add(S.bits4, S.bits6); }
  /* DNS (x -60) */
  { const g = new THREE.Group(); g.position.set(-60, -600, 0); scene.add(g); S.dns = g;
    const tower = (x, h, c) => { const m = box(1.8, h, 1.8, std(0x2a3346, { emissive: c, ei: .2, metal: .3 }), x, h / 2, 0, g); return m; };
    S.dnsNodes = { device: box(.6, 1, .1, glow(C.cyan, .5), -14, .9, 0, g), resolver: tower(-8, 5, C.cyan), root: tower(-2, 7, C.violet), tld: tower(4, 7, C.ok), auth: tower(10, 7, C.route) };
    box(.9, .2, .6, std(0x4a3a2a), -14, .3, 0, g);
    S.dnsPos = { device: V(-14, 1.6, 0), resolver: V(-8, 5.3, 0), root: V(-2, 7.3, 0), tld: V(4, 7.3, 0), auth: V(10, 7.3, 0) };
    S.dnsMsg = sph(.35, glow(C.route, 2.5), 0, 0, 0, g); S.dnsCache = box(1.4, .5, .5, glow(C.ok, 0), -8, 2, 1.2, g); }
  /* hops (x -20) */
  { const g = new THREE.Group(); g.position.set(-20, -600, 0); scene.add(g); S.hops = g;
    S.routers = []; const pts = [];
    for (let i = 0; i < 7; i++) { const x = -12 + i * 4, z = i % 2 ? 1.5 : -1.5; S.routers.push(cyl(.9, .9, .6, std(0x3a4766, { metal: .4, emissive: C.cyan, ei: 0 }), x, .6, z, g, 16)); pts.push(V(x, 1.2, z)); }
    S.hopCurve = new THREE.CatmullRomCurve3(pts); mesh(new THREE.TubeGeometry(S.hopCurve, 80, .07, 6), std(0x1f5fa8, { emissive: C.sea, ei: .3 }), 0, 0, 0, g);
    S.hopPk = sph(.3, glow(C.route, 2.5), 0, 0, 0, g); S.probe = sph(.25, glow(C.cut, 2.5), 0, 0, 0, g); }
  /* BGP (x 20) */
  { const g = new THREE.Group(); g.position.set(20, -600, 0); scene.add(g); S.bgp = g;
    const pos = [[-9, 0], [-4, -4], [-4, 4], [1, 0], [6, -4], [6, 4], [11, 0]].map(([x, z]) => V(x, 2.5, z));
    S.asPos = pos; S.as = pos.map((v, i) => sph(1.1, std(0x46557a, { emissive: C.cyan, ei: 0 }), v.x, v.y, v.z, g, 18));
    S.asEdges = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 6], [1, 4]];
    S.edgeM = S.asEdges.map(([a, b]) => { const d = pos[b].clone().sub(pos[a]), m = cyl(.08, .08, d.length(), std(0x4a5468, { emissive: C.cyan, ei: 0 }), 0, 0, 0, g, 6); m.position.copy(pos[a]).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m; });
    S.bgpPk = sph(.3, glow(C.route, 2.5), 0, 0, 0, g); }
  /* IXP (x 60) */
  { const g = new THREE.Group(); g.position.set(60, -600, 0); scene.add(g); S.ixp = g;
    box(22, 7, 12, std(0x8a96b0, { opacity: .12 }), 0, 3.5, 0, g);
    S.fabric = box(6, 1, 1.2, std(0x2a3346, { emissive: C.cyan, ei: .3, metal: .4 }), 0, 1.5, 0, g);
    S.netsIx = []; S.ixCurves = [];
    const cols = [C.route, C.pink, C.ok, C.cyan, C.violet, 0xff8a3d, 0x9ff5e8, 0xff4d5e];
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = Math.cos(a) * 8, z = Math.sin(a) * 4.2; S.netsIx.push(box(1.4, 2, 1.2, std(cols[i], { emissive: cols[i], ei: .2 }), x, 1, z, g));
      const c = new THREE.CatmullRomCurve3([V(x, 2.1, z), V(x * .5, 2.4, z * .5), V(0, 2, 0)]); S.ixCurves.push(c); mesh(new THREE.TubeGeometry(c, 20, .06, 5), std(0xffd23f, { emissive: 0xffd23f, ei: .3 }), 0, 0, 0, g); }
    S.ixPk = rider(g, 16, .22, C.route); }
  /* cable (x 100) */
  { const g = new THREE.Group(); g.position.set(100, -600, 0); scene.add(g); S.cable = g;
    const along = (r, x0, x1, m) => { const c = cyl(r, r, x1 - x0, m, (x0 + x1) / 2, 1.5, 0, g, 24); c.rotation.z = Math.PI / 2; return c; };
    S.layers = [along(.6, -6, 1.5, std(0x1b1f2a, { rough: .7 })), along(.45, -6, 2.5, std(0x9aa4b8, { metal: .8, rough: .3 })), along(.3, -6, 3.5, std(0xd9824a, { metal: .9, rough: .25 }))];
    S.fibres = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, f = cyl(.04, .04, 10.5, glow(C.cyan, 1.5), -.75, 1.5 + Math.sin(a) * .12, Math.cos(a) * .12, g, 6); f.rotation.z = Math.PI / 2; S.fibres.push(f); }
    const sea = mesh(new THREE.PlaneGeometry(14, 16), std(0x1f5fa8, { opacity: .45, rough: .2 }), -12, .9, 0, g); sea.rotation.x = -Math.PI / 2;
    box(4, .3, 16, std(0xc9a46a), -4, .15, 0, g);
    S.landing = box(4, 3, 3, std(0x8a96b0), 7, 1.5, 2, g); S.landingSign = box(3, .4, .08, glow(C.ok, 0), 7, 2.6, 3.55, g);
    S.ship = new THREE.Group(); S.ship.position.set(-7, 1, -4); g.add(S.ship); box(5, 1, 1.6, std(0xc9372f), 0, 0, 0, S.ship); box(1.6, 1.2, 1.4, std(0xe8edf4), -1, 1, 0, S.ship);
    S.grapnel = cyl(.04, .04, 1, std(0xb0b8c8), 2, -1, 0, S.ship, 6); }
  /* TCP / UDP (x 140) */
  { const g = new THREE.Group(); g.position.set(140, -600, 0); scene.add(g); S.tcp = g;
    for (const z of [-2, 2]) { box(16, .1, 1.4, std(0x1f2a44), 0, .3, z, g); box(1.2, 1.8, 1.4, std(0x3a4766), -8.6, .9, z, g); box(1.2, 1.8, 1.4, std(0x3a4766), 8.6, .9, z, g); }
    S.lanes = { tcp: [], udp: [] }; S.slots = { tcp: [], udp: [] };
    for (const k of ['tcp', 'udp']) { const z = k === 'tcp' ? -2 : 2; for (let i = 1; i <= 6; i++) { S.lanes[k].push(box(.7, .5, .7, new THREE.MeshBasicMaterial({ map: textTex(String(i), { w: 96, h: 96, font: 'bold 64px monospace' }) }), 0, 0, z, g)); S.slots[k].push(box(.5, .3, .5, std(0x2a3346, { emissive: C.ok, ei: 0 }), 10 + (i - 1) * .6, .3, z, g)); } } }
  /* TLS (x 180) */
  { const g = new THREE.Group(); g.position.set(180, -600, 0); scene.add(g); S.tls = g;
    const tub = cyl(1.5, 1.5, 16, std(0x3fe0ff, { opacity: .14 }), 0, 2, 0, g, 24, true); tub.rotation.z = Math.PI / 2;
    for (const x of [-8.6, 8.6]) { box(1, .9, .4, std(C.route, { metal: .7, emissive: C.route, ei: .4 }), x, 2, 0, g); const sh = new THREE.Mesh(geo('lockring', () => new THREE.TorusGeometry(.3, .08, 8, 16, Math.PI)), std(C.route, { metal: .7 })); sh.position.set(x, 2.45, 0); g.add(sh); }
    for (let i = 0; i < 3; i++) cyl(.6, .6, .4, std(0x3a4766, { metal: .4 }), -4 + i * 4, 4.6, 0, g, 12);
    S.tlsPk = new THREE.InstancedMesh(geo('b0.5,0.35,0.35', () => new THREE.BoxGeometry(.5, .35, .35)), new THREE.MeshBasicMaterial({ color: 0xffffff }), 10); S.tlsPk.frustumCulled = false; g.add(S.tlsPk); }

  /* ================= APPLY ================= */
  const routeCache = new Map();
  const route = (from, to, cut = []) => { const k = `${from}>${to}>${cut.join(',')}`; if (!routeCache.has(k)) { const r = shortestPath(from, to, LINKS, CITIES, new Set(cut)); routeCache.set(k, r && { ...r, curve: surfaceCurve(pathPoints(r, CITIES), .9, 4), straight: gcKm(CITIES[from].ll, CITIES[to].ll) }); } return routeCache.get(k); };
  let status = '', extraLabels = [];
  function lightRoute(r, color) { r.links.forEach(l => setE(linkObj[l.id].m.material, color, 1.1)); r.nodes.forEach(n => setE(cityM[n].material, color, 2.2)); }
  function apply(beat, p, t, tryState) {
    const cue = tryState?.kind ? 'try-' + tryState.kind : (beat.cue || '');
    status = ''; extraLabels = [];
    for (const k in linkObj) { const o = linkObj[k]; setE(o.m.material, o.l.sea ? C.sea : C.land, .35); }
    for (const k in cityM) setE(cityM[k].material, C.city, 1.4);
    rootDots.visible = false; pkt.hide(); pkt2.hide(); nets.hide();
    resetStudios(t);
    switch (cue) {
      case 'spin': case 'cities': for (const k in cityM) setE(cityM[k].material, C.city, 1.6 + Math.sin(t * 3 + k.length)); break;
      case 'nets': { const cs = Object.values(linkObj).map(o => o.curve); nets.stream(cs, t, .08); Object.values(linkObj).forEach((o, i) => setE(o.m.material, [C.pink, C.ok, C.cyan, C.violet][i % 4], .9)); break; }
      case 'cables': Object.values(linkObj).forEach(o => { if (o.l.sea) setE(o.m.material, C.sea, 1.4 + .4 * Math.sin(t * 2 + o.l.id.length)); }); pkt2.stream(Object.values(linkObj).filter(o => o.l.sea).map(o => o.curve), t, .1); break;
      case 'roots': rootDots.visible = true; rootDots.material.emissiveIntensity = 1.6 + Math.sin(t * 3) * .6; break;
      case 'route': case 'try-route': {
        const from = tryState?.from || beat.from, to = tryState?.to || beat.to, cut = tryState?.cut ? [tryState.cut] : [];
        const r = route(from, to, cut); if (!r) { status = 'No path left between these cities.'; break; }
        lightRoute(r, C.route);
        const k = tryState ? ((t * .35) % 1.25) : p; const going = k <= .62;
        pkt.along(r.curve, going ? clamp01(k / .62) : clamp01(1 - (k - .62) / .38), .02);
        extraLabels = [[CITIES[from].n, llToXyz(CITIES[from].ll, R + 3)], [CITIES[to].n, llToXyz(CITIES[to].ll, R + 3)]];
        status = `${CITIES[from].n} → ${CITIES[to].n}: ${Math.round(r.km).toLocaleString('en-US')} km of cable (illustrative) · light alone needs ≥ ${rttMs(r.km).toFixed(0)} ms round trip`;
        if (tryState) Object.assign(tryState, { result: { nodes: r.nodes.map(n => CITIES[n].n), km: r.km, straight: r.straight } });
        break;
      }
      case 'cut': case 'try-cut': {
        const from = tryState?.from || 'mumbai', to = tryState?.to || 'london', cutId = tryState ? tryState.cut : 'med', isCut = tryState ? !!tryState.cut : p > .15;
        const before = route(from, to), after = route(from, to, isCut ? [cutId] : []);
        if (isCut) { setE(linkObj[cutId].m.material, C.cut, 2.5 + Math.sin(t * 8)); }
        const r = isCut && (tryState || p > .5) ? after : before; if (!r) { status = 'Cut off: no other path!'; break; }
        lightRoute(r, isCut ? C.ok : C.route);
        if (isCut) setE(linkObj[cutId].m.material, C.cut, 2.5 + Math.sin(t * 8));
        pkt.along(r.curve, (t * .3) % 1, .012);
        status = !isCut ? `Normal route: ${Math.round(before.km).toLocaleString('en-US')} km` : r === before ? 'Cable cut! Traffic on it is lost…' : `Rerouted: ${Math.round(r.km).toLocaleString('en-US')} km instead of ${Math.round(before.km).toLocaleString('en-US')} km, so a slower trip`;
        if (tryState) Object.assign(tryState, { result: { before: before.km, after: after?.km, nodes: r.nodes.map(n => CITIES[n].n) } });
        extraLabels = [[CITIES[from].n, llToXyz(CITIES[from].ll, R + 3)], [CITIES[to].n, llToXyz(CITIES[to].ll, R + 3)]];
        break;
      }
      case 'cdn': {
        const origin = 'ashburn', users = ['mumbai', 'singapore', 'saopaulo', 'lagos', 'sydney', 'tokyo', 'london'];
        setE(cityM[origin].material, C.cut, 3); const local = p > .5;
        const curves = users.map(u => local ? surfaceCurve([CITIES[u].ll, [CITIES[u].ll[0] + 3, CITIES[u].ll[1] + 4]], .6, 2) : route(u, origin)?.curve).filter(Boolean);
        users.forEach(u => setE(cityM[u].material, local ? C.ok : C.city, local ? 3 : 1.4));
        pkt2.stream(curves, t, local ? .6 : .12);
        extraLabels = [['Original server', llToXyz(CITIES[origin].ll, R + 4)]].concat(local ? [['Nearby cache', llToXyz(CITIES.mumbai.ll, R + 4)]] : []);
        status = local ? 'Answered by a cache nearby: a short trip' : 'Without a CDN: every request crosses oceans to one server';
        break;
      }
      case 'first': firstMile(p, t); break;
      case 'pkt': packets(p, t); break;
      case 'addr': addresses(p, t); break;
      case 'dns': case 'try-dns': dns(tryState ? (tryState.step + .5) / DNS_STEPS.length : p, t, !!tryState); break;
      case 'hops': hops(p, t); break;
      case 'bgp': bgp(p, t); break;
      case 'ixp': ixp(p, t); break;
      case 'cable': cable(p, t); break;
      case 'tcp': case 'try-tcp': tcp(tryState ? tryState.k : p, t, tryState?.drop ?? 3, tryState); break;
      case 'tls': tls(t); break;
    }
  }

  /* ---------- studio scenes ---------- */
  function resetStudios(t) {
    setE(S.phone.material, C.cyan, .4); setE(S.mastHead.material, C.cyan, .2); setE(S.ispSign.material, C.ok, .2); S.firstPk.hide();
    S.tiles.forEach(o => { o.m.visible = true; o.hdr.visible = false; }); S.sharedPk.visible = false;
    S.v4.forEach(m => { m.visible = true; }); S.v6.forEach(m => { m.visible = false; }); S.bits4.visible = true; S.bits6.visible = false;
    Object.values(S.dnsNodes).forEach(m => { m.material.emissiveIntensity = .2; }); S.dnsMsg.visible = false; setE(S.dnsCache.material, C.ok, 0);
    S.routers.forEach(r => setE(r.material, C.cyan, 0)); S.hopPk.visible = false; S.probe.visible = false;
    S.as.forEach(a => setE(a.material, C.cyan, 0)); S.edgeM.forEach(e => setE(e.material, C.cyan, 0)); S.bgpPk.visible = false;
    S.ixPk.hide(); setE(S.fabric.material, C.cyan, .3);
    S.layers.forEach((l, i) => { l.position.y = 1.5; l.visible = true; }); S.ship.visible = false; S.grapnel.scale.y = .01; setE(S.landingSign.material, C.ok, 0);
    S.fibres.forEach(f => { f.material.emissiveIntensity = 1.2 + .3 * Math.sin(t * 4); });
    for (const k of ['tcp', 'udp']) { S.lanes[k].forEach(b2 => { b2.visible = false; }); S.slots[k].forEach(s2 => setE(s2.material, C.ok, 0)); }
    S.tlsPk.visible = false;
  }
  function firstMile(p, t) {
    if (p < .4) { const k = (t * .7) % 1; S.firstPk.along(Math.floor(t * .7) % 2 ? S.radioB : S.radioA, k, .03); setE(S.phone.material, C.cyan, 2); setE(S.mastHead.material, C.cyan, 1.2); }
    else if (p < .8) { const k = (t * .4) % 1; S.firstPk.along(S.wireCurve, k, .03); }
    else { S.firstPk.along(S.up, (t * .5) % 1, .03); setE(S.ispSign.material, C.ok, 1.6); }
  }
  function packets(p, t) {
    const split = seg(p, .05, .3), row = seg(p, .35, .55), travel = seg(p, .6, .9), done = p >= .95;
    S.tiles.forEach((o, i) => {
      const home = V(-4.5 + o.c * 1 + .5, 4 - o.r, 0), spread = V(-5 + o.c * 1.35 + .5, 4.2 - o.r * 1.3, 0), lineup = V(-4.5 + i * .9, 2.2 + (i % 2) * .25, 0);
      const order = [3, 0, 7, 1, 10, 5, 2, 11, 4, 9, 6, 8][i], dest = V(5.5 + o.c * 1 + .5, 4 - o.r, 0);
      let pos = home.clone().lerp(spread, split);
      if (row > 0) pos = spread.clone().lerp(lineup, row);
      if (travel > 0) { const k = clamp01(travel * 1.6 - order * .05), mid = lineup.clone().lerp(dest, k); mid.y += Math.sin(Math.PI * k) * (1 + (i % 3)); mid.z = Math.sin(Math.PI * k) * ((i % 3) - 1) * 2; pos = mid; }
      if (done) pos = dest;
      o.m.position.copy(pos); o.m.scale.setScalar(.95); o.hdr.visible = row > .3 && !done && p < 1; o.hdr.position.set(pos.x, pos.y + .6, pos.z);
    });
    if (p >= 1) { S.sharedPk.visible = true; for (let i = 0; i < 14; i++) { S.shared.getPointAt(((t * .15 + i / 14) % 1), P); M4.makeTranslation(P.x, P.y + .35, P.z); S.sharedPk.setMatrixAt(i, M4); } S.sharedPk.instanceMatrix.needsUpdate = true; S.sharedPk.instanceColor.needsUpdate = true; }
  }
  function addresses(p) {
    S.bits4.visible = p < .5; S.v6.forEach((m, i) => { m.visible = p > .5 + i * .05; }); S.bits6.visible = p > .55;
    status = p < .4 ? 'IPv4: 4 numbers × 8 bits = 32 bits' : p < .5 ? '2³² = 4,294,967,296 possible IPv4 addresses' : 'IPv6: 8 groups × 16 bits = 128 bits';
  }
  function dns(p, t, manual) {
    const i = Math.min(DNS_STEPS.length - 1, Math.floor(p * DNS_STEPS.length)), local = manual ? .5 + .5 * ((t * .8) % 1) : (p * DNS_STEPS.length) % 1;
    const [a, b2, text] = DNS_STEPS[i]; S.dnsMsg.visible = true; S.dnsMsg.position.copy(S.dnsPos[a]).lerp(S.dnsPos[b2], Math.min(1, local * 1.3)); S.dnsMsg.position.y += Math.sin(Math.PI * Math.min(1, local * 1.3)) * 2;
    setE(S.dnsMsg.material, i >= 6 ? C.ok : C.route, 2.5);
    S.dnsNodes[b2].material.emissiveIntensity = 1.4; if (i >= 7) setE(S.dnsCache.material, C.ok, 1.6);
    status = `Step ${i + 1} of ${DNS_STEPS.length}: ${text}`;
  }
  function hops(p, t) {
    const n = S.routers.length;
    if (p < .75) { const k = (t * .12) % 1; S.hopCurve.getPointAt(k, P); S.hopPk.visible = true; S.hopPk.position.copy(P); const hop = Math.min(n - 1, Math.floor(k * (n - 1) + .5)); S.routers.forEach((r, i) => setE(r.material, C.cyan, i <= hop ? (i === hop ? 2 : .6) : 0)); status = `Hop ${hop + 1} of ${n} · time to live: ${64 - hop}`; }
    else { const probe = Math.min(n - 1, Math.floor(seg(p, .75, 1) * n)), k = (t * .8) % 1; S.probe.visible = true; S.hopCurve.getPointAt(Math.min(1, probe / (n - 1)) * Math.min(1, k * 1.2), P); S.probe.position.copy(P); S.routers.forEach((r, i) => setE(r.material, i < probe ? C.ok : C.cyan, i < probe ? 1.2 : i === probe ? 2 * (k > .8) : 0)); status = `traceroute: probe with time to live ${probe + 1} → expires at router ${probe + 1}, which replies`; }
  }
  function bgp(p, t) {
    const dist = [3, 2, 2, 1, 1, 1, 0]; // hops from the origin (node 6)
    const ann = seg(p, 0, .3) * 4;
    S.as.forEach((a, i) => setE(a.material, ann >= dist[i] ? C.ok : C.cyan, ann >= dist[i] ? 1 : .1));
    S.edgeM.forEach((e, k) => { const [a, b2] = S.asEdges[k]; setE(e.material, C.ok, ann >= Math.max(dist[a], dist[b2]) ? 1 : 0); });
    status = p < .35 ? 'Network 7 announces: “I can reach 203.0.113.0/24”' : '';
    if (p >= .35 && p < .6) { const path = [0, 1, 3, 4, 6], k = (t * .3) % 1, f = k * (path.length - 1), i = Math.floor(f); S.bgpPk.visible = true; S.bgpPk.position.copy(S.asPos[path[i]]).lerp(S.asPos[path[Math.min(path.length - 1, i + 1)]], f - i); S.bgpPk.position.y += 1.4; status = 'Traffic follows the chosen path to network 7'; }
    if (p >= .6 && p < .92) { setE(S.as[2].material, C.cut, 2); [0, 3].forEach(i => setE(S.as[i].material, C.cut, .8)); [1, 3].forEach(k => setE(S.edgeM[k].material, C.cut, 1.5)); const path = [0, 2], k = (t * .4) % 1; S.bgpPk.visible = true; S.bgpPk.position.copy(S.asPos[0]).lerp(S.asPos[2], k); S.bgpPk.position.y += 1.4; status = 'Network 3 wrongly announces the same addresses: some traffic goes the wrong way'; }
    if (p >= .92) status = 'The bad announcement is withdrawn: traffic flows correctly again';
  }
  function ixp(p, t) { S.ixPk.stream(p > .5 ? [S.ixCurves[0], S.ixCurves[1]] : S.ixCurves, t, .5); setE(S.fabric.material, C.cyan, 1 + .5 * Math.sin(t * 4)); status = p > .5 ? 'Two local networks swap traffic in the same building' : ''; }
  function cable(p, t) {
    const ex = seg(p, 0, .45); S.layers.forEach((l, i) => { l.position.y = 1.5 + 0; l.position.z = 0; }); void ex;
    if (p >= .5) setE(S.landingSign.material, C.ok, 1.4);
    if (p >= .8) { S.ship.visible = true; S.grapnel.scale.y = Math.max(.01, 1.8 * seg(p, .82, .95)); S.grapnel.position.y = -S.grapnel.scale.y / 2; S.ship.position.y = 1 + Math.sin(t * 1.5) * .06; }
  }
  function tcp(k, t, drop, tryState) {
    const n = 6;
    for (const proto of ['tcp', 'udp']) {
      const z = proto === 'tcp' ? -2 : 2;
      S.lanes[proto].forEach((b2, i) => {
        const id = i + 1, start = i * .1, kk = clamp01((k - start) / .5); b2.visible = kk > 0;
        const lost = id === drop, x = -7.5 + kk * 15;
        if (lost) { if (kk < .45) b2.position.set(x, 1, z); else if (proto === 'tcp' && k > .78) { const r2 = clamp01((k - .78) / .2); b2.position.set(-7.5 + r2 * 15, 1, z); } else { b2.position.set(-7.5 + .45 * 15, 1 - (kk - .45) * 6, z + (kk - .45) * 2); b2.visible = kk < .7; } }
        else b2.position.set(x, 1, z);
        const arrived = lost ? (proto === 'tcp' && k > .97) : kk >= 1; setE(S.slots[proto][i].material, C.ok, arrived ? 1.4 : 0);
      });
    }
    status = k < .5 ? `Packet ${drop} gets lost on the way…` : k < .8 ? 'UDP carries on without it' : 'TCP notices the gap and sends it again: complete and in order';
    void t; void tryState;
  }
  function tls(t) { S.tlsPk.visible = true; for (let i = 0; i < 10; i++) { const x = -8 + ((t * 2 + i * 1.6) % 16); M4.makeTranslation(x, 2, 0); S.tlsPk.setMatrixAt(i, M4); S.tlsPk.setColorAt(i, COL.setHex(Math.abs(x) > 7.5 ? 0xffffff : [0x7b5ce6, 0x2fd47a, 0xff6ad5][(i + Math.floor(t * 6)) % 3])); } S.tlsPk.instanceMatrix.needsUpdate = true; S.tlsPk.instanceColor.needsUpdate = true; }

  return {
    apply,
    status: () => status,
    labels: () => extraLabels,
    /* Camera for a reader's route or cut: look down at the middle of the trip. */
    camFor(tryState) {
      if (!tryState || !['route', 'cut'].includes(tryState.kind)) return null;
      const a = CITIES[tryState.from || 'mumbai'].ll, b2 = CITIES[tryState.to || 'london'].ll;
      const va = vecLL(a, 1), vb = vecLL(b2, 1), m = va.add(vb).normalize();
      const lat = Math.asin(m.y) * 180 / Math.PI, lon = Math.atan2(m.x, m.z) * 180 / Math.PI;
      return { look: [0, 0, 0], view: { az: lon, el: lat, dist: 150 + gcKm(a, b2) / 120 } };
    },
    route
  };
}
export { THREE, POI };
