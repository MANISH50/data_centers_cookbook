// End-to-end test with the pre-installed Playwright (software WebGL).
// Serve the repo root, then:  node internet/tests/e2e.mjs http://localhost:8765/
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:8765/').replace(/\/?$/, '/') + 'internet/';
const fails = [];
const check = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fails.push(msg); };
const ready = p => p.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 60000 });
const T = p => p.evaluate(() => window.__net.t);
const chapter = p => p.evaluate(() => document.querySelector('#capEyebrow').textContent.slice(0, 2));
const shot = async p => (await p.locator('#view3d canvas').screenshot()).toString('base64');

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
  check(await p.locator('#capText').textContent() !== null, 'caption present before 3D loads');
  await ready(p);
  check(await p.evaluate(() => !!document.querySelector('#view3d canvas')), 'WebGL canvas created');
  await p.waitForTimeout(5000);
  const soft = await p.evaluate(() => document.documentElement.classList.contains('soft-gl'));
  if (soft) { check(!(await p.evaluate(() => window.__net.playing)) && await p.locator('#bBig').isVisible(), 'no GPU: waits for Play instead of autoplaying'); await p.click('#bBig'); await p.waitForTimeout(600); }
  check(await p.evaluate(() => window.__net.playing), soft ? 'Play starts the tour' : 'tour starts playing on its own');
  const t1 = await T(p); await p.waitForTimeout(2500); const t2 = await T(p);
  check(t2 > t1 + 1, `timeline advances while playing (${t1.toFixed(1)} → ${t2.toFixed(1)} s)`);
  check((await p.textContent('#capText')).length > 20, 'caption typed in');
  // pause / resume
  await p.click('#bPlay'); const tp = await T(p); await p.waitForTimeout(1200);
  check(!(await p.evaluate(() => window.__net.playing)) && Math.abs(await T(p) - tp) < .05, 'pause stops the timeline');
  await p.keyboard.press('Space'); await p.waitForTimeout(600);
  check(await p.evaluate(() => window.__net.playing), 'Space resumes');
  // chapter ticks and next chapter
  for (const i of [4, 8, 11]) {
    await p.click(`#ticks .tick[data-i="${i}"]`); await p.waitForTimeout(600);
    check(+(await chapter(p)) === i + 1, `chapter marker ${i + 1} jumps to chapter ${i + 1}`);
  }
  await p.click('#bNextC'); await p.waitForTimeout(500);
  check(+(await chapter(p)) === 13, 'next-chapter button');
  // scrubbing
  await p.locator('#scrub').fill('300'); await p.waitForTimeout(500);
  check(Math.abs(await T(p) - 300) < 3, 'scrubber seeks');
  // speed
  await p.click('#bSpeed'); check((await p.textContent('#bSpeed')) === '1.5×', 'speed control');
  await p.click('#bSpeed'); await p.click('#bSpeed');
  // drag pauses and shows Resume; Resume plays
  await p.keyboard.press('Home'); await p.waitForTimeout(300);
  if (!(await p.evaluate(() => window.__net.playing))) await p.click('#bPlay');
  const s1 = await shot(p); const box = await p.locator('#view3d').boundingBox();
  await p.mouse.move(box.x + 700, box.y + 300); await p.mouse.down(); await p.mouse.move(box.x + 500, box.y + 260, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(600);
  check(!(await p.evaluate(() => window.__net.playing)), 'dragging the 3D view pauses the tour');
  check(await p.locator('#resume').isVisible(), 'Resume button appears');
  check(s1 !== await shot(p), 'dragging orbits the camera');
  await p.click('#resume'); await p.waitForTimeout(400);
  check(await p.evaluate(() => window.__net.playing), 'Resume continues the tour');
  // scenes change the 3D view over time
  await p.click('#bPlay');
  await p.locator('#scrub').fill('150'); await p.waitForTimeout(700); const a = await shot(p);
  await p.locator('#scrub').fill('170'); await p.waitForTimeout(700); const b = await shot(p);
  check(a !== b, 'the DNS lookup scene changes as time moves');
  check((await p.textContent('#status')).includes('Step'), 'DNS step status line shown');
  const statAt = await p.evaluate(() => window.__net.TL.beats.find(b => b.stat && b.stat[0] === '~200').start + 2);
  await p.locator('#scrub').fill(String(statAt)); await p.waitForTimeout(800);
  check(await p.locator('#stat').isVisible() && (await p.textContent('#stat')).includes('200'), 'stat card shows a sourced number (~200 faults)');
  // Try it: route
  const tl = await p.evaluate(() => window.__net.TL.beats.map(b => [b.start, b.try || '']));
  const at = k => tl.find(x => x[1] === k)[0] + 1;
  await p.locator('#scrub').fill(String(at('route'))); await p.waitForTimeout(600);
  check(await p.locator('#tryBtn').isVisible(), 'Try it button appears on hands-on beats');
  await p.click('#tryBtn'); await p.waitForTimeout(500);
  check(await p.locator('#tryPanel').isVisible() && !(await p.evaluate(() => window.__net.playing)), 'Try it opens a panel and pauses');
  await p.selectOption('#tFrom', 'sydney'); await p.selectOption('#tTo', 'london'); await p.waitForTimeout(1500);
  const res = await p.textContent('#tRes');
  check(/Sydney →.*→ London/.test(res) && /km/.test(res) && /ms/.test(res), 'route panel shows the path, distance and light-speed delay');
  await p.click('#tryClose'); check(await p.locator('#tryPanel').isHidden(), 'Back closes the panel');
  // Try it: cut
  await p.locator('#scrub').fill(String(at('cut'))); await p.waitForTimeout(600); await p.click('#tryBtn'); await p.waitForTimeout(1500);
  const cut = await p.textContent('#tRes');
  check(/Cape Town|Lisbon/.test(cut) && /After the cut/.test(cut), 'cutting a cable shows the detour and the longer trip');
  await p.click('#tCutBtn'); await p.waitForTimeout(1200);
  check(!(await p.textContent('#tRes')).includes('Cape Town'), 'repairing it restores the short route');
  await p.click('#tryClose');
  // Try it: DNS
  await p.locator('#scrub').fill(String(at('dns'))); await p.waitForTimeout(600); await p.click('#tryBtn');
  for (let i = 0; i < 7; i++) await p.click('#tNext');
  await p.waitForTimeout(800);
  check((await p.textContent('#tStep')).includes('Step 8 of 8'), 'DNS stepper reaches the answer');
  await p.click('#tryClose');
  // Try it: TCP
  await p.locator('#scrub').fill(String(at('tcp'))); await p.waitForTimeout(600); await p.click('#tryBtn'); await p.selectOption('#tDrop', '5'); await p.waitForTimeout(7000);
  const tcp = await p.textContent('#tRes');
  check(tcp.includes('all 6 packets') && tcp.includes('packet 5 is simply missing'), 'TCP resends, UDP skips the lost packet');
  await p.click('#tryClose');
  // chapters dialog
  await p.click('#bChapters'); check(await p.locator('#chDlg[open] #chList li').count() === 14, 'chapters menu lists 14 chapters');
  await p.click('#chList button[data-i="8"]'); await p.waitForTimeout(500);
  check(+(await chapter(p)) === 9, 'chapters menu jumps');
  // text version + sources
  await p.click('#bText');
  check(await p.locator('#text section h3').count() === 15, 'text version: 14 chapters + sources');
  check(await p.locator('#text #ch9').count() === 1, 'text version has chapter ids');
  await p.click('#text [data-back-to-tour]');
  await p.click('#bSrc'); check(await p.locator('#srcDlg[open] li').count() === 16, 'sources panel lists 16 sources'); await p.click('#srcDlg [data-close]');
  const names = await p.evaluate(() => [...new Set(window.cookbookEvents.map(e => e.name))]);
  for (const n of ['topic_start', 'chapter_view', 'play', 'pause', 'read_as_text', 'try_it']) check(names.includes(n), 'event ' + n);
  check(await p.evaluate(() => JSON.parse(localStorage.getItem('cookbook:internet')).id.startsWith('ch')), 'progress saved for the library (chN)');
  check(p.errors.length === 0, 'no console errors' + (p.errors.length ? ': ' + p.errors.slice(0, 3).join(' | ') : ''));
}

