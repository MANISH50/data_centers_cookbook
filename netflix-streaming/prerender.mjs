// Writes the "Read as text" article, the first caption card and the Sources list into index.html,
// so crawlers, no-JS readers and the first frame all have the content.
// Run after editing data.js:   node netflix-streaming/prerender.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WIRE_TYPES, BADGES, SOURCES, STOPS } from './data.js';

const file = fileURLToPath(new URL('./index.html', import.meta.url));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ids = Object.keys(SOURCES), num = id => ids.indexOf(id) + 1;
const srcLinks = s => s.src.map(id => `<a href="${SOURCES[id].u}" target="_blank" rel="noopener" title="${esc(SOURCES[id].t)}">[${num(id)}]</a>`).join(' ');
const table = s => s.dc.table ? `<table class="where"><caption class="sr-only">Where it runs</caption><tbody>${s.dc.table.map(([a, b]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</tbody></table>` : '';
const dcBlock = (s, o = '') => `<section class="dcb k-${s.tint}"${o} aria-label="Data-center role"><p class="dch"><span class="lab">Data-center role</span><span class="badge">📍 ${esc(BADGES[s.dc.badge])}</span></p><p class="t">${esc(s.dc.text)}</p>${table(s)}</section>`;
const trademark = 'Independent explainer · Netflix is a trademark of Netflix, Inc. Not affiliated.';

const s0 = STOPS[0];
const card = `
    <p class="eyebrow"><span class="n">01</span><span>/ ${STOPS.length}</span> · ${esc(s0.eyebrow)}</p>
    <h2 class="title" id="cardTitle">${esc(s0.title)}</h2>
    <div class="blocks"><div class="main" style="order:0">${s0.lines.map(l => `<p class="ln">${esc(l)}</p>`).join('')}<div class="scene" id="sceneUi"></div></div>${dcBlock(s0, ' style="order:1"')}</div>
    <ul class="legend" aria-label="Legend">${s0.chips.map(c => `<li class="chip k-${c}"><i aria-hidden="true"></i>${esc(WIRE_TYPES[c].name)}</li>`).join('')}</ul>
    <p class="srcs">Sources: ${srcLinks(s0)} · <button class="linkish" data-open-sources>all sources</button></p>
    <p class="tm">${trademark}</p>
  `;

const text = `
  <h2>How Netflix streams: the whole tour as text</h2>
  <p class="lede">What happens between pressing Play and the first frame, where each step physically runs, and how Netflix’s data-center strategy changed from 2007 to 2025. ${STOPS.length} stops.</p>
  <p class="back"><button class="nb" data-back-to-map>← Back to the map</button></p>
${STOPS.map(s => `  <section aria-labelledby="t-stop-${s.id}">
    <h3 id="t-stop-${s.id}"><span class="n">${String(s.id).padStart(2, '0')}</span>${esc(s.title)}</h3>
    <p><b>What happens.</b> ${s.lines.map(esc).join(' ')}</p>
    ${dcBlock(s)}
    <p class="srcs">Sources: ${srcLinks(s)}</p>
  </section>`).join('\n')}
  <h3 id="t-sources">Sources</h3>
  <ol class="srclist">${ids.map(id => `<li><a href="${SOURCES[id].u}" target="_blank" rel="noopener">${esc(SOURCES[id].t)}</a></li>`).join('')}</ol>
  <footer><p>An independent explainer by the Data Centers Cookbook. Not affiliated with or endorsed by Netflix. Netflix is a trademark of Netflix, Inc. Not affiliated. Map and diagrams are illustrations drawn for this page.</p><p><a href="../">← Back to the library</a></p></footer>
`;

const sources = `
    <button class="x" data-close aria-label="Close sources">✕ Close</button>
    <h2 id="srcTitle">Sources</h2>
    <p>Every fact on this tour comes from these public pages. Numbers in the caption cards, like [3], point to this list.</p>
    <ol>${ids.map(id => `<li><a href="${SOURCES[id].u}" target="_blank" rel="noopener">${esc(SOURCES[id].t)}</a></li>`).join('')}</ol>
    <p class="fine">The map, animations and the adaptive-bitrate game are illustrations, not real Netflix data. ${trademark}</p>
  `;

let html = readFileSync(file, 'utf8');
const put = (name, body) => {
  const re = new RegExp(`<!--${name}-->[\\s\\S]*?<!--/${name}-->`);
  if (!re.test(html)) throw new Error('marker missing: ' + name);
  html = html.replace(re, () => `<!--${name}-->${body}<!--/${name}-->`);
};
put('CARD', card); put('TEXT', text); put('SOURCES', sources);
writeFileSync(file, html);
console.log(`prerendered ${STOPS.length} stops, ${ids.length} sources → ${file}`);
