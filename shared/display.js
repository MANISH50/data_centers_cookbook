/* DISPLAY SETTINGS, shared by the whole library: show or hide the guide (the drawn presenter), show or hide the text
   (captions and card text), and turn her voice on or off. One setting for every page, kept in this browser only
   (localStorage 'cookbook:display'), and synced live between open tabs. Everything still works when storage is blocked.
   Pure helpers (readPrefs, writePrefs, toggled) are unit-tested; mountDisplayMenu() is the DOM part. */

export const KEY = 'cookbook:display';
export const DEFAULTS = Object.freeze({ guide: true, text: true, voice: true });
export const LABELS = {
  guide: ['Guide', 'The presenter who reads to you'],
  text: ['Text', 'Captions and card text on screen'],
  voice: ['Voice', 'Read aloud by your device']
};

/* Read the saved setting from a Storage-like object, falling back to the defaults; understands the older
   'cookbook:voice' ('off') and 'cookbook:voice:min' ('1' = guide hidden) keys from earlier versions. */
export function readPrefs(store) {
  const out = { ...DEFAULTS };
  try {
    const raw = store?.getItem(KEY);
    if (raw) { const v = JSON.parse(raw); for (const k of Object.keys(DEFAULTS)) if (typeof v[k] === 'boolean') out[k] = v[k]; return out; }
    if (store?.getItem('cookbook:voice') === 'off') out.voice = false;
    if (store?.getItem('cookbook:voice:min')) out.guide = false;
  } catch (e) { /* storage blocked or bad JSON: defaults */ }
  return out;
}
export function writePrefs(store, prefs) { try { store?.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* storage blocked */ } }
export const toggled = (prefs, k) => ({ ...prefs, [k]: !prefs[k] });

/* ---------- live state for this page ---------- */
const listeners = new Set();
const store = () => { try { return window.localStorage; } catch (e) { return null; } };
let prefs = typeof window !== 'undefined' ? readPrefs(store()) : { ...DEFAULTS };
export const getPrefs = () => ({ ...prefs });
function apply() {
  if (typeof document === 'undefined') return;
  const r = document.documentElement;
  r.classList.toggle('no-guide', !prefs.guide); r.classList.toggle('no-text', !prefs.text); r.classList.toggle('no-voice', !prefs.voice);
}
export function setPref(k, v) {
  if (!(k in DEFAULTS) || prefs[k] === v) return;
  prefs = { ...prefs, [k]: !!v }; writePrefs(store(), prefs); apply();
  listeners.forEach(f => f(getPrefs(), k));
  if (typeof window !== 'undefined') { (window.cookbookEvents ||= []).push({ name: 'display', key: k, on: !!v }); }
}
export const togglePref = k => setPref(k, !prefs[k]);
export function onPrefs(f) { listeners.add(f); return () => listeners.delete(f); }
if (typeof window !== 'undefined') {
  apply();
  addEventListener('storage', e => { if (e.key !== KEY) return; const before = prefs; prefs = readPrefs(store()); apply(); for (const k of Object.keys(DEFAULTS)) if (before[k] !== prefs[k]) listeners.forEach(f => f(getPrefs(), k)); });
}

/* A "Display" button with a small menu of switches. keys: which switches this page offers (a magazine has no Text switch). */
export function mountDisplayMenu(button, { keys = ['guide', 'text', 'voice'], speech = typeof window !== 'undefined' && !!window.speechSynthesis } = {}) {
  if (!button) return null;
  const shown = keys.filter(k => k !== 'voice' || speech);
  const menu = document.createElement('div');
  menu.className = 'dsp-menu'; menu.id = 'dspMenu'; menu.hidden = true; menu.setAttribute('role', 'group'); menu.setAttribute('aria-label', 'Display');
  menu.innerHTML = `<p class="dsp-h">Display</p>${shown.map(k => `<button type="button" class="dsp-row" role="switch" data-k="${k}" aria-checked="${prefs[k]}"><span class="dsp-t"><b>${LABELS[k][0]}</b><small>${LABELS[k][1]}</small></span><span class="dsp-sw" aria-hidden="true"></span></button>`).join('')}<p class="dsp-fine">Saved for the whole library, on this device. Keys: ${shown.map(k => ({ guide: 'G', text: 'C', voice: 'V' }[k])).join(' · ')}</p>`;
  document.body.appendChild(menu);
  button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', 'dspMenu');
  const sync = () => menu.querySelectorAll('.dsp-row').forEach(r => r.setAttribute('aria-checked', prefs[r.dataset.k]));
  const place = () => { const b = button.getBoundingClientRect(), w = Math.min(300, innerWidth - 16); menu.style.width = w + 'px'; menu.style.left = Math.max(8, Math.min(innerWidth - w - 8, b.right - w)) + 'px'; const below = b.bottom + 8, h = menu.offsetHeight || 220; menu.style.top = (below + h < innerHeight ? below : Math.max(8, b.top - h - 8)) + 'px'; };
  const open = on => { menu.hidden = !on; button.setAttribute('aria-expanded', on); if (on) { sync(); place(); menu.querySelector('.dsp-row')?.focus(); } };
  button.addEventListener('click', e => { e.stopPropagation(); open(menu.hidden); });
  menu.addEventListener('click', e => { e.stopPropagation(); const r = e.target.closest('.dsp-row'); if (r) togglePref(r.dataset.k); });
  document.addEventListener('click', () => { if (!menu.hidden) open(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { open(false); button.focus(); } });
  addEventListener('resize', () => { if (!menu.hidden) place(); });
  onPrefs(sync);
  return { open, menu };
}

/* Keyboard shortcuts G (guide), C (text), V (voice), ignored while typing in a field. */
export function displayKeys(keys = ['guide', 'text', 'voice']) {
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    const k = { g: 'guide', c: 'text', v: 'voice' }[e.key.toLowerCase()];
    if (k && keys.includes(k)) togglePref(k);
  });
}
