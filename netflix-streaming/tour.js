/* HOW NETFLIX STREAMS: the tour engine (camera, map, caption, input, scenes).
   Content lives in data.js; pure helpers in core.js. */
import { WORLD, WIRE_TYPES, BADGES, ZONES, WIRES, TIMELINE, SOURCES, STOPS } from './data.js';
import { parseHash, formatHash, makeThrottle, nextIndex, prevIndex, flyCam, flightMs, viewBoxFor, captionOrder } from './core.js';
import { mountGuideDock } from '../shared/guide-dock.js';

const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const root = document.documentElement;
const stage = $('#stage'), camWrap = $('#camWrap'), svg = $('#map'), card = $('#card');
const rmq = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = rmq.matches;
rmq.addEventListener?.('change', e => { reduced = e.matches; root.classList.toggle('rm', reduced); });
root.classList.toggle('rm', reduced);
const SRC_IDS = Object.keys(SOURCES);
const zoneById = Object.fromEntries(ZONES.map(z => [z.id, z]));

/* ---------- analytics hook (the site has no analytics tool; this is the seam to wire one in) ---------- */
window.cookbookEvents = window.cookbookEvents || [];
function track(name, data = {}) {
  const ev = { name, ...data };
  window.cookbookEvents.push(ev);
  window.dispatchEvent(new CustomEvent('cookbook:analytics', { detail: ev }));
}

/* ================= MAP ================= */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const T = (x, y, txt, cls = '', extra = '') => `<text x="${x}" y="${y}" class="${cls}" ${extra}>${esc(txt)}</text>`;
const box = (x, y, w, h, label, cls = 'bx', sub = '') =>
  `<g class="${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/>${T(x + w / 2, y + h / 2 + (sub ? -4 : 11), label, 'bl', 'text-anchor="middle"')}${sub ? T(x + w / 2, y + h / 2 + 30, sub, 'bs', 'text-anchor="middle"') : ''}</g>`;
const leds = (x, y, n, cls = 'led') => Array.from({ length: n }, (_, i) => `<circle class="${cls}" cx="${x + i * 22}" cy="${y}" r="6" style="animation-delay:${(i * 0.37) % 1.6}s"/>`).join('');

