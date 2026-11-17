// Unit tests: node --test netflix-streaming/tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, WIRE_TYPES, BADGES, ZONES, WIRES, TIMELINE, SOURCES, STOPS } from '../data.js';
import { validateStops, parseHash, formatHash, makeThrottle, nextIndex, prevIndex, flyCam, flightMs, viewBoxFor, captionOrder } from '../core.js';

test('stop data integrity: 15 stops, every required field, all references resolve', () => {
  const errs = validateStops(STOPS, { zones: ZONES, wires: WIRES, sources: SOURCES, badges: BADGES, wireTypes: WIRE_TYPES });
  assert.deepEqual(errs, []);
  assert.equal(STOPS.length, 15);
  for (const s of STOPS) {
    assert.ok(s.title && s.eyebrow, `stop ${s.id} title`);
    assert.ok(s.dc.text.length > 20, `stop ${s.id} has a data-center role`);
    assert.ok(BADGES[s.dc.badge], `stop ${s.id} location badge`);
    assert.ok(ZONES.some(z => z.id === s.site), `stop ${s.id} highlighted site`);
    assert.ok(s.cam.x >= 0 && s.cam.x <= WORLD.w && s.cam.y >= 0 && s.cam.y <= WORLD.h, `stop ${s.id} camera inside the world`);
    assert.ok(s.src.length >= 1, `stop ${s.id} cites a source`);
  }
});

test('validator catches broken stops', () => {
  const bad = STOPS.map(s => ({ ...s }));
  bad[2] = { ...bad[2], site: 'nowhere', dc: { badge: 'moon', text: '' } };
  bad.pop();
  const errs = validateStops(bad, { zones: ZONES, wires: WIRES, sources: SOURCES, badges: BADGES, wireTypes: WIRE_TYPES });
  assert.ok(errs.some(e => e.includes('expected 15')));
  assert.ok(errs.some(e => e.includes('unknown site')));
  assert.ok(errs.some(e => e.includes('bad dc block')));
});

test('every source is https and used by at least one stop', () => {
  const used = new Set(STOPS.flatMap(s => s.src));
  for (const [id, s] of Object.entries(SOURCES)) {
    assert.match(s.u, /^https:\/\//, id);
    assert.ok(used.has(id), `source ${id} is cited`);
  }
});

test('wire paths are valid path data and typed', () => {
  for (const w of WIRES) { assert.ok(WIRE_TYPES[w.type], w.id); assert.match(w.d, /^M[\d .,MCLQ-]+$/, w.id); }
  assert.ok(TIMELINE.every(e => e.stop === 13 || e.stop === 14));
});

test('hash routing: parse and format', () => {
  assert.equal(parseHash('#stop-8', 15), 7);
  assert.equal(parseHash('stop-1', 15), 0);
  assert.equal(parseHash('#STOP-15', 15), 14);
  assert.equal(parseHash('#stop-16', 15), null);
  assert.equal(parseHash('#stop-0', 15), null);
  assert.equal(parseHash('#ch3', 15), null);
  assert.equal(parseHash('', 15), null);
  assert.equal(formatHash(7), '#stop-8');
  for (let i = 0; i < 15; i++) assert.equal(parseHash(formatHash(i), 15), i);
});

test('input throttle: one move per 750 ms', () => {
  let t = 1000; const thr = makeThrottle(750, () => t);
  assert.equal(thr(), true);
  t += 100; assert.equal(thr(), false);
  t += 600; assert.equal(thr(), false);
  t += 60; assert.equal(thr(), true);
  t += 749; assert.equal(thr(), false);
  t += 1; assert.equal(thr(), true);
});

test('next restarts after the last stop; prev stops at the first', () => {
  assert.equal(nextIndex(0, 15), 1);
  assert.equal(nextIndex(14, 15), 0);
  assert.equal(prevIndex(0), 0);
  assert.equal(prevIndex(5), 4);
});

test('Data-center view toggle puts the data-center block first', () => {
  assert.deepEqual(captionOrder(false), ['main', 'dc']);
  assert.deepEqual(captionOrder(true), ['dc', 'main']);
});

test('camera flight: starts and ends on target, zooms out mid-flight for far stops', () => {
  const a = STOPS[2].cam, b = STOPS[7].cam;
  assert.deepEqual(flyCam(a, b, 0, WORLD), { ...a, zoom: a.zoom });
  const end = flyCam(a, b, 1, WORLD);
  assert.ok(Math.abs(end.x - b.x) < 1e-6 && Math.abs(end.zoom - b.zoom) < 1e-6);
  const mid = flyCam(a, b, .5, WORLD);
  assert.ok(mid.zoom < Math.min(a.zoom, b.zoom), 'zooms out between far stops');
  assert.ok(flightMs(a, b, WORLD) >= 900 && flightMs(a, b, WORLD) <= 1800);
});

test('viewBox centres the target in the free area', () => {
  const area = { x: 480, y: 70, w: 780, h: 600 }, screen = { w: 1280, h: 760 };
  const [x, y, w, h] = viewBoxFor({ x: 2000, y: 1000, zoom: 2 }, WORLD, area, screen);
  const s = screen.w / w;
  assert.ok(Math.abs((2000 - x) * s - (area.x + area.w / 2)) < 1e-6);
  assert.ok(Math.abs((1000 - y) * s - (area.y + area.h / 2)) < 1e-6);
  assert.ok(Math.abs(h - screen.h / s) < 1e-6);
});
