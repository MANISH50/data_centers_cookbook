// Shared pieces for the walkthrough prerender scripts (data-centers/prerender.mjs, internet/prerender.mjs):
// the text version's photo figures and credits, and content-hash versions on every script and stylesheet,
// so a returning visitor never gets a stale cached file after an update.
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lic = p => p.licUrl ? `<a href="${p.licUrl}" target="_blank" rel="noopener">${esc(p.licence)}</a>` : esc(p.licence);
export const credit = p => `${esc(p.author)}, <a href="${p.url}" target="_blank" rel="noopener">Wikimedia Commons</a>, ${lic(p)}`;
export const figure = p => `\n    <figure class="photo"><img src="${p.file}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}" loading="lazy" decoding="async"><figcaption>${esc(p.title)}. Photo: ${credit(p)}</figcaption></figure>`;
export const photoCredits = photos => `<ol class="credits">${photos.map(p => `<li><b>${esc(p.title)}</b>: ${credit(p)}. Resized for the web.</li>`).join('')}</ol>`;

/* Beats as text: each photo appears once, at the first beat that shows it. */
export function beatsHTML(beats, photos, num) {
  const seen = globalThis.__seenPhotos ||= new Set();
  return beats.map(b => {
    const p = b.photo && !seen.has(b.photo) && photos.find(x => x.id === b.photo); if (p) seen.add(b.photo);
    return `<p>${esc(b.text)}</p>${p ? figure(p) : ''}${b.stat ? `\n    <p class="fact"><b>${esc(b.stat[0])}</b>: ${esc(b.stat[1])}${b.stat[2] ? ` [${num(b.stat[2])}]` : ''}</p>` : ''}`;
  }).join('\n    ');
}

export const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10);

/* Versions every local module (in the issue folder and shared/) through an import map, and the page's own
   <script>/<link> tags through ?v=, so browsers fetch fresh files whenever their content changes. */
export function versionPage(html, pageDir) {
  const root = dirname(pageDir), mods = [];
  for (const dir of [pageDir, join(root, 'shared')]) for (const f of readdirSync(dir)) if (/\.(m?js)$/.test(f) && !/^prerender/.test(f)) mods.push(join(dir, f));
  const rel = f => { const r = relative(pageDir, f).split('\\').join('/'); return r.startsWith('.') ? r : './' + r; };
  const imports = Object.fromEntries(mods.sort().map(f => [rel(f), `${rel(f)}?v=${hash(f)}`]));
  const map = `\n<script type="importmap">${JSON.stringify({ imports })}</script>\n`;
  html = html.replace(/<!--IMPORTMAP-->[\s\S]*?<!--\/IMPORTMAP-->/, () => `<!--IMPORTMAP-->${map}<!--/IMPORTMAP-->`);
  html = html.replace(/(<link rel="stylesheet" href=")((?:\.\.\/shared\/|)[\w-]+\.css)(?:\?v=\w+)?(")/g, (m, a, href, c) => `${a}${href}?v=${hash(join(pageDir, href))}${c}`);
  html = html.replace(/(<script type="module" src=")(main\.js)(?:\?v=\w+)?(")/, (m, a, src, c) => `${a}${src}?v=${hash(join(pageDir, src))}${c}`);
  return html;
}

/* The first photo is written into the page (and preloaded) so it can paint before any script runs. */
export function firstPhoto(html, chapters, photos) {
  const p = photos.find(x => x.id === chapters[0].beats[0].photo);
  html = html.replace(/<!--PRELOAD-->[\s\S]*?<!--\/PRELOAD-->/, `<!--PRELOAD--><link rel="preload" as="image" href="${p.file}" fetchpriority="high"><!--/PRELOAD-->`);
  return html.replace(/<div class="ph" id="phA"[^>]*>[\s\S]*?<\/div>/, `<div class="ph" id="phA" data-id="${p.id}" style="opacity:1"><img class="bg" alt="" src="${p.thumb}"><img class="fg" alt="" src="${p.file}" fetchpriority="high" style="width:100%;height:100%;object-fit:cover"></div>`);
}
