// End-to-end checks shared by the photo walkthroughs (Issue 01 and Issue 06), with the pre-installed Playwright.
// Each issue's tests/e2e.mjs calls run({ dir, chapters, sources, extra }). A fake speech engine stands in for the voice.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const FAKE_SPEECH = readFileSync(new URL('./fake-speech.js', import.meta.url), 'utf8');

export async function run({ dir, chapters, sources, extra }) {
  const BASE = (process.argv[2] || 'http://localhost:8765/').replace(/\/?$/, '/') + dir + '/';
  const { PHOTOS, CHAPTERS } = await import(`../../${dir}/data.js`);
  const fails = [];
  const check = (ok, msg) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg); if (!ok) fails.push(msg); };
  const browser = await chromium.launch();
  async function page(opts = {}) {
    const { speech = true, ...o } = opts;
    const ctx = await browser.newContext(o); const p = await ctx.newPage(); p.errors = [];
    if (speech) await p.addInitScript({ content: FAKE_SPEECH });
    p.on('console', m => m.type() === 'error' && p.errors.push(m.text())); p.on('pageerror', e => p.errors.push(e.message));
    p.on('requestfailed', r => p.errors.push('request failed: ' + r.url()));
    p.on('response', r => r.status() >= 400 && p.errors.push(`HTTP ${r.status()}: ${r.url()}`));
    return p;
  }
  const W = p => p.evaluate(() => ({ t: window.__wt.t, playing: window.__wt.playing, photo: window.__wt.photo, speaking: window.__wt.voice.speaking }));
  const chapter = p => p.evaluate(() => +document.querySelector('#capEyebrow').textContent.slice(0, 2));
  const seekTo = async (p, s) => { await p.locator('#scrub').fill(String(Math.max(0, Math.round(s)))); await p.waitForTimeout(250); };
  const photoReady = (p, id) => p.waitForFunction(id => window.__wt.photo && window.__wt.photo.id === id && window.__wt.photo.ready, id, { timeout: 8000 }).then(() => true, () => false);

  console.log('Desktop 1280×760');
  {
    const p = await page({ viewport: { width: 1280, height: 760 } });
    await p.goto(BASE);
    check(await photoReady(p, CHAPTERS[0].beats[0].photo), 'a real photo is showing from the first second');
    check((await p.locator('#phCredit').textContent()).includes('Wikimedia Commons'), 'its credit is shown under the caption');
    await p.waitForTimeout(2500);
    check((await W(p)).playing, 'the walkthrough starts playing on its own');
    check(await p.locator('#guide .ga-hint').isVisible(), 'the guide asks for a tap before she can speak (browser rule)');
    await p.click('#bPlay'); await p.click('#bPlay'); await p.waitForTimeout(600);
    const spoken = await p.evaluate(() => window.__spoken);
    check(spoken.length > 0 && spoken.at(-1).voice === 'Samantha', `after a tap the guide reads the caption (voice ${spoken.at(-1)?.voice})`);
    const t1 = (await W(p)).t; await p.waitForTimeout(2000); const t2 = (await W(p)).t;
    check(t2 > t1 + 1, `time moves while playing (${t1.toFixed(1)} → ${t2.toFixed(1)} s)`);
    // the photo drifts slowly (Ken Burns)
    const tr1 = await p.evaluate(() => document.querySelector('#phA .fg').style.transform); await p.waitForTimeout(800);
    check(tr1 !== await p.evaluate(() => document.querySelector('#phA .fg').style.transform), 'the photo pans and zooms slowly while playing');
    await p.click('#bPlay'); const tp = (await W(p)).t; await p.waitForTimeout(900);
    const wp = await W(p); check(!wp.playing && Math.abs(wp.t - tp) < .05 && !wp.speaking, 'Pause stops time and the voice');
    await p.keyboard.press('Space'); await p.waitForTimeout(400); check((await W(p)).playing, 'Space resumes');
    await p.click('#photos'); await p.waitForTimeout(300); check(!(await W(p)).playing, 'tapping the photo pauses');
    // every chapter has its photos
    for (let ci = 0; ci < chapters; ci++) {
      const s = await p.evaluate(ci => window.__wt.TL.chapterStart[ci], ci);
      await seekTo(p, s + 1); const want = await p.evaluate(t => { const T = window.__wt.TL; return T.beats.find(b => b.start <= t && t < b.end).photo; }, Math.round(s + 1));
      check(await photoReady(p, want) && await chapter(p) === ci + 1, `chapter ${ci + 1}: real photo “${want}” loads`);
    }
    // labels pinned to a photo, diagrams only on idea beats
    const lb = await p.evaluate(() => window.__wt.TL.beats.find(b => b.plabels && b.plabels.length));
    await seekTo(p, lb.start + 3); await p.waitForTimeout(1200);
    check(await p.locator('.lbl3.on').count() >= 1, `labels appear on the photo (“${lb.plabels[0][0]}”)`);
    const dgb = await p.evaluate(() => window.__wt.TL.beats.find(b => b.cue));
    await seekTo(p, dgb.start + 2); await p.waitForTimeout(400);
    check(await p.locator('#diagram').isVisible() && await p.locator('#diagram svg').count() === 1, `a small diagram explains an idea (${dgb.cue})`);
    const plain = await p.evaluate(() => window.__wt.TL.beats.find(b => !b.cue));
    await seekTo(p, plain.start + 2); await p.waitForTimeout(400);
    check(await p.locator('#diagram').isHidden(), 'photo-only beats show no diagram');
    // scrubber photo marks and the Photos gallery
    check(await p.locator('#pmarks i').count() >= PHOTOS.length, 'the timeline marks where each photo starts');
    await p.click('#bPhotos');
    check(await p.locator('#phDlg[open] #phGrid li').count() === PHOTOS.length, `Photos gallery lists all ${PHOTOS.length} photos`);
    const pick = PHOTOS[Math.floor(PHOTOS.length / 2)];
    await p.click(`#phGrid button[data-id="${pick.id}"]`); await p.waitForTimeout(300);
    check(await p.locator('#phDlg[open]').count() === 0 && await photoReady(p, pick.id), `tapping a thumbnail jumps to “${pick.id}”`);
    if ((await W(p)).playing) await p.click('#bPlay');
    // the film waits for the guide; Voice off lets it go on
    await p.evaluate(() => { window.__msPerWord = 3000; });
    const B = await p.evaluate(() => { const b = window.__wt.TL.beats[3]; return { start: b.start, end: b.end }; });
    await seekTo(p, Math.ceil(B.end - 2)); if (!(await W(p)).playing) await p.click('#bPlay');
    await p.waitForTimeout(4000); const th = (await W(p)).t;
    check(th < B.end && th > B.end - .2, `the film waits at the end of a beat while she talks (t=${th.toFixed(2)}, end=${B.end})`);
    await p.click('#bVoice'); await p.waitForTimeout(1500);
    check((await p.getAttribute('#bVoice', 'aria-pressed')) === 'false' && (await W(p)).t > B.end, 'Voice off: she stops and the film moves on');
    await p.keyboard.press('v'); check((await p.getAttribute('#bVoice', 'aria-pressed')) === 'true', 'V turns her back on');
    await p.evaluate(() => { window.__msPerWord = 60; });
    // chapters, speed, text version, sources
    await p.click('#ticks .tick[data-i="2"]'); await p.waitForTimeout(400); check(await chapter(p) === 3, 'chapter marker jumps');
    await p.click('#bNextC'); await p.waitForTimeout(300); check(await chapter(p) === 4, 'next-chapter button');
    await p.click('#bSpeed'); check((await p.textContent('#bSpeed')) === '1.5×', 'speed control'); await p.click('#bSpeed'); await p.click('#bSpeed');
    await p.click('#bChapters'); check(await p.locator('#chDlg[open] #chList li').count() === chapters, `chapters menu lists ${chapters}`);
    await p.click('#chList button[data-i="5"]'); await p.waitForTimeout(300); check(await chapter(p) === 6, 'chapters menu jumps');
    if (extra) await extra(p, { check, seekTo, W, photoReady });
    await p.click('#bText');
    check(await p.locator('#text section h3').count() === chapters + 1, 'text version: every chapter + sources');
    check(await p.locator('#text figure.photo').count() === PHOTOS.length, 'text version shows each photo once, with its credit');
    await p.click('#text [data-back-to-tour]');
    await p.click('#bSrc'); check(await p.locator('#srcDlg[open] li').count() === sources + PHOTOS.length, `Sources lists ${sources} sources and ${PHOTOS.length} photo credits`); await p.click('#srcDlg [data-close]');
    const names = await p.evaluate(() => [...new Set(window.cookbookEvents.map(e => e.name))]);
    for (const n of ['topic_start', 'chapter_view', 'play', 'pause', 'read_as_text', 'voice', 'photos_open', 'photo_jump']) check(names.includes(n), 'event ' + n);
    check(await p.evaluate(dir => JSON.parse(localStorage.getItem('cookbook:' + dir)).id.startsWith('ch'), dir), 'progress saved for the library');
    check(p.errors.length === 0, 'no console errors or failed requests' + (p.errors.length ? ': ' + p.errors.slice(0, 3).join(' | ') : ''));
  }

  console.log('Links: #chN, #photos, #sources');
  {
    const p = await page({ viewport: { width: 1280, height: 760 } });
    for (const n of [1, 3, Math.min(5, chapters), chapters]) { await p.goto(BASE + '?paused#ch' + n); await p.reload(); await p.waitForTimeout(500); check(await chapter(p) === n, `#ch${n} opens chapter ${n}`); }
    await p.goto(BASE + '#photos'); await p.reload(); await p.waitForTimeout(500); check(await p.locator('#phDlg[open]').count() === 1, '#photos opens the gallery');
    await p.goto(BASE + '#sources'); await p.reload(); await p.waitForTimeout(500); check(await p.locator('#srcDlg[open]').count() === 1, '#sources opens Sources');
    check(!(await W(p)).playing, 'opening a panel by link does not autoplay');
  }

  console.log('Reduced motion');
  {
    const p = await page({ viewport: { width: 1280, height: 760 }, reducedMotion: 'reduce' });
    await p.goto(BASE); await p.waitForTimeout(2500);
    check(!(await W(p)).playing, 'no autoplay');
    await p.click('#bNextB'); await p.waitForTimeout(300);
    check(!(await W(p)).playing && (await p.evaluate(() => document.querySelector('#capText .rest').textContent)) === '', 'stepping shows the full caption and does not play');
    await p.click('#bPlay'); const a = await p.evaluate(() => document.querySelector('#phA .fg').style.transform); await p.waitForTimeout(900);
    check(a === await p.evaluate(() => document.querySelector('#phA .fg').style.transform), 'photos stay still (no pan or zoom)');
    check(p.errors.length === 0, 'no console errors');
  }

  console.log('No speech API');
  {
    const p = await page({ viewport: { width: 1280, height: 760 }, speech: false });
    await p.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined }); });
    await p.goto(BASE + '?paused'); await p.waitForTimeout(500);
    check(await p.locator('#bVoice').isHidden(), 'Voice button hidden without speech support');
    await p.click('#bPlay'); await p.waitForTimeout(1200); check((await W(p)).playing && p.errors.length === 0, 'the walkthrough still plays, no errors');
  }

  console.log('Mobile 390×800');
  {
    const p = await page({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await p.goto(BASE + '?paused'); await p.waitForTimeout(1500);
    check(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, 'no horizontal overflow');
    const small = await p.evaluate(() => [...document.querySelectorAll('.bar a,.bar button,.ctrl button:not(.tick)')].filter(b => b.offsetParent).map(b => b.getBoundingClientRect()).filter(r => r.width < 40 || r.height < 40).length);
    check(small === 0, 'header and control targets ≥ 40 px');
    const cap = await p.locator('#caption').boundingBox(), ctrl = await p.locator('.ctrl').boundingBox();
    check(cap.y + cap.height <= ctrl.y + 1 && cap.x >= 0 && cap.x + cap.width <= 390, 'caption fits above the controls');
    const g = await p.locator('#guide').boundingBox(); check(g && g.x >= cap.x && g.y >= cap.y, 'guide sits in the caption box');
    check((await W(p)).photo.ready, 'photo shows on a phone');
    const dgb = await p.evaluate(() => window.__wt.TL.beats.find(b => b.cue));
    await seekTo(p, dgb.start + 2); await p.waitForTimeout(500);
    const d = await p.locator('#diagram').boundingBox(), cap2 = await p.locator('#caption').boundingBox();
    check(d && d.y + d.height <= cap2.y + 1 && d.x >= 0 && d.x + d.width <= 391, 'diagram card fits above the caption');
    const sb = await p.evaluate(() => window.__wt.TL.beats.find(b => b.stat && b.cue) || window.__wt.TL.beats.find(b => b.stat));
    await seekTo(p, sb.start + 2); await p.waitForTimeout(500);
    const sc = await p.locator('#stat').boundingBox(), cap3 = await p.locator('#caption').boundingBox(), dg3 = await p.locator('#diagram').isVisible() ? await p.locator('#diagram').boundingBox() : null;
    check(sc && sc.y + sc.height <= cap3.y + 1 && (!dg3 || sc.y >= dg3.y + dg3.height - 1), 'stat card sits between the diagram and the caption, overlapping neither');
    await p.click('#bPlay'); await p.waitForTimeout(1000); check((await W(p)).playing, 'plays on a phone');
    check(p.errors.length === 0, 'no console errors');
  }

  await browser.close();
  console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL CHECKS PASSED');
  process.exit(fails.length ? 1 : 0);
}
