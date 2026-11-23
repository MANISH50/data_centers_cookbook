/* FROM SAND TO SIGNAL: tour engine (captions, input, camera, hands-on controls).
   Content: data.js · pure helpers: core.js, logic.js · 3D models: scene.js (three.js loaded lazily). */
import { STATIONS, PLACES, SOURCES, STOPS } from './data.js';
import { parseHash, formatHash, makeThrottle, nextIndex, prevIndex, camPos, flyTo, flightMs, scaleJump } from './core.js';
import { makeCpu, stepCpu, PROGRAM, nandTransistors, rippleAdd, hex2, bin8, rgbHex } from './logic.js';

const $ = s => document.querySelector(s);
const root = document.documentElement, stage = $('#stage'), card = $('#card'), view3d = $('#view3d'), labelLayer = $('#labels');
const rmq = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = rmq.matches; root.classList.toggle('rm', reduced);
rmq.addEventListener?.('change', e => { reduced = e.matches; root.classList.toggle('rm', reduced); });
const SRC_IDS = Object.keys(SOURCES);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

window.cookbookEvents = window.cookbookEvents || [];
function track(name, data = {}) { const ev = { name, ...data }; window.cookbookEvents.push(ev); window.dispatchEvent(new CustomEvent('cookbook:analytics', { detail: ev })); }

/* ================= STATE ================= */
let cur = -1, completed = false, autoOn = false, autoTimer = 0, textMode = false, typeJob = 0;
let camState = { look: [...STOPS[0].look], view: { ...STOPS[0].view } }, flight = null, orbit = { az: 0, el: 0 };
const throttle = makeThrottle(750);
const shared = { cpu: makeCpu(7, 5), screenNumber: 12, rgb: [255, 179, 71], adder: [7, 5], nand: [0, 0], gate: 0, pull: .55, explode: 1, pack: 1 };
let W3 = null; // the 3D world, once three.js has loaded

/* ================= CAPTION ================= */
const srcNum = id => SRC_IDS.indexOf(id) + 1;
const chars = t => [...t].map(ch => `<span class="c">${esc(ch)}</span>`).join('');
function renderCard(s, instant) {
  const table = s.table ? `<table class="where-t"><caption class="sr-only">Where each step happens</caption><tbody>${s.table.map(([a, b]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</tbody></table>` : '';
  card.innerHTML = `
    <p class="eyebrow"><span class="n">${String(s.id).padStart(2, '0')}</span><span>/ ${STOPS.length}</span> · ${esc(s.eyebrow)}</p>
    <h2 class="title" id="cardTitle">${esc(s.title)}</h2>
    ${s.lines.map(l => `<p class="ln t">${chars(l)}</p>`).join('')}
    <div class="lab" id="labUi"></div>
    <section class="where" aria-label="Where it happens"><p class="wh"><span class="lab-t">Where it happens</span><span class="badge">📍 ${esc(PLACES[s.place])}</span></p><p class="t">${chars(s.where)}</p>${table}</section>
    <p class="srcs">${s.ill ? '<span class="illtag">3D model: illustration</span> · ' : ''}Sources: ${s.src.map(id => `<a href="${SOURCES[id].u}" target="_blank" rel="noopener" title="${esc(SOURCES[id].t)}">[${srcNum(id)}]</a>`).join(' ')} · <button class="linkish" data-open-sources>all sources</button></p>
    <p class="tm">Independent explainer. No company logos; 3D models are drawn in code for this page.</p>`;
  card.scrollTop = 0;
  card.querySelector('[data-open-sources]').onclick = openSources;
  buildLab(s);
  typeOut(instant || reduced);
}
function typeOut(instant) {
  const job = ++typeJob, groups = [...card.querySelectorAll('.t')];
  if (instant) { card.classList.add('typed'); return; }
  card.classList.remove('typed');
  let gi = 0, ci = 0;
  const step = () => {
    if (job !== typeJob) return;
    const g = groups[gi]; if (!g) { card.classList.add('typed'); return; }
    const cs = g.querySelectorAll('.c');
    for (let k = 0; k < 3 && ci < cs.length; k++) cs[ci++].classList.add('on');
    if (ci >= cs.length) { gi++; ci = 0; setTimeout(step, 120); } else setTimeout(step, 14);
  };
  step();
}
card.addEventListener('click', e => { if (!e.target.closest('button,a,input,label')) { typeJob++; card.classList.add('typed'); } });

