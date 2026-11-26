// End-to-end check of the site-wide Display setting and the guide on every page of the library.
// Serve the repo root, then:  node shared/tests/e2e-display.mjs http://localhost:8765/
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const FAKE_SPEECH = readFileSync(new URL('./fake-speech.js', import.meta.url), 'utf8');
const BASE = (process.argv[2] || 'http://localhost:8765/').replace(/\/?$/, '/');
const fails = [];
const check = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fails.push(msg); };
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const cls = p => p.evaluate(() => document.documentElement.className);
async function newPage(ctx) {
  const p = await ctx.newPage(); p.errors = [];
  p.on('pageerror', e => p.errors.push(e.message)); p.on('console', m => m.type() === 'error' && p.errors.push(m.text()));
  p.on('response', r => r.status() >= 400 && p.errors.push(`HTTP ${r.status()}: ${r.url()}`));
  return p;
}

console.log('Home page: one Display setting for the whole library');
const ctx = await browser.newContext({ viewport: { width: 1280, height: 760 } });
await ctx.addInitScript({ content: FAKE_SPEECH + ';window.__msPerWord=120;' });
{
  const p = await newPage(ctx);
  await p.goto(BASE); await p.waitForTimeout(500);
  await p.click('#bDisplay');
  check(await p.locator('#dspMenu .dsp-row').count() === 3 && await p.locator('.dsp-row[aria-checked="true"]').count() === 3, 'Display menu: Guide, Text and Voice, all on at first');
  await p.click('.dsp-row[data-k="text"]'); await p.keyboard.press('Escape');
  check((await cls(p)).includes('no-text'), 'Text switched off from the home page');
  check(p.errors.length === 0, 'no errors on the home page');
}

for (const [dir, name] of [['netflix-streaming', 'Issue 04'], ['sand-to-signal', 'Issue 05']]) {
  console.log(`${name} (tour): docked guide reads each stop`);
  const p = await newPage(ctx);
  await p.goto(BASE + dir + '/'); await p.waitForTimeout(2500);
  check((await cls(p)).includes('no-text') && await p.locator('#card .ln').first().isHidden() && await p.locator('#card .title').isVisible(), 'the home-page choice applies: card text hidden, title and sources stay');
  await p.keyboard.press('c'); await p.waitForTimeout(200);
  check(await p.locator('#card .ln').first().isVisible(), 'C brings the text back');
  check(await p.locator('#guideDock #guide').isVisible(), 'the guide is docked on the page');
  await p.click('#bNext'); await p.waitForFunction(() => window.__spoken.length > 0, null, { timeout: 10000 }).catch(() => {}); await p.waitForTimeout(300);
  const said = await p.evaluate(() => window.__spoken.map(s => s.text));
  const title = await p.locator('#cardTitle').textContent();
  check(said.some(x => x.toLowerCase().startsWith(title.trim().toLowerCase().slice(0, 12))), `she reads the stop aloud (“${title.trim().slice(0, 30)}”)${said.length ? '' : ' [nothing spoken]'} ${JSON.stringify(said.map(x => x.slice(0, 25)))}`);
  await p.click('#gdListen'); await p.waitForTimeout(300);
  check(!(await p.evaluate(() => window.__dock.reading)), 'while she reads, the button stops her');
  await p.click('#gdListen'); await p.waitForTimeout(300);
  check(await p.evaluate(() => window.__spoken.length) > said.length, 'Listen reads the stop again');
  await p.keyboard.press('g'); await p.waitForTimeout(200);
  check(await p.locator('#guideDock #guide').isHidden() && await p.locator('#gdListen').isVisible(), 'Guide off: the presenter goes, Listen stays while the voice is on');
  await p.keyboard.press('v'); await p.waitForTimeout(200);
  check(await p.locator('#guideDock').isHidden(), 'Guide and Voice off: nothing left in the corner');
  await p.keyboard.press('g'); await p.keyboard.press('v'); await p.keyboard.press('c'); // back to: guide on, voice on, text off
  check(p.errors.length === 0, 'no errors' + (p.errors.length ? ': ' + p.errors.slice(0, 2).join(' | ') : ''));
}

for (const [dir, name] of [['azure-databricks', 'Issue 02'], ['ai-model', 'Issue 03']]) {
  console.log(`${name} (magazine): Listen reads from where you are`);
  const p = await newPage(ctx);
  await p.goto(BASE + dir + '/#ch3'); await p.waitForFunction(() => Math.abs(document.getElementById('ch3').getBoundingClientRect().top) < 200, null, { timeout: 8000 }).catch(() => p.evaluate(() => document.getElementById('ch3').scrollIntoView())); await p.waitForTimeout(400);
  await p.click('#bDisplay');
  check(await p.locator('#dspMenu .dsp-row').count() === 2 && await p.locator('.dsp-row[data-k="text"]').count() === 0, 'Display menu: Guide and Voice (the magazine itself is the text)');
  await p.keyboard.press('Escape');
  await p.click('#gdListen'); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({ n: window.__spoken.length, el: document.querySelector('.reading-now')?.closest('.chapter')?.id }));
  check(r.n > 0 && r.el === 'ch3', `she reads aloud from chapter 3, highlighting the paragraph (${r.el})`);
  await p.click('#gdListen'); await p.waitForTimeout(300);
  check(await p.locator('.reading-now').count() === 0 && (await p.getAttribute('#gdListen', 'aria-pressed')) === 'false', 'Stop ends the reading');
  check(p.errors.length === 0, 'no errors' + (p.errors.length ? ': ' + p.errors.slice(0, 2).join(' | ') : ''));
}

console.log('Phones: Display button and guide fit');
{
  const m = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });
  for (const dir of ['', 'azure-databricks/', 'ai-model/', 'netflix-streaming/', 'sand-to-signal/', 'data-centers/?paused', 'internet/?paused']) {
    const p = await newPage(m); await p.goto(BASE + dir); await p.waitForTimeout(1200);
    const r = await p.evaluate(() => { const b = document.getElementById('bDisplay').getBoundingClientRect(); return { over: document.documentElement.scrollWidth - innerWidth, w: b.width, h: b.height, vis: b.width > 0 }; });
    check(r.vis && r.over <= 0 && r.w >= 40 && r.h >= 40, `${dir || 'home'}: Display button ≥ 40 px, no sideways scroll`);
  }
}

await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