console.log('Deep links');
{
  const p = await page({ viewport: { width: 1280, height: 760 } });
  for (const n of [1, 4, 9, 14]) {
    await p.goto(BASE + '?paused#ch' + n); await p.reload(); await p.waitForTimeout(700);
    check(+(await chapter(p)) === n, `#ch${n} opens chapter ${n}`);
  }
  await p.goto(BASE + '?paused#sources'); await p.reload(); await p.waitForTimeout(600);
  check(await p.locator('#srcDlg[open]').count() === 1, '#sources opens the Sources panel');
}

console.log('Reduced motion');
{
  const p = await page({ viewport: { width: 1280, height: 760 }, reducedMotion: 'reduce' });
  await p.goto(BASE); await ready(p); await p.waitForTimeout(3000);
  check(!(await p.evaluate(() => window.__net.playing)), 'no autoplay');
  await p.click('#bNextB'); await p.waitForTimeout(300);
  check((await p.evaluate(() => document.querySelector('#capText .rest').textContent)) === '' || await p.evaluate(() => getComputedStyle(document.querySelector('#capText .rest')).color !== 'rgba(0, 0, 0, 0)'), 'captions shown in full');
  check(!(await p.evaluate(() => window.__net.playing)), 'stepping does not start playback');
  check(p.errors.length === 0, 'no console errors');
}

console.log('No WebGL');
{
  const p = await page({ viewport: { width: 1280, height: 760 } });
  await p.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; });
  await p.goto(BASE); await p.waitForTimeout(2000);
  check(await p.evaluate(() => document.documentElement.classList.contains('nogl')), 'falls back when WebGL is missing');
  check(await p.locator('#text').isVisible() && await p.locator('#noglMsg').isVisible(), 'text version and notice shown');
}

console.log('Mobile 390×800');
{
  const p = await page({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await p.goto(BASE + '?paused'); await ready(p); await p.waitForTimeout(1500);
  check(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'no horizontal overflow');
  const small = await p.evaluate(() => [...document.querySelectorAll('.bar a,.bar button,.ctrl button:not(.tick)')].filter(b => b.offsetParent).map(b => b.getBoundingClientRect()).filter(r => r.width < 40 || r.height < 40).length);
  check(small === 0, 'header and control targets ≥ 40px');
  const cap = await p.locator('#caption').boundingBox(), ctrl = await p.locator('.ctrl').boundingBox();
  check(cap.y + cap.height <= ctrl.y + 1 && cap.x >= 0 && cap.x + cap.width <= 390, 'caption fits above the controls');
  await p.click('#bPlay'); await p.waitForTimeout(1500);
  check(await p.evaluate(() => window.__net.playing), 'plays on mobile');
  check(p.errors.length === 0, 'no console errors');
}

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