/* ================= HANDS-ON CONTROLS ================= */
/* Rendering budget: GPUs render every frame; software-only WebGL (no GPU) renders only while something changes. */
let liveUntil = 0, softwareGL = false, needFrames = 2;
const kick = (ms = 4000) => { liveUntil = Math.max(liveUntil, performance.now() + ms); };
const redraw = (n = 2) => { needFrames = Math.max(needFrames, n); };
let lastUser = -1e9; // animations started by the reader keep the 3D view live for a few seconds
['pointerdown', 'keydown', 'input', 'click'].forEach(t => document.addEventListener(t, () => { lastUser = performance.now(); }, true));
const api = k => { if (performance.now() - lastUser < 800) kick(); else redraw(2); return W3?.stations[k]?.api; };
const now3d = () => performance.now() / 1000;
function buildLab(s) {
  const ui = $('#labUi'); ui.className = 'lab lab-' + s.lab;
  const h = html => { ui.innerHTML = html; };
  switch (s.lab) {
    case 'start':
      h(`<button class="btn big" id="lStart">▶ Start the journey</button>`);
      $('#lStart').onclick = () => go(1); break;
    case 'atoms':
      h(`<button class="btn" id="lAtoms" aria-pressed="false">⚛ Show the atoms</button><p class="note" aria-live="polite" id="lNote">Drag the model to turn the crystal.</p>`);
      $('#lAtoms').onclick = e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); api('sand')?.atoms(on); $('#lNote').textContent = on ? 'Yellow = silicon, red = oxygen: each silicon atom is bonded to oxygen (simplified lattice).' : 'Drag the model to turn the crystal.'; }; break;
    case 'reactor':
      h(`<button class="btn" id="lRun">🔥 Run the reactor</button><p class="note" aria-live="polite" id="lNote">Ultra-pure silicon grows onto the hot rods.</p>`);
      $('#lRun').onclick = () => { api('purify')?.run(); $('#lNote').textContent = 'Silicon from the gas deposits onto the glowing rods, which thicken. Then they are broken into chunks.'; }; break;
    case 'pull':
      h(`<label class="rng"><span>Pull the crystal up</span><input type="range" id="lPull" min="0" max="1" step="0.01" value="${shared.pull}" aria-label="Pull the crystal up"></label><p class="note">Seed rotating, crystal growing from the melt.</p>`);
      $('#lPull').oninput = e => { shared.pull = +e.target.value; api('czo')?.pull(shared.pull); }; api('czo')?.pull(shared.pull); break;
    case 'slice':
      h(`<button class="btn" id="lSlice">🪚 Slice the ingot</button><p class="note" aria-live="polite" id="lNote"></p>`);
      $('#lSlice').onclick = () => { api('slice')?.slice(); $('#lNote').textContent = 'Wafers come off the saw; one is polished to a mirror finish.'; }; break;
    case 'expose':
      h(`<button class="btn" id="lExp">💡 Expose the wafer</button><p class="note" aria-live="polite" id="lNote">EUV light: tin droplets hit by a laser make a plasma that glows at 13.5 nm.</p>`);
      $('#lExp').onclick = () => { api('litho')?.expose(); $('#lNote').textContent = 'Light bounces off mirrors, through the mask pattern, onto the resist, one chip area after another.'; }; break;
    case 'steps': {
      const steps = W3?.stations.layers.steps || ['Bare silicon', 'Deposit a thin film', 'Coat with resist', 'Expose with light', 'Develop and etch', 'Implant ions', 'Strip the resist'];
      const cur0 = api('layers')?.step ?? 0;
      h(`<button class="btn" id="lStep">Next process step →</button><ol class="stepl" id="lSteps">${steps.map((t, i) => `<li${i === cur0 ? ' aria-current="step"' : ''}>${esc(t)}</li>`).join('')}</ol>`);
      $('#lStep').onclick = () => { const k = api('layers')?.next() ?? 0; document.querySelectorAll('#lSteps li').forEach((li, i) => i === k ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current')); };
      break;
    }
    case 'gate':
      h(`<button class="btn" id="lGate" aria-pressed="${!!shared.gate}">⚡ Gate voltage: ${shared.gate ? 'ON' : 'OFF'}</button><p class="note" aria-live="polite" id="lNote">${shared.gate ? 'Current flows: the switch is ON (1).' : 'No current: the switch is OFF (0).'}</p>`);
      $('#lGate').onclick = e => { shared.gate = shared.gate ? 0 : 1; api('fet')?.gate(shared.gate); e.currentTarget.setAttribute('aria-pressed', !!shared.gate); e.currentTarget.textContent = `⚡ Gate voltage: ${shared.gate ? 'ON' : 'OFF'}`; $('#lNote').textContent = shared.gate ? 'Current flows: the switch is ON (1).' : 'No current: the switch is OFF (0).'; };
      api('fet')?.gate(shared.gate); break;
    case 'explode':
      h(`<label class="rng"><span>Pull the layers apart</span><input type="range" id="lEx" min="1" max="4" step="0.01" value="${shared.explode}" aria-label="Pull the wiring layers apart"></label>`);
      $('#lEx').oninput = e => { shared.explode = +e.target.value; api('wires')?.explode(shared.explode); }; api('wires')?.explode(shared.explode); break;
    case 'package':
      h(`<label class="rng"><span>Assemble ↔ explode</span><input type="range" id="lPk" min="0" max="1" step="0.01" value="${shared.pack}" aria-label="Assemble or explode the package"></label><button class="btn" id="lTest">🧪 Test every die</button><p class="note" aria-live="polite" id="lNote"></p>`);
      $('#lPk').oninput = e => { shared.pack = +e.target.value; api('pack')?.explode(shared.pack); };
      $('#lTest').onclick = () => { api('pack')?.test(); $('#lNote').textContent = 'Green dies passed, red ones failed (an illustration, not real yield data). Only good dies get packaged.'; };
      api('pack')?.explode(shared.pack); break;
    case 'nand': {
      const draw = () => {
        const [a, b] = shared.nand, st = nandTransistors(a, b); api('nand')?.set(a, b);
        $('#lA').setAttribute('aria-pressed', !!a); $('#lB').setAttribute('aria-pressed', !!b); $('#lA').textContent = `A = ${a}`; $('#lB').textContent = `B = ${b}`;
        $('#lOut').textContent = `Output = ${st.out}`; $('#lOut').className = 'outv ' + (st.out ? 'one' : 'zero');
        document.querySelectorAll('#lTT tbody tr').forEach(tr => tr.classList.toggle('on', tr.dataset.k === `${a}${b}`));
      };
      h(`<div class="tryit"><button class="btn bit" id="lA"></button><button class="btn bit" id="lB"></button><span class="outv" id="lOut" aria-live="polite"></span></div>
        <table class="tt" id="lTT"><caption class="sr-only">NAND truth table</caption><thead><tr><th>A</th><th>B</th><th>Out</th></tr></thead><tbody>${[[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => `<tr data-k="${a}${b}"><td>${a}</td><td>${b}</td><td>${a && b ? 0 : 1}</td></tr>`).join('')}</tbody></table>`);
      $('#lA').onclick = () => { shared.nand[0] ^= 1; draw(); }; $('#lB').onclick = () => { shared.nand[1] ^= 1; draw(); }; draw(); break;
    }
    case 'adder': {
      const draw = () => {
        const [a, b] = shared.adder, r = rippleAdd(a, b, 4); api('adder')?.set(a, b, W3 ? clock : 0);
        $('#lSum').innerHTML = `<span>${a} = <b>${bin8(a).slice(4)}</b></span><span>+ ${b} = <b>${bin8(b).slice(4)}</b></span><span class="eq">= ${r.total} = <b>${r.carryOut}${bin8(r.sum).slice(4)}</b></span>`;
      };
      h(`<div class="nums"><label class="rng"><span>A</span><input type="range" id="lAa" min="0" max="15" value="${shared.adder[0]}" aria-label="Number A, 0 to 15"></label><label class="rng"><span>B</span><input type="range" id="lAb" min="0" max="15" value="${shared.adder[1]}" aria-label="Number B, 0 to 15"></label></div><p class="sum mono" id="lSum" aria-live="polite"></p>`);
      $('#lAa').oninput = e => { shared.adder[0] = +e.target.value; draw(); }; $('#lAb').oninput = e => { shared.adder[1] = +e.target.value; draw(); }; draw(); break;
    }
    case 'cpu': {
      const show = () => {
        const s = shared.cpu; api('cpu')?.show(s);
        $('#lPh').innerHTML = ['fetch', 'decode', 'execute'].map(p => `<span class="${!s.halted && s.phase === p ? 'on' : ''}">${p}</span>`).join('');
        $('#lMem').innerHTML = s.mem.map((m, i) => `<li class="${i === s.pc && !s.halted ? 'pc' : ''}"><b>${i}</b> ${m == null ? '—' : esc(String(m))}</li>`).join('');
        $('#lReg').textContent = `PC=${s.pc}  R0=${s.reg[0]}  R1=${s.reg[1]}  OUT=${s.out ?? '—'}`;
        $('#lLog').textContent = s.log.slice(-3).join('\n') || 'Press Step to fetch the first instruction.';
        $('#lStepC').disabled = $('#lRunC').disabled = s.halted;
        if (s.out != null) { shared.screenNumber = s.out; api('screen')?.setNumber(s.out); }
      };
      h(`<div class="nums"><label class="rng"><span>memory[6]</span><input type="range" id="lX" min="0" max="49" value="${shared.cpu.mem[6]}" aria-label="First number"></label><label class="rng"><span>memory[7]</span><input type="range" id="lY" min="0" max="49" value="${shared.cpu.mem[7]}" aria-label="Second number"></label></div>
        <div class="phases" id="lPh" aria-hidden="true"></div>
        <div class="cpu-grid"><ol class="mem mono" id="lMem" start="0" aria-label="Memory"></ol><div><p class="reg mono" id="lReg" aria-live="polite"></p><pre class="log mono" id="lLog"></pre></div></div>
        <div class="tryit"><button class="btn" id="lStepC">Step ⏭</button><button class="btn" id="lRunC">Run ▶</button><button class="btn ghost" id="lResetC">↺ Reset</button></div>`);
      const reset = () => { shared.cpu = makeCpu(+$('#lX').value, +$('#lY').value); show(); };
      $('#lX').oninput = reset; $('#lY').oninput = reset; $('#lResetC').onclick = reset;
      $('#lStepC').onclick = () => { shared.cpu = stepCpu(shared.cpu); show(); };
      $('#lRunC').onclick = async () => { while (!shared.cpu.halted && cur === 12) { shared.cpu = stepCpu(shared.cpu); show(); await new Promise(r => setTimeout(r, reduced ? 0 : 420)); } };
      show(); void PROGRAM; break;
    }
    case 'rgb': {
      const draw = () => {
        const [r, g, b] = shared.rgb; api('screen')?.setColor(r, g, b);
        $('#lSw').style.background = rgbHex(r, g, b);
        $('#lBytes').innerHTML = ['R', 'G', 'B'].map((c, i) => `<span><b>${c}</b> ${shared.rgb[i]} · 0x${hex2(shared.rgb[i])} · ${bin8(shared.rgb[i])}</span>`).join('');
      };
      h(`<p class="note">The screen shows <b>${shared.screenNumber}</b>, the CPU’s answer${shared.cpu.out == null ? ' (run the CPU at stop 13 to change it)' : ''}.</p>
        <div class="rgbs">${['Red', 'Green', 'Blue'].map((c, i) => `<label class="rng c${i}"><span>${c}</span><input type="range" min="0" max="255" value="${shared.rgb[i]}" data-i="${i}" aria-label="${c}, 0 to 255"></label>`).join('')}</div>
        <div class="pix"><span class="sw" id="lSw" aria-hidden="true"></span><p class="bytes mono" id="lBytes" aria-live="polite"></p></div>`);
      ui.querySelectorAll('.rgbs input').forEach(inp => inp.oninput = e => { shared.rgb[+e.target.dataset.i] = +e.target.value; draw(); });
      api('screen')?.setNumber(shared.screenNumber); draw(); break;
    }
    case 'finale':
      h(`<p class="note">Next: see the buildings these chips work in. <a href="../data-centers/">Inside the Cloud: how a data center works →</a></p><button class="btn" id="lAgain">↺ Start again</button>`);
      $('#lAgain').onclick = () => go(0); break;
  }
}
/* Re-apply hands-on state once the 3D world exists (the first caption may render before three.js loads). */
function syncWorld() {
  api('czo')?.pull(shared.pull); api('wires')?.explode(shared.explode); api('pack')?.explode(shared.pack); api('fet')?.gate(shared.gate);
  api('nand')?.set(...shared.nand); api('adder')?.set(...shared.adder, clock); api('cpu')?.show(shared.cpu);
  api('screen')?.setNumber(shared.screenNumber); api('screen')?.setColor(...shared.rgb);
}

