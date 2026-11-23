/* HOW THE INTERNET MOVES DATA: the film player (autoplay, scrubbing, chapters, captions, orbit, "Try it" panels).
   Content: data.js · timeline maths: timeline.js · network maths: net.js · 3D world: world.js (three.js loaded after the first paint). */
import { POI, SOURCES, CHAPTERS, CITIES, LINKS } from './data.js';
import { rttMs, DNS_STEPS } from './net.js';
import { buildTimeline, beatAt, cueProgress, cameraAt, camPos, typedChars, parseHash, fmtTime, resolve } from './timeline.js';

const $ = s => document.querySelector(s);
const root = document.documentElement, stage = $('#stage'), view3d = $('#view3d'), labelLayer = $('#labels');
const rmq = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = rmq.matches; root.classList.toggle('rm', reduced);
rmq.addEventListener?.('change', e => { reduced = e.matches; root.classList.toggle('rm', reduced); });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const IDS = CHAPTERS.map(c => c.id);
const TL = buildTimeline(CHAPTERS, POI);
const srcNum = id => SOURCES.findIndex(s => s.id === id) + 1;

window.cookbookEvents = window.cookbookEvents || [];
function track(name, data = {}) { const ev = { name, ...data }; window.cookbookEvents.push(ev); window.dispatchEvent(new CustomEvent('cookbook:analytics', { detail: ev })); }

/* ================= STATE ================= */
let t = 0, playing = false, speed = 1, captions = true, textMode = false, ended = false;
let orbit = { az: 0, el: 0, zoom: 1 }, orbitBack = null, userTook = false;
let curBeat = -1, curChapter = -1, W = null, completed = false, tryState = null, wasPlaying = false, labelKey = '';

/* ================= UI: scrubber, chapter menu ================= */
const scrub = $('#scrub');
scrub.max = TL.total.toFixed(1);
$('#ticks').innerHTML = TL.chapterStart.map((s, i) => `<button class="tick" style="left:${(s / TL.total * 100).toFixed(3)}%" data-i="${i}" aria-label="Chapter ${i + 1}: ${esc(CHAPTERS[i].title)}" title="${i + 1}. ${esc(CHAPTERS[i].title)}"></button>`).join('');
document.querySelectorAll('#ticks .tick').forEach(b => b.onclick = () => jumpChapter(+b.dataset.i));
$('#chList').innerHTML = CHAPTERS.map((c, i) => `<li><button data-i="${i}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="tt"><b>${esc(c.title)}</b><small>${esc(c.sub)}</small></span><span class="tm">${fmtTime(TL.chapterStart[i])}</span></button></li>`).join('');
document.querySelectorAll('#chList button').forEach(b => b.onclick = () => { $('#chDlg').close(); jumpChapter(+b.dataset.i); });
scrub.addEventListener('input', () => { seek(+scrub.value, { keepPlaying: true }); });

function seek(nt, { keepPlaying = false } = {}) {
  t = Math.max(0, Math.min(TL.total, nt)); ended = false; orbit = { az: 0, el: 0, zoom: 1 }; hideResume();
  if (!keepPlaying && !reduced) setPlaying(true);
  draw(true);
}
const jumpChapter = i => { seek(TL.chapterStart[Math.max(0, Math.min(CHAPTERS.length - 1, i))]); };
const jumpBeat = d => { const i = Math.max(0, Math.min(TL.beats.length - 1, beatAt(TL, t) + d)); seek(TL.beats[i].start); if (reduced) setPlaying(false); };

function setPlaying(on) {
  if (on && tryState) { tryState = null; $('#tryPanel').hidden = true; root.classList.remove('trying'); labelKey = ''; }
  if (on && ended) { t = 0; ended = false; }
  playing = on; root.classList.toggle('playing', on);
  $('#bPlay').innerHTML = on ? '<span aria-hidden="true">❚❚</span>' : '<span aria-hidden="true">▶</span>';
  $('#bPlay').setAttribute('aria-label', on ? 'Pause' : 'Play');
  $('#startCard').classList.toggle('gone', on || t > 0.5);
  if (on) { hideResume(); if (userTook) { orbitBack = { from: { ...orbit }, t0: performance.now() }; userTook = false; } }
  track(on ? 'play' : 'pause', { t: Math.round(t) });
}
function showResume() { $('#resume').hidden = false; }
function hideResume() { $('#resume').hidden = true; }

