// End-to-end test with the pre-installed Playwright (software WebGL).
// Serve the repo root, then:  node sand-to-signal/tests/e2e.mjs http://localhost:8765/
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:8765/').replace(/\/?$/, '/') + 'sand-to-signal/';
const fails = [];
const check = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fails.push(msg); };
const stopNum = p => p.evaluate(() => +document.querySelector('.eyebrow .n').textContent);
const ready = p => p.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 30000 });
const settle = p => p.waitForTimeout(2600);
const shot3d = async p => (await p.locator('#view3d canvas').screenshot()).toString('base64');

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function page(opts = {}) {
  const ctx = await browser.newContext(opts); const p = await ctx.newPage(); p.errors = [];
  p.on('console', m => m.type() === 'error' && p.errors.push(m.text())); p.on('pageerror', e => p.errors.push(e.message));
  return p;
}

console.log('Desktop 1280×760');
{
  const p = await page({ viewport: { width: 1280, height: 760 } });
  await p.goto(BASE);
  check(await p.locator('#card .title').isVisible(), 'first caption visible before 3D loads');
  await ready(p); await settle(p);
  check(await p.evaluate(() => !!document.querySelector('#view3d canvas')), 'WebGL canvas created');
  const px = await p.evaluate(() => { const r = window.__sts.renderer, gl = r.getContext(), b = new Uint8Array(4 * 64); gl.readPixels(gl.drawingBufferWidth * .7 | 0, gl.drawingBufferHeight * .5 | 0, 8, 8, gl.RGBA, gl.UNSIGNED_BYTE, b); return b.reduce((a, v) => a + v, 0); });
  void px;
  await p.click('#lStart'); await settle(p);
  check(await stopNum(p) === 2, 'Start button goes to stop 2');
  for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(850); }
  await settle(p);
  check(await stopNum(p) === 5, 'Next ×3 with the keyboard reaches stop 5');
  check(new URL(p.url()).hash === '#stop-5', 'hash follows the stop');
  check(await p.locator('#rail [aria-current="step"]').count() === 1, 'rail marks the current step');
  check((await p.textContent('#scale')).includes('300 mm'), 'scale badge updates');
  // hands-on: each control changes the rendered 3D scene
  const labs = [[2, '#lAtoms'], [3, '#lRun'], [5, '#lSlice'], [6, '#lExp'], [7, '#lStep'], [8, '#lGate'], [10, '#lTest'], [11, '#lA']];
  for (const [n, sel] of labs) {
    await p.evaluate(n => { location.hash = '#stop-' + n; }, n); await settle(p);
    const before = await shot3d(p); await p.click(sel); await p.waitForTimeout(3300);
    check(before !== await shot3d(p), `stop ${n}: ${sel} changes the 3D scene`);
  }
  await p.evaluate(() => { location.hash = '#stop-4'; }); await settle(p);
  const b4 = await shot3d(p); await p.locator('#lPull').fill('1'); await p.waitForTimeout(1200);
  check(b4 !== await shot3d(p), 'stop 4: Pull slider grows the ingot');
  // deep link + adder
  await p.goto(BASE + '#stop-12'); await p.reload(); await ready(p); await settle(p);
  check(await stopNum(p) === 12, 'deep link #stop-12 opens stop 12');
  await p.locator('#lAa').fill('9'); await p.locator('#lAb').fill('8');
  check((await p.textContent('#lSum')).includes('= 17 = 10001'), 'adder: 9 + 8 = 17 = 10001');
  // CPU → screen
  await p.click('#bNext'); await settle(p);
  for (let i = 0; i < 15; i++) await p.click('#lStepC');
  check((await p.textContent('#lReg')).includes('OUT=12'), 'CPU runs the program and outputs 12');
  check(await p.locator('#lStepC').isDisabled(), 'CPU halts');
  await p.click('#bNext'); await settle(p);
  check((await p.textContent('#labUi')).includes('shows 12'), 'the CPU answer reaches the screen stop');
  const sb = await shot3d(p); await p.locator('#labUi .rgbs input').first().fill('0'); await p.waitForTimeout(600);
  check(sb !== await shot3d(p), 'stop 14: colour slider changes the pixels');
  check((await p.textContent('#lBytes')).includes('R 0 · 0x00 · 00000000'), 'pixel bytes shown in hex and binary');
  // last stop restarts
  await p.click('#bNext'); await settle(p);
  check((await p.textContent('#bNext')).includes('Restart'), 'last stop shows Restart');
  // drag to orbit
  const o1 = await shot3d(p); const box = await p.locator('#view3d').boundingBox();
  await p.mouse.move(box.x + 900, box.y + 400); await p.mouse.down(); await p.mouse.move(box.x + 700, box.y + 380, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(500);
  check(o1 !== await shot3d(p), 'dragging orbits the camera');
  // text, sources, events
  await p.click('#bText');
  check(await p.locator('#text section h3').count() === 15, 'text version has all 15 stops');
  check(await p.locator('#text .where').count() === 15, 'text version has 15 "where it happens" blocks');
  await p.click('#text [data-back-to-map]');
  await p.click('#bSrc'); check(await p.locator('#srcDlg[open] li').count() >= 14, 'sources panel opens'); await p.click('#srcDlg [data-close]');
  await p.click('#bAuto'); await p.click('#bAuto');
  const names = await p.evaluate(() => [...new Set(window.cookbookEvents.map(e => e.name))]);
  for (const n of ['topic_start', 'stop_view', 'tour_complete', 'read_as_text', 'auto_tour_toggle']) check(names.includes(n), 'event ' + n);
  check(await p.evaluate(() => JSON.parse(localStorage.getItem('cookbook:sand-to-signal')).id.startsWith('stop-')), 'progress saved for the library');
  check(p.errors.length === 0, 'no console errors' + (p.errors.length ? ': ' + p.errors.slice(0, 3).join(' | ') : ''));
}