function drawZoneArt(z) {
  const { x, y, w, h } = z;
  switch (z.id) {
    case 'home': {
      const caps = ['4K', 'HDR', 'AV1', 'HEVC', 'AVC', 'DRM licence', 'ABR buffer'];
      return `
      <path class="house" d="M${x + 40} ${y + 150} L${x + 380} ${y + 70} L${x + 720} ${y + 150}"/>
      <g class="tv"><rect x="${x + 90}" y="${y + 180}" width="380" height="220" rx="12"/><rect class="scr" x="${x + 106}" y="${y + 196}" width="348" height="188" rx="6"/>
        <path class="play" d="M${x + 258} ${y + 255} l52 35 -52 35z"/><rect x="${x + 250}" y="${y + 400}" width="60" height="22"/></g>
      <g class="router"><rect x="${x + 580}" y="${y + 180}" width="110" height="46" rx="10"/><path d="M${x + 600} ${y + 180} l-14 -60 M${x + 670} ${y + 180} l14 -60"/>${leds(x + 604, y + 203, 4, 'led r')}</g>
      ${T(x + 635, y + 260, 'Router', 'cap', 'text-anchor="middle"')}
      <g class="phone"><rect x="${x + 600}" y="${y + 300}" width="70" height="130" rx="12"/><rect class="scr" x="${x + 608}" y="${y + 314}" width="54" height="96" rx="4"/></g>
      <g id="caps">${caps.map((c, i) => { const cx = x + 40 + (i % 4) * 170, cy = y + 460 + Math.floor(i / 4) * 50; return `<g class="capb" style="--d:${i * 0.18}s"><rect x="${cx}" y="${cy - 30}" width="${c.length > 5 ? 160 : 110}" height="40" rx="20"/>${T(cx + (c.length > 5 ? 80 : 55), cy - 3, c, 'cb', 'text-anchor="middle"')}</g>`; }).join('')}</g>`;
    }
    case 'isp': return `
      <g class="rack"><rect x="${x + 50}" y="${y + 190}" width="120" height="420" rx="8"/><rect x="${x + 190}" y="${y + 190}" width="120" height="420" rx="8"/>
        ${[0, 1].map(r => [0, 1, 2, 3, 4, 5].map(u => `<rect class="${u === 0 ? 'oca' : 'unit'}" x="${x + 60 + r * 140}" y="${y + 215 + u * 64}" width="100" height="48" rx="5"/>`).join('')).join('')}
        ${leds(x + 75, y + 263, 3, 'led t')}${leds(x + 215, y + 263, 3, 'led t')}</g>
      ${T(x + 180, y + 650, 'Embedded OCAs', 'cap', 'text-anchor="middle"')}
      <g class="bldg"><rect x="${x + 360}" y="${y + 130}" width="360" height="500" rx="10"/>${Array.from({ length: 12 }, (_, i) => `<rect class="win" x="${x + 395 + (i % 4) * 80}" y="${y + 290 + Math.floor(i / 4) * 95}" width="46" height="56" rx="4"/>`).join('')}</g>
      ${box(x + 390, y + 92, 180, 66, 'ISP router', 'bx sm')}`;
    case 'ix': return `
      <g class="fabric"><rect x="${x + 60}" y="${y + 120}" width="660" height="70" rx="12"/>${Array.from({ length: 24 }, (_, i) => `<rect class="port" x="${x + 80 + i * 26}" y="${y + 140}" width="16" height="30" rx="3"/>`).join('')}</g>
      ${T(x + 390, y + 230, 'Exchange switching fabric · peering', 'cap', 'text-anchor="middle"')}
      ${[0, 1, 2].map(i => `<g class="sto"><rect x="${x + 70 + i * 220}" y="${y + 270}" width="200" height="120" rx="10"/>${T(x + 170 + i * 220, y + 322, 'Storage OCA', 'bl s', 'text-anchor="middle"')}${leds(x + 125 + i * 220, y + 360, 5, 'led t')}</g>`).join('')}
      ${['ISP A', 'ISP B', 'ISP C'].map((t, i) => `<g class="pill"><rect x="${x + 90 + i * 220}" y="${y + 470}" width="160" height="56" rx="28"/>${T(x + 170 + i * 220, y + 507, t, 'cb', 'text-anchor="middle"')}</g>`).join('')}`;
    case 'aws': {
      const svc = ['Entitlement', 'Profiles', 'Playback', 'Licensing', 'Recommend.', 'Billing', 'Steering'];
      const data = [['EVCache', 'cache'], ['Cassandra', 'database'], ['Keystone', 'Kafka events'], ['S3', 'media origin']];
      const plat = [['Titus', 'containers'], ['Spinnaker', 'deploys'], ['Chaos Monkey', 'breaks things on purpose']];
      return `
      ${['A', 'B', 'C'].map((r, i) => `<g class="region" id="region${r}"><rect x="${x + 20 + i * 300}" y="${y + 60}" width="270" height="64" rx="12"/>${T(x + 155 + i * 300, y + 102, 'Region ' + r, 'cb', 'text-anchor="middle"')}</g>`).join('')}
      ${T(x + 960, y + 102, 'Active-active: any healthy region can serve you', 'cap')}
      ${box(x + 20, y + 170, 1880, 82, 'ZUUL · edge gateway: routing · security · load shedding · failover', 'bx zuul')}
      ${svc.map((s, i) => box(x + 20 + i * 271, y + 332, 251, 164, s, 'bx svc' + (s === 'Steering' ? ' steer' : s === 'Playback' ? ' pb' : ''))).join('')}
      ${data.map(([s, sub], i) => box(x + 20 + i * 475, y + 560, 455, 120, s, 'bx dat' + (s === 'S3' ? ' s3' : ''), sub)).join('')}
      ${plat.map(([s, sub], i) => box(x + 20 + i * 470, y + 740, 450, 120, s, 'bx plat' + (i === 2 ? ' chaos' : ''), sub)).join('')}`;
    }
    case 'enc': {
      const shots = Array.from({ length: 8 }, (_, i) => `<rect class="shot" x="${x + 60 + i * 82}" y="${y + 230}" width="70" height="50" rx="4" style="--d:${i * 0.08}s"/>`).join('');
      const encs = Array.from({ length: 12 }, (_, i) => `<rect class="encu" x="${x + 60 + (i % 6) * 110}" y="${y + 350 + Math.floor(i / 6) * 70}" width="94" height="54" rx="8" style="--d:${0.6 + i * 0.07}s"/>`).join('');
      const bars = [0.35, 0.8, 0.5, 0.95, 0.3, 0.65, 0.45, 0.85].map((v, i) => `<rect class="sbar" x="${x + 60 + i * 50}" y="${y + 900 - 200 * v}" width="36" height="${200 * v}" rx="4" style="--d:${1.4 + i * 0.1}s"/>`).join('');
      const ladder = [['AV1', 4], ['HEVC', 3], ['AVC', 2]].map(([c, n], j) => Array.from({ length: n }, (_, k) => `<rect class="rung" x="${x + 500 + j * 70}" y="${y + 880 - k * 52}" width="56" height="40" rx="6" style="--d:${1.8 + (j * 4 + k) * 0.08}s"/>`).join('') + T(x + 528 + j * 70, y + 950, c, 'cb s', 'text-anchor="middle"')).join('');
      return `
      ${box(x + 60, y + 90, 640, 90, 'Studio master', 'bx master')}
      ${T(x + 60, y + 215, 'Split into shots', 'cap')}${shots}
      ${T(x + 60, y + 335, 'Parallel encodes on Cosmos (AWS EC2)', 'cap')}${encs}
      <g class="vmaf"><rect x="${x + 60}" y="${y + 520}" width="640" height="56" rx="28"/><rect class="vfill" x="${x + 60}" y="${y + 520}" width="640" height="56" rx="28"/>${T(x + 380, y + 557, 'VMAF quality check', 'cb', 'text-anchor="middle"')}</g>
      ${T(x + 60, y + 660, 'Bitrate per shot', 'cap')}${bars}
      ${T(x + 500, y + 660, 'Quality ladder', 'cap')}${ladder}`;
    }
    case 'live': return `
      <g class="venue"><path d="M${x + 60} ${y + 420} Q ${x + 230} ${y + 220} ${x + 400} ${y + 420} Z"/><path class="ring" d="M${x + 110} ${y + 420} Q ${x + 230} ${y + 280} ${x + 350} ${y + 420}"/>
        <rect x="${x + 200}" y="${y + 360}" width="60" height="60"/>${T(x + 230, y + 470, 'Venue', 'cap', 'text-anchor="middle"')}<circle class="rec" cx="${x + 360}" cy="${y + 260}" r="14"/></g>
      ${box(x + 640, y + 120, 320, 180, 'Cloud live', 'bx lenc', 'encoding · AWS')}
      ${box(x + 440, y + 540, 300, 120, 'Live Origin', 'bx origin', 'on EC2')}
      <g id="liveHud" class="hud"><rect x="${x + 40}" y="${y + 560}" width="360" height="150" rx="16"/>${T(x + 220, y + 625, '0', 'num', 'text-anchor="middle" id="liveNum"')}${T(x + 220, y + 680, 'peak concurrent streams', 'cb s', 'text-anchor="middle"')}</g>`;
    case 'time': {
      const n = TIMELINE.length, x0 = x + 680, x1 = x + w - 240, ay = y + 200;
      return `<line class="axis" x1="${x + 40}" y1="${ay}" x2="${x + w - 40}" y2="${ay}"/>` + TIMELINE.map((e, i) => {
        const ex = x0 + i * (x1 - x0) / (n - 1), up = i % 2 === 0, ty = up ? y + 70 : y + 270;
        const words = e.text.split(' '), rows = ['']; words.forEach(wd => { if ((rows[rows.length - 1] + ' ' + wd).length > 24) rows.push(wd); else rows[rows.length - 1] += (rows[rows.length - 1] ? ' ' : '') + wd; });
        return `<g class="ev" data-stop="${e.stop}" style="--d:${(i % 6) * 0.35}s"><line x1="${ex}" y1="${ay}" x2="${ex}" y2="${up ? ty + 30 : ty - 40}"/><circle cx="${ex}" cy="${ay}" r="14"/>
          ${T(ex + 22, up ? ty - 8 : ty - 8, e.year, 'yr')}${rows.map((r, k) => T(ex + 22, ty + 30 + k * 38, r, 'et')).join('')}</g>`;
      }).join('');
    }
  }
  return '';
}

