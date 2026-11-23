// Writes the full text version (every chapter and caption, the facts, recaps) and the Sources list into index.html,
// so search engines, no-JS readers and browsers without WebGL get everything. Chapter sections keep the ids ch1…ch13,
// so old links like ../data-centers/#ch5 still land in the right place.
// Run after editing data.js:   node data-centers/prerender.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SOURCES, CHAPTERS, RECAPS } from './data.js';

const file = fileURLToPath(new URL('./index.html', import.meta.url));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = id => SOURCES.findIndex(s => s.id === id) + 1;
const srcItem = s => s.u ? `<a href="${s.u}" target="_blank" rel="noopener">${esc(s.t)}</a>` : esc(s.t);

const text = `
  <h2>Inside the Cloud: how a data center really works</h2>
  <p class="lede">The whole 3D tour as text: 13 chapters, from the outside fence to the inside of a server, and back out to the planet.</p>
  <p><button class="back" data-back-to-tour>← Back to the 3D tour</button></p>
${CHAPTERS.map((c, i) => `  <section id="${c.id}" aria-labelledby="${c.id}-h">
    <h3 id="${c.id}-h"><span class="n">${String(i + 1).padStart(2, '0')}</span>${esc(c.title)}</h3>
    <p class="sub">${esc(c.sub)}</p>
    ${c.beats.map(b => `<p>${esc(b.text)}</p>${b.stat ? `\n    <p class="fact"><b>${esc(b.stat[0])}</b>: ${esc(b.stat[1])}${b.stat[2] ? ` [${num(b.stat[2])}]` : ''}</p>` : ''}`).join('\n    ')}
    <ul class="recap">${(RECAPS[c.id] || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul>
  </section>`).join('\n')}
  <section id="sources" aria-labelledby="sources-h">
    <h3 id="sources-h">Sources</h3>
    <ol>${SOURCES.map(s => `<li>${srcItem(s)}</li>`).join('')}</ol>
  </section>
  <footer><p>An independent, educational explainer. The 3D campus, its rooms and the flows inside it are illustrations drawn in code for this page, not a real site. Company and product names belong to their owners. 3D rendering: three.js (MIT licence). Figures were checked against the sources above and may change.</p><p><a href="../">← Back to the library</a></p></footer>
`;
const sources = `
  <button class="x" data-close aria-label="Close sources">✕ Close</button>
  <h2 id="srcTitle">Sources</h2>
  <p>Where the numbers in the tour come from. Stat cards show the number of their source, like [3].</p>
  <ol>${SOURCES.map(s => `<li>${srcItem(s)}</li>`).join('')}</ol>
  <p class="fine">The 3D campus and the moving flows (packets, power, air, heat) are illustrations, not to scale. 3D rendering: three.js (MIT licence).</p>
`;

let html = readFileSync(file, 'utf8');
const put = (name, body) => { const re = new RegExp(`<!--${name}-->[\\s\\S]*?<!--/${name}-->`); if (!re.test(html)) throw new Error('marker missing: ' + name); html = html.replace(re, () => `<!--${name}-->${body}<!--/${name}-->`); };
put('TEXT', text); put('SOURCES', sources);
writeFileSync(file, html);
console.log(`prerendered ${CHAPTERS.length} chapters, ${CHAPTERS.reduce((a, c) => a + c.beats.length, 0)} beats, ${SOURCES.length} sources → ${file}`);