/* ================= NAVIGATION ================= */
function go(i, { instant = false, keepCard = false } = {}) {
  if (i == null || i < 0 || i >= STOPS.length || (i === cur && !instant)) return;
  const prevStop = STOPS[cur], s = STOPS[i]; cur = i; redraw(3);
  if (!keepCard) renderCard(s, instant); else buildLab(s);
  updateControls();
  if (formatHash(i) !== location.hash) history.replaceState(null, '', formatHash(i));
  $('#scale').textContent = s.scale;
  orbit = { az: 0, el: 0 };
  const target = { look: [...s.look], view: { ...s.view } };
  if (instant || reduced || !W3) { flight = null; camState = target; arrive(); }
  else {
    flight = { a: { look: [...camState.look], view: { ...camState.view } }, b: target, t0: performance.now(), ms: flightMs(camState, target) };
    stage.classList.add('flying'); kick(flight.ms + 1500);
    if (scaleJump(prevStop, s)) { stage.classList.remove('tunnel'); void stage.offsetWidth; stage.classList.add('tunnel'); }
  }
  try { localStorage.setItem('cookbook:sand-to-signal', JSON.stringify({ id: 'stop-' + s.id, num: String(s.id).padStart(2, '0'), title: s.title })); } catch (e) { /* storage blocked */ }
}
function arrive() {
  const s = STOPS[cur]; stage.classList.remove('flying');
  track('stop_view', { n: s.id });
  if (s.id === STOPS.length && !completed) { completed = true; track('tour_complete'); }
  clearTimeout(autoTimer); if (autoOn) autoTimer = setTimeout(() => cur === STOPS.length - 1 ? setAuto(false) : next(), 12000);
}
const next = () => go(nextIndex(cur, STOPS.length));
const prev = () => go(prevIndex(cur));
function updateControls() {
  document.querySelectorAll('#rail button').forEach((b, k) => { k === cur ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current'); b.classList.toggle('done', k < cur); });
  document.querySelectorAll('#railBar i').forEach((b, k) => { b.classList.toggle('cur', k === cur); b.classList.toggle('done', k < cur); });
  const last = cur === STOPS.length - 1;
  $('#bNext').innerHTML = last ? '<span aria-hidden="true">↺</span> Restart' : 'Next <span aria-hidden="true">›</span>';
  $('#bNext').setAttribute('aria-label', last ? 'Restart the tour' : 'Next stop');
  $('#bPrev').disabled = cur === 0;
  $('#count').textContent = `${cur + 1} / ${STOPS.length}`;
}
function setAuto(on) {
  autoOn = on; $('#bAuto').setAttribute('aria-pressed', on); $('#bAuto').querySelector('.t').textContent = on ? 'Pause tour' : 'Auto tour'; $('#bAuto').querySelector('.i').textContent = on ? '❚❚' : '▶';
  track('auto_tour_toggle', { on }); clearTimeout(autoTimer);
  if (on) { if (cur === STOPS.length - 1) go(0); else autoTimer = setTimeout(next, 12000); }
}

/* ================= INPUT ================= */
const gesture = dir => { if (textMode || $('#srcDlg').open) return; if (!throttle()) return; dir > 0 ? next() : prev(); };
const cardCanScroll = dir => card.scrollHeight > card.clientHeight + 2 && (dir > 0 ? card.scrollTop + card.clientHeight < card.scrollHeight - 2 : card.scrollTop > 2);
stage.addEventListener('wheel', e => {
  if (textMode) return;
  const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (e.target.closest('#card') && cardCanScroll(Math.sign(d))) return;
  if (e.target.closest('input')) return;
  e.preventDefault(); if (Math.abs(d) > 12) gesture(Math.sign(d));
}, { passive: false });
// Drag (mouse or one finger) on the 3D view orbits the camera around the model.
let drag = null;
view3d.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, az: orbit.az, el: orbit.el, id: e.pointerId }; view3d.setPointerCapture(e.pointerId); view3d.classList.add('grab'); });
view3d.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; redraw(1); orbit.az = Math.max(-80, Math.min(80, drag.az - (e.clientX - drag.x) * .35)); orbit.el = Math.max(-25, Math.min(40, drag.el + (e.clientY - drag.y) * .25)); });
const endDrag = () => { drag = null; view3d.classList.remove('grab'); };
view3d.addEventListener('pointerup', endDrag); view3d.addEventListener('pointercancel', endDrag);
view3d.addEventListener('dblclick', () => { orbit = { az: 0, el: 0 }; });
document.addEventListener('keydown', e => {
  if (textMode || $('#srcDlg').open || e.altKey || e.ctrlKey || e.metaKey) return;
  const tag = e.target.tagName; if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
  const onCtl = /^(BUTTON|A)$/.test(tag), k = e.key;
  if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(k) || (k === ' ' && !onCtl)) { e.preventDefault(); gesture(1); }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(k)) { e.preventDefault(); gesture(-1); }
  else if (k === 'Home') { e.preventDefault(); if (throttle()) go(0); }
  else if (k === 'End') { e.preventDefault(); if (throttle()) go(STOPS.length - 1); }
});
addEventListener('hashchange', () => { const i = parseHash(location.hash, STOPS.length); if (i != null && i !== cur) go(i); });

