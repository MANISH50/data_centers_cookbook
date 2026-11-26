/* Issue 07 · "Try it" panels: a tokenizer, a next-token picker, an attention view and chip maths.
   All logic is in lab.js (unit-tested); the tokenizer, scores and attention pattern are illustrations. */
import { VOCAB, tokenize, softmax, topP, sample, rng, NEXT, ATTN_SENTENCE, attention, matVecSteps, chipMaths, H100 } from './lab.js';
import { bars } from '../shared/diagram-kit.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (v, d = 0) => Number(v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });

export function createTry({ wt, track }) {
  const $ = s => document.querySelector(s), root = document.documentElement;
  let open = null, wasPlaying = false;
  const TITLES = { tokens: 'Cut text into tokens', next: 'Pick the next word', attn: 'Where does a word look?', chip: 'Chip maths' };

  function show(kind) {
    wasPlaying = wt.playing; if (wasPlaying) wt.setPlaying(false); wt.guide?.stop?.();
    open = kind; $('#tryTitle').textContent = TITLES[kind]; const body = $('#tryBody');
    if (kind === 'tokens') {
      body.innerHTML = `<label class="tryfull">Your text<textarea id="tText" rows="3">How does a chat model answer my question so fast?</textarea></label><div class="toks" id="tToks" aria-live="polite"></div><dl class="tryres" id="tRes"></dl><p class="tryfine">An illustrative tokenizer with a tiny vocabulary of ${VOCAB.length} pieces; real ones learn tens of thousands. · marks a space.</p>`;
      const run = () => { const toks = tokenize($('#tText').value); const n = toks.length, ch = [...$('#tText').value].length;
        $('#tToks').innerHTML = toks.map((t, i) => `<span class="tok c${i % 6}" title="token #${t.id}">${esc(t.t.replace(/ /g, '·').replace(/\n/g, '⏎'))}</span>`).join('');
        $('#tRes').innerHTML = `<dt>Characters</dt><dd>${ch}</dd><dt>Tokens</dt><dd>${n}</dd><dt>Characters per token</dt><dd>${n ? (ch / n).toFixed(1) : '0'}</dd>`; };
      $('#tText').addEventListener('input', run); run();
    } else if (kind === 'next') {
      body.innerHTML = `<div class="tryrow"><label class="wide">Start of a sentence<select id="tPrompt">${NEXT.map((n, i) => `<option value="${i}">${esc(n.prompt)} …</option>`).join('')}</select></label></div>
        <div class="tryrow"><label>Temperature <output id="tTo">1.0</output><input type="range" id="tT" min="0.1" max="2" step="0.1" value="1"></label><label>Top-p <output id="tPo">1.00</output><input type="range" id="tP" min="0.3" max="1" step="0.05" value="1"></label></div>
        <div class="tryviz" id="tViz"></div><div class="tryrow"><button class="tbtn" id="tPick">🎲 Pick a word</button></div><p class="trystep" id="tOut" aria-live="polite"></p><p class="tryfine">Illustrative scores, not from a real model; the maths (softmax, temperature, top-p, sampling) is real.</p>`;
      const r = rng(7); const probs = () => { const ex = NEXT[+$('#tPrompt').value]; return [ex, topP(softmax(ex.options.map(o => o[1]), +$('#tT').value), +$('#tP').value)]; };
      const draw = () => { const [ex, pr] = probs(); $('#tTo').textContent = (+$('#tT').value).toFixed(1); $('#tPo').textContent = (+$('#tP').value).toFixed(2);
        $('#tViz').innerHTML = bars(ex.options.map((o, i) => ({ label: o[0], v: pr[i], note: pr[i] ? `${(pr[i] * 100).toFixed(1)}%` : 'cut by top-p', cls: pr[i] ? 'dg-on' : 'dg-off' })), 1, { bh: 14, gap: 6, lw: 80 }); };
      ['tPrompt', 'tT', 'tP'].forEach(id => $('#' + id).addEventListener('input', draw)); draw();
      $('#tPick').onclick = () => { const [ex, pr] = probs(), k = sample(pr, r()); $('#tOut').textContent = `${ex.prompt} ${ex.options[k][0]}`; track('try_pick', { word: ex.options[k][0] }); };
    } else if (kind === 'attn') {
      body.innerHTML = `<p class="trystep">Tap a word to see which earlier words it looks at.</p><div class="toks lg" id="tWords">${ATTN_SENTENCE.map((w, i) => `<button class="tok wbtn" data-i="${i}">${esc(w)}</button>`).join('')}</div><dl class="tryres" id="tRes" aria-live="polite"></dl><p class="tryfine">An illustrative pattern for one attention head; real models have many heads, each looking for different things.</p>`;
      const pick = i => { const w = attention(i); document.querySelectorAll('#tWords .wbtn').forEach((b, j) => { const v = j <= i ? w[j] : 0; b.style.setProperty('--w', v.toFixed(3)); b.classList.toggle('sel', j === i); b.classList.toggle('future', j > i); b.setAttribute('aria-pressed', j === i); });
        const top = w.map((v, j) => [v, j]).filter(([, j]) => j !== i).sort((a, b) => b[0] - a[0]).slice(0, 2);
        $('#tRes').innerHTML = `<dt>Word</dt><dd>“${esc(ATTN_SENTENCE[i])}”</dd><dt>Looks most at</dt><dd>${top.length ? top.map(([v, j]) => `“${esc(ATTN_SENTENCE[j])}” ${Math.round(v * 100)}%`).join(', ') : 'only itself (it’s the first word)'}</dd><dt>Later words</dt><dd>hidden: a chat model only looks back</dd>`; };
      document.querySelectorAll('#tWords .wbtn').forEach(b => b.onclick = () => pick(+b.dataset.i)); pick(7);
    } else if (kind === 'chip') {
      const A = [[2, 1, 0], [1, 3, 1], [0, 2, 4]], x = [1, 2, 3], { steps, y } = matVecSteps(A, x);
      body.innerHTML = `<p class="trystep" id="tStep">A tiny layer: 3×3 numbers times a list of 3. Press Step.</p><div class="mm" id="tMM"></div><div class="tryrow"><button class="tbtn" id="tStepBtn">Step ▶</button><button class="tbtn" id="tAll">All at once ⚡</button></div>
        <h3 class="tryh">A real model on real chips</h3><div class="tryrow"><label>Model size<select id="tSize"><option value="7e9">7 billion</option><option value="70e9" selected>70 billion</option><option value="175e9">175 billion (GPT-3)</option></select></label><label>Number size<select id="tBits"><option value="16">16-bit</option><option value="8">8-bit</option><option value="4">4-bit</option></select></label><label>H100s<select id="tChips">${[1, 2, 4, 8, 16].map(n => `<option${n === 8 ? ' selected' : ''}>${n}</option>`).join('')}</select></label></div>
        <dl class="tryres" id="tRes" aria-live="polite"></dl><p class="tryfine">Uses NVIDIA’s published H100 figures (80 GB, 3.35 TB/s, 1,979 trillion FP16 operations a second with sparsity) and about 2 operations per parameter per token. Real systems add overheads and batch many users, so treat these as best-case limits for one conversation.</p>`;
      let k = 0; const grid = () => { const cur = steps[k - 1]; $('#tMM').innerHTML = `<table class="mmt"><tbody>${A.map((row, i) => `<tr>${row.map((a, j) => `<td class="${cur && cur.i === i && cur.j === j ? 'hot' : ''}">${a}</td>`).join('')}<td class="op">${i === 1 ? '×' : ''}</td><td class="${cur && cur.j === i ? 'hot' : ''}">${x[i]}</td><td class="op">${i === 1 ? '=' : ''}</td><td class="res">${steps.slice(0, k).filter(s => s.i === i).at(-1)?.partial ?? '…'}</td></tr>`).join('')}</tbody></table>`;
        $('#tStep').textContent = k === 0 ? 'A tiny layer: 3×3 numbers times a list of 3. Press Step.' : k < steps.length ? `Step ${k} of ${steps.length}: ${cur.a} × ${cur.x} added to row ${cur.i + 1} → ${cur.partial}` : `Done: ${steps.length} multiply-adds gave [${y.join(', ')}]. A tensor core does whole blocks like this in one step; a big model needs hundreds of billions per token.`; };
      $('#tStepBtn').onclick = () => { k = k >= steps.length ? 0 : k + 1; grid(); }; $('#tAll').onclick = () => { k = steps.length; grid(); };
      const calc = () => { const r = chipMaths({ params: +$('#tSize').value, bits: +$('#tBits').value, chips: +$('#tChips').value, chip: H100 });
        $('#tRes').innerHTML = `<dt>Memory for the weights</dt><dd>${fmt(r.memGB)} GB (one H100 has ${H100.memGB} GB)</dd><dt>H100s needed just to hold it</dt><dd>${r.minChips}${r.fits ? '' : ' · not enough chips selected!'}</dd>` + (r.fits ? `<dt>Reading all weights once</dt><dd>≥ ${fmt(r.msPerToken, 1)} ms → at most ~${fmt(r.tokensPerSec)} tokens/s</dd><dt>Arithmetic per token</dt><dd>${fmt(r.flops / 1e9)} billion operations → ${fmt(r.msCompute, 3)} ms at peak</dd><dt>So the limit is</dt><dd>${r.memoryBound ? 'memory speed (as the walkthrough says)' : 'arithmetic'}</dd>` : ''); };
      ['tSize', 'tBits', 'tChips'].forEach(id => $('#' + id).addEventListener('input', calc)); grid(); calc();
    }
    $('#tryPanel').hidden = false; root.classList.add('trying'); $('#tryClose').focus(); track('try_it', { kind });
  }
  function close() { if (!open) return; open = null; $('#tryPanel').hidden = true; root.classList.remove('trying'); wt.redraw(); if (wasPlaying) wt.setPlaying(true); }
  $('#tryBtn').onclick = () => { const b = wt.TL.beats.find(x => x.start <= wt.t && wt.t < x.end) || wt.TL.beats.at(-1); if (b.try) show(b.try); };
  $('#tryClose').onclick = close;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) close(); });
  return { beat(b) { $('#tryBtn').hidden = !b.try; }, show, close, get state() { return open; } };
}