/* ================= CAPTION, STAT, LABELS ================= */
function renderBeat(i) {
  const b = TL.beats[i], c = CHAPTERS[b.ci];
  $('#capEyebrow').textContent = `${String(b.ci + 1).padStart(2, '0')} · ${c.title}`;
  $('#capLive').textContent = b.text;
  $('#ill').hidden = !b.ill;
  $('#tryBtn').hidden = !b.try; if (tryState) closeTry();
  const cs = $('#capSrc'); if (b.src) { cs.hidden = false; cs.textContent = `Source [${srcNum(b.src)}]`; cs.title = SOURCES[srcNum(b.src) - 1].t; } else cs.hidden = true;
  const st = $('#stat');
  if (b.stat) { st.hidden = false; st.innerHTML = `<b>${esc(b.stat[0])}</b><span>${esc(b.stat[1])}</span>${b.stat[2] ? `<a href="#sources" data-src title="${esc(SOURCES[srcNum(b.stat[2]) - 1].t)}">Source [${srcNum(b.stat[2])}]</a>` : ''}`; st.querySelector('[data-src]')?.addEventListener('click', e => { e.preventDefault(); openSources(); }); }
  else st.hidden = true;
  if (b.ci !== curChapter) {
    curChapter = b.ci;
    $('#ctNum').textContent = `Chapter ${String(b.ci + 1).padStart(2, '0')}`; $('#ctTitle').textContent = c.title; $('#ctSub').textContent = c.sub;
    document.querySelectorAll('#ticks .tick').forEach((tk, k) => tk.classList.toggle('on', k === b.ci));
    if (location.hash !== '#' + c.id && !location.hash.startsWith('#t=')) history.replaceState(null, '', '#' + c.id);
    try { localStorage.setItem('cookbook:internet', JSON.stringify({ id: c.id, num: String(b.ci + 1).padStart(2, '0'), title: c.title })); } catch (e) { /* storage blocked */ }
    track('chapter_view', { n: b.ci + 1 });
  }
}
let labels = [];
function drawCaption(b) {
  const n = reduced ? b.text.length : typedChars(b, t);
  $('#capText').innerHTML = `${esc(b.text.slice(0, n))}<span class="rest" aria-hidden="true">${esc(b.text.slice(n))}</span>`;
  const local = t - TL.chapterStart[b.ci];
  $('#chTitle').classList.toggle('show', local < 3.2 && !reduced && captions);
  $('#tNow').textContent = fmtTime(t); scrub.value = t.toFixed(1);
  scrub.style.setProperty('--pct', (t / TL.total * 100).toFixed(2) + '%');
}

