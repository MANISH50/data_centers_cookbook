/* Pure helpers (no DOM): unit-tested in tests/unit.test.mjs. */

export const REQUIRED = ['id', 'eyebrow', 'title', 'cam', 'lines', 'dc', 'site', 'active', 'wires', 'chips', 'src'];

/* Returns a list of problems; empty = valid. */
export function validateStops(stops, { zones, wires, sources, badges, wireTypes }) {
  const errs = [], zoneIds = new Set(zones.map(z => z.id)), wireIds = new Set(wires.map(w => w.id));
  if (stops.length !== 15) errs.push(`expected 15 stops, got ${stops.length}`);
  stops.forEach((s, i) => {
    const at = `stop ${i + 1}`;
    for (const k of REQUIRED) if (s[k] == null) errs.push(`${at}: missing ${k}`);
    if (s.id !== i + 1) errs.push(`${at}: id should be ${i + 1}`);
    if (!s.cam || !isFinite(s.cam.x) || !isFinite(s.cam.y) || !(s.cam.zoom > 0)) errs.push(`${at}: bad cam`);
    if (!Array.isArray(s.lines) || s.lines.length < 1 || s.lines.length > 3) errs.push(`${at}: needs 1–3 lines`);
    if (!s.dc || !badges[s.dc.badge] || !s.dc.text) errs.push(`${at}: bad dc block`);
    if (!zoneIds.has(s.site)) errs.push(`${at}: unknown site ${s.site}`);
    (s.active || []).forEach(z => z !== '*' && !zoneIds.has(z) && errs.push(`${at}: unknown zone ${z}`));
    (s.wires || []).forEach(w => !wireIds.has(w) && errs.push(`${at}: unknown wire ${w}`));
    (s.chips || []).forEach(c => !wireTypes[c] && errs.push(`${at}: unknown chip ${c}`));
    (s.src || []).forEach(c => !sources[c] && errs.push(`${at}: unknown source ${c}`));
  });
  return errs;
}

/* "#stop-8" → 7 (0-based). Anything else → null. */
export function parseHash(hash, count) {
  const m = /^#?stop-(\d{1,3})$/i.exec(String(hash || '').trim());
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= count ? n - 1 : null;
}
export const formatHash = i => `#stop-${i + 1}`;

/* One gesture = one move: returns true at most once per `ms`. */
export function makeThrottle(ms, now = () => Date.now()) {
  let last = -Infinity;
  return () => { const t = now(); if (t - last < ms) return false; last = t; return true; };
}

/* Next/previous with restart on the last stop. */
export const nextIndex = (i, n) => (i + 1) % n;
export const prevIndex = i => Math.max(0, i - 1);

export const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const lerp = (a, b, t) => a + (b - a) * t;

/* Camera at progress t (0..1) of a flight from a to b.
   Zoom is interpolated in log space and dips (zooms out) mid-flight when the stops are far apart. */
export function flyCam(a, b, t, world) {
  const e = easeInOut(t);
  const dist = Math.hypot(b.x - a.x, b.y - a.y) / Math.hypot(world.w, world.h);
  const dip = Math.min(1.1, dist * 2.4) * Math.sin(Math.PI * e);
  const lz = lerp(Math.log(a.zoom), Math.log(b.zoom), e) - dip;
  return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), zoom: Math.max(.6, Math.exp(lz)) };
}
export const flightMs = (a, b, world) => {
  const d = Math.hypot(b.x - a.x, b.y - a.y) / Math.hypot(world.w, world.h) + Math.abs(Math.log(b.zoom / a.zoom)) * .25;
  return Math.round(900 + Math.min(1, d) * 900);
};

/* Fit the camera frame (world/zoom) into the free screen area, centred on (x, y).
   area = {x, y, w, h} in screen px; screen = {w, h}. Returns an SVG viewBox [x, y, w, h]. */
export function viewBoxFor(cam, world, area, screen) {
  const fw = world.w / cam.zoom, fh = world.h / cam.zoom;
  const s = Math.min(area.w / fw, area.h / fh);
  const cx = area.x + area.w / 2, cy = area.y + area.h / 2;
  return [cam.x - cx / s, cam.y - cy / s, screen.w / s, screen.h / s];
}

/* Toggle state for "Data-center view": returns the order of caption blocks. */
export const captionOrder = dcView => dcView ? ['dc', 'main'] : ['main', 'dc'];
