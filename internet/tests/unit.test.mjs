// Unit tests: node --test internet/tests/*.test.mjs   (shared helpers: shared/tests/*.test.mjs)
import test from 'node:test';
import assert from 'node:assert/strict';
import { SOURCES, CHAPTERS, RECAPS, CITIES, LINKS, PHOTOS } from '../data.js';
import { buildTimeline, cueProgress, parseHash, validate } from '../../shared/timeline.js';
import { gcKm, rttMs, linkKm, shortestPath, pathPoints, DNS_STEPS, dnsStep, deliver } from '../net.js';
import { DIAGRAMS, proj, coastPath, routeOf, MAP_W, MAP_H } from '../diagrams.js';

const TL = buildTimeline(CHAPTERS), IDS = CHAPTERS.map(c => c.id);

test('content integrity: 14 chapters, every beat valid, every cited source exists', () => {
  assert.deepEqual(validate(CHAPTERS, SOURCES, 14), []);
  for (const c of CHAPTERS) { assert.ok(RECAPS[c.id]?.length, `${c.id} recap`); assert.ok(c.where, `${c.id} where`); }
  for (const b of TL.beats) if (b.try) assert.ok(['route', 'cut', 'dns', 'tcp'].includes(b.try));
  for (const s of SOURCES) if (s.u) assert.match(s.u, /^https:\/\//);
  assert.deepEqual(parseHash('#ch9', TL, IDS), { t: TL.chapterStart[8], ci: 8 });
  assert.ok(TL.beats[0].photo && PHOTOS.length >= 15);
  for (const b of TL.beats) assert.doesNotMatch(b.text, /\b(3D|drag|on this globe)\b/i, b.text.slice(0, 40));
});

test('every diagram draws at the start, middle and end of its beats', () => {
  for (const b of TL.beats) if (b.cue) {
    assert.ok(DIAGRAMS[b.cue], 'diagram for ' + b.cue);
    for (const t of [b.start, b.start + b.d / 2, b.end]) { const out = DIAGRAMS[b.cue](cueProgress(b, t), b); assert.match(out.svg, /^<svg viewBox/); assert.doesNotMatch(out.svg + (out.status || ''), /NaN|undefined/, b.cue); }
  }
});

test('the flat map: projection, coastline and routes stay on the map', () => {
  assert.deepEqual(proj([80, -180]), [0, 0]); assert.deepEqual(proj([-60, 180]), [MAP_W, MAP_H]);
  const d = coastPath(); assert.ok(d.length > 5000 && /^M/.test(d) && !/NaN/.test(d));
  const r = routeOf('mumbai', 'london'); for (const [x, y] of r.pts) assert.ok(x >= 0 && x <= MAP_W && y >= 0 && y <= MAP_H);
  const cut = DIAGRAMS.cut(.5); assert.match(cut.status, /Rerouted/); assert.match(cut.svg, /dg-bad-line/);
});

test('great-circle distances and light-speed delay are right', () => {
  const ml = gcKm(CITIES.mumbai.ll, CITIES.london.ll);
  assert.ok(Math.abs(ml - 7192) < 15, `Mumbai–London ≈ 7,192 km (${ml.toFixed(0)})`);
  assert.ok(Math.abs(rttMs(ml) - 71.9) < .3, 'about 72 ms round trip at 200,000 km/s');
  assert.equal(rttMs(100), 1, '1 ms per 100 km round trip… i.e. 0.5 ms each way per 100 km');
  assert.ok(Math.abs(gcKm([0, 0], [0, 180]) - Math.PI * 6371) < 1, 'half way round the equator');
});

test('the illustrative network connects every city, and routes never beat the straight line', () => {
  const ks = Object.keys(CITIES);
  for (const a of ks) for (const b of ks) if (a !== b) {
    const r = shortestPath(a, b, LINKS, CITIES); assert.ok(r, `${a} → ${b}`);
    assert.ok(r.km >= gcKm(CITIES[a].ll, CITIES[b].ll) - 1, `${a} → ${b} not shorter than straight line`);
    assert.equal(r.nodes[0], a); assert.equal(r.nodes.at(-1), b);
    const pts = pathPoints(r, CITIES); assert.deepEqual(pts[0], CITIES[a].ll); assert.deepEqual(pts.at(-1), CITIES[b].ll);
  }
  for (const l of LINKS) assert.ok(linkKm(l, CITIES) > 0);
});

test('cutting a cable reroutes onto a longer path', () => {
  const before = shortestPath('mumbai', 'london', LINKS, CITIES), after = shortestPath('mumbai', 'london', LINKS, CITIES, new Set(['med']));
  assert.ok(before.links.some(l => l.id === 'med'));
  assert.ok(after && !after.links.some(l => l.id === 'med') && after.km > before.km);
});

test('DNS steps and TCP/UDP delivery rules', () => {
  assert.equal(DNS_STEPS.length, 8); assert.equal(dnsStep(0), 0); assert.equal(dnsStep(.999), 7); assert.equal(dnsStep(1), 7);
  assert.equal(DNS_STEPS[0][1], 'resolver'); assert.equal(DNS_STEPS.at(-1)[1], 'device');
  const tcp = deliver(6, 3, 'tcp'), udp = deliver(6, 3, 'udp');
  assert.deepEqual(tcp.got, [1, 2, 3, 4, 5, 6]); assert.ok(tcp.complete); assert.deepEqual(tcp.resent, [3]);
  assert.deepEqual(udp.got, [1, 2, 4, 5, 6]); assert.ok(!udp.complete);
});
