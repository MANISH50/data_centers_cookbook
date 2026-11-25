/* PHOTO WALKTHROUGH PLAYER, shared by Issue 01 (data-centers/) and Issue 06 (internet/).
   A self-playing film of real photos: each beat shows a photo with a slow pan and zoom (shared/photos.js),
   a typed caption read aloud by the guide (shared/anchor.js), labels pinned to parts of the photo, an optional
   stat card, and, only for ideas a camera can't see, a small flat diagram. Scrub, pause, chapters, speed, captions,
   text version, Sources and a Photos gallery. Everything on screen is a function of the time t. */
import { buildTimeline, beatAt, cueProgress, typedChars, parseHash, fmtTime } from './timeline.js';
import { kenBurns, drift, fadeIn, layout, uvToPx } from './photos.js';
import { createAnchor, holdAt } from './anchor.js';

export function startWalkthrough({ slug, CHAPTERS, SOURCES, PHOTOS, DIAGRAMS = {}, base = '', extras = null }) {
  const $ = s => document.querySelector(s);
  const root = document.documentElement, stage = $('#stage'), labelLayer = $('#labels');
  const rmq = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = rmq.matches; root.classList.toggle('rm', reduced);
  rmq.addEventListener?.('change', e => { reduced = e.matches; root.classList.toggle('rm', reduced); redraw(); });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const IDS = CHAPTERS.map(c => c.id), TL = buildTimeline(CHAPTERS), PH = Object.fromEntries(PHOTOS.map(p => [p.id, p]));
  const srcNum = id => SOURCES.findIndex(s => s.id === id) + 1;
  window.cookbookEvents = window.cookbookEvents || [];
  const track = (name, data = {}) => { const ev = { name, ...data }; window.cookbookEvents.push(ev); window.dispatchEvent(new CustomEvent('cookbook:analytics', { detail: ev })); };
  const guide = createAnchor({ mount: $('#caption'), button: $('#bVoice'), track });

  /* ---------- state ---------- */
  let t = 0, playing = false, speed = 1, captions = true, textMode = false, ended = false, completed = false;
  let curBeat = -1, curChapter = -1, labels = [], needDraw = true, diagramHTML = '';

  /* ---------- scrubber, chapter ticks, photo marks, menus ---------- */
  const scrub = $('#scrub'); scrub.max = TL.total.toFixed(1);
  $('#ticks').innerHTML = TL.chapterStart.map((s, i) => `<button class="tick" style="left:${(s / TL.total * 100).toFixed(3)}%" data-i="${i}" aria-label="Chapter ${i + 1}: ${esc(CHAPTERS[i].title)}" title="${i + 1}. ${esc(CHAPTERS[i].title)}"></button>`).join('');
  document.querySelectorAll('#ticks .tick').forEach(b => b.onclick = () => jumpChapter(+b.dataset.i));
  const firstAt = {}; TL.beats.forEach(b => { if (!(b.photo in firstAt)) firstAt[b.photo] = b.start; });
  $('#pmarks').innerHTML = TL.beats.filter((b, i) => !i || TL.beats[i - 1].photo !== b.photo).map(b => `<i style="left:${(b.start / TL.total * 100).toFixed(3)}%"></i>`).join('');
  $('#chList').innerHTML = CHAPTERS.map((c, i) => `<li><button data-i="${i}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="tt"><b>${esc(c.title)}</b><small>${esc(c.sub)}</small></span><span class="tm">${fmtTime(TL.chapterStart[i])}</span></button></li>`).join('');
  document.querySelectorAll('#chList button').forEach(b => b.onclick = () => { $('#chDlg').close(); jumpChapter(+b.dataset.i); });
  const shown = PHOTOS.slice().sort((a, b) => firstAt[a.id] - firstAt[b.id]);
  $('#phGrid').innerHTML = shown.map(p => `<li><button data-id="${p.id}"><img src="${base}${p.thumb}" alt="" loading="lazy" decoding="async" width="240" height="160"><b>${esc(p.title)}</b><small>${esc(p.author)} · ${esc(p.licence)} · ${fmtTime(firstAt[p.id])}</small></button></li>`).join('');
  document.querySelectorAll('#phGrid button').forEach(b => b.onclick = () => { $('#phDlg').close(); seek(firstAt[b.dataset.id]); track('photo_jump', { id: b.dataset.id }); });
  $('#phCount').textContent = PHOTOS.length;
  scrub.addEventListener('input', () => seek(+scrub.value, { keepPlaying: true }));

  function seek(nt, { keepPlaying = false } = {}) {
    t = Math.max(0, Math.min(TL.total, nt)); ended = false; guide.reset();
    if (!keepPlaying && !reduced) setPlaying(true);
    $('#startCard').classList.add('gone'); redraw(); draw();
  }
  const jumpChapter = i => seek(TL.chapterStart[Math.max(0, Math.min(CHAPTERS.length - 1, i))]);
  const jumpBeat = d => { const i = Math.max(0, Math.min(TL.beats.length - 1, beatAt(TL, t) + d)); seek(TL.beats[i].start); if (reduced) setPlaying(false); };
  function setPlaying(on) {
    if (on && ended) { t = 0; ended = false; }
    playing = on; root.classList.toggle('playing', on);
    $('#bPlay').innerHTML = on ? '<span aria-hidden="true">❚❚</span>' : '<span aria-hidden="true">▶</span>';
    $('#bPlay').setAttribute('aria-label', on ? 'Pause' : 'Play');
    if (on) $('#startCard').classList.add('gone');
    track(on ? 'play' : 'pause', { t: Math.round(t) }); redraw();
  }

  /* ---------- the photo layers ---------- */
  const layerA = $('#phA'), layerB = $('#phB');
  function dress(layer, id) {
    if (layer.dataset.id === id) return;
    const p = PH[id]; layer.dataset.id = id;
    const fg = layer.querySelector('.fg'), bg = layer.querySelector('.bg');
    fg.src = base + p.file; fg.alt = ''; bg.src = base + p.thumb; layer.classList.toggle('contain', p.fit === 'contain');
    fg.onload = () => redraw();
  }
  const preload = ids => ids.forEach(id => { if (id && !preload.done.has(id)) { preload.done.add(id); const im = new Image(); im.decoding = 'async'; im.src = base + PH[id].file; } });
  preload.done = new Set();
  function place(layer, view, box, area) {
    const p = PH[layer.dataset.id], L = layout(view, p.w / p.h, box, area, p.fit || 'cover'), fg = layer.querySelector('.fg');
    fg.style.width = p.w + 'px'; fg.style.height = p.h + 'px';
    fg.style.transform = `translate(${L.left.toFixed(1)}px,${L.top.toFixed(1)}px) scale(${(L.w / p.w).toFixed(5)})`;
    return L;
  }

  /* ---------- caption, stat, credit, labels ---------- */
  function renderBeat(i) {
    const b = TL.beats[i], c = CHAPTERS[b.ci], p = PH[b.photo];
    $('#capEyebrow').textContent = `${String(b.ci + 1).padStart(2, '0')} · ${c.title}`;
    $('#capLive').textContent = b.text;
    $('#photos').setAttribute('aria-label', `Photo: ${p.alt}`);
    const st = $('#stat');
    if (b.stat) { st.hidden = false; st.innerHTML = `<b>${esc(b.stat[0])}</b><span>${esc(b.stat[1])}</span>${b.stat[2] ? `<a href="#sources" data-src title="${esc(SOURCES[srcNum(b.stat[2]) - 1].t)}">Source [${srcNum(b.stat[2])}]</a>` : ''}`; st.querySelector('[data-src]')?.addEventListener('click', e => { e.preventDefault(); $('#srcDlg').showModal(); }); }
    else st.hidden = true;
    const cs = $('#capSrc'); if (cs) { cs.hidden = !b.src; if (b.src) { cs.textContent = `Source [${srcNum(b.src)}]`; cs.title = SOURCES[srcNum(b.src) - 1].t; cs.onclick = e => { e.preventDefault(); $('#srcDlg').showModal(); }; } }
    $('#phCredit').innerHTML = `Photo: ${esc(p.title)} · ${esc(p.author)} · <a href="${esc(p.url)}" target="_blank" rel="noopener">Wikimedia Commons</a> · ${p.licUrl ? `<a href="${esc(p.licUrl)}" target="_blank" rel="noopener">${esc(p.licence)}</a>` : esc(p.licence)}`;
    labelLayer.innerHTML = ''; labels = (b.plabels || []).map(([text, uv]) => { const el = document.createElement('span'); el.className = 'lbl3'; el.textContent = text; labelLayer.appendChild(el); return { el, uv }; });
    dress(layerA, b.photo);
    const prev = TL.beats[i - 1]; if (prev && prev.photo !== b.photo) dress(layerB, prev.photo);
    preload([TL.beats[i + 1]?.photo, TL.beats[i + 2]?.photo, TL.beats[i + 3]?.photo]);
    extras?.beat?.(b);
    if (b.ci !== curChapter) {
      curChapter = b.ci;
      $('#ctNum').textContent = `Chapter ${String(b.ci + 1).padStart(2, '0')}`; $('#ctTitle').textContent = c.title; $('#ctSub').textContent = c.sub;
      document.querySelectorAll('#ticks .tick').forEach((tk, k) => tk.classList.toggle('on', k === b.ci));
      if (location.hash !== '#' + c.id && !/^#(t=|photos|sources)/.test(location.hash)) history.replaceState(null, '', '#' + c.id);
      try { localStorage.setItem('cookbook:' + slug, JSON.stringify({ id: c.id, num: String(b.ci + 1).padStart(2, '0'), title: c.title })); } catch (e) { /* storage blocked */ }
      track('chapter_view', { n: b.ci + 1 });
    }
  }
  function freeArea() {
    const sr = stage.getBoundingClientRect(), br = $('.bar').getBoundingClientRect(), cap = $('#caption').getBoundingClientRect(), kr = $('.ctrl').getBoundingClientRect();
    const top = br.height ? br.bottom : 0, bottom = Math.min(kr.height ? kr.top : sr.height, cap.height && captions ? cap.top : sr.height);
    return { x: 0, y: top, w: sr.width, h: Math.max(160, bottom - top) };
  }

  /* ---------- draw: everything from t ---------- */
  let photoState = null;
  function draw() {
    const i = beatAt(TL, t), b = TL.beats[i];
    if (i !== curBeat) { curBeat = i; renderBeat(i); }
    // caption
    const n = reduced ? b.text.length : typedChars(b, t);
    $('#capText').innerHTML = `${esc(b.text.slice(0, n))}<span class="rest" aria-hidden="true">${esc(b.text.slice(n))}</span>`;
    $('#chTitle').classList.toggle('show', t - TL.chapterStart[b.ci] < 3.2 && !reduced && captions && $('#startCard').classList.contains('gone'));
    $('#tNow').textContent = fmtTime(t); scrub.value = t.toFixed(1); scrub.style.setProperty('--pct', (t / TL.total * 100).toFixed(2) + '%');
    // photos
    const box = { w: stage.clientWidth, h: stage.clientHeight }, area = freeArea();
    const LA = place(layerA, kenBurns(TL, i, t, reduced), box, area);
    const k = reduced ? 1 : fadeIn(TL, i, t), prev = TL.beats[i - 1];
    layerA.style.opacity = k;
    if (k < 1 && prev && prev.photo !== b.photo) { layerB.style.opacity = 1; place(layerB, drift(prev, prev.end, reduced), box, area); } else layerB.style.opacity = 0;
    const fg = layerA.querySelector('.fg'); photoState = { id: b.photo, ready: fg.complete && fg.naturalWidth > 0, opacity: k };
    // labels pinned to the photo
    const on = t - b.start > 1.2 || reduced;
    for (const L of labels) {
      const [x, y] = uvToPx(L.uv, LA), ok = on && x > 8 && x < box.w - 8 && y > area.y + 30 && y < area.y + area.h;
      const half = (L.w ??= L.el.offsetWidth || 100) / 2 + 6, cx = Math.min(Math.max(x, half), box.w - half);
      L.el.style.transform = `translate(${cx.toFixed(1)}px,${(y - 14).toFixed(1)}px) translate(-50%,-100%)`; L.el.classList.toggle('on', ok);
    }
    // minimal animation: a flat diagram, only on beats about ideas
    const D = b.cue && DIAGRAMS[b.cue], out = D ? D(reduced ? 1 : cueProgress(b, t), b) : null, dg = $('#diagram');
    dg.hidden = !out; dg.classList.toggle('wide', !!out?.wide);
    if (out) { const html = `<figcaption>${esc(out.title || '')}</figcaption>${out.svg}${out.status ? `<p class="dg-status" role="status">${esc(out.status)}</p>` : ''}`; if (html !== diagramHTML) { diagramHTML = html; dg.innerHTML = html; } }
    // phones: the stat card sits under the diagram card (both live at the top of the screen)
    const st = $('#stat');
    if (!st.hidden && box.w <= 640) { const top = out ? dg.getBoundingClientRect().bottom + 8 : area.y + 10; st.style.top = top.toFixed(0) + 'px'; } else st.style.top = '';
    extras?.draw?.(b, t);
  }

  /* ---------- loop ---------- */
  let last = performance.now(), raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (playing && !textMode) {
      const bi = beatAt(TL, t);
      t = holdAt(t + dt * speed, TL.beats[bi].end, guide.holding(bi), t);
      if (t >= TL.total) { t = TL.total; setPlaying(false); ended = true; if (!completed) { completed = true; track('tour_complete'); } $('#bPlay').setAttribute('aria-label', 'Replay'); $('#bPlay').innerHTML = '<span aria-hidden="true">↺</span>'; }
    }
    { const bi = beatAt(TL, t); guide.sync({ i: bi, beat: TL.beats[bi], playing: playing && !textMode, speed }); }
    if (!(playing || needDraw) || textMode) return;
    needDraw = false; draw();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  function redraw() { needDraw = true; }
  addEventListener('resize', redraw);

  /* ---------- input ---------- */
  $('#photos').addEventListener('click', () => { if (!document.querySelector('dialog[open]')) setPlaying(!playing); });
  document.addEventListener('keydown', e => {
    if (textMode || document.querySelector('dialog[open]') || e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = e.target.tagName; if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) && e.target.id !== 'scrub') return;
    const onBtn = /^(BUTTON|A)$/.test(tag);
    if (e.key === ' ' && !onBtn) { e.preventDefault(); setPlaying(!playing); }
    else if (e.key === 'k') setPlaying(!playing);
    else if (e.key === 'ArrowRight' && e.target.id !== 'scrub') { e.preventDefault(); jumpBeat(1); }
    else if (e.key === 'ArrowLeft' && e.target.id !== 'scrub') { e.preventDefault(); jumpBeat(-1); }
    else if (e.key === ']') jumpChapter(curChapter + 1);
    else if (e.key === '[') jumpChapter(curChapter - 1);
    else if (e.key === 'Home') { e.preventDefault(); seek(0); }
    else if (e.key === 'v' || e.key === 'V') $('#bVoice').click();
  });
  addEventListener('hashchange', () => { const h = parseHash(location.hash, TL, IDS); if (h?.sources) $('#srcDlg').showModal(); else if (h?.photos) $('#phDlg').showModal(); else if (h && h.ci !== curChapter) seek(h.t); });

  /* ---------- controls ---------- */
  $('#bPlay').onclick = () => setPlaying(!playing);
  $('#bBig').onclick = () => setPlaying(true);
  $('#bPrevB').onclick = () => jumpBeat(-1); $('#bNextB').onclick = () => jumpBeat(1);
  $('#bPrevC').onclick = () => jumpChapter(curChapter - (t - TL.chapterStart[curChapter] > 3 ? 0 : 1)); $('#bNextC').onclick = () => jumpChapter(curChapter + 1);
  $('#bSpeed').onclick = () => { speed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1; $('#bSpeed').textContent = speed + '×'; track('speed', { speed }); };
  $('#bCC').onclick = () => { captions = !captions; root.classList.toggle('nocc', !captions); $('#bCC').setAttribute('aria-pressed', captions); redraw(); };
  $('#bChapters').onclick = () => $('#chDlg').showModal();
  $('#bPhotos').onclick = () => { $('#phDlg').showModal(); track('photos_open'); };
  $('#bSrc').onclick = () => $('#srcDlg').showModal();
  $('#tTotal').textContent = fmtTime(TL.total);
  document.querySelectorAll('dialog [data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
  $('#bText').onclick = () => setText(!textMode);
  $('#bTextStart').onclick = () => setText(true);
  document.querySelectorAll('[data-back-to-tour]').forEach(b => b.onclick = () => setText(false));
  function setText(on) {
    textMode = on; root.classList.toggle('textmode', on); $('#bText').setAttribute('aria-pressed', on); $('#bText').querySelector('.t').textContent = on ? 'Back to the tour' : 'Read as text';
    if (on) { if (playing) setPlaying(false); guide.stop(); const el = document.getElementById(CHAPTERS[Math.max(0, curChapter)].id); el ? el.scrollIntoView({ block: 'start' }) : scrollTo(0, 0); }
    else { scrollTo(0, 0); redraw(); }
    track('read_as_text', { on });
  }

  /* ---------- boot ---------- */
  root.classList.add('ready');
  const h0 = parseHash(location.hash, TL, IDS);
  const startPaused = /[?&]paused\b/.test(location.search) || !!h0?.sources || !!h0?.photos; // ?paused: open without autoplay (tests, screenshots)
  if (h0?.t != null) t = h0.t;
  if (h0?.sources) $('#srcDlg').showModal();
  if (h0?.photos) $('#phDlg').showModal();
  draw();
  $('#startCard').classList.toggle('gone', t > .5);
  raf = requestAnimationFrame(frame);
  track('topic_start', { t: Math.round(t) });
  if (!reduced && !startPaused) setTimeout(() => { if (!playing && !textMode && t < .5) setPlaying(true); }, 1600);

  const api = { get t() { return t; }, get playing() { return playing; }, setPlaying, seek, TL, voice: guide.state, get photo() { return photoState; }, redraw, guide };
  window.__wt = api;
  return api;
}
