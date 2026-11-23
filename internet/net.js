/* Pure network maths (no DOM, no three.js): unit-tested in tests/unit.test.mjs.
   Great-circle distances, link lengths along waypoints, shortest paths (Dijkstra) and light-speed delay. */

export const EARTH_KM = 6371;
export const FIBRE_KM_S = 200000; // light in glass fibre ≈ 2/3 of c

const rad = d => d * Math.PI / 180;
/* Great-circle distance in km between [lat, lon] points (haversine). */
export function gcKm(a, b) {
  const [la1, lo1] = a.map(rad), [la2, lo2] = b.map(rad);
  const h = Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
/* Round-trip time in ms for light in fibre over `km` one way. */
export const rttMs = km => 2 * km / FIBRE_KM_S * 1000;

/* [lat, lon] → [x, y, z] on a sphere of radius r (y up, lon 0 facing +z, so camPos(az = lon, el = lat) looks straight down at it). */
export function llToXyz([lat, lon], r) {
  const la = rad(lat), lo = rad(lon);
  return [r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)];
}

/* The [lat, lon] points a link follows: city → sea waypoints → city. */
export const linkPoints = (link, cities) => [cities[link.a].ll, ...(link.sea || []), cities[link.b].ll];
export function linkKm(link, cities) { const p = linkPoints(link, cities); let km = 0; for (let i = 1; i < p.length; i++) km += gcKm(p[i - 1], p[i]); return km; }

/* Shortest path by length. `cut` is a Set of link ids to avoid. Returns { nodes, links, km } or null. */
export function shortestPath(from, to, links, cities, cut = new Set()) {
  const dist = { [from]: 0 }, prev = {}, done = new Set(), adj = {};
  for (const l of links) { if (cut.has(l.id)) continue; const km = linkKm(l, cities); (adj[l.a] ||= []).push([l.b, l, km]); (adj[l.b] ||= []).push([l.a, l, km]); }
  while (true) {
    let u = null; for (const k in dist) if (!done.has(k) && (u === null || dist[k] < dist[u])) u = k;
    if (u === null) return null;
    if (u === to) break;
    done.add(u);
    for (const [v, l, km] of adj[u] || []) { const nd = dist[u] + km; if (dist[v] === undefined || nd < dist[v]) { dist[v] = nd; prev[v] = [u, l]; } }
  }
  const nodes = [to], used = []; let c = to;
  while (c !== from) { const [p, l] = prev[c]; used.unshift(l); nodes.unshift(p); c = p; }
  return { nodes, links: used, km: dist[to] };
}

/* The path as one list of [lat, lon] points, each link oriented in travel order. */
export function pathPoints(route, cities) {
  const pts = [];
  route.links.forEach((l, i) => { let p = linkPoints(l, cities); if (l.a !== route.nodes[i]) p = p.slice().reverse(); pts.push(...(i ? p.slice(1) : p)); });
  return pts;
}

/* DNS lookup steps (illustration of an iterative lookup). */
export const DNS_STEPS = [
  ['device', 'resolver', 'Your device asks the resolver: “What is example.com?”'],
  ['resolver', 'root', 'The resolver asks a root server.'],
  ['root', 'resolver', 'Root: “I don’t know, but ask the .com servers.”'],
  ['resolver', 'tld', 'The resolver asks a .com server.'],
  ['tld', 'resolver', '.com: “Ask example.com’s own name servers.”'],
  ['resolver', 'auth', 'The resolver asks example.com’s authoritative server.'],
  ['auth', 'resolver', 'Authoritative: “example.com is 192.0.2.10.” (an example address)'],
  ['resolver', 'device', 'The resolver hands the answer to your device, and keeps a copy (cache).']
];
export const dnsStep = p => Math.min(DNS_STEPS.length - 1, Math.floor(Math.max(0, p) * DNS_STEPS.length));

/* TCP vs UDP delivery of packets 1..n with one dropped packet. */
export function deliver(n, drop, proto) {
  const got = []; for (let i = 1; i <= n; i++) if (i !== drop) got.push(i);
  if (proto === 'tcp' && drop) { got.push(drop); got.sort((a, b) => a - b); return { got, resent: [drop], complete: got.length === n }; }
  return { got, resent: [], complete: got.length === n };
}
