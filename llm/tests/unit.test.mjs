// Unit tests: node --test llm/tests/*.test.mjs   (shared helpers: shared/tests/*.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import { SOURCES, CHAPTERS, RECAPS, PHOTOS } from '../data.js';
import { DIAGRAMS } from '../diagrams.js';
import { buildTimeline, cueProgress, validate, fmtTime } from '../../shared/timeline.js';
import { VOCAB, tokenize, softmax, topP, sample, rng, NEXT, ATTN_SENTENCE, attention, matVecSteps, chipMaths, H100 } from '../lab.js';

const TL = buildTimeline(CHAPTERS);

test('content: 16 chapters, valid beats and sources, recaps, about 15 minutes', () => {
  assert.deepEqual(validate(CHAPTERS, SOURCES, 16), []);
  for (const c of CHAPTERS) { assert.ok(RECAPS[c.id]?.length, c.id); assert.ok(c.where, c.id); }
  assert.ok(TL.total >= 14 * 60 && TL.total <= 20 * 60, fmtTime(TL.total));
  for (const s of SOURCES) if (s.u) assert.match(s.u, /^https:\/\//);
  for (const b of TL.beats) if (b.try) assert.ok(['tokens', 'next', 'attn', 'chip'].includes(b.try), b.try);
  assert.ok(TL.beats[0].photo && PHOTOS.length >= 20);
});
test('every diagram draws at the start, middle and end of its beats', () => {
  for (const b of TL.beats) if (b.cue) {
    assert.ok(DIAGRAMS[b.cue], 'diagram for ' + b.cue);
    for (const t of [b.start, b.start + b.d / 2, b.end]) { const o = DIAGRAMS[b.cue](cueProgress(b, t), b); assert.match(o.svg, /^<svg viewBox/); assert.doesNotMatch(o.svg + (o.status || ''), /NaN|undefined|Infinity/, b.cue); }
  }
});
test('the published GPT-3 sizes add up: 12 × 12,288² × 96 ≈ 175 billion; KV cache ≈ 4.7 MB a token', () => {
  const d = 12288, perLayer = 4 * d * d + 2 * d * 4 * d;
  assert.ok(Math.abs(perLayer * 96 / 1e9 - 174) < 1.5, `${(perLayer * 96 / 1e9).toFixed(1)} billion`);
  assert.ok(Math.abs(2 * 96 * d * 2 / 1e6 - 4.72) < .01);
  assert.match(DIAGRAMS.layerparams().status, /≈ 174 billion/);
});
test('tokenizer (illustration): splits text, never loses a character, and is greedy', () => {
  for (const s of ['How does a chat model answer?', 'Hellooo, unreadable words!', 'ünïcödé 🙂 ok', '']) assert.equal(tokenize(s).map(t => t.t).join(''), s);
  assert.deepEqual(tokenize(' the cat').map(t => t.t), [' the', ' cat']);
  assert.ok(tokenize('unreadable').length > 1, 'a rare word becomes several pieces');
  assert.ok(VOCAB.length > 50 && new Set(VOCAB).size === VOCAB.length);
  assert.ok(tokenize('🙂')[0].id >= 1000, 'unknown characters get their own token');
});
test('softmax, temperature, top-p and sampling behave', () => {
  const p = softmax([2, 1, 0]); assert.ok(Math.abs(p.reduce((a, b) => a + b) - 1) < 1e-12); assert.ok(p[0] > p[1] && p[1] > p[2]);
  assert.ok(softmax([2, 1, 0], .2)[0] > softmax([2, 1, 0], 2)[0], 'low temperature sharpens');
  assert.deepEqual(topP([.6, .3, .1], .5).map(v => +v.toFixed(3)), [1, 0, 0]);
  assert.deepEqual(topP([.6, .3, .1], .85).map(v => +v.toFixed(3)), [.667, .333, 0]);
  assert.equal(sample([.2, .5, .3], .1), 0); assert.equal(sample([.2, .5, .3], .69), 1); assert.equal(sample([.2, .5, .3], .99), 2);
  const r1 = rng(7), r2 = rng(7); assert.equal(r1(), r2(), 'seeded'); const r = rng(3); for (let i = 0; i < 100; i++) { const v = r(); assert.ok(v >= 0 && v < 1); }
  for (const n of NEXT) assert.ok(n.options.length >= 5);
});
test('attention (illustration): looks only back, sums to 1, and “it” looks most at “animal”', () => {
  for (let i = 0; i < ATTN_SENTENCE.length; i++) { const w = attention(i); assert.equal(w.length, i + 1); assert.ok(Math.abs(w.reduce((a, b) => a + b) - 1) < 1e-9); }
  const w = attention(7); assert.equal(ATTN_SENTENCE[7], 'it'); const best = w.slice(0, 7).indexOf(Math.max(...w.slice(0, 7))); assert.equal(ATTN_SENTENCE[best], 'animal');
});
test('chip maths: matrix steps and H100 memory/bandwidth limits', () => {
  const { steps, y } = matVecSteps([[2, 1, 0], [1, 3, 1], [0, 2, 4]], [1, 2, 3]); assert.equal(steps.length, 9); assert.deepEqual(y, [4, 10, 16]);
  const r = chipMaths({ params: 175e9, bits: 16, chips: 8, chip: H100 });
  assert.equal(r.memGB, 350); assert.equal(r.minChips, 5); assert.ok(r.fits);
  assert.ok(Math.abs(r.msPerToken - 350e9 / (3.35e12 * 8) * 1000) < 1e-9);
  assert.ok(r.memoryBound, 'one conversation is limited by memory speed, as the walkthrough says');
  assert.equal(chipMaths({ params: 70e9, bits: 4 }).memGB, 35);
  assert.ok(!chipMaths({ params: 175e9, bits: 16, chips: 2 }).fits);
});
