// Writes the full text version (every chapter and caption, the facts, recaps) and the Sources list into index.html,
// so search engines and no-JS readers get everything. Also versions every script and stylesheet (?v=hash). Chapter sections keep the ids ch1…ch13,
// so old links like ../data-centers/#ch5 still land in the right place.
// Run after editing data.js:   node data-centers/prerender.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SOURCES, CHAPTERS, RECAPS, PHOTOS } from './data.js';
import { esc as esc0, beatsHTML, photoCredits as credits, versionPage } from '../shared/prerender-kit.mjs';
const photoCredits = credits(PHOTOS);

const file = fileURLToPath(new URL('./index.html', import.meta.url));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = id => SOURCES.findIndex(s => s.id === id) + 1;
const srcItem = s => s.u ? `<a href="${s.u}" target="_blank" rel="noopener">${esc(s.t)}</a>` : esc(s.t);

const text = `
  <h2>Inside the Cloud: how a data center really works</h2>
  <p class="lede">The whole walkthrough as text: 13 chapters, from the outside fence to the inside of a server, and back out to the planet.</p>
  <p><button class="back" data-back-to-tour>← Back to the photo walkthrough</button></p>
${CHAPTERS.map((c, i) => `  <section id="${c.id}" aria-labelledby="${c.id}-h">
    <h3 id="${c.id}-h"><span class="n">${String(i + 1).padStart(2, '0')}</span>${esc(c.title)}</h3>
    <p class="sub">${esc(c.sub)}</p>
    ${beatsHTML(c.beats, PHOTOS, num)}
    <ul class="recap">${(RECAPS[c.id] || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul>
  </section>`).join('\n')}
  <section id="sources" aria-labelledby="sources-h">
    <h3 id="sources-h">Sources</h3>
    <ol>${SOURCES.map(s => `<li>${srcItem(s)}</li>`).join('')}</ol>
    ${PHOTOS.length ? `<h4>Photo credits</h4>
    <p>Real photos from Wikimedia Commons under the free licences shown.</p>
    ${photoCredits}` : ''}
  </section>
  <footer><p>An independent, educational explainer. Every photo is real, from Wikimedia Commons under a free licence and credited above; some show analogies (a library, a pit stop), named as such in their titles. The small diagrams over the photos are illustrations, not to scale. Company and product names belong to their owners. Figures were checked against the sources above and may change. Your guide is a drawn character, not a real person; her voice is made by your own device’s built-in speech, so it sounds different on each device.</p><p><a href="../">← Back to the library</a></p></footer>
`;
const sources = `
  <button class="x" data-close aria-label="Close sources">✕ Close</button>
  <h2 id="srcTitle">Sources</h2>
  <p>Where the numbers in the walkthrough come from. Stat cards show the number of their source, like [3].</p>
  <ol>${SOURCES.map(s => `<li>${srcItem(s)}</li>`).join('')}</ol>
  ${PHOTOS.length ? `<h3>Photo credits</h3>
  ${photoCredits}` : ''}
  <p class="fine">Photos: Wikimedia Commons, credited above; some are analogies, named as such. The small diagrams are illustrations, not to scale. The guide’s voice is your device’s built-in speech (turn it off with the 🔊 button or the V key).</p>
`;

let html = readFileSync(file, 'utf8');
const put = (name, body) => { const re = new RegExp(`<!--${name}-->[\\s\\S]*?<!--/${name}-->`); if (!re.test(html)) throw new Error('marker missing: ' + name); html = html.replace(re, () => `<!--${name}-->${body}<!--/${name}-->`); };
put('TEXT', text); put('SOURCES', sources);
html = versionPage(html, fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, ''));
writeFileSync(file, html);
console.log(`prerendered ${CHAPTERS.length} chapters, ${CHAPTERS.reduce((a, c) => a + c.beats.length, 0)} beats, ${SOURCES.length} sources → ${file}`);