/* ================= DRAW ================= */
let THREE, renderer, scene, camera, world, softGL = false, lastDraw = 0, needDraw = true, clock = 0;
const v3 = { x: 0, y: 0, z: 0 };
function setLabels(list) {
  const key = list.map(l => l[0] + l[1]).join('|'); if (key === labelKey) return; labelKey = key;
  labelLayer.innerHTML = ''; labels = list.map(([text, p]) => { const el = document.createElement('span'); el.className = 'lbl3'; el.textContent = text; labelLayer.appendChild(el); return { el, pos: resolve(p, POI) }; });
}
function draw(force) {
  const i = beatAt(TL, t), b = TL.beats[i];
  if (i !== curBeat) { curBeat = i; renderBeat(i); }
  drawCaption(b);
  if (!W) return;
  const p = cueProgress(b, t);
  world.apply(b, p, tryState ? clock : t, tryState);
  const st = world.status(); $('#status').hidden = !st; if (st) $('#status').textContent = st;
  if (tryState) updateTry();
  setLabels((b.labels || []).concat(world.labels()));
  // camera: timeline path + reader's orbit (which eases back after Resume)
  const cam = (tryState && world.camFor(tryState)) || cameraAt(TL, tryState ? b.start + 3 : t, !reduced);
  let o = orbit;
  if (orbitBack) { const k = Math.min(1, (performance.now() - orbitBack.t0) / 900); o = { az: orbitBack.from.az * (1 - k), el: orbitBack.from.el * (1 - k), zoom: 1 + (orbitBack.from.zoom - 1) * (1 - k) }; if (k >= 1) { orbitBack = null; orbit = { az: 0, el: 0, zoom: 1 }; } }
  const view = { az: cam.view.az + o.az, el: Math.max(2, Math.min(85, cam.view.el + o.el)), dist: cam.view.dist * o.zoom * fitFactor() };
  const pos = camPos(cam.look, view); camera.position.set(...pos); camera.lookAt(...cam.look);
  const a = freeArea(), w = stage.clientWidth, h = stage.clientHeight;
  camera.setViewOffset(w, h, w / 2 - (a.x + a.w / 2), h / 2 - (a.y + a.h / 2), w, h); camera.updateProjectionMatrix();
  scene.fog.near = view.dist * 1.2; scene.fog.far = view.dist * 4 + 300;
  renderer.render(scene, camera);
  // labels
  const typedDone = tryState || t - b.start > 1.2;
  for (const L of labels) {
    v3.x = L.pos[0]; v3.y = L.pos[1]; v3.z = L.pos[2];
    const vec = new THREE.Vector3(v3.x, v3.y, v3.z).project(camera), x = (vec.x * .5 + .5) * w, y = (-vec.y * .5 + .5) * h;
    const ok = typedDone && vec.z < 1 && x > 8 && x < w - 8 && y > a.y && y < a.y + a.h;
    const half = (L.w ??= L.el.offsetWidth || 100) / 2 + 6, cx = Math.min(Math.max(x, half), w - half);
    L.el.style.transform = `translate(${cx.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%)`; L.el.classList.toggle('on', ok);
  }
}
function fitFactor() { const w = stage.clientWidth, h = stage.clientHeight; return w / h < 1 ? Math.min(2.2, Math.max(1, .95 / (w / h))) : 1; }
function freeArea() {
  const sr = stage.getBoundingClientRect(), br = $('.bar').getBoundingClientRect(), cap = $('#caption').getBoundingClientRect(), kr = $('.ctrl').getBoundingClientRect();
  const top = br.height ? br.bottom : 0, bottom = Math.min(kr.height ? kr.top : sr.height, cap.height && captions ? cap.top + 30 : sr.height);
  return { x: 0, y: top, w: sr.width, h: Math.max(160, bottom - top) };
}

/* ================= LOOP ================= */
let last = performance.now(), raf = 0;
function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (playing && !textMode) {
    t += dt * speed;
    if (t >= TL.total) { t = TL.total; setPlaying(false); ended = true; if (!completed) { completed = true; track('tour_complete'); } $('#bPlay').setAttribute('aria-label', 'Replay'); $('#bPlay').innerHTML = '<span aria-hidden="true">↺</span>'; }
  }
  if (tryState) clock += dt;
  const moving = playing || orbitBack || needDraw || tryState;
  if (!moving) return;
  if (softGL && now - lastDraw < (playing || tryState ? 85 : 0)) return; // no GPU: about 12 fps
  lastDraw = now; needDraw = false;
  draw();
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
const redraw = () => { needDraw = true; };

