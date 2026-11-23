// Writes the full text version (every chapter and caption, the facts, recaps) and the Sources list into index.html,
// so search engines, no-JS readers and browsers without WebGL get everything. Chapter sections keep the ids ch1…ch13,
// so links like ../internet/#ch9 land on that chapter.
// Run after editing data.js:   node internet/prerender.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SOURCES, CHAPTERS, RECAPS } from './data.js';

const file = fileURLToPath(new URL('./index.html', import.meta.url));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = id => SOURCES.findIndex(s => s.id === id) + 1;
const srcItem = s => s.u ? `<a href="${s.u}" target="_blank" rel="noopener">${esc(s.t)}</a>` : esc(s.t);

const text = `
  <h2>How the internet moves data</h2>
  <p class="lede">The whole 3D tour as text: 14 chapters, from your tap to the ocean floor and back.</p>
  <p><button class="back" data-back-to-tour>← Back to the 3D tour</button></p>
${CHAPTERS.map((c, i) => `  <section id="${c.id}" aria-labelledby="${c.id}-h">
    <h3 id="${c.id}-h"><span class="n">${String(i + 1).padStart(2, '0')}</span>${esc(c.title)}</h3>
    <p class="sub">${esc(c.sub)} · Where it happens: ${esc(c.where)}</p>
    ${c.beats.map(b => `<p>${esc(b.text)}</p>${b.stat ? `\n    <p class="fact"><b>${esc(b.stat[0])}</b>: ${esc(b.stat[1])}${b.stat[2] ? ` [${num(b.stat[2])}]` : ''}</p>` : ''}`).join('\n    ')}
    <ul class="recap">${(RECAPS[c.id] || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul>
  </section>`).join('\n')}
  <section id="sources" aria-labelledby="sources-h">
    <h3 id="sources-h">Sources</h3>
    <ol>${SOURCES.map(s => `<li>${srcItem(s)}</li>`).join('')}</ol>
  </section>
  <footer><p>An independent, educational explainer. The globe’s cable network and routes, and the close-up sets, are illustrations drawn in code for this page, not real cable paths. Coastlines: Natural Earth (public domain). Company and product names belong to their owners. 3D rendering: three.js (MIT licence). Figures were checked against the sources above and may change.</p><p><a href="../">← Back to the library</a></p></footer>
`;
const sources = `
  <button class="x" data-close aria-label="Close sources">✕ Close</button>
  <h2 id="srcTitle">Sources</h2>
  <p>Where the facts in the tour come from. Stat cards show the number of their source, like [3].</p>
  <ol>${SOURCES.map(s => `<li>${srcItem(s)}</li>`).join('')}</ol>
  <p class="fine">The cable routes on the globe and the moving packets are illustrations, not real cable paths. Coastlines: Natural Earth (public domain). 3D rendering: three.js (MIT licence).</p>
`;

let html = readFileSync(file, 'utf8');
const put = (name, body) => { const re = new RegExp(`<!--${name}-->[\\s\\S]*?<!--/${name}-->`); if (!re.test(html)) throw new Error('marker missing: ' + name); html = html.replace(re, () => `<!--${name}-->${body}<!--/${name}-->`); };
put('TEXT', text); put('SOURCES', sources);
writeFileSync(file, html);
console.log(`prerendered ${CHAPTERS.length} chapters, ${CHAPTERS.reduce((a, c) => a + c.beats.length, 0)} beats, ${SOURCES.length} sources → ${file}`);
