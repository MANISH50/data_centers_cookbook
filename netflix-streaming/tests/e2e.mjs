// End-to-end test with the pre-installed Playwright.
// Serve the repo root, then:  node netflix-streaming/tests/e2e.mjs http://localhost:8765/
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:8765/').replace(/\/?$/, '/') + 'netflix-streaming/';
const fails = [];
const check = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fails.push(msg); };
const stopNum = p => p.evaluate(() => +document.querySelector('.eyebrow .n').textContent);
const settle = p => p.waitForTimeout(2100);

const browser = await chromium.launch();
async function page(opts = {}) {
  const ctx = await browser.newContext(opts);
  const p = await ctx.newPage();
  p.errors = [];
  p.on('console', m => m.type() === 'error' && p.errors.push(m.text()));
  p.on('pageerror', e => p.errors.push(e.message));
  return p;
}

console.log('Desktop 1280×760');
{
  const p = await page({ viewport: { width: 1280, height: 760 } });
  await p.goto(BASE);
  check(await stopNum(p) === 1, 'loads on stop 1');
  check(await p.locator('#card .ln').first().isVisible(), 'first stop text visible immediately');
  for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(800); }
  await settle(p);
  check(await stopNum(p) === 4, 'Next ×3 with the keyboard reaches stop 4');
  check(new URL(p.url()).hash === '#stop-4', 'hash follows the stop');
  check(await p.locator('#rail [aria-current="step"]').count() === 1, 'rail marks one current step');
  check(await p.locator('#rail li:nth-child(4) button').getAttribute('aria-current') === 'step', 'rail step 4 is current');
  // throttle: two quick presses move only one stop
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await settle(p);
  check(await stopNum(p) === 5, 'throttle: two quick key presses move one stop');
  await p.waitForTimeout(800);
  await p.mouse.move(800, 400); await p.mouse.wheel(0, 120); await settle(p);
  check(await stopNum(p) === 6, 'wheel moves one stop');
  await p.click('#bPrev'); await settle(p);
  check(await stopNum(p) === 5, 'Prev button');
  // Data-center view
  await p.click('#bDc'); await p.waitForTimeout(600);
  check(await p.evaluate(() => document.documentElement.classList.contains('dcview')), 'Data-center view toggles on');
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.dcb')).order === '0' && getComputedStyle(document.querySelector('#card .main')).order === '1'), 'DC block leads the caption');
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.zdc')).opacity) === '1', 'zones show infrastructure labels');
  await p.click('#bDc');
  // scene: failover
  await p.click('#failBtn');
  check(await p.evaluate(() => document.querySelector('#regionA').classList.contains('down')), 'Fail a region scene works');
  // deep link
  await p.goto(BASE + '#stop-8'); await p.reload(); await settle(p);
  check(await stopNum(p) === 8, 'deep link #stop-8 opens stop 8');
  await p.evaluate(() => { location.hash = '#stop-12'; }); await p.waitForTimeout(2600);
  check(await stopNum(p) === 12, 'hashchange navigates');
  // last stop → Next restarts
  await p.goto(BASE + '#stop-15'); await p.reload(); await settle(p);
  check((await p.textContent('#bNext')).includes('Restart'), 'last stop shows Restart');
  await p.click('#bNext'); await settle(p);
  check(await stopNum(p) === 1, 'Restart goes back to stop 1');
  // read as text
  await p.click('#bText');
  check(await p.locator('#text section h3').count() === 15, 'text version has all 15 stops');
  check(await p.locator('#text .dcb').count() === 15, 'text version has 15 data-center blocks');
  check(await p.locator('#stage').isHidden(), 'map hidden in text mode');
  await p.click('#text [data-back-to-map]');
  check(await p.locator('#stage').isVisible(), 'back to the map');
  // sources
  await p.click('#bSrc');
  check(await p.locator('#srcDlg[open] li').count() >= 15, 'sources panel opens');
  await p.click('#srcDlg [data-close]');
  // analytics events
  const names = await p.evaluate(() => [...new Set(window.cookbookEvents.map(e => e.name))]);
  for (const n of ['topic_start', 'stop_view', 'tour_complete', 'read_as_text']) check(names.includes(n), 'event ' + n);
  await p.click('#bAuto'); await p.click('#bAuto');
  check(await p.evaluate(() => window.cookbookEvents.some(e => e.name === 'auto_tour_toggle')), 'event auto_tour_toggle');
  check(await p.evaluate(() => JSON.parse(localStorage.getItem('cookbook:netflix-streaming')).id.startsWith('stop-')), 'progress saved for the library');
  check(p.errors.length === 0, 'no console errors' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
}

console.log('Reduced motion');
{
  const p = await page({ viewport: { width: 1280, height: 760 }, reducedMotion: 'reduce' });
  await p.goto(BASE);
  await p.click('#bNext'); await p.waitForTimeout(150);
  check(await stopNum(p) === 2, 'moves instantly');
  check(await p.evaluate(() => [...document.querySelectorAll('#card .c')].every(c => getComputedStyle(c).opacity === '1')), 'no typewriter: all text shown');
  check(await p.evaluate(() => getComputedStyle(document.querySelector('#camWrap')).transform === 'none'), 'no tilt');
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.grain')).display === 'none'), 'no grain');
  const vb1 = await p.getAttribute('#map', 'viewBox'); await p.waitForTimeout(600);
  check(vb1 === await p.getAttribute('#map', 'viewBox'), 'no idle drift');
  check(p.errors.length === 0, 'no console errors');
}

console.log('Mobile 390×800');
{
  const p = await page({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await p.goto(BASE); await settle(p);
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(ov <= 0, 'no horizontal overflow');
  const card = await p.locator('#card').boundingBox();
  check(card.height <= 800 * .45 + 1, 'caption is a bottom sheet ≤ 45% height');
  // camera target is above the sheet
  const tgt = await p.evaluate(() => { const vb = document.querySelector('#map').getAttribute('viewBox').split(' ').map(Number); const s = innerWidth / vb[2]; return { y: (1340 - vb[1]) * s }; });
  check(tgt.y < card.y, 'camera target sits above the caption');
  await p.click('#bNext'); await settle(p);
  check(await stopNum(p) === 2, 'Next on mobile');
  const btns = await p.evaluate(() => [...document.querySelectorAll('.bar button,.ctrl button:not(#rail button)')].map(b => b.getBoundingClientRect()).filter(r => r.width < 40 || r.height < 40).length);
  check(btns === 0, 'header and nav buttons ≥ 40px');
  check(p.errors.length === 0, 'no console errors');
}

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