function buildMap() {
  const types = Object.keys(WIRE_TYPES);
  let s = `<defs>
    <pattern id="dots" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2.2" fill="currentColor"/></pattern>
    <radialGradient id="glowR" r=".6"><stop offset="0" stop-color="#ff5a4e" stop-opacity=".22"/><stop offset="1" stop-color="#ff5a4e" stop-opacity="0"/></radialGradient>
  </defs>
  <rect class="ground" x="-4000" y="-3000" width="${WORLD.w + 8000}" height="${WORLD.h + 6000}" fill="url(#dots)"/>
  <ellipse cx="2000" cy="1250" rx="2200" ry="1500" fill="url(#glowR)"/>
  <g id="zones">`;
  for (const z of ZONES) {
    s += `<g class="zone" id="z-${z.id}" data-zone="${z.id}">
      <rect class="zbg" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="34"/>
      ${T(z.x + 34, z.y + 58, z.label, 'zl')}
      ${T(z.x + 34, z.y - 24, z.dc, 'zdc')}
      <g class="art">${drawZoneArt(z)}</g></g>`;
  }
  s += `</g><path id="backbone" class="backbone" d="M2950 760 C 3050 1050 2900 1150 2760 1250"/>${T(2930, 1080, 'Netflix backbone', 'bbl')}
    <rect id="siteRing" class="ring" rx="40"/><g id="wires">`;
  for (const w of WIRES) s += `<g class="wire w-${w.type}" id="w-${w.id}"><path class="wbase" d="${w.d}"/><path class="wglow" d="${w.d}"/><g class="dots"></g></g>`;
  s += `</g><g id="sceneLayer"></g>`;
  svg.innerHTML = s;
  for (const w of WIRES) w.el = $('#w-' + w.id);
  void types;
}
/* Sample a wire the first time it is used, so animating its dots is a cheap lookup. */
function sampleWire(w) {
  if (w.pts) return;
  const p = w.el.querySelector('.wbase'), L = p.getTotalLength(), N = 120;
  w.len = L; w.pts = Array.from({ length: N + 1 }, (_, i) => { const q = p.getPointAtLength(L * i / N); return [q.x, q.y]; });
  const n = Math.max(3, Math.min(10, Math.round(L / 200)));
  w.el.querySelector('.dots').innerHTML = Array.from({ length: n }, () => `<circle r="${w.type === 'video' ? 13 : 10}"/>`).join('');
  w.dots = [...w.el.querySelectorAll('.dots circle')];
}

