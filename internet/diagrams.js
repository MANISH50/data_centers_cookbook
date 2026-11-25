/* Issue 06 · the small flat diagrams over the photos, for ideas a camera can't see (packets, addresses, DNS, BGP…)
   and a flat world map for routes and cable cuts. Each takes the cue progress p (0..1) and returns { title, svg, status? }.
   The cable network on the map is an ILLUSTRATION (data.js LINKS), not real cable routes; distances and light-speed maths are real. */
import { svg, box, line, dot, text, chain, bars, step, along, poly, esc } from '../shared/diagram-kit.js';
import { COAST } from './land.js';
import { CITIES, LINKS } from './data.js';
import { shortestPath, pathPoints, rttMs, DNS_STEPS, dnsStep } from './net.js';

/* ---------- flat map (equirectangular, 400 px wide, latitudes 80 N to 60 S) ---------- */
export const MAP_W = 400, MAP_H = 156;
export const proj = ([lat, lon]) => [(lon + 180) / 360 * MAP_W, (80 - lat) / 140 * MAP_H];
let coastD = '';
export function coastPath() {
  if (coastD) return coastD;
  for (const ln of COAST) {
    let last = null, d = '';
    for (let i = 0; i < ln.length; i += 2) {
      const [x, y] = proj([ln[i + 1], ln[i]]); if (y < -2 || y > MAP_H + 2) continue;
      if (last && Math.hypot(x - last[0], y - last[1]) < .9) continue;
      d += (last && Math.abs(x - last[0]) < 100 ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); last = [x, y];
    }
    coastD += d;
  }
  return coastD;
}
/* The coastline is drawn once into a hidden <svg> on the page and reused by every map with <use>. */
export function mountMapDefs(doc = document) {
  if (doc.getElementById('coast')) return;
  const s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('width', '0'); s.setAttribute('height', '0'); s.setAttribute('aria-hidden', 'true'); s.style.position = 'absolute';
  s.innerHTML = `<defs><path id="coast" d="${coastPath()}" fill="none" stroke="#3b5379" stroke-width=".8" stroke-linejoin="round"/></defs>`;
  doc.body.appendChild(s);
}
const linkPts = l => { const p = [CITIES[l.a].ll, ...(l.sea || []), CITIES[l.b].ll]; return p.map(proj); };
export function map({ hot = null, cut = null, dotAt = null, cities = [], extra = '' } = {}) { // returns an <svg>; diagrams using it set wide: true
  let o = `<rect width="${MAP_W}" height="${MAP_H}" rx="8" fill="#08111f"/><use href="#coast"/>`;
  for (const l of LINKS) o += poly(linkPts(l), cut && l.id === cut ? 'dg-bad-line' : 'dg-line');
  if (hot) o += poly(hot, 'dg-hot');
  if (cut) { const l = LINKS.find(x => x.id === cut); const m = linkPts(l)[Math.floor(linkPts(l).length / 2)]; o += text(m[0], m[1] + 4, '✕', { size: 14, weight: 800, cls: 'dg-bad' }); }
  for (const c of cities) { const [x, y] = proj(CITIES[c].ll); o += dot(x, y, 3.2, 'dg-on') + text(x, y - 6, CITIES[c].n.replace(/ \(.*\)/, ''), { size: 8.5 }); }
  if (dotAt) o += dot(dotAt[0], dotAt[1], 4.5, 'dg-warn');
  return svg(MAP_W, MAP_H, o + extra);
}
export const routeOf = (from, to, cut = null) => { const r = shortestPath(from, to, LINKS, CITIES, cut ? new Set([cut]) : new Set()); return r && { ...r, pts: pathPoints(r, CITIES).map(proj) }; };
const km = v => `${Math.round(v).toLocaleString('en-US')} km`;

