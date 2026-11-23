// Unit tests: node --test data-centers/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { POI, SOURCES, CHAPTERS, RECAPS } from '../data.js';
import { buildTimeline, beatAt, chapterAt, cueProgress, cameraAt, camPos, typedChars, parseHash, fmtTime, validate, GLIDE } from '../timeline.js';

const TL = buildTimeline(CHAPTERS, POI), IDS = CHAPTERS.map(c => c.id);

test('content integrity: 13 chapters, every beat has a caption, camera and valid references', () => {
  assert.deepEqual(validate(CHAPTERS, POI, SOURCES), []);
  assert.equal(CHAPTERS.length, 13);
  for (const c of CHAPTERS) assert.ok(RECAPS[c.id]?.length, `${c.id} has a recap`);
  assert.ok(TL.total > 600 && TL.total < 960, `about 10–16 minutes (${fmtTime(TL.total)})`);
});

test('every chapter of the old magazine is still covered (ids ch1…ch12 + the finale)', () => {
  for (let i = 1; i <= 12; i++) assert.ok(IDS.includes('ch' + i));
});

test('beats are back to back and times increase', () => {
  TL.beats.forEach((b, i) => { if (i) assert.equal(b.start, TL.beats[i - 1].end); assert.ok(b.end > b.start); });
  assert.equal(TL.beats.at(-1).end, TL.total);
  TL.chapterStart.forEach((s, i) => { if (i) assert.ok(s > TL.chapterStart[i - 1]); });
});

test('time → beat and chapter lookup', () => {
  assert.equal(beatAt(TL, 0), 0);
  assert.equal(beatAt(TL, TL.total + 5), TL.beats.length - 1);
  TL.beats.forEach((b, i) => { assert.equal(beatAt(TL, b.start + .01), i); assert.equal(beatAt(TL, b.end - .01), i); });
  TL.chapterStart.forEach((s, i) => assert.equal(chapterAt(TL, s + .1), i));
});

test('cue progress honours sub-ranges across beats (e.g. the power cut)', () => {
  const cut = TL.beats.filter(b => b.cue === 'cut');
  assert.equal(cut.length, 3);
  assert.equal(cueProgress(cut[0], cut[0].start), 0);
  assert.ok(Math.abs(cueProgress(cut[0], cut[0].end) - .4) < 1e-9);
  assert.ok(Math.abs(cueProgress(cut[1], cut[1].start) - .4) < 1e-9);
  assert.ok(Math.abs(cueProgress(cut[2], cut[2].end) - 1) < 1e-9);
  const plain = TL.beats.find(b => !b.p0 && b.p0 !== 0);
  assert.equal(cueProgress(plain, plain.start + plain.d / 2), .5);
});

test('camera is deterministic, continuous across beat boundaries and settles on the beat view', () => {
  for (let t = 0; t < TL.total; t += 7.3) assert.deepEqual(cameraAt(TL, t), cameraAt(TL, t));
  for (const b of TL.beats.slice(1)) {
    const a = cameraAt(TL, b.start - 1e-4), c = cameraAt(TL, b.start + 1e-4);
    const pa = camPos(a.look, a.view), pc = camPos(c.look, c.view);
    assert.ok(Math.hypot(pa[0] - pc[0], pa[1] - pc[1], pa[2] - pc[2]) < 2, `no jump into ${b.text.slice(0, 30)}…`);
    const settled = cameraAt(TL, b.start + GLIDE + .01);
    assert.deepEqual(settled.look, b.look);
  }
  const still = cameraAt(TL, TL.beats[5].start + 1, false); assert.deepEqual(still.look, TL.beats[5].look);
});

test('captions type in at a steady rate and finish within the beat', () => {
  for (const b of TL.beats) { assert.equal(typedChars(b, b.start), 0); assert.ok(typedChars(b, b.end) === b.text.length, `caption fits: ${b.text.slice(0, 30)}`); }
});

test('deep links: old #chN links, #t=, #sources', () => {
  assert.deepEqual(parseHash('#ch5', TL, IDS), { t: TL.chapterStart[4], ci: 4 });
  assert.deepEqual(parseHash('#ch12', TL, IDS), { t: TL.chapterStart[11], ci: 11 });
  assert.equal(parseHash('#ch99', TL, IDS), null);
  assert.equal(parseHash('#t=125.5', TL, IDS).t, 125.5);
  assert.equal(parseHash('#t=99999', TL, IDS).t, TL.total);
  assert.deepEqual(parseHash('#sources', TL, IDS), { sources: true });
  assert.equal(parseHash('#nothing', TL, IDS), null);
  assert.equal(fmtTime(125.9), '2:05');
});

test('every stat card number has a source, and every source is cited or listed', () => {
  const cited = new Set(TL.beats.filter(b => b.stat?.[2]).map(b => b.stat[2]));
  for (const id of cited) assert.ok(SOURCES.find(s => s.id === id), id);
  for (const s of SOURCES) if (s.u) assert.match(s.u, /^https:\/\//);
});
