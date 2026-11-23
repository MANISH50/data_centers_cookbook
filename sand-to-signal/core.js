/* Pure helpers (no DOM, no three.js): unit-tested in tests/unit.test.mjs.
   Navigation helpers follow netflix-streaming/core.js. */

export const REQUIRED = ['id', 'eyebrow', 'title', 'station', 'look', 'view', 'scale', 'lines', 'place', 'where', 'lab', 'src'];

export function validateStops(stops, { stations, places, sources }) {
  const errs = [];
  if (stops.length !== 15) errs.push(`expected 15 stops, got ${stops.length}`);
  stops.forEach((s, i) => {
    const at = `stop ${i + 1}`;
    for (const k of REQUIRED) if (s[k] == null) errs.push(`${at}: missing ${k}`);
    if (s.id !== i + 1) errs.push(`${at}: id should be ${i + 1}`);
    if (s.station !== 'overview' && !stations[s.station]) errs.push(`${at}: unknown station ${s.station}`);
    if (!Array.isArray(s.look) || s.look.length !== 3 || !s.look.every(Number.isFinite)) errs.push(`${at}: bad look`);
    if (!s.view || !(s.view.dist > 0) || !Number.isFinite(s.view.az) || !Number.isFinite(s.view.el)) errs.push(`${at}: bad view`);
    if (!Array.isArray(s.lines) || s.lines.length < 1 || s.lines.length > 3) errs.push(`${at}: needs 1–3 lines`);
    if (!places[s.place]) errs.push(`${at}: unknown place ${s.place}`);
    (s.src || []).forEach(c => !sources[c] && errs.push(`${at}: unknown source ${c}`));
  });
  return errs;
}

export function parseHash(hash, count) {
  const m = /^#?stop-(\d{1,3})$/i.exec(String(hash || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= count ? n - 1 : null;
}
export const formatHash = i => `#stop-${i + 1}`;

export function makeThrottle(ms, now = () => Date.now()) {
  let last = -Infinity;
  return () => { const t = now(); if (t - last < ms) return false; last = t; return true; };
}
export const nextIndex = (i, n) => (i + 1) % n;
export const prevIndex = i => Math.max(0, i - 1);
export const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const lerp = (a, b, t) => a + (b - a) * t;

/* Camera position from a look-at point and a view {az, el, dist} in degrees. */
export function camPos(look, view) {
  const az = view.az * Math.PI / 180, el = view.el * Math.PI / 180;
  return [look[0] + view.dist * Math.cos(el) * Math.sin(az), look[1] + view.dist * Math.sin(el), look[2] + view.dist * Math.cos(el) * Math.cos(az)];
}

/* Camera flight at progress t: look point glides, the camera rises in an arc when stops are far apart. */
export function flyTo(a, b, t) {
  const e = easeInOut(t);
  const look = a.look.map((v, i) => lerp(v, b.look[i], e));
  const d = Math.hypot(b.look[0] - a.look[0], b.look[2] - a.look[2]);
  const lift = Math.min(60, d * .35) * Math.sin(Math.PI * e);
  const view = { az: lerp(a.view.az, b.view.az, e), el: lerp(a.view.el, b.view.el, e), dist: Math.exp(lerp(Math.log(a.view.dist), Math.log(b.view.dist), e)) + lift };
  return { look, view };
}
export const flightMs = (a, b) => Math.round(1000 + Math.min(1, Math.hypot(b.look[0] - a.look[0], b.look[2] - a.look[2]) / 200) * 1000);

/* Does the scale badge change between two stops? (triggers the zoom-tunnel effect) */
export const scaleJump = (a, b) => !!a && !!b && a.scale !== b.scale && a.station !== b.station;
