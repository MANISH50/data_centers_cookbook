/* LISTEN: the guide for the long magazines (Issues 02 and 03). A Display button in the top bar (guide, voice) and the
   docked guide, who reads the magazine aloud from the paragraph you are on, highlighting each one as she goes. */
import { mountGuideDock } from './guide-dock.js';

const ICON = '<svg class="dsp-ico" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h7M13 4h1M2 12h1M7 12h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="11" cy="4" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="5" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const READ = '.chapter :is(h2, h3, p, li, blockquote)';
const SKIP = '.quiz, figure, nav, .topbar, .sr-only, [aria-hidden="true"], details:not([open]) > :not(summary), .reveal-hidden, button, .tip';

/* The readable blocks, in page order (pure enough to test with any DOM). */
export function readable(root = document) {
  return [...root.querySelectorAll(READ)].filter(el => !el.closest(SKIP) && !el.querySelector(READ) && el.textContent.trim().length > 1);
}

const bar = document.querySelector('.topbar') || document.body;
const btn = document.createElement('button');
btn.className = 'dsp-top'; btn.id = 'bDisplay'; btn.type = 'button';
btn.setAttribute('aria-label', 'Display: guide and voice'); btn.title = 'Display: guide, voice';
btn.innerHTML = `${ICON}<span class="t"> Display</span>`;
const anchorEl = bar.querySelector('#menuBtn, #themeBtn, .menu-btn');
anchorEl ? anchorEl.before(btn) : bar.appendChild(btn);

const track = (name, data = {}) => { (window.cookbookEvents ||= []).push({ name, ...data }); };
const dock = mountGuideDock({
  displayButton: btn, keys: ['guide', 'voice'], track,
  onListen() {
    const all = readable(), top = (document.querySelector('.topbar')?.getBoundingClientRect().bottom || 0) + 8;
    let i = all.findIndex(el => el.getBoundingClientRect().bottom > top); if (i < 0) i = 0;
    dock.play(all.slice(i).map(el => ({ el, text: el.textContent })), 'mag-' + i);
  }
});
window.__dock = dock;
