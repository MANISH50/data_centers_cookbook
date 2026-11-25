/* Pure timeline helpers for the photo walkthroughs (no DOM): unit-tested in shared/tests/timeline.test.mjs.
   A walkthrough is chapters of beats; each beat is a caption shown for `d` seconds over a real photo. */

/* Flattens chapters into beats with absolute start and end times. */
export function buildTimeline(chapters) {
  const beats = []; let t = 0; const chapterStart = [];
  chapters.forEach((c, ci) => {
    chapterStart.push(t);
    c.beats.forEach((b, bi) => { beats.push({ ...b, ci, bi, i: beats.length, start: t, end: t + b.d }); t += b.d; });
  });
  return { beats, chapterStart, total: t };
}

/* Index of the beat playing at time t (binary search). */
export function beatAt(tl, t) {
  const B = tl.beats; if (t <= 0) return 0; if (t >= tl.total) return B.length - 1;
  let lo = 0, hi = B.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (B[mid].start <= t) lo = mid; else hi = mid - 1; }
  return lo;
}
export const chapterAt = (tl, t) => tl.beats[beatAt(tl, t)].ci;

/* Progress 0..1 of the beat's diagram cue at time t (honours p0/p1 sub-ranges, so a cue can span several beats). */
export function cueProgress(beat, t) {
  const k = Math.min(1, Math.max(0, (t - beat.start) / beat.d));
  const p0 = beat.p0 ?? 0, p1 = beat.p1 ?? (beat.p0 != null ? beat.p0 : 1);
  return beat.p0 != null && beat.p1 == null ? p0 : p0 + (p1 - p0) * k;
}

export const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const lerp = (a, b, k) => a + (b - a) * k;

/* Typed caption: how many characters are visible at time t (about 55 per second). */
export const typedChars = (beat, t, cps = 55) => Math.max(0, Math.min(beat.text.length, Math.floor((t - beat.start) * cps)));

/* Deep links: #ch3 (old magazine links keep working), #t=123.5, #sources, #photos. */
export function parseHash(hash, tl, ids) {
  const h = String(hash || '').replace(/^#/, '').trim();
  let m = /^ch(\d{1,2})$/i.exec(h);
  if (m) { const i = ids.indexOf('ch' + (+m[1])); return i >= 0 ? { t: tl.chapterStart[i], ci: i } : null; }
  m = /^t=(\d+(?:\.\d+)?)$/.exec(h);
  if (m) { const t = Math.min(tl.total, +m[1]); return { t, ci: chapterAt(tl, t) }; }
  if (h === 'sources') return { sources: true };
  if (h === 'photos') return { photos: true };
  return null;
}

export const fmtTime = s => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/* Content checks for the unit tests. */
export function validate(chapters, sources, expected) {
  const errs = [], ids = new Set(sources.map(s => s.id));
  if (chapters.length !== expected) errs.push(`expected ${expected} chapters, got ${chapters.length}`);
  chapters.forEach((c, i) => {
    if (c.id !== 'ch' + (i + 1)) errs.push(`chapter ${i + 1}: id should be ch${i + 1}`);
    if (!c.title || !c.sub || !c.beats?.length) errs.push(`${c.id}: missing title, sub or beats`);
    c.beats.forEach((b, j) => {
      const at = `${c.id} beat ${j + 1}`;
      if (!b.text || b.text.length < 20) errs.push(`${at}: caption too short`);
      if (!(b.d >= 5 && b.d <= 14)) errs.push(`${at}: duration ${b.d}`);
      if (b.stat && b.stat[2] && !ids.has(b.stat[2])) errs.push(`${at}: unknown source ${b.stat[2]}`);
      if (b.src && !ids.has(b.src)) errs.push(`${at}: unknown source ${b.src}`);
    });
  });
  return errs;
}
