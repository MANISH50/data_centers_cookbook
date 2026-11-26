/* Issue 07 · the maths behind the Try it panels (no DOM): unit-tested in llm/tests/unit.test.mjs.
   The tokenizer, the next-word scores and the attention pattern are small ILLUSTRATIONS, not Claude's real ones.
   The chip maths uses real published numbers (NVIDIA H100) and real arithmetic. */

/* ---------- 1. A tiny illustrative tokenizer: greedy longest match over a small vocabulary ---------- */
const PIECES = [' the', ' and', ' to', ' of', ' a', ' in', ' is', ' it', ' you', ' that', ' for', ' on', ' with', ' are', ' this', ' be', ' was', ' as',
  ' how', ' what', ' why', ' does', ' do', ' can', ' my', ' your', ' work', ' works', ' chip', ' chips', ' data', ' model', ' answer', ' token', ' word',
  ' words', ' question', ' chat', ' AI', ' hello', ' world', ' cat', ' sat', ' mat', ' center', ' energy', ' fast', ' learn', ' read', ' write', ' time',
  'The', 'How', 'What', 'Why', 'Hello', 'I', 'A', 'It', 'This', 'Can',
  'ing', 'ed', 'er', 'est', 'ly', 'tion', 'ation', 'ment', 'ness', 'able', 'ize', 'ise', 's', 'es', 'un', 're', 'pre', 'ex', 'in', 'on', 'an', 'at', 'en', 'or',
  'th', 'he', 'll', 'oo', 'ee', 'ch', 'sh', 'st', 'ar', 'al', 'ou', 'ow', 'gr', 'pl', 'tr', ' ', '.', ',', '?', '!', "'", '"', ':', ';', '-', '\n'];
export const VOCAB = [...new Set(PIECES)];
const VSET = new Map(VOCAB.map((p, i) => [p, i]));
const MAXLEN = Math.max(...VOCAB.map(p => p.length));
/* tokens of `text`: [{ t: text piece, id: number }]. Unknown characters become single-character tokens (id ≥ 1000). */
export function tokenize(text) {
  const out = []; let i = 0; const s = String(text || '');
  while (i < s.length) {
    let len = Math.min(MAXLEN, s.length - i), hit = null;
    for (; len > 0; len--) { const piece = s.slice(i, i + len); if (VSET.has(piece)) { hit = piece; break; } }
    if (!hit) { const ch = String.fromCodePoint(s.codePointAt(i)); out.push({ t: ch, id: 1000 + s.codePointAt(i) }); i += ch.length; continue; }
    out.push({ t: hit, id: VSET.get(hit) }); i += hit.length;
  }
  return out;
}

/* ---------- 2. Next-token probabilities, temperature and top-p ---------- */
export function softmax(scores, temperature = 1) {
  const T = Math.max(.05, temperature), m = Math.max(...scores), e = scores.map(s => Math.exp((s - m) / T)), z = e.reduce((a, b) => a + b, 0);
  return e.map(x => x / z);
}
/* keep the smallest set of top choices whose probabilities add up to at least p, renormalised (others become 0) */
export function topP(probs, p = 1) {
  const order = probs.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]); const keep = new Set(); let sum = 0;
  for (const [v, i] of order) { keep.add(i); sum += v; if (sum >= p - 1e-12) break; }
  const z = probs.reduce((a, v, i) => a + (keep.has(i) ? v : 0), 0);
  return probs.map((v, i) => keep.has(i) ? v / z : 0);
}
/* pick an index with random number r in [0, 1) */
export function sample(probs, r) { let c = 0; for (let i = 0; i < probs.length; i++) { c += probs[i]; if (r < c) return i; } return probs.length - 1; }
/* a small seeded random generator, so the panel and the tests are repeatable */
export function rng(seed = 1) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
/* illustrative candidates and scores (not from a real model) */
export const NEXT = [
  { prompt: 'The cat sat on the', options: [['mat', 3.2], ['floor', 2.4], ['sofa', 2.1], ['roof', 1.3], ['keyboard', .9], ['moon', -.8]] },
  { prompt: 'The capital of France is', options: [['Paris', 6], ['a', 1.6], ['the', 1.2], ['Lyon', -.5], ['beautiful', -.2], ['London', -2]] },
  { prompt: 'Once upon a time, there was a', options: [['little', 2.6], ['king', 2.1], ['young', 2], ['dragon', 1.5], ['robot', 1.1], ['spoon', -.4]] }
];

/* ---------- 3. An illustrative attention pattern ---------- */
export const ATTN_SENTENCE = ['The', 'animal', 'didn’t', 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired'];
const LINKS = { 7: { 1: 4.2, 5: 1.4 }, 10: { 7: 2.6, 1: 2.4 }, 8: { 7: 2.2 }, 2: { 1: 1.8 }, 3: { 1: 1.6, 2: 1.2 }, 5: { 3: 1.8, 4: 1.2 }, 6: { 3: 1 }, 9: { 10: 0 } };
/* weights that token i gives to tokens 0..i (a chat model only looks back); sum to 1 */
export function attention(i) {
  const raw = [];
  for (let j = 0; j <= i; j++) raw.push((j === i ? .8 : .3 / (1 + (i - j) * .4)) + (LINKS[i]?.[j] || 0));
  const e = raw.map(x => Math.exp(x)), z = e.reduce((a, b) => a + b, 0);
  return e.map(x => x / z);
}

/* ---------- 4. Chip maths ---------- */
export const H100 = { name: 'NVIDIA H100 (SXM)', memGB: 80, bwTBs: 3.35, tflops16: 1979 }; // NVIDIA specifications; FP16 figure is with sparsity
/* multiply a matrix by a vector one multiply-add at a time: the list of steps */
export function matVecSteps(A, x) {
  const steps = []; const y = A.map(() => 0);
  A.forEach((row, i) => row.forEach((a, j) => { y[i] += a * x[j]; steps.push({ i, j, a, x: x[j], partial: y[i] }); }));
  return { steps, y };
}
/* a model of `params` parameters stored with `bits` bits each, on `chips` chips like `chip` */
export function chipMaths({ params, bits = 16, chips = 1, chip = H100 }) {
  const bytes = params * bits / 8, memGB = bytes / 1e9;
  const minChips = Math.ceil(memGB / chip.memGB);
  const fits = chips >= minChips;
  const msPerToken = bytes / (chip.bwTBs * 1e12 * chips) * 1000;   // reading every parameter once
  const flops = 2 * params;                                         // about 2 operations per parameter per token
  const msCompute = flops / (chip.tflops16 * 1e12 * chips) * 1000;  // at the peak rate (with sparsity)
  return { memGB, minChips, fits, msPerToken, tokensPerSec: 1000 / msPerToken, flops, msCompute, memoryBound: msPerToken > msCompute };
}