/* ================= MINIMAP ================= */
const mini = $('#mini');
function buildMini() {
  mini.querySelector('svg').innerHTML = ZONES.map(z => `<rect class="mz" data-zone="${z.id}" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="40"/>`).join('') + `<rect id="miniView" class="mv" rx="30"/>`;
}

/* ================= STATE ================= */
let cur = 0, cam = { ...STOPS[0].cam }, flight = null, vb = [0, 0, WORLD.w, WORLD.h];
let dcView = false, textMode = false, autoOn = false, autoTimer = 0, completed = false;
let typeJob = 0, sceneCleanup = null;
const throttle = makeThrottle(750);

function freeArea() {
  const sr = stage.getBoundingClientRect(), cr = card.getBoundingClientRect();
  const br = $('.bar').getBoundingClientRect(), kr = $('.ctrl').getBoundingClientRect();
  const top = (br.height ? br.bottom - sr.top : 0) + 12, bottom = (kr.height ? kr.top - sr.top : sr.height) - 12;
  const hasCard = cr.width > 0 && cr.height > 0;
  if (sr.width < 760) return { x: 12, y: top, w: sr.width - 24, h: Math.max(120, (hasCard ? cr.top - sr.top : bottom) - 12 - top) };
  const left = hasCard ? cr.right - sr.left + 16 : 16;
  return { x: left, y: top, w: Math.max(200, sr.width - left - 16), h: Math.max(120, bottom - top) };
}

let camDirty = true;
function applyCam(c) {
  const sr = stage.getBoundingClientRect();
  vb = viewBoxFor(c, WORLD, freeArea(), { w: sr.width, h: sr.height });
  svg.setAttribute('viewBox', vb.map(v => v.toFixed(1)).join(' '));
  const mv = $('#miniView');
  if (mv) { mv.setAttribute('x', vb[0]); mv.setAttribute('y', vb[1]); mv.setAttribute('width', vb[2]); mv.setAttribute('height', vb[3]); }
}

/* ================= RENDER LOOP ================= */
let raf = 0, lastNow = 0, dotsDirty = true;
function frame(now) {
  raf = requestAnimationFrame(frame);
  lastNow = now;
  // The camera only moves during a flight; the idle drift is a CSS animation (compositor only).
  if (flight) {
    const t = Math.min(1, (now - flight.t0) / flight.ms);
    cam = flyCam(flight.a, flight.b, t, WORLD);
    const k = Math.sin(Math.PI * t), tiltX = 7 * k, tiltY = -5 * k * Math.sign(flight.b.x - flight.a.x || 1);
    camWrap.style.transform = `perspective(1800px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) scale(1.06)`;
    camDirty = true;
    if (t >= 1) { cam = { ...flight.b }; flight = null; stage.classList.remove('flying'); camWrap.style.transform = ''; arrive(); }
  }
  if (camDirty) { applyCam(cam); camDirty = false; }
  if (reduced && !dotsDirty) return;
  dotsDirty = false;
  // Moving dots along active wires.
  const sec = now / 1000;
  for (const w of WIRES) {
    if (!w.on) continue;
    sampleWire(w);
    const speed = (w.type === 'video' ? 520 : 380) / w.len;
    w.dots.forEach((d, i) => {
      const u = reduced ? (i + .5) / w.dots.length : ((sec * speed + i / w.dots.length) % 1);
      const p = w.pts[Math.round(u * (w.pts.length - 1))];
      d.setAttribute('cx', p[0]); d.setAttribute('cy', p[1]);
    });
  }
}
function startLoop() { if (!raf) raf = requestAnimationFrame(frame); }
function stopLoop() { cancelAnimationFrame(raf); raf = 0; }
document.addEventListener('visibilitychange', () => document.hidden ? stopLoop() : startLoop());

/* ================= CAPTION ================= */
const srcNum = id => SRC_IDS.indexOf(id) + 1;
const charSpans = t => [...t].map(ch => `<span class="c">${esc(ch)}</span>`).join('');
function renderCard(s, instant) {
  const legend = s.chips.map(c => `<li class="chip k-${c}"><i aria-hidden="true"></i>${esc(WIRE_TYPES[c].name)}</li>`).join('');
  const table = s.dc.table ? `<table class="where"><caption class="sr-only">Where it runs</caption><tbody>${s.dc.table.map(([a, b]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</tbody></table>` : '';
  const [o1, o2] = captionOrder(dcView);
  card.innerHTML = `
    <p class="eyebrow"><span class="n">${String(s.id).padStart(2, '0')}</span><span>/ ${STOPS.length}</span> · ${esc(s.eyebrow)}</p>
    <h2 class="title" id="cardTitle">${esc(s.title)}</h2>
    <div class="blocks">
      <div class="main" style="order:${o1 === 'main' ? 0 : 1}">${s.lines.map(l => `<p class="ln t">${charSpans(l)}</p>`).join('')}<div class="scene" id="sceneUi"></div></div>
      <section class="dcb k-${s.tint}" style="order:${o1 === 'dc' ? 0 : 1}" aria-label="Data-center role">
        <p class="dch"><span class="lab">Data-center role</span><span class="badge">📍 ${esc(BADGES[s.dc.badge])}</span></p>
        <p class="t">${charSpans(s.dc.text)}</p>${table}
      </section>
    </div>
    <ul class="legend" aria-label="Legend">${legend}</ul>
    <p class="srcs">Sources: ${s.src.map(id => `<a href="${SOURCES[id].u}" target="_blank" rel="noopener" title="${esc(SOURCES[id].t)}">[${srcNum(id)}]</a>`).join(' ')} · <button class="linkish" data-open-sources>all sources</button></p>
    <p class="tm">Independent explainer · Netflix is a trademark of Netflix, Inc. Not affiliated.</p>`;
  card.scrollTop = 0;
  card.querySelector('[data-open-sources]').onclick = openSources;
  typeOut(instant || reduced);
}

