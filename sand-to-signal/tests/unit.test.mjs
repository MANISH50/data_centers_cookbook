// Unit tests: node --test sand-to-signal/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { STATIONS, PLACES, SOURCES, STOPS } from '../data.js';
import { validateStops, parseHash, formatHash, makeThrottle, nextIndex, prevIndex, camPos, flyTo, flightMs, scaleJump } from '../core.js';
import { nand, nandTransistors, fullAdder, rippleAdd, makeCpu, stepCpu, runCpu, PROGRAM, hex2, bin8, rgbHex, numberPixels } from '../logic.js';

test('stop data integrity: 15 stops, every required field, references resolve', () => {
  assert.deepEqual(validateStops(STOPS, { stations: STATIONS, places: PLACES, sources: SOURCES }), []);
  for (const s of STOPS) { assert.ok(s.where.length > 15, `stop ${s.id} where`); assert.ok(s.src.length, `stop ${s.id} cites a source`); }
  const used = new Set(STOPS.flatMap(s => s.src));
  for (const [id, s] of Object.entries(SOURCES)) { assert.match(s.u, /^https:\/\//); assert.ok(used.has(id), `source ${id} is cited`); }
});
test('every 3D station is visited by a stop', () => {
  const visited = new Set(STOPS.map(s => s.station));
  for (const k of Object.keys(STATIONS)) assert.ok(visited.has(k), k);
});
test('validator catches broken stops', () => {
  const bad = STOPS.slice(0, 14).map(s => ({ ...s })); bad[1].station = 'moon'; bad[2].place = 'nowhere';
  const errs = validateStops(bad, { stations: STATIONS, places: PLACES, sources: SOURCES });
  assert.ok(errs.some(e => e.includes('expected 15'))); assert.ok(errs.some(e => e.includes('unknown station'))); assert.ok(errs.some(e => e.includes('unknown place')));
});
test('hash routing', () => {
  assert.equal(parseHash('#stop-12', 15), 11); assert.equal(parseHash('#stop-16', 15), null); assert.equal(parseHash('#x', 15), null);
  for (let i = 0; i < 15; i++) assert.equal(parseHash(formatHash(i), 15), i);
});
test('input throttle: one move per 750 ms', () => {
  let t = 0; const thr = makeThrottle(750, () => t);
  assert.equal(thr(), true); t = 700; assert.equal(thr(), false); t = 760; assert.equal(thr(), true);
  assert.equal(nextIndex(14, 15), 0); assert.equal(prevIndex(0), 0);
});
test('camera maths', () => {
  const p = camPos([10, 0, 0], { az: 0, el: 0, dist: 5 }); assert.deepEqual(p.map(v => +v.toFixed(6)), [10, 0, 5]);
  const a = { look: STOPS[1].look, view: STOPS[1].view }, b = { look: STOPS[13].look, view: STOPS[13].view };
  assert.deepEqual(flyTo(a, b, 0).look, a.look); assert.deepEqual(flyTo(a, b, 1).look, b.look);
  assert.ok(flyTo(a, b, .5).view.dist > Math.max(a.view.dist, b.view.dist), 'rises mid-flight');
  assert.ok(flightMs(a, b) <= 2000); assert.equal(scaleJump(STOPS[1], STOPS[2]), true);
});
test('NAND gate and its transistors', () => {
  for (const [a, b, out] of [[0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 0]]) {
    assert.equal(nand(a, b), out); const t = nandTransistors(a, b);
    assert.equal(t.out, out); assert.equal(t.pullUp, !t.pullDown, 'exactly one network conducts');
  }
});
test('full adder from NANDs matches arithmetic for all inputs', () => {
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) { const r = fullAdder(a, b, c); assert.equal(r.sum + 2 * r.cout, a + b + c); }
});
test('ripple-carry adder: 7 + 5 = 12, and every 4-bit pair', () => {
  const r = rippleAdd(7, 5, 4);
  assert.equal(r.total, 12); assert.equal(r.sum, 12); assert.equal(r.carryOut, 0);
  assert.deepEqual(r.steps.map(s => s.cout), [1, 1, 1, 0]);
  for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) assert.equal(rippleAdd(a, b, 4).total, a + b);
});
test('toy CPU runs fetch → decode → execute and outputs the sum', () => {
  let s = makeCpu(7, 5);
  assert.equal(s.phase, 'fetch'); s = stepCpu(s); assert.equal(s.phase, 'decode'); assert.equal(s.ir, PROGRAM[0]);
  s = stepCpu(s); assert.equal(s.phase, 'execute'); s = stepCpu(s); assert.equal(s.reg[0], 7);
  const end = runCpu(7, 5); assert.equal(end.out, 12); assert.equal(end.halted, true); assert.equal(end.cycle, PROGRAM.length * 3);
  assert.equal(runCpu(49, 49).out, 98);
});
test('pixel helpers', () => {
  assert.equal(hex2(255), 'FF'); assert.equal(bin8(5), '00000101'); assert.equal(rgbHex(255, 179, 71), '#FFB347');
  const px = numberPixels(12); assert.ok(px.size > 10); for (const k of px) { const [x, y] = k.split(',').map(Number); assert.ok(x >= 0 && x < 16 && y >= 0 && y < 9); }
});