/* ================= INPUT ================= */
let drag = null;
view3d.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, az: orbit.az, el: orbit.el, id: e.pointerId, moved: false }; view3d.setPointerCapture(e.pointerId); view3d.classList.add('grab'); });
view3d.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 6) return;
  if (!drag.moved) { drag.moved = true; if (playing) setPlaying(false); userTook = true; orbitBack = null; showResume(); }
  orbit.az = drag.az - dx * .3; orbit.el = Math.max(-30, Math.min(50, drag.el + dy * .2)); redraw();
});
const endDrag = e => { if (drag && !drag.moved && e?.type === 'pointerup') { setPlaying(!playing); } drag = null; view3d.classList.remove('grab'); };
view3d.addEventListener('pointerup', endDrag); view3d.addEventListener('pointercancel', () => { drag = null; view3d.classList.remove('grab'); });
view3d.addEventListener('wheel', e => { e.preventDefault(); orbit.zoom = Math.max(.35, Math.min(2.5, orbit.zoom * (e.deltaY > 0 ? 1.08 : .93))); if (playing) setPlaying(false); userTook = true; showResume(); redraw(); }, { passive: false });
$('#resume').onclick = () => setPlaying(true);
document.addEventListener('keydown', e => {
  if (textMode || tryState || document.querySelector('dialog[open]') || e.altKey || e.ctrlKey || e.metaKey) return;
  const tag = e.target.tagName; if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) && e.target.id !== 'scrub') return;
  const onBtn = /^(BUTTON|A)$/.test(tag);
  if (e.key === ' ' && !onBtn) { e.preventDefault(); setPlaying(!playing); }
  else if (e.key === 'k') setPlaying(!playing);
  else if (e.key === 'ArrowRight' && e.target.id !== 'scrub') { e.preventDefault(); jumpBeat(1); }
  else if (e.key === 'ArrowLeft' && e.target.id !== 'scrub') { e.preventDefault(); jumpBeat(-1); }
  else if (e.key === ']') jumpChapter(curChapter + 1);
  else if (e.key === '[') jumpChapter(curChapter - 1);
  else if (e.key === 'Home') { e.preventDefault(); seek(0); }
});
addEventListener('hashchange', () => { const h = parseHash(location.hash, TL, IDS); if (h?.sources) openSources(); else if (h && h.ci !== curChapter) seek(h.t); });
addEventListener('resize', redraw);