/* ================= CONTROLS ================= */
$('#rail').innerHTML = STOPS.map(s => `<li><button aria-label="Stop ${s.id}: ${esc(s.title)}" title="${s.id}. ${esc(s.title)}"><i></i></button></li>`).join('');
document.querySelectorAll('#rail button').forEach((b, k) => b.onclick = () => go(k));
$('#railBar').innerHTML = STOPS.map(() => '<i></i>').join('');
$('#railBar').onclick = e => { const r = $('#railBar').getBoundingClientRect(); go(Math.max(0, Math.min(STOPS.length - 1, Math.floor((e.clientX - r.left) / r.width * STOPS.length)))); };
$('#bPrev').onclick = prev;
$('#bNext').onclick = () => cur === STOPS.length - 1 ? go(0) : next();
$('#bAuto').onclick = () => setAuto(!autoOn);
$('#bText').onclick = () => setText(!textMode);
document.querySelectorAll('[data-back-to-map]').forEach(b => b.onclick = () => setText(false));
function setText(on) {
  textMode = on; root.classList.toggle('textmode', on); $('#bText').setAttribute('aria-pressed', on); $('#bText').querySelector('.t').textContent = on ? 'Back to 3D' : 'Read as text';
  track('read_as_text', { on });
  if (on) { if (autoOn) setAuto(false); const h = document.getElementById('t-stop-' + (cur + 1)); h ? h.scrollIntoView({ block: 'start' }) : scrollTo(0, 0); }
  else scrollTo(0, 0);
}
const dlg = $('#srcDlg');
function openSources() { dlg.showModal(); }
$('#bSrc').onclick = openSources;
dlg.querySelector('[data-close]').onclick = () => dlg.close();
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

