/* Real-photo walkthrough maths (no DOM): unit-tested in shared/tests/photos.test.mjs.
   Each beat shows one photo. `focus: [u, v, zoom]` picks the part of the photo to centre (u across, v down, 0..1)
   and how far to zoom in; across the beat the view drifts slowly (a Ken Burns move). Everything is a pure function
   of time, so the scrubber can jump anywhere. */

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const GLIDE = 1.4; // seconds to glide between two views of the same photo

/* The view {u, v, z} of beat b at time t on its own (no glide). */
export function drift(b, t, still = false) {
  const [u, v, z] = b.focus || [.5, .5, 1];
  const k = still ? 0 : clamp((t - b.start) / b.d, 0, 1);
  const dx = (b.i % 2 ? -1 : 1) * .025, dy = (b.i % 3 === 1 ? -1 : 1) * .015;
  return { u: u + dx * k, v: v + dy * k, z: z * (1 + .07 * k) };
}

/* The view at time t: glides from the previous beat's last view when both beats show the same photo. */
export function kenBurns(tl, i, t, still = false) {
  const b = tl.beats[i], p = tl.beats[i - 1], cur = drift(b, t, still);
  if (!p || p.photo !== b.photo || still) return cur;
  const k = ease(clamp((t - b.start) / GLIDE, 0, 1)), a = drift(p, p.end);
  return { u: a.u + (cur.u - a.u) * k, v: a.v + (cur.v - a.v) * k, z: a.z + (cur.z - a.z) * k };
}

/* Opacity of beat i's photo layer: fades in over `inS` seconds when the photo changes, else fully shown. */
export function fadeIn(tl, i, t, inS = .8) {
  const b = tl.beats[i], p = tl.beats[i - 1];
  if (!p) return 1; // the very first photo is there from the start
  if (p.photo !== b.photo) { const k = clamp((t - b.start) / inS, 0, 1); return k * k * (3 - 2 * k); }
  return 1;
}

/* Where to draw the photo: {left, top, w, h} in px inside a box {w, h}, so that photo point (u, v) sits at the centre
   of `area` (the part of the stage not covered by bars and caption). 'cover' fills the box; 'contain' fits the area. */
export function layout(view, aspect, box, area, fit = 'cover') {
  let bw, bh;
  if (fit === 'contain') { bh = area.h * .94; bw = bh * aspect; if (bw > box.w * .94) { bw = box.w * .94; bh = bw / aspect; } }
  else { bw = Math.max(box.w, box.h * aspect); bh = bw / aspect; }
  const w = bw * view.z, h = bh * view.z;
  const ax = area.x + area.w / 2, ay = area.y + area.h / 2;
  let left = ax - view.u * w, top = ay - view.v * h;
  if (fit === 'cover' || w >= box.w) left = clamp(left, box.w - w, 0); else left = clamp(left, 0, box.w - w);
  if (fit === 'cover' || h >= box.h) top = clamp(top, box.h - h, 0); else top = clamp(top, area.y, Math.max(area.y, area.y + area.h - h));
  return { left, top, w, h };
}
/* A point on the photo (u, v) → px on the stage, given a layout. */
export const uvToPx = ([u, v], L) => [L.left + u * L.w, L.top + v * L.h];

/* Checks for the unit tests: every beat has a photo, every photo is credited under a free licence and used. */
export function validatePhotos(chapters, photos) {
  const errs = [], ids = new Set();
  for (const p of photos) {
    if (ids.has(p.id)) errs.push(`duplicate photo id ${p.id}`); ids.add(p.id);
    for (const k of ['file', 'thumb', 'title', 'alt', 'author', 'licence', 'url']) if (!p[k]) errs.push(`photo ${p.id}: missing ${k}`);
    if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(p.url || '')) errs.push(`photo ${p.id}: url is not a Wikimedia Commons file page`);
    if (!/^(CC0|Public domain|CC BY(-SA)? [\d.]+)/.test(p.licence || '')) errs.push(`photo ${p.id}: licence ${p.licence} is not a free licence we use`);
    if (/BY/.test(p.licence) && !/^https?:\/\/creativecommons\.org\//.test(p.licUrl || '')) errs.push(`photo ${p.id}: CC BY licence needs a link`);
    if (!(p.w > 0 && p.h > 0)) errs.push(`photo ${p.id}: missing size`);
    if (p.fit && !['cover', 'contain'].includes(p.fit)) errs.push(`photo ${p.id}: bad fit`);
  }
  const used = new Set();
  chapters.forEach((c, ci) => c.beats.forEach((b, bi) => {
    const at = `chapter ${ci + 1} beat ${bi + 1}`;
    if (!b.photo) errs.push(`${at}: no photo`); else if (!ids.has(b.photo)) errs.push(`${at}: unknown photo ${b.photo}`); else used.add(b.photo);
    if (b.focus && !(b.focus.length === 3 && b.focus[0] >= 0 && b.focus[0] <= 1 && b.focus[1] >= 0 && b.focus[1] <= 1 && b.focus[2] >= 1 && b.focus[2] <= 4)) errs.push(`${at}: bad focus`);
    for (const [txt, uv] of b.plabels || []) if (!txt || !(uv[0] >= 0 && uv[0] <= 1 && uv[1] >= 0 && uv[1] <= 1)) errs.push(`${at}: label outside the photo`);
  }));
  for (const id of ids) if (!used.has(id)) errs.push(`photo ${id} is never shown`);
  return errs;
}
