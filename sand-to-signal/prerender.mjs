// Writes the "Read as text" article, the first caption card and the Sources list into index.html,
// so crawlers, no-JS readers, browsers without WebGL and the first frame all have the content.
// Run after editing data.js:   node sand-to-signal/prerender.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PLACES, SOURCES, STOPS } from './data.js';

const file = fileURLToPath(new URL('./index.html', import.meta.url));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ids = Object.keys(SOURCES), num = id => ids.indexOf(id) + 1;
const srcLinks = s => s.src.map(id => `<a href="${SOURCES[id].u}" target="_blank" rel="noopener" title="${esc(SOURCES[id].t)}">[${num(id)}]</a>`).join(' ');
const table = s => s.table ? `<table class="where-t"><caption class="sr-only">Where each step happens</caption><tbody>${s.table.map(([a, b]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</tbody></table>` : '';
const where = s => `<section class="where" aria-label="Where it happens"><p class="wh"><span class="lab-t">Where it happens</span><span class="badge">📍 ${esc(PLACES[s.place])}</span></p><p class="t">${esc(s.where)}</p>${table(s)}</section>`;

const s0 = STOPS[0];
const card = `
    <p class="eyebrow"><span class="n">01</span><span>/ ${STOPS.length}</span> · ${esc(s0.eyebrow)}</p>
    <h2 class="title" id="cardTitle">${esc(s0.title)}</h2>
    ${s0.lines.map(l => `<p class="ln">${esc(l)}</p>`).join('')}
    <div class="lab" id="labUi"></div>
    ${where(s0)}
    <p class="srcs">Sources: ${srcLinks(s0)} · <button class="linkish" data-open-sources>all sources</button></p>
    <p class="tm">Independent explainer. No company logos; 3D models are drawn in code for this page.</p>
  `;

const text = `
  <h2>From sand to signal: the whole tour as text</h2>
  <p class="lede">How a chip is made from sand, and how its switches add two numbers and light a pixel. ${STOPS.length} stops.</p>
  <p><button class="nb" data-back-to-map>← Back to the 3D tour</button></p>
${STOPS.map(s => `  <section aria-labelledby="t-stop-${s.id}">
    <h3 id="t-stop-${s.id}"><span class="n">${String(s.id).padStart(2, '0')}</span>${esc(s.title)}</h3>
    ${s.lines.map(l => `<p>${esc(l)}</p>`).join('\n    ')}
    ${where(s)}
    <p class="srcs">${s.ill ? '3D model: illustration · ' : ''}Sources: ${srcLinks(s)}</p>
  </section>`).join('\n')}
  <h3 id="t-sources">Sources</h3>
  <ol>${ids.map(id => `<li><a href="${SOURCES[id].u}" target="_blank" rel="noopener">${esc(SOURCES[id].t)}</a></li>`).join('')}</ol>
  <footer><p>An independent explainer by the Data Centers Cookbook. Not affiliated with any company named here; no logos are used. The 3D models, the logic gate, the adder and the toy CPU are illustrations built in code for this page. 3D rendering uses three.js (MIT licence).</p><p><a href="../">← Back to the library</a></p></footer>
`;

const sources = `
    <button class="x" data-close aria-label="Close sources">✕ Close</button>
    <h2 id="srcTitle">Sources</h2>
    <p>Facts on this tour come from these public pages. Numbers in the caption cards, like [3], point to this list.</p>
    <ol>${ids.map(id => `<li><a href="${SOURCES[id].u}" target="_blank" rel="noopener">${esc(SOURCES[id].t)}</a></li>`).join('')}</ol>
    <p class="fine">3D models and simulations are illustrations, not to scale. 3D rendering: three.js (MIT licence).</p>
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