/* ================= 3D ================= */
let clock = 0;
function freeArea() {
  const sr = stage.getBoundingClientRect(), cr = card.getBoundingClientRect(), br = $('.bar').getBoundingClientRect(), kr = $('.ctrl').getBoundingClientRect();
  const top = (br.height ? br.bottom : 0) + 8, bottom = kr.height ? kr.top : sr.height, hasCard = cr.width > 0 && cr.height > 0;
  if (sr.width < 760) return { x: 0, y: top, w: sr.width, h: Math.max(140, (hasCard ? cr.top : bottom) - top) };
  const left = hasCard ? cr.right + 12 : 0;
  return { x: left, y: top, w: Math.max(240, sr.width - left), h: Math.max(160, bottom - top) };
}

async function start3d() {
  let THREE, buildWorld;
  try {
    const c = document.createElement('canvas');
    if (!(c.getContext('webgl2') || c.getContext('webgl'))) throw new Error('no webgl');
    ({ THREE, buildWorld } = await import('./scene.js'));
  } catch (e) { root.classList.add('nogl'); $('#noglMsg').hidden = false; return; }
  const small = innerWidth < 760;
  const renderer = new THREE.WebGLRenderer({ antialias: !small, powerPreference: 'high-performance' });
  try { const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); softwareGL = /swiftshader|llvmpipe|software|softpipe/i.test(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''); } catch (e) { /* unknown: treat as GPU */ }
  renderer.setPixelRatio(softwareGL ? 1 : Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  if (softwareGL) root.classList.add('soft-gl');
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2; renderer.outputColorSpace = THREE.SRGBColorSpace;
  view3d.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, 1, .1, 900);
  W3 = await buildWorld(scene, renderer, { soft: softwareGL, nearX: STOPS[Math.max(0, cur)].look[0] });
  syncWorld();
  if (STOPS[cur]) buildLab(STOPS[cur]);
  // HTML labels projected from 3D points, so text stays sharp.
  const labels = [];
  for (const k in W3.stations) for (const l of W3.stations[k].labels) { const el = document.createElement('span'); el.className = 'lbl3'; el.textContent = l.text; labelLayer.appendChild(el); labels.push({ el, pos: l.pos, k }); }
  const v = new THREE.Vector3();
  let w = 0, h = 0, last = performance.now(), raf = 0;
  const resize = () => { const sr = stage.getBoundingClientRect(); if (sr.width !== w || sr.height !== h) { w = sr.width; h = sr.height; renderer.setSize(w, h, false); camera.aspect = w / h; } };
  let lastDraw = 0, slow = 0;
  const frame = nowMs => {
    raf = requestAnimationFrame(frame);
    if (softwareGL) { // no GPU: draw only when something changes, at a low frame rate
      const live = nowMs < liveUntil || flight;
      if (!(needFrames > 0 || (live && nowMs - lastDraw > 120))) return;
      if (needFrames > 0) needFrames--;
    }
    lastDraw = nowMs;
    const dt = Math.min(.1, (nowMs - last) / 1000); last = nowMs; if (!reduced) clock += dt;
    resize();
    if (flight) { const t = Math.min(1, (nowMs - flight.t0) / flight.ms); camState = flyTo(flight.a, flight.b, t); if (t >= 1) { camState = flight.b; flight = null; arrive(); } }
    const a = freeArea(), view = { ...camState.view, az: camState.view.az + orbit.az, el: Math.max(-10, Math.min(80, camState.view.el + orbit.el)) };
    // Fit the stop into the free area: move back when the area is small or the screen is narrow.
    const clamp = v => Math.max(1, Math.min(2.6, v)), fitArea = clamp(Math.max(w / a.w, h / a.h) * .8), portrait = w / h < 1 ? clamp(.78 / (w / h)) : 1;
    view.dist *= Math.max(fitArea, portrait);
    const p = camPos(camState.look, view); camera.position.set(...p); camera.lookAt(...camState.look);
    camera.setViewOffset(w, h, (w / 2) - (a.x + a.w / 2), (h / 2) - (a.y + a.h / 2), w, h); camera.updateProjectionMatrix();
    const lookX = camState.look[0], far = view.dist > 70, vis = new Set(Object.keys(STATIONS).filter(k => far || Math.abs(STATIONS[k].x - lookX) < 75));
    scene.fog.near = view.dist * .7; scene.fog.far = view.dist * 3.2;
    W3.update(dt, clock, vis);
    const r0 = performance.now(); renderer.render(scene, camera);
    // Slow frames (no GPU, or a very weak one): switch to drawing only when something changes.
    if (!softwareGL) { slow = performance.now() - r0 > 40 ? slow + 1 : 0; if (slow >= 3) { softwareGL = true; root.classList.add('soft-gl'); renderer.setPixelRatio(1); } }
    const showLabels = !flight && !far, st = STOPS[cur];
    for (const L of labels) {
      if (!showLabels || L.k !== st.station) { if (L.on) { L.el.classList.remove('on'); L.on = false; } continue; }
      v.copy(L.pos).project(camera);
      const x = (v.x * .5 + .5) * w, y = (-v.y * .5 + .5) * h, ok = v.z < 1 && x > a.x - 10 && x < w + 10 && y > a.y && y < a.y + a.h;
      const half = (L.w ??= L.el.offsetWidth || 120) / 2 + 6, cx = Math.min(Math.max(x, half), w - half); // keep labels on screen
      L.el.style.transform = `translate(${cx.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%)`;
      if (ok !== !!L.on) { L.el.classList.toggle('on', ok); L.on = ok; }
    }
  };
  redraw(2); addEventListener('resize', () => redraw(2));
  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  root.classList.add('gl-ready');
  window.__sts = { renderer, scene, camera, world: W3, shared };
}

/* ================= BOOT ================= */
root.classList.add('ready');
const startAt = parseHash(location.hash, STOPS.length) ?? 0;
go(startAt, { instant: true, keepCard: startAt === 0 && !!card.querySelector('.title') });
card.querySelector('[data-open-sources]')?.addEventListener('click', openSources);
track('topic_start', { stop: startAt + 1 });
// Load three.js after the first caption is on screen.
const later = () => (window.requestIdleCallback || (f => setTimeout(f, 60)))(() => start3d(), { timeout: 1200 });
if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