console.log('Reduced motion');
{
  const p = await page({ viewport: { width: 1280, height: 760 }, reducedMotion: 'reduce' });
  await p.goto(BASE); await ready(p);
  await p.click('#bNext'); await p.waitForTimeout(200);
  check(await stopNum(p) === 2, 'moves instantly');
  check(await p.evaluate(() => [...document.querySelectorAll('#card .c')].every(c => getComputedStyle(c).opacity === '1')), 'no typewriter');
  check(await p.evaluate(() => getComputedStyle(document.querySelector('.tunnelfx')).display === 'none'), 'no zoom tunnel');
  check(p.errors.length === 0, 'no console errors');
}

console.log('No WebGL');
{
  const p = await page({ viewport: { width: 1280, height: 760 } });
  await p.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; });
  await p.goto(BASE); await p.waitForTimeout(1500);
  check(await p.evaluate(() => document.documentElement.classList.contains('nogl')), 'falls back when WebGL is missing');
  check(await p.locator('#text').isVisible() && await p.locator('#noglMsg').isVisible(), 'text version and notice shown');
}

console.log('Mobile 390×800');
{
  const p = await page({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await p.goto(BASE); await ready(p); await settle(p);
  check(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'no horizontal overflow');
  check((await p.locator('#card').boundingBox()).height <= 800 * .46 + 1, 'caption is a bottom sheet ≤ 46% height');
  await p.click('#bNext'); await settle(p);
  check(await stopNum(p) === 2, 'Next on mobile');
  const small = await p.evaluate(() => [...document.querySelectorAll('.bar button,.bar a,.ctrl > button')].map(b => b.getBoundingClientRect()).filter(r => r.width < 40 || r.height < 40).length);
  check(small === 0, 'header and nav targets ≥ 40px');
  check(p.errors.length === 0, 'no console errors');
}

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