function typeOut(instant) {
  const job = ++typeJob;
  const blocks = [...card.querySelectorAll('.blocks > *')].sort((a, b) => a.style.order - b.style.order);
  const groups = blocks.flatMap(b => [...b.querySelectorAll('.t')].map(t => ({ t, dc: b.classList.contains('dcb') })));
  const finishDc = () => { pulseSite(); };
  if (instant) { card.querySelectorAll('.c').forEach(c => c.classList.add('on')); card.classList.add('typed'); finishDc(); return; }
  card.classList.remove('typed');
  let gi = 0, ci = 0, dcStarted = false;
  const step = () => {
    if (job !== typeJob) return;
    const g = groups[gi]; if (!g) { card.classList.add('typed'); return; }
    if (g.dc && !dcStarted) { dcStarted = true; finishDc(); }
    const cs = g.t.querySelectorAll('.c');
    for (let k = 0; k < 3 && ci < cs.length; k++) cs[ci++].classList.add('on');
    if (ci >= cs.length) { gi++; ci = 0; setTimeout(step, 140); } else setTimeout(step, 14);
  };
  step();
}
function finishTyping() { typeJob++; card.querySelectorAll('.c').forEach(c => c.classList.add('on')); card.classList.add('typed'); }
card.addEventListener('click', e => { if (!e.target.closest('button,a')) finishTyping(); });

function pulseSite() {
  const r = $('#siteRing'); r.classList.remove('pulse'); void r.getBBox(); r.classList.add('pulse');
}

/* ================= MAP STATE PER STOP ================= */
function setMapState(s) {
  const all = s.active.includes('*');
  document.querySelectorAll('#zones .zone').forEach(g => g.classList.toggle('dim', !all && !s.active.includes(g.dataset.zone)));
  document.querySelectorAll('#mini .mz').forEach(g => g.classList.toggle('on', all || s.active.includes(g.dataset.zone)));
  for (const w of WIRES) { w.on = s.wires.includes(w.id); w.el.classList.toggle('on', w.on); }
  dotsDirty = true; camDirty = true;
  const z = zoneById[s.site], r = $('#siteRing'), pad = 18;
  r.setAttribute('x', z.x - pad); r.setAttribute('y', z.y - pad); r.setAttribute('width', z.w + pad * 2); r.setAttribute('height', z.h + pad * 2);
  r.setAttribute('class', 'ring k-' + s.tint);
  $('#backbone').classList.toggle('on', s.wires.includes('s3Ix'));
}

/* ================= NAVIGATION ================= */
function go(i, { instant = false, source = 'nav', keepCard = false } = {}) {
  if (i == null || i < 0 || i >= STOPS.length) return;
  const changed = i !== cur || instant;
  if (!changed) return;
  if (sceneCleanup) { sceneCleanup(); sceneCleanup = null; }
  const prev = cur; cur = i;
  const s = STOPS[i];
  setMapState(s); if (!keepCard) renderCard(s, instant); updateControls();
  if (formatHash(i) !== location.hash) history.replaceState(null, '', formatHash(i));
  if (instant || reduced) { flight = null; cam = { ...s.cam }; stage.classList.remove('flying'); arrive(); }
  else { flight = { a: { ...cam }, b: { ...s.cam }, t0: performance.now(), ms: flightMs(cam, s.cam, WORLD) }; stage.classList.add('flying'); }
  try { localStorage.setItem('cookbook:netflix-streaming', JSON.stringify({ id: 'stop-' + s.id, num: String(s.id).padStart(2, '0'), title: s.title })); } catch (e) { /* storage blocked: fine */ }
  void prev; void source;
}
/* ================= THE GUIDE (reads each stop aloud; Display menu: guide, text, voice) ================= */
const stopText = s => `${s.title}. ${s.lines.join(' ')} Data-center role: ${s.dc.text}`;
const dock = mountGuideDock({ displayButton: $('#bDisplay'), track, onListen: () => dock.read('stop-' + cur + '-' + Date.now(), stopText(STOPS[cur])) });
root.classList.add('tour-page');
window.__dock = dock;

function arrive() {
  const s = STOPS[cur];
  dock.read('stop-' + s.id, stopText(s));
  track('stop_view', { n: s.id });
  if (s.id === STOPS.length && !completed) { completed = true; track('tour_complete'); }
  runScene(s);
  scheduleAuto();
}
const next = () => go(nextIndex(cur, STOPS.length));
const prev = () => go(prevIndex(cur));

