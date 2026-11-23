// End-to-end test with the pre-installed Playwright (software WebGL).
// Serve the repo root, then:  node data-centers/tests/e2e.mjs http://localhost:8765/
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import { readFileSync } from 'node:fs';
const FAKE_SPEECH = readFileSync(new URL('../../shared/tests/fake-speech.js', import.meta.url), 'utf8');
const { PHOTOS } = await import('../data.js');

const BASE = (process.argv[2] || 'http://localhost:8765/').replace(/\/?$/, '/') + 'data-centers/';
const fails = [];
const check = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fails.push(msg); };
const ready = p => p.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 60000 });
const T = p => p.evaluate(() => window.__dc.t);
const chapter = p => p.evaluate(() => document.querySelector('#capEyebrow').textContent.slice(0, 2));
const shot = async p => (await p.locator('#view3d canvas').screenshot()).toString('base64');

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function page(opts = {}) {
  const { speech = true, ...o } = opts;
  const ctx = await browser.newContext(o); const p = await ctx.newPage(); p.errors = [];
  if (speech) await p.addInitScript({ content: FAKE_SPEECH });
  p.on('requestfailed', r => p.errors.push('request failed: ' + r.url()));
  p.on('response', r => r.status() >= 400 && p.errors.push(`HTTP ${r.status()}: ${r.url()}`));
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
  if (soft) { check(!(await p.evaluate(() => window.__dc.playing)) && await p.locator('#bBig').isVisible(), 'no GPU: waits for Play instead of autoplaying'); await p.click('#bBig'); await p.waitForTimeout(600); }
  check(await p.evaluate(() => window.__dc.playing), soft ? 'Play starts the tour' : 'tour starts playing on its own');
  const t1 = await T(p); await p.waitForTimeout(2500); const t2 = await T(p);
  check(t2 > t1 + 1, `timeline advances while playing (${t1.toFixed(1)} → ${t2.toFixed(1)} s)`);
  check((await p.textContent('#capText')).length > 20, 'caption typed in');
  // the guide speaks each caption, in a woman's voice when the device has one
  await p.waitForTimeout(400);
  const spoken = await p.evaluate(() => window.__spoken);
  check(spoken.length > 0 && spoken.at(-1).voice === 'Samantha', `guide speaks the caption (${spoken.length} line(s), voice ${spoken.at(-1)?.voice})`);
  await p.evaluate(() => { window.__msPerWord = 400; }); await p.click('#bNextB'); await p.waitForTimeout(700);
  check(await p.evaluate(() => window.__dc.voice.speaking) && await p.locator('#guide.talk').count() === 1, 'a new beat starts a new line, and her mouth moves while she speaks');
  await p.evaluate(() => { window.__msPerWord = 60; });
  check(!/₹/.test(spoken.map(x => x.text).join(' ')), 'symbols are spelled out for the voice');
  // pause / resume
  await p.click('#bPlay'); const tp = await T(p); await p.waitForTimeout(1200);
  check(!(await p.evaluate(() => window.__dc.playing)) && Math.abs(await T(p) - tp) < .05, 'pause stops the timeline');
  check(!(await p.evaluate(() => window.__dc.voice.speaking)) && await p.locator('#guide.talk').count() === 0, 'pause stops the voice');
  await p.keyboard.press('Space'); await p.waitForTimeout(600);
  check(await p.evaluate(() => window.__dc.playing), 'Space resumes');
  // chapter ticks and next chapter
  for (const i of [4, 7, 10]) {
    await p.click(`#ticks .tick[data-i="${i}"]`); await p.waitForTimeout(600);
    check(+(await chapter(p)) === i + 1, `chapter marker ${i + 1} jumps to chapter ${i + 1}`);
  }
  await p.click('#bNextC'); await p.waitForTimeout(500);
  check(+(await chapter(p)) === 12, 'next-chapter button');
  // scrubbing
  await p.locator('#scrub').fill('400'); await p.waitForTimeout(500);
  check(Math.abs(await T(p) - 400) < 3, 'scrubber seeks');
  // speed
  await p.click('#bSpeed'); check((await p.textContent('#bSpeed')) === '1.5×', 'speed control');
  await p.click('#bSpeed'); await p.click('#bSpeed');
  // drag pauses and shows Resume; Resume plays
  await p.keyboard.press('Home'); await p.waitForTimeout(300);
  if (!(await p.evaluate(() => window.__dc.playing))) await p.click('#bPlay');
  const s1 = await shot(p); const box = await p.locator('#view3d').boundingBox();
  await p.mouse.move(box.x + 700, box.y + 300); await p.mouse.down(); await p.mouse.move(box.x + 500, box.y + 260, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(600);
  check(!(await p.evaluate(() => window.__dc.playing)), 'dragging the 3D view pauses the tour');
  check(await p.locator('#resume').isVisible(), 'Resume button appears');
  check(s1 !== await shot(p), 'dragging orbits the camera');
  await p.click('#resume'); await p.waitForTimeout(400);
  check(await p.evaluate(() => window.__dc.playing), 'Resume continues the tour');
  // scenes change the 3D view over time
  await p.click('#bPlay');
  await p.locator('#scrub').fill('336'); await p.waitForTimeout(700); const a = await shot(p);
  await p.locator('#scrub').fill('348'); await p.waitForTimeout(700); const b = await shot(p);
  check(a !== b, 'the power-cut scene changes as time moves');
  check((await p.textContent('#status')).includes('Grid'), 'power-cut status line shown');
  await p.locator('#scrub').fill('362'); await p.waitForTimeout(600);
  check(await p.locator('#stat').isVisible() && (await p.textContent('#stat')).includes('54%'), 'stat card shows a sourced number (54%)');
  // the film waits for the guide at the end of a beat, and the Voice button turns her off
  { await p.evaluate(() => { window.__msPerWord = 3000; });
    const B = await p.evaluate(() => { const b = window.__dc.TL.beats[3]; return { start: b.start, end: b.end }; });
    await p.locator('#scrub').fill(String(Math.ceil(B.end - 2))); if (!(await p.evaluate(() => window.__dc.playing))) await p.click('#bPlay');
    await p.waitForTimeout(4500); const th = await T(p);
    check(th < B.end && th > B.end - .2, `film holds at the end of the beat while she is talking (t=${th.toFixed(2)}, end=${B.end})`);
    await p.click('#bVoice'); await p.waitForTimeout(1500);
    check((await p.getAttribute('#bVoice', 'aria-pressed')) === 'false' && await T(p) > B.end, 'Voice off: she stops and the film moves on');
    check(await p.evaluate(() => localStorage.getItem('cookbook:voice')) === 'off', 'voice choice remembered');
    await p.keyboard.press('v'); check((await p.getAttribute('#bVoice', 'aria-pressed')) === 'true', 'V key turns the voice back on');
    await p.evaluate(() => { window.__msPerWord = 60; }); await p.click('#bPlay'); }
  // real photos stand in the 3D scene in place of the models
  for (const id of ['gpu', 'generator']) {
    const ph = PHOTOS.find(x => x.id === id), [c, i] = ph.at.split('.').map(Number);
    const ts = await p.evaluate(([c, i]) => window.__dc.TL.beats.find(b => b.ci === c - 1 && b.bi === i).start, [c, i]);
    await p.locator('#scrub').fill(String(Math.ceil(ts + 2))); await p.waitForTimeout(1500); await p.locator('#scrub').fill(String(Math.ceil(ts + 3))); await p.waitForTimeout(800);
    const st = await p.evaluate(() => window.__dc.photo);
    check(st && st.id === id && st.ready && st.opacity > .9, `real photo “${id}” loads and shows on its beat`);
    check(await p.locator('#phCredit').isVisible() && /Wikimedia Commons/.test(await p.textContent('#phCredit')), `photo credit shown for “${id}”`);
  }
  if (await p.evaluate(() => window.__dc.playing)) await p.click('#bPlay');
  // chapters dialog
  await p.click('#bChapters'); check(await p.locator('#chDlg[open] #chList li').count() === 13, 'chapters menu lists 13 chapters');
  await p.click('#chList button[data-i="8"]'); await p.waitForTimeout(500);
  check(+(await chapter(p)) === 9, 'chapters menu jumps');
  // text version + sources
  await p.click('#bText');
  check(await p.locator('#text section h3').count() === 14, 'text version: 13 chapters + sources');
  check(await p.locator('#text #ch5').count() === 1, 'text version keeps old chapter ids');
  check(await p.locator('#text figure.photo').count() === PHOTOS.length, 'text version shows every real photo with its credit');
  await p.click('#text [data-back-to-tour]');
  await p.click('#bSrc'); check(await p.locator('#srcDlg[open] li').count() === 15 + PHOTOS.length, `sources panel lists 15 sources and ${PHOTOS.length} photo credits`); await p.click('#srcDlg [data-close]');
  const names = await p.evaluate(() => [...new Set(window.cookbookEvents.map(e => e.name))]);
  for (const n of ['topic_start', 'chapter_view', 'play', 'pause', 'read_as_text', 'voice']) check(names.includes(n), 'event ' + n);
  check(await p.evaluate(() => JSON.parse(localStorage.getItem('cookbook:data-centers')).id.startsWith('ch')), 'progress saved for the library (chN)');
  check(p.errors.length === 0, 'no console errors' + (p.errors.length ? ': ' + p.errors.slice(0, 3).join(' | ') : ''));
}

console.log('Old links (#ch1 … #ch12)');
{
  const p = await page({ viewport: { width: 1280, height: 760 } });
  for (const n of [1, 3, 5, 8, 12]) {
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
  check(!(await p.evaluate(() => window.__dc.playing)), 'no autoplay');
  await p.click('#bNextB'); await p.waitForTimeout(300);
  check((await p.evaluate(() => document.querySelector('#capText .rest').textContent)) === '' || await p.evaluate(() => getComputedStyle(document.querySelector('#capText .rest')).color !== 'rgba(0, 0, 0, 0)'), 'captions shown in full');
  check(!(await p.evaluate(() => window.__dc.playing)), 'stepping does not start playback');
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

console.log('No speech API');
{
  const p = await page({ viewport: { width: 1280, height: 760 }, speech: false });
  await p.addInitScript(() => { delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; Object.defineProperty(window, 'speechSynthesis', { value: undefined }); });
  await p.goto(BASE + '?paused'); await ready(p);
  check(await p.locator('#bVoice').isHidden(), 'Voice button hidden without speech support');
  await p.click('#bPlay'); await p.waitForTimeout(1500);
  check(await p.evaluate(() => window.__dc.playing) && p.errors.length === 0, 'tour still plays, no errors');
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
  const gb = await p.locator('#guide').boundingBox();
  check(gb && gb.x >= cap.x && gb.x + gb.width <= cap.x + cap.width && gb.y >= cap.y, 'guide sits inside the caption box');
  await p.click('#guide .ga-min'); check(await p.locator('#caption.guide-min').count() === 1, 'guide can be minimised'); await p.click('#guide .ga-min');
  await p.click('#bPlay'); await p.waitForTimeout(1500);
  check(await p.evaluate(() => window.__dc.playing), 'plays on mobile');
  check(p.errors.length === 0, 'no console errors');
}

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
