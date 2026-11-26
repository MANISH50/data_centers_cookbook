/* Issue 07 · the small flat diagrams over the photos, for ideas a camera can't see. Each takes the cue progress p
   (0..1) and returns { title, svg, status? }. Token splits, scores and attention patterns are illustrations (lab.js). */
import { svg, box, line, dot, text, chain, bars, step, lerp } from '../shared/diagram-kit.js';
import { tokenize, softmax, NEXT, ATTN_SENTENCE, attention, chipMaths } from './lab.js';

const chips = (toks, active = -1, { y = 8, size = 11 } = {}) => { let x = 2, o = '';
  toks.forEach((t, i) => { const label = t.replace(/ /g, '·'), w = Math.max(22, label.length * 7.2 + 12); if (x + w > 398) { x = 2; y += 32; } o += box(x, y, w, 26, label, i === active ? 'dg-warn' : i < active || active < 0 ? 'dg-on' : 'dg-off', { size, rx: 6 }); x += w + 6; });
  return { o, h: y + 30 }; };

export const DIAGRAMS = {
  journey: p => ({ title: 'One message, end to end', svg: chain(['You press Enter', 'Internet', 'Tokens', 'Layers on chips', 'Pick a token', 'Stream back'], step(p, 6), { per: 3, size: 11 }) }),
  arrive: p => ({ title: 'Arriving at the provider', svg: chain(['Your request', 'Check who + limits', 'Scheduler', 'A group of AI chips'], step(p, 4), { per: 4, size: 10.5 }) }),
  tokens: p => { const toks = tokenize(p < .5 ? 'How does a chat model answer?' : 'Hellooo, unreadable words!').map(t => t.t), n = Math.max(1, Math.ceil(((p % .5) / .5 + .01) * toks.length)); const c = chips(toks, n - 1);
    return { title: `Tokens (illustration): ${toks.length} for this text`, svg: svg(400, c.h, c.o) }; },
  vocab: () => { let o = ''; [['·the', 0], ['·cat', 1], ['·sat', 2], ['ing', 3], ['?', 4]].forEach(([t, i]) => { o += box(4 + i * 79, 6, 72, 30, t, 'dg-on', { size: 12 }) + text(40 + i * 79, 52, `#${[262, 3797, 3332, 278, 30][i]}`, { size: 11, cls: 'dg-muted' }); });
    return { title: 'Each token is a number in the vocabulary (illustrative numbers)', svg: svg(400, 60, o) }; },
  embed: p => { let o = text(4, 14, '“cat” →', { anchor: 'start', size: 12 }); const n = 28;
    for (let i = 0; i < n; i++) { const v = Math.sin(i * 1.7 + 1) * Math.cos(i * .6), h = Math.abs(v) * 30 * Math.min(1, p * 2 + .2); o += `<rect x="${60 + i * 12}" y="${v > 0 ? 34 - h : 34}" width="9" height="${Math.max(1, h)}" class="${v > 0 ? 'dg-on' : 'dg-warn'}"/>`; }
    o += text(398, 80, p >= .5 ? '… 12,288 numbers per token in GPT-3' : 'a long list of numbers', { anchor: 'end', size: 11, cls: 'dg-muted' });
    return { title: 'An embedding: a token as a list of numbers', svg: svg(400, 86, o) }; },
  stack: p => { const L = 8, k = step(p, L + 1); let o = '';
    for (let i = 0; i < L; i++) { const y = 96 - i * 12; o += `<rect x="70" y="${y}" width="260" height="10" rx="3" class="${i < k ? 'dg-on' : 'dg-off'}"/>`; }
    o += text(200, 10, 'layers (GPT-3 has 96)', { size: 11 }) + text(10, 100, 'tokens in', { anchor: 'start', size: 10, cls: 'dg-muted' }) + text(390, 14, 'next-token guess', { anchor: 'end', size: 10, cls: 'dg-muted' });
    if (p > .8) o += text(200, 120, 'each layer = attention + feed-forward', { size: 11 });
    return { title: 'A Transformer: a tall stack of layers', svg: svg(400, 126, o) }; },
  attn: p => { const i = 7, w = attention(i), words = ATTN_SENTENCE; let o = '', x = 4; const xs = [];
    words.forEach((t, j) => { const wd = t.length * 6.6 + 10; xs.push(x + wd / 2); o += box(x, 56, wd, 24, t, j === i ? 'dg-warn' : j < i ? 'dg-on' : 'dg-off', { size: 10, rx: 5 }); x += wd + 4; });
    if (p > .3) w.forEach((v, j) => { if (j === i) return; const a = xs[i], c = xs[j], h = 10 + Math.abs(a - c) * .25; o += `<path d="M${a} 56 Q${(a + c) / 2} ${56 - h * 1.4} ${c} 56" fill="none" stroke="var(--sky)" stroke-width="${(1 + v * 18).toFixed(1)}" opacity="${(.25 + v * 1.6).toFixed(2)}"/>`; });
    return { title: '“it” looks back (illustration)', svg: svg(400, 86, o), status: p > .3 ? `“it” pays most attention to “animal” (${Math.round(w[1] * 100)}%)` : null }; },
  qkv: () => ({ title: 'Each token makes three lists', svg: svg(400, 70, box(4, 18, 90, 34, 'token', 'dg-on', { size: 12 }) + line(96, 35, 120, 35, 'dg-hot') + [['Query', 'what I look for'], ['Key', 'what I contain'], ['Value', 'what I pass on']].map(([n, s], i) => box(124 + i * 92, 12, 86, 46, n, 'dg-warn', { size: 12, sub: s })).join('')) }),
  mask: () => { let o = ''; const n = 6; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) o += `<rect x="${130 + c * 22}" y="${4 + r * 16}" width="20" height="14" rx="2" class="${c <= r ? 'dg-on' : 'dg-off'}"/>`;
    o += text(124, 50, 'each token (row) sees', { anchor: 'end', size: 10.5 }) + text(124, 64, 'only earlier ones', { anchor: 'end', size: 10.5 }) + text(270, 50, '→ writes left to right', { anchor: 'start', size: 10.5 });
    return { title: 'Looking back only', svg: svg(400, 102, o) }; },
  matmul: p => { const k = step(p, 10); let o = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o += box(10 + c * 30, 10 + r * 30, 26, 26, String((r * 3 + c) % 7 + 1), r === Math.floor((k % 9) / 3) ? 'dg-warn' : 'dg-on', { size: 11, rx: 4 });
    o += text(112, 56, '×', { size: 18 }); for (let r = 0; r < 3; r++) o += box(126, 10 + r * 30, 26, 26, String(r + 2), 'dg-on', { size: 11, rx: 4 });
    o += text(168, 56, '=', { size: 18 }); for (let r = 0; r < 3; r++) o += box(184, 10 + r * 30, 34, 26, r <= Math.floor((k % 9) / 3) ? '✓' : '…', r <= Math.floor((k % 9) / 3) ? 'dg-ok' : 'dg-off', { size: 11, rx: 4 });
    o += text(232, 40, p < .5 ? 'every layer is grids of' : '175 billion parameters', { anchor: 'start', size: 11 }) + text(232, 56, p < .5 ? 'numbers multiplied' : '× 2 ≈ 350 billion', { anchor: 'start', size: 11 }) + text(232, 72, p < .5 ? 'and added up' : 'operations per token', { anchor: 'start', size: 11 });
    return { title: 'Matrix multiplication', svg: svg(400, 104, o) }; },
  cores: () => { let o = text(80, 14, 'CPU: a few big cores', { size: 11 }) + text(290, 14, 'AI chip: thousands of small ones', { size: 11 });
    for (let i = 0; i < 4; i++) o += box(20 + (i % 2) * 64, 22 + Math.floor(i / 2) * 40, 56, 34, '', 'dg-on');
    for (let i = 0; i < 180; i++) o += `<rect x="${190 + (i % 20) * 10}" y="${22 + Math.floor(i / 20) * 9}" width="8" height="7" rx="1" class="dg-on"/>`;
    return { title: 'Built for one job, at huge scale', svg: svg(400, 106, o) }; },
  systolic: () => { let o = ''; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { o += box(120 + c * 40, 6 + r * 24, 32, 18, '×+', 'dg-on', { size: 9, rx: 3 }); if (c < 5) o += line(152 + c * 40, 15 + r * 24, 160 + c * 40, 15 + r * 24, 'dg-hot'); }
    o += text(112, 40, 'numbers flow', { anchor: 'end', size: 11 }) + text(112, 56, 'through a grid', { anchor: 'end', size: 11 }) + text(112, 72, 'of multipliers', { anchor: 'end', size: 11 });
    return { title: 'A systolic array (TPU) / tensor cores (GPU)', svg: svg(400, 104, o) }; },
  hbm: () => { let o = box(150, 70, 100, 30, 'AI chip', 'dg-warn', { size: 12 }); [40, 290].forEach(x => { for (let i = 0; i < 6; i++) o += `<rect x="${x}" y="${84 - i * 12}" width="70" height="10" rx="2" class="dg-on"/>`; o += text(x + 35, 100, 'HBM stack', { size: 10, cls: 'dg-muted' }); });
    o += line(112, 80, 148, 82, 'dg-hot') + line(252, 82, 288, 80, 'dg-hot');
    return { title: 'High Bandwidth Memory: stacked, right beside the chip', svg: svg(400, 108, o) }; },
  membw: p => { const r = chipMaths({ params: 175e9, bits: 16, chips: 8 });
    return { title: 'Writing one token = reading every parameter', svg: bars([{ label: 'Weights (16-bit)', v: r.memGB, note: `${Math.round(r.memGB)} GB` }, { label: 'One H100 holds', v: 80, note: '80 GB', cls: 'dg-off' }], r.memGB, { lw: 120 }), status: p > .5 ? `On 8 H100s: reading it all once takes ≥ ${r.msPerToken.toFixed(0)} ms, so ≤ ${Math.floor(r.tokensPerSec)} tokens/s per pass` : `${Math.round(r.memGB)} GB needs at least ${r.minChips} H100s just to hold it` }; },
  split: p => { const pipe = p >= .5; let o = '';
    if (!pipe) { for (let c = 0; c < 4; c++) { o += box(10 + c * 98, 10, 88, 30, `chip ${c + 1}`, 'dg-warn', { size: 11 }); for (let l = 0; l < 3; l++) o += `<rect x="${14 + c * 98}" y="${48 + l * 12}" width="80" height="9" rx="2" class="dg-on"/>`; } o += text(200, 100, 'each chip holds a slice of every layer', { size: 11 }); }
    else { for (let c = 0; c < 4; c++) { o += box(10 + c * 98, 30, 84, 34, `layers ${c * 24 + 1}–${c * 24 + 24}`, 'dg-on', { size: 10 }); if (c < 3) o += line(96 + c * 98, 47, 106 + c * 98, 47, 'dg-hot'); } o += text(200, 96, 'an assembly line of chips (96 layers)', { size: 11 }); }
    return { title: pipe ? 'Pipeline parallelism' : 'Tensor parallelism', svg: svg(400, 106, o) }; },
  phases: p => { const dec = p >= .45, toks = ['How', '·does', '·a', '·chip', '·work', '?']; let o = '';
    toks.forEach((t, i) => { o += box(4 + i * 56, 8, 50, 26, t, dec ? 'dg-off' : 'dg-warn', { size: 10, rx: 5 }); });
    const out = ['It', '·splits', '·the', '·work…'], n = dec ? Math.max(1, Math.ceil((p - .45) / .55 * out.length)) : 0;
    out.slice(0, n).forEach((t, i) => { o += box(4 + i * 70, 52, 64, 26, t, i === n - 1 ? 'dg-warn' : 'dg-on', { size: 10, rx: 5 }); });
    return { title: dec ? 'Decode: one token at a time' : 'Prefill: the whole prompt at once', svg: svg(400, 84, o) }; },
  kv: p => { const n = 2 + Math.floor(p * 9); let o = text(4, 14, 'KV cache (keys + values of earlier tokens)', { anchor: 'start', size: 11 });
    for (let i = 0; i < n; i++) o += `<rect x="${4 + i * 36}" y="24" width="32" height="16" rx="3" class="dg-on"/><rect x="${4 + i * 36}" y="44" width="32" height="16" rx="3" class="dg-on" opacity=".7"/>`;
    o += `<rect x="${4 + n * 36}" y="24" width="32" height="36" rx="3" class="dg-warn"/>` + text(4, 80, 'the new token computes only its own, then looks back at the cache', { anchor: 'start', size: 10.5, cls: 'dg-muted' });
    return { title: 'The KV cache grows with every token', svg: svg(400, 86, o) }; },
  probs: (p, b) => { const ex = NEXT[0], T = p < .7 ? 1 : lerp(1, .4, (p - .7) / .3), pr = softmax(ex.options.map(o => o[1]), T), k = pr.indexOf(Math.max(...pr));
    return { title: `“${ex.prompt} …” (illustrative scores)`, svg: bars(ex.options.map((o, i) => ({ label: o[0], v: pr[i], note: `${Math.round(pr[i] * 100)}%`, cls: p > .4 && i === k ? 'dg-warn' : 'dg-on' })), 1, { bh: 14, gap: 6, lw: 80 }), status: p > .7 ? `temperature ${T.toFixed(1)}: the odds get sharper` : null }; },
  loop: () => ({ title: 'The loop', svg: chain(['Conversation', 'All the layers', 'Probabilities', 'Pick one token', 'Add it, repeat'], 3, { per: 5, size: 10 }) }),
  stream: p => { const words = ['Chips', '·split', '·the', '·model', '·and', '·stream', '·each', '·token', '·back.'], n = Math.max(1, Math.ceil(p * words.length)); const c = chips(words.slice(0, n), n - 1);
    return { title: 'Streaming: each token is sent as soon as it’s chosen', svg: svg(400, c.h, c.o) }; },
  batch: () => { let o = ''; ['Ana', 'Ben', 'Chen', 'Dev', 'Eli'].forEach((n, i) => { o += box(4, 4 + i * 20, 70, 16, n, 'dg-on', { size: 9, rx: 3 }) + line(76, 12 + i * 20, 150, 52, 'dg-hot'); });
    o += box(150, 34, 110, 36, 'One pass', 'dg-warn', { size: 12, sub: 'reads weights once' }) + line(262, 52, 300, 52, 'dg-hot') + box(300, 34, 96, 36, '5 next tokens', 'dg-on', { size: 11 });
    return { title: 'Batching: many conversations, one read', svg: svg(400, 104, o) }; },
  spec: () => ({ title: 'Speculative decoding', svg: chain(['Small model guesses 4 tokens', 'Big model checks all 4 in one pass', 'Keep the right ones'], 2, { per: 3, size: 10 }) }),
  quant: () => { const r16 = chipMaths({ params: 70e9, bits: 16 }), r8 = chipMaths({ params: 70e9, bits: 8 }), r4 = chipMaths({ params: 70e9, bits: 4 });
    return { title: 'Fewer bits per number (a 70-billion-parameter example)', svg: bars([{ label: '16-bit', v: r16.memGB, note: `${r16.memGB} GB` }, { label: '8-bit', v: r8.memGB, note: `${r8.memGB} GB` }, { label: '4-bit', v: r4.memGB, note: `${r4.memGB} GB`, cls: 'dg-warn' }], r16.memGB, { lw: 60 }) }; },
  layerparams: () => { const d = 12288, att = 4 * d * d, ffn = 2 * d * 4 * d, per = att + ffn;
    return { title: 'Parameters in one GPT-3 layer (from its published sizes)', svg: bars([{ label: 'Attention: 4 × d × d', v: att, note: `${(att / 1e9).toFixed(2)} billion`, cls: 'dg-on' }, { label: 'Feed-forward: 2 × d × 4d', v: ffn, note: `${(ffn / 1e9).toFixed(2)} billion`, cls: 'dg-warn' }], ffn, { lw: 160 }), status: `${(per / 1e9).toFixed(2)} billion per layer × 96 layers ≈ ${Math.round(per * 96 / 1e9)} billion` }; },
  kvsize: p => { const per = 2 * 96 * 12288 * 2, n = p < .5 ? 1 : 2048;
    return { title: 'KV cache, if built like GPT-3 with 16-bit numbers', svg: bars([{ label: 'per token', v: per, note: `${(per / 1e6).toFixed(1)} MB` }, { label: '2,048 tokens', v: per * 2048, note: `${(per * 2048 / 1e9).toFixed(1)} GB`, cls: p < .5 ? 'dg-off' : 'dg-warn' }], per * 2048, { lw: 100 }), status: '2 (key + value) × 96 layers × 12,288 numbers × 2 bytes' }; },
  recap: p => ({ title: 'The whole trip', svg: chain(['Enter', 'Tokens', 'Embeddings', 'Attention + layers', 'Many chips + HBM', 'Probabilities', 'Pick', 'Stream'], step(p, 8), { per: 4, size: 10 }) })
};