function updateControls() {
  document.querySelectorAll('#rail button').forEach((b, k) => { if (k === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.classList.toggle('done', k < cur); });
  document.querySelectorAll('#railBar i').forEach((b, k) => { b.classList.toggle('cur', k === cur); b.classList.toggle('done', k < cur); });
  const last = cur === STOPS.length - 1;
  $('#bNext').innerHTML = last ? '<span aria-hidden="true">↺</span> Restart' : 'Next <span aria-hidden="true">›</span>';
  $('#bNext').setAttribute('aria-label', last ? 'Restart the tour' : 'Next stop');
  $('#bPrev').disabled = cur === 0;
  $('#count').textContent = `${cur + 1} / ${STOPS.length}`;
}

/* ---------- auto tour ---------- */
function scheduleAuto() {
  clearTimeout(autoTimer);
  if (!autoOn) return;
  const tick = () => {
    if (dock.guide.busy()) { autoTimer = setTimeout(tick, 1000); return; } // wait for the guide to finish
    if (cur === STOPS.length - 1) { setAuto(false); return; }
    next();
  };
  autoTimer = setTimeout(tick, 10000);
}
function setAuto(on) {
  autoOn = on; const b = $('#bAuto'); b.setAttribute('aria-pressed', on);
  b.querySelector('.t').textContent = on ? 'Pause tour' : 'Auto tour';
  b.querySelector('.i').textContent = on ? '❚❚' : '▶';
  track('auto_tour_toggle', { on });
  if (on && cur === STOPS.length - 1) go(0); else scheduleAuto();
}

/* ================= SCENES ================= */
const later = (fn, ms) => { const t = setTimeout(fn, reduced ? 0 : ms); return () => clearTimeout(t); };
function runScene(s) {
  const ui = $('#sceneUi'); if (!ui) return;
  const offs = [];
  const add = f => offs.push(f);
  switch (s.scene) {
    case 'device': $('#caps').classList.add('play'); add(() => $('#caps').classList.remove('play')); break;
    case 'encode': $('#z-enc').classList.add('play'); add(() => $('#z-enc').classList.remove('play')); break;
    case 'oca': $('#z-isp').classList.add('busy'); add(() => $('#z-isp').classList.remove('busy')); break;
    case 'fill': {
      root.classList.add('night');
      ui.innerHTML = `<div class="moon" aria-hidden="true"><span>☾</span><div class="clock"><i></i></div></div><p class="note">Fill window: off-peak hours, when the network is quiet.</p>`;
      add(() => root.classList.remove('night'));
      break;
    }
    case 'timeline': {
      document.querySelectorAll('#z-time .ev').forEach(e => e.classList.toggle('lit', +e.dataset.stop === s.id));
      add(() => document.querySelectorAll('#z-time .ev').forEach(e => e.classList.remove('lit')));
      break;
    }
    case 'failover': {
      ui.innerHTML = `<div class="tryit"><button class="btn red" id="failBtn"><span aria-hidden="true">⚡</span> Fail Region A</button><p class="note" id="failNote" aria-live="polite">Members are served by their nearest healthy region.</p></div>`;
      const A = $('#regionA'), B = $('#regionB');
      A.classList.add('serving');
      let undo = null;
      $('#failBtn').onclick = () => {
        if (A.classList.contains('down')) return;
        A.classList.remove('serving'); A.classList.add('down'); B.classList.add('serving');
        $('#failNote').textContent = 'Region A is down. DNS is overridden and Zuul sends members to Region B. Nobody’s show stops.';
        $('#failBtn').disabled = true;
        undo = later(() => { A.classList.remove('down'); A.classList.add('serving'); B.classList.remove('serving'); $('#failNote').textContent = 'Region A is back. Netflix rehearses this regularly.'; $('#failBtn').disabled = false; }, 5000);
      };
      add(() => { undo && undo(); A.classList.remove('down', 'serving'); B.classList.remove('serving'); });
      break;
    }
    case 'abr': {
      ui.innerHTML = `<div class="abr" aria-label="Adaptive bitrate simulation (illustration)">
        <div class="abr-top"><canvas id="abrC" width="560" height="150" aria-hidden="true"></canvas>
          <ol class="ladder" id="ladder" aria-label="Quality ladder">${['4K', 'Full HD', 'HD', 'SD', 'Low'].map(q => `<li>${q}</li>`).join('')}</ol></div>
        <div class="buf"><span>Buffer</span><div class="meter"><i id="bufI"></i></div></div>
        <div class="tryit"><button class="btn" id="thrBtn" aria-pressed="false">📶 Throttle my Wi-Fi</button><button class="btn red" id="ocaBtn">✖ Fail this OCA</button></div>
        <p class="note" id="abrNote" aria-live="polite">Streaming from URL #1: the OCA inside your ISP.</p>
        <p class="ill">Illustration · no real numbers</p></div>`;
      const cv = $('#abrC'), cx = cv.getContext('2d'), hist = [];
      let bw = .9, target = .9, buf = .7, rung = 0, t0 = performance.now(), on = true, url = 1, outage = 0;
      const rungFor = b => b > .78 ? 0 : b > .6 ? 1 : b > .42 ? 2 : b > .25 ? 3 : 4;
      $('#thrBtn').onclick = e => { const p = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', p); target = p ? .3 : .9; $('#abrNote').textContent = p ? 'Bandwidth drops. ABR steps down the ladder so the buffer doesn’t run dry.' : 'Bandwidth is back. ABR climbs the ladder again.'; };
      $('#ocaBtn').onclick = () => {
        if (url === 2) return; url = 2; outage = 1.2;
        $('#w-ispHome').classList.add('broken');
        WIRES.find(w => w.id === 'ispHome').on = false; $('#w-ispHome').classList.remove('on');
        $('#abrNote').textContent = 'The OCA stopped answering. The player moves to URL #2, a storage OCA at the internet exchange. The buffer covers the gap.';
        $('#ocaBtn').disabled = true;
      };
      const tick = () => {
        if (!on) return;
        const now = performance.now(), dt = Math.min(.1, (now - t0) / 1000); t0 = now;
        bw += (target - bw) * dt * 1.5 + (Math.random() - .5) * .02; if (outage > 0) { outage -= dt; bw = Math.max(0, bw - dt * 3); } else if (url === 2) bw += (target * .92 - bw) * dt;
        const want = rungFor(bw); if (want !== rung) rung = want;
        const need = [.85, .65, .47, .3, .15][rung]; buf = Math.max(0, Math.min(1, buf + (bw - need) * dt * .8));
        hist.push(bw); if (hist.length > 140) hist.shift();
        const W = cv.width, H = cv.height; cx.clearRect(0, 0, W, H);
        cx.strokeStyle = 'rgba(255,255,255,.08)'; cx.lineWidth = 1; [.25, .5, .75].forEach(g => { cx.beginPath(); cx.moveTo(0, H * g); cx.lineTo(W, H * g); cx.stroke(); });
        cx.strokeStyle = '#2dd4bf'; cx.lineWidth = 3; cx.beginPath(); hist.forEach((v, i) => { const X = i / 139 * W, Y = H - Math.max(0, Math.min(1, v)) * H * .7 - 8; i ? cx.lineTo(X, Y) : cx.moveTo(X, Y); }); cx.stroke();
        cx.fillStyle = '#a99d93'; cx.font = '600 20px Inter, sans-serif'; cx.fillText('connection speed', 10, 24);
        document.querySelectorAll('#ladder li').forEach((li, k) => li.classList.toggle('on', k === rung));
        $('#bufI').style.width = (buf * 100).toFixed(0) + '%';
        if (!reduced) requestAnimationFrame(tick); else setTimeout(tick, 250);
      };
      tick();
      add(() => { on = false; $('#w-ispHome').classList.remove('broken'); });
      break;
    }
    case 'live': {
      const el = $('#liveNum'), hud = $('#liveHud'), target = 65000000; hud.classList.add('show');
      ui.innerHTML = `<p class="note">Counter: the 65 million peak Netflix reported for Tyson vs. Paul, November 2024.</p>`;
      if (reduced) el.textContent = target.toLocaleString('en-US');
      else { const t0 = performance.now(); let on = true; const tick = () => { if (!on) return; const k = Math.min(1, (performance.now() - t0) / 2600), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(target * e).toLocaleString('en-US'); if (k < 1) requestAnimationFrame(tick); }; tick(); add(() => { on = false; }); }
      add(() => hud.classList.remove('show'));
      break;
    }
  }
  sceneCleanup = () => offs.forEach(f => f());
}

/* ================= INPUT ================= */
const gesture = dir => { if (textMode || $('#srcDlg').open) return; if (!throttle()) return; dir > 0 ? next() : prev(); };
function cardCanScroll(dir) {
  if (card.scrollHeight <= card.clientHeight + 2) return false;
  return dir > 0 ? card.scrollTop + card.clientHeight < card.scrollHeight - 2 : card.scrollTop > 2;
}
stage.addEventListener('wheel', e => {
  if (textMode) return;
  const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (e.target.closest('#card') && cardCanScroll(Math.sign(d))) return; // let the caption scroll
  e.preventDefault();
  if (e.ctrlKey) { if (Math.abs(d) > 2) gesture(d < 0 ? 1 : -1); return; } // trackpad pinch: out = next
  if (Math.abs(d) > 12) gesture(Math.sign(d));
}, { passive: false });

let tStart = null;
stage.addEventListener('touchstart', e => {
  const inCard = !!e.target.closest('#card'), pts = [...e.touches].map(t => [t.clientX, t.clientY]);
  tStart = { pts, inCard, top: card.scrollTop, dist: pts.length > 1 ? Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) : 0, pinch: 0 };
}, { passive: true });
stage.addEventListener('touchmove', e => {
  if (!tStart) return;
  if (e.touches.length > 1 && tStart.dist) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); tStart.pinch = d / tStart.dist; e.preventDefault(); }
  else if (!tStart.inCard) e.preventDefault();
}, { passive: false });
stage.addEventListener('touchend', e => {
  if (!tStart || e.touches.length) return;
  const s = tStart; tStart = null;
  if (s.pinch) { if (s.pinch > 1.2) gesture(1); else if (s.pinch < .83) gesture(-1); return; }
  const t = e.changedTouches[0], dx = t.clientX - s.pts[0][0], dy = t.clientY - s.pts[0][1];
  if (s.inCard && (Math.abs(card.scrollTop - s.top) > 2 || Math.abs(dy) > Math.abs(dx))) return; // was scrolling the caption
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return;
  const v = Math.abs(dx) > Math.abs(dy) ? dx : dy;
  gesture(v < 0 ? 1 : -1);
});

