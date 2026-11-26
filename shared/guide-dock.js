/* THE GUIDE, DOCKED: the drawn presenter in the bottom corner of the tours (Issues 04, 05) and magazines (02, 03),
   with a Listen button. Tours call read(key, text) when a stop opens; magazines call readFrom() to read the page
   aloud paragraph by paragraph from where you are. Shown, hidden and voiced by the site-wide Display setting. */
import { createAnchor } from './anchor.js';
import { mountDisplayMenu, displayKeys, onPrefs, getPrefs } from './display.js';

/* Split long text into speakable chunks (some speech engines stop on very long utterances). Pure; unit-tested. */
export function chunks(text, max = 220) {
  const t = String(text || '').replace(/\s+/g, ' ').trim(); if (!t) return [];
  const sentences = t.match(/[^.!?…]+[.!?…]+["”’)]*\s*|[^.!?…]+$/g) || [t];
  const out = []; let cur = '';
  for (let s of sentences) {
    s = s.trim();
    while (s.length > max) { const cut = s.lastIndexOf(' ', max) > 40 ? s.lastIndexOf(' ', max) : max; if (cur) { out.push(cur); cur = ''; } out.push(s.slice(0, cut).trim()); s = s.slice(cut).trim(); }
    if ((cur + ' ' + s).trim().length > max && cur) { out.push(cur); cur = s; } else cur = (cur + ' ' + s).trim();
  }
  if (cur) out.push(cur);
  return out;
}

export function mountGuideDock({ displayButton, keys = ['guide', 'text', 'voice'], track = () => {}, onListen = null } = {}) {
  mountDisplayMenu(displayButton, { keys }); displayKeys(keys);
  const dock = document.createElement('div');
  dock.className = 'guide-dock'; dock.id = 'guideDock'; dock.setAttribute('role', 'region'); dock.setAttribute('aria-label', 'Your guide');
  dock.innerHTML = '<button type="button" class="gd-btn gd-listen" id="gdListen" aria-pressed="false"><span aria-hidden="true">🔊</span> Listen</button>';
  document.body.appendChild(dock);
  const guide = createAnchor({ mount: dock, track });
  const btn = dock.querySelector('#gdListen');
  let queue = [], reading = false, current = null;
  const setBtn = on => { reading = on; btn.setAttribute('aria-pressed', on); btn.lastChild.textContent = on ? ' Stop' : ' Listen'; };
  function stop() { queue = []; guide.stop(); setBtn(false); current?.el?.classList.remove('reading-now'); current = null; }
  /* read a list of { text, el? } items in order; el (if any) is highlighted and kept in view while it is read */
  function play(items, key) {
    stop(); queue = items.flatMap(it => chunks(it.text).map((c, k) => ({ text: c, el: it.el, first: k === 0 })));
    if (!queue.length) return false;
    setBtn(true); let n = 0;
    const next = () => {
      const it = queue.shift(); if (!it) { stop(); return; }
      if (it.el !== current?.el) { current?.el?.classList.remove('reading-now'); it.el?.classList.add('reading-now'); if (it.el && it.first) { const r = it.el.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 90) it.el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } }
      current = it;
      const ok = guide.say(`${key}#${n++}`, it.text, { force: true, onEnd: next });
      if (!ok) stop();
    };
    next(); return reading;
  }
  btn.onclick = () => { if (reading || guide.busy()) { stop(); track('listen', { on: false }); } else { onListen?.(); track('listen', { on: true }); } };
  onPrefs((p, k) => { if (k === 'voice' && !p.voice) stop(); });
  return {
    guide, stop, play,
    /* a tour stop: read its text once (again only if asked) */
    read(key, text) { if (!getPrefs().voice) return false; return play([{ text }], key); },
    get reading() { return reading; }
  };
}