export const DIAGRAMS = {
  spin: () => ({ wide: true, title: 'One tap, one message', svg: map({ cities: ['mumbai', 'london'] }) }),
  nets: p => { const N = [[60, 30, 'Phone company'], [190, 18, 'University'], [330, 32, 'Cloud company'], [110, 92, 'Home ISP'], [270, 96, 'Content network']]; let o = '';
    const E = [[0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [1, 4], [0, 4]];
    E.forEach(([a, b], i) => { o += line(N[a][0], N[a][1], N[b][0], N[b][1], i <= step(p, E.length) ? 'dg-hot' : 'dg-line'); });
    N.forEach(([x, y, n]) => { o += box(x - 52, y - 14, 104, 28, n, 'dg-on', { size: 10 }); });
    return { title: 'A network of networks', svg: svg(400, 112, o) }; },
  cities: () => ({ title: 'People online, 2026 (ITU estimate)', svg: bars([{ label: 'Online', v: 76, note: '≈ 76% · 6.3 billion' }, { label: 'Offline', v: 24, note: '≈ 2 billion', cls: 'dg-off' }], 100, { lw: 70 }) }),
  cables: () => ({ wide: true, title: 'Cables join the continents (illustration)', svg: map({ cities: ['mumbai', 'london', 'newyork', 'singapore', 'saopaulo', 'capetown', 'sydney', 'tokyo'] }) }),
  route: (p, b) => { const from = b.from || 'mumbai', to = b.to || 'london', r = routeOf(from, to);
    return { wide: true, title: `${CITIES[from].n} → ${CITIES[to].n} (illustrative route)`, svg: map({ hot: r.pts, dotAt: along(r.pts, p < .5 ? p * 2 : 2 - p * 2), cities: [from, to] }), status: `${km(r.km)} of cable · light alone needs ≥ ${rttMs(r.km).toFixed(0)} ms round trip` }; },
  cut: p => { const cutOn = p > .15, r = routeOf('mumbai', 'london', cutOn ? 'med' : null);
    return { wide: true, title: 'A cable cut, and traffic rerouting (illustration)', svg: map({ hot: r.pts, cut: cutOn ? 'med' : null, dotAt: along(r.pts, (p * 3) % 1), cities: ['mumbai', 'london'] }), status: cutOn ? `Rerouted: ${km(r.km)}, ≥ ${rttMs(r.km).toFixed(0)} ms round trip` : null }; },
  cdn: p => { const near = p > .3; const o = near ? '' : ''; const r = near ? routeOf('mumbai', 'chennai') : routeOf('mumbai', 'losangeles');
    return { wide: true, title: near ? 'Answered from a cache nearby' : 'Without a cache: across the world', svg: map({ hot: r.pts, dotAt: along(r.pts, (p * 4) % 1), cities: near ? ['mumbai', 'chennai'] : ['mumbai', 'losangeles'], extra: o }) }; },
  roots: () => { let o = ''; Object.values(CITIES).forEach(c => { const [x, y] = proj(c.ll); o += dot(x, y, 3.5, 'dg-warn'); });
    return { wide: true, title: 'Root servers: many copies worldwide (illustration)', svg: map({ extra: o }), status: '13 named authorities · 12 organisations · 2,000+ copies' }; },
  pkt: p => { const k = p < .35 ? 0 : p < .6 ? 1 : p < 1 ? 2 : 3; let o = '';
    for (let i = 0; i < 6; i++) {
      const order = k === 2 ? [2, 0, 4, 1, 5, 3][i] : i, x = k === 0 ? 20 + (i % 3) * 40 : 20 + order * 62, y = k === 0 ? 14 + Math.floor(i / 3) * 40 : 30;
      o += k === 0 ? `<rect x="${x}" y="${y}" width="38" height="38" class="dg-on" opacity="${.55 + i * .07}"/>` : box(x, y, 54, 42, `#${i + 1}`, k === 3 ? 'dg-on' : 'dg-warn', { size: 12, sub: k === 1 ? 'to: London' : '' });
    }
    o += text(k === 0 ? 210 : 200, k === 0 ? 50 : 94, ['Your photo, cut into pieces', 'Each piece gets a header: from, to, number', 'They can arrive out of order…', 'Shared lines, taking turns: packet switching'][k], { size: 11, anchor: k === 0 ? 'start' : 'middle' });
    return { title: 'Packets', svg: svg(400, 100, o) }; },
  addr: p => { const v6 = p >= .5; return { title: v6 ? 'IPv6: 128 bits' : 'IPv4: 32 bits', svg: svg(400, 70, text(200, 30, v6 ? '2001:db8::1' : '192.0.2.1', { size: 26, weight: 800 }) + text(200, 58, v6 ? 'enough for every device many times over' : '≈ 4.3 billion addresses, fewer than the people online', { size: 11, cls: 'dg-muted' })) }; },
  first: p => p < .2 ? { title: 'NAT: one public address for the home', svg: svg(400, 80, ['Phone', 'Laptop', 'TV'].map((n, i) => box(4, 4 + i * 26, 80, 22, n, 'dg-on', { size: 10 }) + line(86, 15 + i * 26, 150, 40, 'dg-hot')).join('') + box(150, 22, 110, 36, 'Home router', 'dg-warn', { size: 11 }) + line(262, 40, 290, 40, 'dg-hot') + box(290, 22, 106, 36, '1 public IPv4', 'dg-on', { size: 11 })) }
    : { title: 'The first mile', svg: chain(['Phone', 'Wi-Fi or mast', 'Copper / fibre', 'Your ISP'], step((p - .2) / .8, 4), { per: 4, size: 11 }) },
  dns: p => { const k = dnsStep(p), [from, to, say] = DNS_STEPS[k]; const N = { device: [40, 'Your device'], resolver: [140, 'Resolver'], root: [235, 'Root'], tld: [300, '.com'], auth: [365, 'example.com'] };
    let o = Object.entries(N).map(([id, [x, n]]) => box(x - 33, 10, 66, 30, n, id === from || id === to ? 'dg-warn' : 'dg-on', { size: 9.5 })).join('');
    const a = N[from][0], c = N[to][0]; o += line(a, 48, c, 48, 'dg-hot') + dot(a + (c - a) * .85, 48, 4) + text(200, 72, say.length > 64 ? say.slice(0, 62) + '…' : say, { size: 10.5 });
    return { title: `DNS lookup · step ${k + 1} of ${DNS_STEPS.length}`, svg: svg(400, 80, o) }; },
  hops: p => { const n = 6, k = step(p < .75 ? p / .75 : 1, n); let o = '';
    for (let i = 0; i < n; i++) { const x = 8 + i * 66; o += box(x, 14, 54, 30, `Router ${i + 1}`, i === k ? 'dg-warn' : i < k ? 'dg-on' : 'dg-off', { size: 9.5 }); if (i < n - 1) o += line(x + 56, 29, x + 64, 29, i < k ? 'dg-hot' : 'dg-line'); }
    o += text(200, 70, p < .4 ? 'Each router knows only the best next step' : p < .75 ? `Time to live: ${64 - k} (−1 at every router)` : 'traceroute: 1 · 2 · 3 · 4 · 5 · 6 … every router on the way', { size: 11 });
    return { title: 'Hop by hop', svg: svg(400, 80, o) }; },
  bgp: p => { const N = [[50, 26, 'AS 1'], [170, 18, 'AS 2'], [300, 30, 'AS 3'], [110, 86, 'AS 4'], [250, 90, 'AS 5'], [360, 84, 'AS 6']], E = [[0, 1], [1, 2], [0, 3], [3, 4], [1, 4], [2, 5], [4, 5]];
    const bad = p >= .6, reach = Math.min(E.length, Math.floor(p / .6 * E.length) + 1); let o = '';
    E.forEach(([a, b], i) => { o += line(N[a][0], N[a][1], N[b][0], N[b][1], i < reach ? (bad && i >= 4 ? 'dg-bad-line' : 'dg-hot') : 'dg-line'); });
    N.forEach(([x, y, n], i) => { o += box(x - 28, y - 13, 56, 26, n, i === 0 ? 'dg-warn' : bad && i === 5 ? 'dg-bad' : 'dg-on', { size: 10 }); });
    return { title: bad ? 'A wrong announcement spreads' : 'Networks announce what they can reach', svg: svg(400, 106, o), status: bad ? 'AS 6 wrongly claims AS 1’s addresses · RPKI checks help catch this' : null }; },
  ixp: p => { const together = p >= .5; let o = '';
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, x = 200 + Math.cos(a) * 150, y = 52 + Math.sin(a) * 38; o += line(x, y, 200, 52, 'dg-hot') + box(x - 34, y - 11, 68, 22, `Network ${i + 1}`, 'dg-on', { size: 9 }); }
    o += box(160, 38, 80, 28, 'Shared switch', 'dg-warn', { size: 10 });
    return { title: together ? 'Swap traffic locally' : 'An internet exchange (IXP)', svg: svg(400, 104, o), status: together ? 'Same city in, same city out: no trip abroad' : null }; },
  cable: p => { if (p < .5) { const R = [['Armour wires', 52, '#4b5563'], ['Copper power', 34, '#b45309'], ['Insulation', 26, '#e5e7eb'], ['Steel strength', 16, '#9ca3af'], ['Glass fibres', 7, 'var(--sky)']]; let o = '';
      R.forEach(([n, r, c], i) => { o += `<circle cx="70" cy="60" r="${r}" fill="${c}" stroke="#08111f" stroke-width="1"/>` + line(70 + r * .7, 60 - r * .7 + i * 4, 150, 14 + i * 22, 'dg-line') + text(156, 18 + i * 22, n, { size: 11, anchor: 'start' }); });
      return { title: 'Inside a cable (simplified)', svg: svg(400, 120, o + text(320, 112, 'about as wide as a garden hose', { size: 10, cls: 'dg-muted' })) }; }
    if (p < .8) return { title: 'Coming ashore', svg: chain(['Undersea cable', 'Landing station', 'Over land', 'Data centers + exchanges'], step((p - .5) / .3, 4), { per: 4, size: 10.5 }) };
    return { title: 'Cable faults: about 200 a year', svg: bars([{ label: 'Fishing + anchors', v: 67, note: '≈ two-thirds' }, { label: 'Everything else', v: 33, note: '≈ one-third', cls: 'dg-off' }], 100, { lw: 120 }) }; },
  tcp: (p, b) => { const udp = p >= .5, k = (p % .5) / .5, drop = b?.drop || 3; let o = text(4, 14, udp ? 'UDP: just sends' : 'TCP: resends what was lost', { size: 11, anchor: 'start' });
    for (let i = 1; i <= 6; i++) { const lost = i === drop, arrived = k * 6 >= i, resent = !udp && lost && k > .8; o += box(4 + (i - 1) * 66, 26, 58, 34, lost && arrived && !resent ? '✕' : `#${i}`, lost && arrived ? (resent ? 'dg-ok' : 'dg-bad') : arrived ? 'dg-on' : 'dg-off', { size: 12 }); }
    o += text(200, 80, !udp ? (k > .8 ? 'All 6, in order ✓' : `Packet ${drop} lost… waiting to resend`) : (k > .6 ? `5 of 6: packet ${drop} is simply missing` : 'sending…'), { size: 11 });
    return { title: 'Delivery rules', svg: svg(400, 88, o) }; },
  tls: () => ({ title: 'HTTPS: TLS encryption', svg: svg(400, 70, box(4, 16, 90, 38, 'You', 'dg-on', { size: 12 }) + ['Router', 'Router', 'Router'].map((n, i) => box(118 + i * 58, 22, 50, 26, n, 'dg-off', { size: 9 })).join('') + line(96, 35, 304, 35, 'dg-hot') + text(200, 66, '🔒 carried by everyone, readable by no one in between', { size: 10.5 }) + box(306, 16, 90, 38, 'Website', 'dg-on', { size: 12 })) })
};
export { esc };
