// Unit tests: node --test internet/tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { POI, SOURCES, CHAPTERS, RECAPS, CITIES, LINKS } from '../data.js';
import { buildTimeline, beatAt, cueProgress, cameraAt, camPos, typedChars, parseHash, validate, GLIDE } from '../timeline.js';
import { gcKm, rttMs, llToXyz, linkKm, shortestPath, pathPoints, DNS_STEPS, dnsStep, deliver } from '../net.js';

const TL = buildTimeline(CHAPTERS, POI), IDS = CHAPTERS.map(c => c.id);

test('content integrity: 14 chapters, every beat valid, every cited source exists', () => {
  assert.deepEqual(validate(CHAPTERS, POI, SOURCES, 14), []);
  for (const c of CHAPTERS) { assert.ok(RECAPS[c.id]?.length, `${c.id} recap`); assert.ok(c.where, `${c.id} where`); }
  const ids = new Set(SOURCES.map(s => s.id));
  for (const b of TL.beats) { if (b.src) assert.ok(ids.has(b.src), b.src); if (b.try) assert.ok(['route', 'cut', 'dns', 'tcp'].includes(b.try)); }
  for (const s of SOURCES) if (s.u) assert.match(s.u, /^https:\/\//);
});

test('timeline: back to back, lookups, continuous camera, captions fit', () => {
  TL.beats.forEach((b, i) => { if (i) assert.equal(b.start, TL.beats[i - 1].end); assert.equal(beatAt(TL, b.start + .01), i); assert.equal(typedChars(b, b.end), b.text.length); });
  for (const b of TL.beats.slice(1)) { const a = cameraAt(TL, b.start - 1e-4), c = cameraAt(TL, b.start + 1e-4); const pa = camPos(a.look, a.view), pc = camPos(c.look, c.view); assert.ok(Math.hypot(pa[0] - pc[0], pa[1] - pc[1], pa[2] - pc[2]) < 2); assert.deepEqual(cameraAt(TL, b.start + GLIDE + .01).look, b.look); }
  assert.deepEqual(parseHash('#ch9', TL, IDS), { t: TL.chapterStart[8], ci: 8 });
  assert.equal(parseHash('#sources', TL, IDS).sources, true);
});

test('cue sub-ranges hand over smoothly between beats', () => {
  for (const cue of ['pkt', 'addr', 'dns', 'first', 'hops', 'bgp', 'cut']) {
    const bs = TL.beats.filter(b => b.cue === cue && b.p1 != null);
    for (let i = 1; i < bs.length; i++) if (bs[i].start === bs[i - 1].end) assert.ok(Math.abs(cueProgress(bs[i - 1], bs[i - 1].end) - cueProgress(bs[i], bs[i].start)) < 1e-9, cue);
  }
});

test('great-circle distances and light-speed delay are right', () => {
  const ml = gcKm(CITIES.mumbai.ll, CITIES.london.ll);
  assert.ok(Math.abs(ml - 7192) < 15, `Mumbai–London ≈ 7,192 km (${ml.toFixed(0)})`);
  assert.ok(Math.abs(rttMs(ml) - 71.9) < .3, 'about 72 ms round trip at 200,000 km/s');
  assert.equal(rttMs(100), 1, '1 ms per 100 km round trip… i.e. 0.5 ms each way per 100 km');
  assert.ok(Math.abs(gcKm([0, 0], [0, 180]) - Math.PI * 6371) < 1, 'half way round the equator');
  const v = llToXyz([0, 0], 10); assert.deepEqual(v.map(x => +x.toFixed(6)), [0, 0, 10]);
  const n = llToXyz([90, 0], 10); assert.ok(Math.abs(n[1] - 10) < 1e-9);
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
