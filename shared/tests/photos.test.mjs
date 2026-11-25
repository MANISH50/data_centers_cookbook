import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from '../timeline.js';
import { drift, kenBurns, fadeIn, layout, uvToPx, validatePhotos, GLIDE } from '../photos.js';
import { versionPage, hash } from '../prerender-kit.mjs';

const beats = [{ photo: 'a', d: 10, text: 'x' }, { photo: 'a', d: 10, text: 'y', focus: [.3, .4, 2] }, { photo: 'b', d: 10, text: 'z' }];
const TL = buildTimeline([{ beats }]);

test('drift: a slow, small pan and zoom across each beat', () => {
  const b = TL.beats[0], s = drift(b, b.start), e = drift(b, b.end);
  assert.deepEqual(s, { u: .5, v: .5, z: 1 });
  assert.ok(e.z > 1 && e.z < 1.1 && Math.abs(e.u - .5) < .05 && Math.abs(e.v - .5) < .05);
  assert.deepEqual(drift(b, b.end, true), s, 'reduced motion: no movement');
});
test('kenBurns glides between two views of the same photo, and cuts to a new photo', () => {
  const b1 = TL.beats[1], end0 = drift(TL.beats[0], TL.beats[0].end);
  assert.deepEqual(kenBurns(TL, 1, b1.start), end0, 'starts where the previous beat ended');
  assert.deepEqual(kenBurns(TL, 1, b1.start + GLIDE + .01), drift(b1, b1.start + GLIDE + .01), 'then follows its own focus');
  assert.deepEqual(kenBurns(TL, 2, TL.beats[2].start), drift(TL.beats[2], TL.beats[2].start), 'a new photo starts on its own view');
});
test('fadeIn crossfades only when the photo changes', () => {
  assert.equal(fadeIn(TL, 0, 0), 1, 'the first photo is there from the start');
  assert.equal(fadeIn(TL, 1, TL.beats[1].start), 1);
  assert.equal(fadeIn(TL, 2, TL.beats[2].start), 0);
  assert.equal(fadeIn(TL, 2, TL.beats[2].start + 5), 1);
});
test('layout covers the stage and puts the focus point in the middle of the free area', () => {
  const box = { w: 1280, h: 760 }, area = { x: 0, y: 56, w: 1280, h: 500 };
  const L = layout({ u: .5, v: .5, z: 1 }, 1.5, box, area);
  assert.ok(L.w >= box.w && L.h >= box.h && L.left <= 0 && L.top <= 0 && L.left + L.w >= box.w && L.top + L.h >= box.h, 'no gaps');
  const Z = layout({ u: .7, v: .4, z: 2 }, 1.5, box, area), [x, y] = uvToPx([.7, .4], Z);
  assert.ok(Math.abs(x - 640) < 1 && Math.abs(y - 306) < 1, 'focus point centred');
  const C = layout({ u: .5, v: .5, z: 1 }, .35, box, area, 'contain');
  assert.ok(C.h <= area.h && C.top >= area.y - 1, 'a tall photo fits inside the free area');
});

for (const dir of ['data-centers', 'internet']) {
  test(`${dir}: every beat has a real photo; every photo is credited, freely licensed, on disk with a thumbnail, and shown`, async () => {
    const { CHAPTERS, PHOTOS } = await import(`../../${dir}/data.js`);
    assert.deepEqual(validatePhotos(CHAPTERS, PHOTOS), []);
    for (const p of PHOTOS) for (const f of [p.file, p.thumb]) assert.ok(existsSync(fileURLToPath(new URL(`../../${dir}/${f}`, import.meta.url))), `${dir}/${f}`);
  });
  test(`${dir}: the page versions every module and stylesheet with its current content hash`, () => {
    const pageDir = fileURLToPath(new URL(`../../${dir}`, import.meta.url)), html = readFileSync(pageDir + '/index.html', 'utf8');
    assert.equal(versionPage(html, pageDir), html, 'index.html is up to date: run node ' + dir + '/prerender.mjs');
    const map = JSON.parse(/<script type="importmap">(.*?)<\/script>/.exec(html)[1]).imports;
    for (const f of ['./data.js', './main.js', '../shared/walkthrough.js', '../shared/photos.js', '../shared/anchor.js']) assert.equal(map[f], `${f}?v=${hash(pageDir + '/' + f)}`, f);
  });
}
test('validatePhotos catches mistakes', () => {
  const ch = [{ beats: [{ photo: 'x', focus: [2, 0, 1] }, { text: 'no photo' }, { photo: 'nope', plabels: [['far', [2, 0]]] }] }];
  const errs = validatePhotos(ch, [{ id: 'x', file: 'x.jpg', thumb: 't.jpg', title: 'X', alt: 'x', author: 'A', licence: 'CC BY-SA 4.0', licUrl: '', url: 'https://example.com/x', w: 1, h: 1 }, { id: 'unused', file: 'u', thumb: 'u', title: 'U', alt: 'u', author: 'A', licence: 'All rights reserved', url: 'https://commons.wikimedia.org/wiki/File:U.jpg', w: 1, h: 1 }]);
  for (const re of [/bad focus/, /no photo/, /unknown photo nope/, /outside the photo/, /Commons file page/, /needs a link/, /not a free licence/, /unused is never shown/]) assert.ok(errs.some(e => re.test(e)), re);
});
