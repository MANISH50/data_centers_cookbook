/* Issue 06 · "Try it" panels, flat (no 3D): send a packet between cities, cut a cable, step through a DNS lookup,
   lose a packet with TCP vs UDP. Uses the pure maths in net.js and the flat map in diagrams.js. */
import { CITIES, LINKS } from './data.js';
import { rttMs, DNS_STEPS, gcKm } from './net.js';
import { map, routeOf, DIAGRAMS } from './diagrams.js';
import { along } from '../shared/diagram-kit.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const km = v => `${Math.round(v).toLocaleString('en-US')} km`;

export function createTry({ wt, track }) {
  const $ = s => document.querySelector(s), root = document.documentElement;
  let st = null, wasPlaying = false, raf = 0, k0 = 0;
  const cityOpts = sel => Object.entries(CITIES).map(([k, c]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${esc(c.n)}</option>`).join('');
  const seaOpts = sel => LINKS.filter(l => l.sea).map(l => `<option value="${l.id}"${l.id === sel ? ' selected' : ''}>${esc(CITIES[l.a].n)} ↔ ${esc(CITIES[l.b].n)}</option>`).join('');

  function open(b) {
    const kind = b.try; if (!kind) return;
    wasPlaying = wt.playing; if (wasPlaying) wt.setPlaying(false);
    st = { kind, from: b.from || 'mumbai', to: b.to || 'london', cut: kind === 'cut' ? 'med' : null, step: 0, drop: 3 }; k0 = performance.now();
    $('#tryTitle').textContent = { route: 'Send a packet', cut: 'Cut a cable', dns: 'Look up example.com', tcp: 'Lose a packet' }[kind];
    const body = $('#tryBody');
    if (kind === 'route' || kind === 'cut') {
      body.innerHTML = `<div class="tryviz" id="tViz"></div><div class="tryrow"><label>From<select id="tFrom">${cityOpts(st.from)}</select></label><label>To<select id="tTo">${cityOpts(st.to)}</select></label></div>
        ${kind === 'cut' ? `<div class="tryrow"><label class="wide">Cable to cut<select id="tCut">${seaOpts('med')}</select></label></div><div class="tryrow"><button class="tbtn" id="tCutBtn" aria-pressed="true">✂ Cut it</button></div>` : ''}
        <dl class="tryres" id="tRes" aria-live="polite"></dl><p class="tryfine">The network is an illustration, not real cable routes; the light-speed maths is real.</p>`;
      $('#tFrom').onchange = e => { st.from = e.target.value; k0 = performance.now(); }; $('#tTo').onchange = e => { st.to = e.target.value; k0 = performance.now(); };
      if (kind === 'cut') {
        $('#tCut').onchange = e => { st.cut = e.target.value; $('#tCutBtn').setAttribute('aria-pressed', 'true'); $('#tCutBtn').textContent = '✂ Cut it'; };
        $('#tCutBtn').onclick = e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; st.cut = on ? $('#tCut').value : null; e.currentTarget.setAttribute('aria-pressed', on); e.currentTarget.textContent = on ? '✂ Cut it' : '🔧 Repaired'; };
      }
    } else if (kind === 'dns') {
      body.innerHTML = `<div class="tryviz" id="tViz"></div><p class="trystep" id="tStep" aria-live="polite"></p><div class="tryrow"><button class="tbtn" id="tBack">◀ Back</button><button class="tbtn" id="tNext">Next step ▶</button></div>`;
      $('#tBack').onclick = () => { st.step = Math.max(0, st.step - 1); }; $('#tNext').onclick = () => { st.step = Math.min(DNS_STEPS.length - 1, st.step + 1); };
    } else if (kind === 'tcp') {
      body.innerHTML = `<div class="tryviz" id="tViz"></div><div class="tryrow"><label>Packet to lose<select id="tDrop">${[1, 2, 3, 4, 5, 6].map(i => `<option${i === 3 ? ' selected' : ''}>${i}</option>`).join('')}</select></label><button class="tbtn" id="tSend">▶ Send again</button></div><dl class="tryres" id="tRes" aria-live="polite"></dl>`;
      $('#tDrop').onchange = e => { st.drop = +e.target.value; k0 = performance.now(); }; $('#tSend').onclick = () => { k0 = performance.now(); };
    }
    $('#tryPanel').hidden = false; root.classList.add('trying'); $('#tryClose').focus(); track('try_it', { kind });
    last = ''; lastViz = ''; loop();
  }
  function close() { if (!st) return; st = null; cancelAnimationFrame(raf); $('#tryPanel').hidden = true; root.classList.remove('trying'); wt.redraw(); if (wasPlaying) wt.setPlaying(true); }

  let last = '', lastViz = '';
  function loop() {
    if (!st) return; raf = requestAnimationFrame(loop);
    const k = ((performance.now() - k0) / 1000) % 4 / 4, s = st; let html = '', viz = '';
    if (s.kind === 'route' || s.kind === 'cut') {
      const now = routeOf(s.from, s.to, s.kind === 'cut' ? s.cut : null), before = routeOf(s.from, s.to);
      if (s.from === s.to) html = '<dt>Path</dt><dd>Pick two different cities.</dd>';
      else if (s.kind === 'route') { const straight = gcKm(CITIES[s.from].ll, CITIES[s.to].ll); html = `<dt>Path</dt><dd>${now.nodes.map(n => esc(CITIES[n].n)).join(' → ')}</dd><dt>Cable distance</dt><dd>${km(now.km)}</dd><dt>Straight line</dt><dd>${km(straight)}</dd><dt>Light alone, round trip</dt><dd>≥ ${rttMs(now.km).toFixed(0)} ms (straight line: ${rttMs(straight).toFixed(0)} ms)</dd>`; }
      else html = `<dt>Path now</dt><dd>${now ? now.nodes.map(n => esc(CITIES[n].n)).join(' → ') : 'no path left!'}</dd><dt>Before the cut</dt><dd>${km(before.km)} · ≥ ${rttMs(before.km).toFixed(0)} ms</dd><dt>${s.cut ? 'After the cut' : 'Now'}</dt><dd>${now ? `${km(now.km)} · ≥ ${rttMs(now.km).toFixed(0)} ms` : 'no path left!'}</dd>`;
      viz = s.from === s.to || !now ? map({ cut: s.cut, cities: [s.from, s.to] }) : map({ hot: now.pts, cut: s.kind === 'cut' ? s.cut : null, dotAt: along(now.pts, k), cities: [s.from, s.to] });
    } else if (s.kind === 'dns') {
      $('#tStep').textContent = `Step ${s.step + 1} of ${DNS_STEPS.length}: ${DNS_STEPS[s.step][2]}`;
      viz = DIAGRAMS.dns((s.step + .5) / DNS_STEPS.length).svg;
    } else if (s.kind === 'tcp') {
      const t = Math.min(1, (performance.now() - k0) / 6000);
      html = `<dt>TCP</dt><dd>${t > .97 ? 'all 6 packets, in order ✓' : `waiting for packet ${s.drop}…`}</dd><dt>UDP</dt><dd>${t > .6 ? `5 of 6 packets: packet ${s.drop} is simply missing` : 'sending…'}</dd>`;
      viz = DIAGRAMS.tcp(Math.min(.499, t * .5), { drop: s.drop }).svg;
    }
    if (html !== last) { last = html; const el = $('#tRes'); if (el) el.innerHTML = html; }
    if (viz !== lastViz) { lastViz = viz; $('#tViz').innerHTML = viz; }
  }

  $('#tryBtn').onclick = () => open(wt.TL.beats.find(b => b.start <= wt.t && wt.t < b.end) || wt.TL.beats.at(-1));
  $('#tryClose').onclick = close;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && st) close(); });
  return {
    beat(b) { $('#tryBtn').hidden = !b.try; },
    get state() { return st; },
    open, close
  };
}