let drag = null;
camWrap.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) { drag = { x: e.clientX, y: e.clientY }; camWrap.classList.add('grab'); } });
addEventListener('pointerup', e => {
  if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = null; camWrap.classList.remove('grab');
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 60) return;
  const v = Math.abs(dx) > Math.abs(dy) ? dx : dy; gesture(v < 0 ? 1 : -1);
});

document.addEventListener('keydown', e => {
  if (textMode || $('#srcDlg').open || e.altKey || e.ctrlKey || e.metaKey) return;
  const tag = e.target.tagName, onCtl = /^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(tag);
  const k = e.key;
  if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(k) || (k === ' ' && !onCtl)) { e.preventDefault(); gesture(1); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(k)) { e.preventDefault(); gesture(-1); }
  else if (k === 'Home') { e.preventDefault(); if (throttle()) go(0); }
  else if (k === 'End') { e.preventDefault(); if (throttle()) go(STOPS.length - 1); }
});

addEventListener('hashchange', () => { const i = parseHash(location.hash, STOPS.length); if (i != null && i !== cur) go(i); });
addEventListener('resize', () => { camDirty = true; });
if (window.ResizeObserver) new ResizeObserver(() => { camDirty = true; }).observe(card);

/* ================= CONTROLS ================= */
function buildRail() {
  $('#rail').innerHTML = STOPS.map((s, k) => `<li><button aria-label="Stop ${s.id}: ${esc(s.title)}" title="${s.id}. ${esc(s.title)}"><i></i></button></li>`).join('');
  document.querySelectorAll('#rail button').forEach((b, k) => b.onclick = () => go(k));
  // Phones: one wide touch strip instead of 15 tiny buttons (Prev/Next stay the accessible controls).
  const bar = $('#railBar');
  bar.innerHTML = STOPS.map(() => '<i></i>').join('');
  bar.onclick = e => { const r = bar.getBoundingClientRect(); go(Math.max(0, Math.min(STOPS.length - 1, Math.floor((e.clientX - r.left) / r.width * STOPS.length)))); };
}
$('#bPrev').onclick = prev;
$('#bNext').onclick = () => { if (cur === STOPS.length - 1) go(0); else next(); };
$('#bAuto').onclick = () => setAuto(!autoOn);
$('#bDc').onclick = () => {
  dcView = !dcView; root.classList.toggle('dcview', dcView); $('#bDc').setAttribute('aria-pressed', dcView);
  const [o1] = captionOrder(dcView);
  card.querySelector('.main').style.order = o1 === 'main' ? 0 : 1; card.querySelector('.dcb').style.order = o1 === 'dc' ? 0 : 1;
  pulseSite();
};
$('#bText').onclick = () => setText(!textMode);
document.querySelectorAll('[data-back-to-map]').forEach(b => b.onclick = () => setText(false));
function setText(on) {
  textMode = on; root.classList.toggle('textmode', on); $('#bText').setAttribute('aria-pressed', on);
  $('#bText').querySelector('.t').textContent = on ? 'Back to map' : 'Read as text';
  track('read_as_text', { on });
  if (on) { setAuto && autoOn && setAuto(false); stopLoop(); const h = document.getElementById('t-stop-' + (cur + 1)); h && h.scrollIntoView({ block: 'start' }); $('#text h2')?.focus?.(); }
  else { scrollTo(0, 0); startLoop(); camDirty = true; }
}
const dlg = $('#srcDlg');
function openSources() { dlg.showModal(); }
$('#bSrc').onclick = openSources;
dlg.querySelector('[data-close]').onclick = () => dlg.close();
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
mini.addEventListener('click', e => {
  const r = mini.querySelector('svg').getBoundingClientRect(), wx = (e.clientX - r.left) / r.width * WORLD.w, wy = (e.clientY - r.top) / r.height * WORLD.h;
  let best = 0, bd = Infinity; STOPS.forEach((s, k) => { const d = Math.hypot(s.cam.x - wx, s.cam.y - wy) * s.cam.zoom ** .3; if (d < bd) { bd = d; best = k; } });
  go(best);
});

/* ================= BOOT ================= */
buildMap(); buildMini(); buildRail();
root.classList.add('ready');
const start = parseHash(location.hash, STOPS.length) ?? 0;
cur = -1;
// Stop 1's caption is already in the HTML (prerendered), so keep it: no re-render on first paint.
go(start, { instant: true, keepCard: start === 0 && !!card.querySelector('.title') });
card.querySelector('[data-open-sources]')?.addEventListener('click', openSources);
track('topic_start', { stop: start + 1 });
startLoop();