/* ================= CONTROLS ================= */
$('#bPlay').onclick = () => setPlaying(!playing);
$('#bBig').onclick = () => setPlaying(true);
$('#bPrevB').onclick = () => jumpBeat(-1); $('#bNextB').onclick = () => jumpBeat(1);
$('#bPrevC').onclick = () => jumpChapter(curChapter - (t - TL.chapterStart[curChapter] > 3 ? 0 : 1)); $('#bNextC').onclick = () => jumpChapter(curChapter + 1);
$('#bSpeed').onclick = () => { speed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1; $('#bSpeed').textContent = speed + '×'; track('speed', { speed }); };
$('#bCC').onclick = () => { captions = !captions; root.classList.toggle('nocc', !captions); $('#bCC').setAttribute('aria-pressed', captions); redraw(); };
$('#bChapters').onclick = () => $('#chDlg').showModal();
$('#tTotal').textContent = fmtTime(TL.total);
const dlg = $('#srcDlg');
function openSources() { dlg.showModal(); }
$('#bSrc').onclick = openSources;
document.querySelectorAll('dialog [data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
$('#bText').onclick = () => setText(!textMode);
$('#bTextStart').onclick = () => setText(true);
document.querySelectorAll('[data-back-to-tour]').forEach(b => b.onclick = () => setText(false));
function setText(on) {
  textMode = on; root.classList.toggle('textmode', on); $('#bText').setAttribute('aria-pressed', on); $('#bText').querySelector('.t').textContent = on ? 'Back to 3D' : 'Read as text';
  if (on) { if (playing) setPlaying(false); const el = document.getElementById(CHAPTERS[Math.max(0, curChapter)].id); el ? el.scrollIntoView({ block: 'start' }) : scrollTo(0, 0); }
  else { scrollTo(0, 0); redraw(); }
  track('read_as_text', { on });
}


/* ================= TRY IT PANELS ================= */
const cityOpts = sel => Object.entries(CITIES).map(([k, c]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(c.n)}</option>`).join('');
const seaOpts = sel => LINKS.filter(l => l.sea).map(l => `<option value="${l.id}"${l.id === sel ? ' selected' : ''}>${esc(CITIES[l.a].n)} ↔ ${esc(CITIES[l.b].n)}</option>`).join('');
const km = v => `${Math.round(v).toLocaleString('en-US')} km`;
function openTry() {
  const b = TL.beats[beatAt(TL, t)]; if (!b.try) return;
  wasPlaying = playing; if (playing) setPlaying(false);
  const kind = b.try, panel = $('#tryPanel'), body = $('#tryBody');
  tryState = { kind, from: b.from || 'mumbai', to: b.to || 'london', cut: kind === 'cut' ? 'med' : null, step: 0, drop: 3, k: 0, k0: clock };
  const title = { route: 'Send a packet', cut: 'Cut a cable', dns: 'Look up example.com', tcp: 'Lose a packet' }[kind];
  $('#tryTitle').textContent = title;
  if (kind === 'route' || kind === 'cut') {
    body.innerHTML = `<div class="tryrow"><label>From<select id="tFrom">${cityOpts(tryState.from)}</select></label><label>To<select id="tTo">${cityOpts(tryState.to)}</select></label></div>
      ${kind === 'cut' ? `<div class="tryrow"><label class="wide">Cable to cut<select id="tCut">${seaOpts('med')}</select></label></div><div class="tryrow"><button class="tbtn" id="tCutBtn" aria-pressed="true">✂ Cut it</button></div>` : ''}
      <dl class="tryres" id="tRes" aria-live="polite"></dl><p class="tryfine">The network is an illustration, not real cable routes; the light-speed maths is real.</p>`;
    $('#tFrom').onchange = e => { tryState.from = e.target.value; }; $('#tTo').onchange = e => { tryState.to = e.target.value; };
    if (kind === 'cut') { $('#tCut').onchange = e => { tryState.cut = e.target.value; $('#tCutBtn').setAttribute('aria-pressed', 'true'); $('#tCutBtn').textContent = '✂ Cut it'; }; $('#tCutBtn').onclick = e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; tryState.cut = on ? $('#tCut').value : null; e.currentTarget.setAttribute('aria-pressed', on); e.currentTarget.textContent = on ? '✂ Cut it' : '🔧 Repaired'; }; }
  } else if (kind === 'dns') {
    body.innerHTML = `<p class="trystep" id="tStep" aria-live="polite"></p><div class="tryrow"><button class="tbtn" id="tBack">◀ Back</button><button class="tbtn" id="tNext">Next step ▶</button></div>`;
    $('#tBack').onclick = () => { tryState.step = Math.max(0, tryState.step - 1); }; $('#tNext').onclick = () => { tryState.step = Math.min(DNS_STEPS.length - 1, tryState.step + 1); };
  } else if (kind === 'tcp') {
    body.innerHTML = `<div class="tryrow"><label>Packet to lose<select id="tDrop">${[1, 2, 3, 4, 5, 6].map(i => `<option${i === 3 ? ' selected' : ''}>${i}</option>`).join('')}</select></label><button class="tbtn" id="tSend">▶ Send again</button></div><dl class="tryres" id="tRes" aria-live="polite"></dl>`;
    $('#tDrop').onchange = e => { tryState.drop = +e.target.value; tryState.k0 = clock; }; $('#tSend').onclick = () => { tryState.k0 = clock; };
  }
  panel.hidden = false; root.classList.add('trying'); $('#tryClose').focus(); track('try_it', { kind }); redraw();
}
function closeTry() { if (!tryState) return; tryState = null; $('#tryPanel').hidden = true; root.classList.remove('trying'); labelKey = ''; redraw(); if (wasPlaying) setPlaying(true); }
let lastRes = '';
function updateTry() {
  const s = tryState;
  if (s.kind === 'tcp') s.k = Math.min(1, (clock - s.k0) / 6);
  let html = '';
  if (s.kind === 'route' && s.result) { const r = s.result; html = `<dt>Path</dt><dd>${r.nodes.map(esc).join(' → ')}</dd><dt>Cable distance</dt><dd>${km(r.km)}</dd><dt>Straight line</dt><dd>${km(r.straight)}</dd><dt>Light alone, round trip</dt><dd>≥ ${rttMs(r.km).toFixed(0)} ms (straight line: ${rttMs(r.straight).toFixed(0)} ms)</dd>`; }
  if (s.kind === 'cut' && s.result) { const r = s.result; html = `<dt>Path now</dt><dd>${r.nodes.map(esc).join(' → ')}</dd><dt>Before the cut</dt><dd>${km(r.before)} · ≥ ${rttMs(r.before).toFixed(0)} ms</dd><dt>${s.cut ? 'After the cut' : 'Now'}</dt><dd>${r.after ? `${km(r.after)} · ≥ ${rttMs(r.after).toFixed(0)} ms` : 'no path left!'}</dd>`; }
  if (s.kind === 'dns') { $('#tStep').textContent = `Step ${s.step + 1} of ${DNS_STEPS.length}: ${DNS_STEPS[s.step][2]}`; return; }
  if (s.kind === 'tcp') html = `<dt>TCP</dt><dd>${s.k > .97 ? 'all 6 packets, in order ✓' : `waiting for packet ${s.drop}…`}</dd><dt>UDP</dt><dd>${s.k > .6 ? `5 of 6 packets: packet ${s.drop} is simply missing` : 'sending…'}</dd>`;
  if (html !== lastRes) { lastRes = html; const el = $('#tRes'); if (el) el.innerHTML = html; }
}
$('#tryBtn').onclick = openTry;
$('#tryClose').onclick = closeTry;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && tryState) closeTry(); });

/* ================= 3D ================= */
async function start3d() {
  let buildWorld;
  try {
    const c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) throw new Error('no webgl');
    [THREE, { buildWorld }] = await Promise.all([import('../vendor/three.min.js'), import('./world.js')]);
  } catch (e) { root.classList.add('nogl'); $('#noglMsg').hidden = false; return; }
  const small = innerWidth < 760;
  renderer = new THREE.WebGLRenderer({ antialias: !small, powerPreference: 'high-performance' });
  try { const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); softGL = /swiftshader|llvmpipe|software|softpipe/i.test(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''); } catch (e) { /* assume a GPU */ }
  if (softGL) root.classList.add('soft-gl');
  renderer.setPixelRatio(softGL ? 1 : Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.outputColorSpace = THREE.SRGBColorSpace;
  view3d.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');
  scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(45, 1, .3, 4000);
  world = buildWorld(scene, renderer, { soft: softGL }); W = true;
  const resize = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; redraw(); };
  resize(); addEventListener('resize', resize);
  root.classList.add('gl-ready'); curBeat = -1; draw(true);
  window.__net = { renderer, scene, camera, world, get t() { return t; }, get playing() { return playing; }, get tryState() { return tryState; }, TL };
  // No GPU (software rendering): every frame is slow, so wait for the reader to press Play.
  if (!reduced && !startPaused && !softGL) setTimeout(() => { if (!playing && !textMode && !userTook) setPlaying(true); }, t > .5 ? 700 : 1800);
}

/* ================= BOOT ================= */
root.classList.add('ready');
const h0 = parseHash(location.hash, TL, IDS);
let startPaused = /[?&]paused\b/.test(location.search); // ?paused: open without autoplay (tests, screenshots)
if (h0?.t != null) t = h0.t;
if (h0?.sources) { startPaused = true; openSources(); }
draw(true);
$('#startCard').classList.toggle('gone', t > .5);
raf = requestAnimationFrame(frame);
track('topic_start', { t: Math.round(t) });
const later = () => (window.requestIdleCallback || (f => setTimeout(f, 60)))(() => start3d(), { timeout: 1200 });
if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
