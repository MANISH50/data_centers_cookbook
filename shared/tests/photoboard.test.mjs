import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { boardFrame, fadeAt, uvToLocal, validatePhotos } from '../photoboard.js';

const beat = (start, d, photo) => ({ start, end: start + d, d, photo, look: [0, 0, 0], view: { az: 0, el: 0, dist: 10 } });

test('boardFrame stands the photo between the look point and the camera, facing it', () => {
  const f = boardFrame({ look: [0, 0, 0], view: { az: -3.5, el: 0, dist: 10 } });
  assert.deepEqual(f.pos.map(v => +v.toFixed(6)), [0, 0, 3.2]);
  assert.equal(f.rotY, 0); assert.equal(+f.camDist.toFixed(6), 6.8);
  const up = boardFrame({ look: [1, 2, 3], view: { az: 86.5, el: 30, dist: 20 } });
  assert.ok(up.pos[0] > 1 && up.pos[1] > 2, 'moves toward a camera that is to the side and above');
  assert.ok(up.rotX < 0, 'tilts back to face a camera looking down');
});
test('fadeAt fades a photo in and out, and holds it across beats that share it', () => {
  const B = [beat(0, 10), beat(10, 10, 'a'), beat(20, 10, 'a'), beat(30, 10, 'b')];
  assert.equal(fadeAt(B, 0, 5), 0);
  assert.equal(fadeAt(B, 1, 10), 0);
  assert.ok(fadeAt(B, 1, 10.5) > 0 && fadeAt(B, 1, 10.5) < 1);
  assert.equal(fadeAt(B, 1, 12), 1);
  assert.equal(fadeAt(B, 1, 19.9), 1, 'no fade-out before a beat with the same photo');
  assert.equal(fadeAt(B, 2, 20.1), 1, 'no fade-in after a beat with the same photo');
  assert.ok(fadeAt(B, 2, 29.9) < 1, 'fades out before a different photo');
  assert.equal(fadeAt(B, 3, -1e9), 0, 'far-off time hides it (used while a Try-it panel is open)');
});
test('uvToLocal maps photo corners to the board', () => {
  assert.deepEqual(uvToLocal([0, 0], 4, 2), [-2, 1, .02]);
  assert.deepEqual(uvToLocal([1, 1], 4, 2), [2, -1, .02]);
  assert.deepEqual(uvToLocal([.5, .5], 4, 2), [0, 0, .02]);
});

for (const dir of ['data-centers', 'internet']) {
  test(`${dir}: every photo is credited, licensed, on disk and shown`, async () => {
    const { CHAPTERS, PHOTOS } = await import(`../../${dir}/data.js`);
    assert.deepEqual(validatePhotos(CHAPTERS, PHOTOS), []);
    for (const p of PHOTOS) assert.ok(existsSync(fileURLToPath(new URL(`../../${dir}/${p.file}`, import.meta.url))), `${dir}/${p.file} exists`);
  });
}
test('validatePhotos catches mistakes', () => {
  const ch = [{ beats: [{ photo: 'x' }, { photo: 'nope' }] }];
  const errs = validatePhotos(ch, [{ id: 'x', file: 'x.jpg', title: 'X', alt: 'x', author: 'A', licence: 'CC BY-SA 4.0', licUrl: '', url: 'https://example.com/x', w: 1, h: 1, labels: [['far', [2, 0]]] }]);
  assert.ok(errs.some(e => /unknown photo nope/.test(e)));
  assert.ok(errs.some(e => /Commons file page/.test(e)));
  assert.ok(errs.some(e => /needs a link/.test(e)));
  assert.ok(errs.some(e => /outside the photo/.test(e)));
});
