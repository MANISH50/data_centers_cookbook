// node --test shared/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, beatAt, chapterAt, cueProgress, typedChars, parseHash, fmtTime, validate } from '../timeline.js';
import { CHAPTERS, SOURCES } from '../../data-centers/data.js';

const TL = buildTimeline(CHAPTERS), IDS = CHAPTERS.map(c => c.id);

test('beats are back to back, numbered, and times increase', () => {
  TL.beats.forEach((b, i) => { assert.equal(b.i, i); if (i) assert.equal(b.start, TL.beats[i - 1].end); assert.ok(b.end > b.start); });
  assert.equal(TL.beats.at(-1).end, TL.total);
  TL.chapterStart.forEach((s, i) => { if (i) assert.ok(s > TL.chapterStart[i - 1]); });
});
test('time → beat and chapter lookup', () => {
  assert.equal(beatAt(TL, 0), 0); assert.equal(beatAt(TL, -3), 0); assert.equal(beatAt(TL, TL.total + 5), TL.beats.length - 1);
  TL.beats.forEach((b, i) => { assert.equal(beatAt(TL, b.start + .01), i); assert.equal(beatAt(TL, b.end - .01), i); });
  TL.chapterStart.forEach((s, i) => assert.equal(chapterAt(TL, s + .1), i));
});
test('cue progress honours sub-ranges that span beats', () => {
  const cut = TL.beats.filter(b => b.cue === 'cut');
  assert.equal(cut.length, 3);
  assert.equal(cueProgress(cut[0], cut[0].start), 0);
  assert.ok(Math.abs(cueProgress(cut[0], cut[0].end) - .4) < 1e-9);
  assert.ok(Math.abs(cueProgress(cut[1], cut[1].start) - .4) < 1e-9);
  assert.ok(Math.abs(cueProgress(cut[2], cut[2].end) - 1) < 1e-9);
  const plain = TL.beats.find(b => b.p0 == null); assert.equal(cueProgress(plain, plain.start + plain.d / 2), .5);
});
test('captions type in and finish within their beat', () => {
  for (const b of TL.beats) { assert.equal(typedChars(b, b.start), 0); assert.equal(typedChars(b, b.end), b.text.length, b.text.slice(0, 30)); }
});
test('deep links: #chN, #t=, #sources, #photos', () => {
  assert.deepEqual(parseHash('#ch5', TL, IDS), { t: TL.chapterStart[4], ci: 4 });
  assert.equal(parseHash('#ch99', TL, IDS), null);
  assert.equal(parseHash('#t=125.5', TL, IDS).t, 125.5);
  assert.equal(parseHash('#t=99999', TL, IDS).t, TL.total);
  assert.deepEqual(parseHash('#sources', TL, IDS), { sources: true });
  assert.deepEqual(parseHash('#photos', TL, IDS), { photos: true });
  assert.equal(parseHash('#nothing', TL, IDS), null);
  assert.equal(fmtTime(125.9), '2:05');
});
test('validate catches bad content', () => {
  assert.deepEqual(validate(CHAPTERS, SOURCES, 13), []);
  const bad = [{ id: 'ch2', title: '', sub: '', beats: [{ text: 'short', d: 30, stat: ['1', 'x', 'nope'] }] }];
  const errs = validate(bad, SOURCES, 2);
  for (const re of [/expected 2 chapters/, /id should be ch1/, /missing title/, /caption too short/, /duration 30/, /unknown source nope/]) assert.ok(errs.some(e => re.test(e)), re);
});
