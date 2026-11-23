/* Pure timeline helpers (no DOM, no three.js): unit-tested in tests/unit.test.mjs. */

export const GLIDE = 2.4; // seconds the camera takes to glide into each beat

/* Flattens chapters into beats with absolute start times. */
export function buildTimeline(chapters, poi) {
  const beats = []; let t = 0; const chapterStart = [];
  chapters.forEach((c, ci) => {
    chapterStart.push(t);
    c.beats.forEach((b, bi) => {
      beats.push({ ...b, ci, bi, start: t, end: t + b.d, roof: b.roof ?? c.roof ?? 1, look: resolve(b.cam[0], poi), view: { az: b.cam[1], el: b.cam[2], dist: b.cam[3] } });
      t += b.d;
    });
  });
  return { beats, chapterStart, total: t };
}
export const resolve = (p, poi) => Array.isArray(p) ? p : poi[p];

/* Index of the beat playing at time t (binary search). */
export function beatAt(tl, t) {
  const B = tl.beats; if (t <= 0) return 0; if (t >= tl.total) return B.length - 1;
  let lo = 0, hi = B.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (B[mid].start <= t) lo = mid; else hi = mid - 1; }
  return lo;
}
export const chapterAt = (tl, t) => tl.beats[beatAt(tl, t)].ci;

/* Progress 0..1 of the beat's scene cue at time t (honours p0/p1 sub-ranges, so a cue can span several beats). */
export function cueProgress(beat, t) {
  const k = Math.min(1, Math.max(0, (t - beat.start) / beat.d));
  const p0 = beat.p0 ?? 0, p1 = beat.p1 ?? (beat.p0 != null ? beat.p0 : 1);
  return beat.p0 != null && beat.p1 == null ? p0 : p0 + (p1 - p0) * k;
}

export const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const lerp = (a, b, k) => a + (b - a) * k;

/* Camera position from a look-at point and a view {az, el, dist} in degrees. */
export function camPos(look, view) {
  const az = view.az * Math.PI / 180, el = view.el * Math.PI / 180;
  return [look[0] + view.dist * Math.cos(el) * Math.sin(az), look[1] + view.dist * Math.sin(el), look[2] + view.dist * Math.cos(el) * Math.cos(az)];
}

/* Camera at time t: glide from the previous beat's view for GLIDE seconds (rising when far), then a slow drift. */
export function cameraAt(tl, t, glide = true) {
  const i = beatAt(tl, t), b = tl.beats[i], prev = tl.beats[i - 1], local = t - b.start;
  const drift = { az: b.view.az + 7 * (local / b.d), el: b.view.el, dist: b.view.dist * (1 - .05 * (local / b.d)) };
  if (!prev || !glide || local >= GLIDE) return { look: b.look, view: drift };
  const k = easeInOut(local / GLIDE), pv = { az: prev.view.az + 7, el: prev.view.el, dist: prev.view.dist * .95 };
  const look = prev.look.map((v, j) => lerp(v, b.look[j], k));
  const far = Math.hypot(b.look[0] - prev.look[0], b.look[2] - prev.look[2]);
  let daz = drift.az - pv.az; while (daz > 180) daz -= 360; while (daz < -180) daz += 360;
  const view = { az: pv.az + daz * k, el: lerp(pv.el, drift.el, k) + Math.min(35, far * .12) * Math.sin(Math.PI * k), dist: Math.exp(lerp(Math.log(pv.dist), Math.log(drift.dist), k)) + Math.min(160, far * .45) * Math.sin(Math.PI * k) };
  return { look, view };
}

/* Typed caption: how many characters are visible at time t (about 55 per second). */
export const typedChars = (beat, t, cps = 55) => Math.max(0, Math.min(beat.text.length, Math.floor((t - beat.start) * cps)));

/* Deep links: #ch3 (old magazine links keep working), #t=123.5, #sources. */
export function parseHash(hash, tl, ids) {
  const h = String(hash || '').replace(/^#/, '').trim();
  let m = /^ch(\d{1,2})$/i.exec(h);
  if (m) { const i = ids.indexOf('ch' + (+m[1])); return i >= 0 ? { t: tl.chapterStart[i], ci: i } : null; }
  m = /^t=(\d+(?:\.\d+)?)$/.exec(h);
  if (m) { const t = Math.min(tl.total, +m[1]); return { t, ci: chapterAt(tl, t) }; }
  if (h === 'sources') return { sources: true };
  return null;
}

export const fmtTime = s => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export function validate(chapters, poi, sources) {
  const errs = [], ids = new Set(sources.map(s => s.id));
  if (chapters.length !== 13) errs.push(`expected 13 chapters, got ${chapters.length}`);
  chapters.forEach((c, i) => {
    if (c.id !== 'ch' + (i + 1)) errs.push(`chapter ${i + 1}: id should be ch${i + 1}`);
    if (!c.title || !c.sub || !c.beats?.length) errs.push(`${c.id}: missing title, sub or beats`);
    c.beats.forEach((b, j) => {
      const at = `${c.id} beat ${j + 1}`;
      if (!b.text || b.text.length < 20) errs.push(`${at}: caption too short`);
      if (!(b.d >= 5 && b.d <= 14)) errs.push(`${at}: duration ${b.d}`);
      if (!Array.isArray(b.cam) || b.cam.length !== 4) errs.push(`${at}: bad cam`);
      else if (!Array.isArray(b.cam[0]) && !poi[b.cam[0]]) errs.push(`${at}: unknown point ${b.cam[0]}`);
      if (b.stat && b.stat[2] && !ids.has(b.stat[2])) errs.push(`${at}: unknown source ${b.stat[2]}`);
      (b.labels || []).forEach(l => { if (!Array.isArray(l[1]) && !poi[l[1]]) errs.push(`${at}: unknown label point`); });
    });
  });
  return errs;
}
