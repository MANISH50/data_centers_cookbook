// Unit tests: node --test data-centers/tests/*.test.mjs   (shared helpers: shared/tests/*.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import { SOURCES, CHAPTERS, RECAPS, PHOTOS } from '../data.js';
import { DIAGRAMS } from '../diagrams.js';
import { buildTimeline, cueProgress, fmtTime, validate } from '../../shared/timeline.js';

const TL = buildTimeline(CHAPTERS), IDS = CHAPTERS.map(c => c.id);

test('content: 13 chapters, valid beats, recaps, about 13 minutes', () => {
  assert.deepEqual(validate(CHAPTERS, SOURCES, 13), []);
  for (const c of CHAPTERS) assert.ok(RECAPS[c.id]?.length, `${c.id} has a recap`);
  assert.ok(TL.total > 600 && TL.total < 960, `about 10–16 minutes (${fmtTime(TL.total)})`);
  for (let i = 1; i <= 12; i++) assert.ok(IDS.includes('ch' + i), 'old magazine links #ch1…#ch12 still land');
});
test('a real photo from the first second, and plenty of different ones', () => {
  assert.ok(TL.beats[0].photo);
  assert.ok(PHOTOS.length >= 40, `${PHOTOS.length} photos`);
  const changes = TL.beats.filter((b, i) => i && b.photo !== TL.beats[i - 1].photo).length;
  assert.ok(changes / TL.beats.length > .6, 'the photo changes on most beats');
});
test('no caption still talks about the old 3D scene', () => {
  for (const b of TL.beats) assert.doesNotMatch(b.text, /\b(3D|drag|light(s)? up|on this globe)\b/i, b.text.slice(0, 40));
});
test('every diagram draws at the start, middle and end of its beats', () => {
  const cues = new Set(TL.beats.map(b => b.cue).filter(Boolean));
  for (const b of TL.beats) if (b.cue && DIAGRAMS[b.cue]) for (const t of [b.start, b.start + b.d / 2, b.end]) {
    const out = DIAGRAMS[b.cue](cueProgress(b, t), b);
    assert.match(out.svg, /^<svg viewBox="0 0 \d+ \d+"/, b.cue); assert.ok(out.title, b.cue);
    assert.doesNotMatch(out.svg, /NaN|undefined/, b.cue);
  }
  for (const c of ['smc', 'storage', 'req', 'power', 'cut', 'red', 'nines', 'tiers', 'virt', 'pue']) assert.ok(cues.has(c) && DIAGRAMS[c], c);
});
test('the power cut diagram tells the story in order', () => {
  const s = p => DIAGRAMS.cut(p).status;
  assert.equal(s(0), 'Grid: on'); assert.match(s(.3), /UPS batteries/); assert.match(s(.6), /generators/); assert.match(s(1), /back/);
});
test('every stat card number has a source with a safe link', () => {
  for (const b of TL.beats) if (b.stat?.[2]) assert.ok(SOURCES.find(s => s.id === b.stat[2]), b.stat[2]);
  for (const s of SOURCES) if (s.u) assert.match(s.u, /^https:\/\//);
});
