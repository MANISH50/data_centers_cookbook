/* Tiny flat-diagram helpers (SVG strings) for the "minimal animation" cards over the photos.
   Each diagram is a pure function of progress p (0..1), so scrubbing shows the right state. No DOM. */

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-hidden="true">${body}</svg>`;
export const step = (p, n) => Math.min(n - 1, Math.floor(Math.max(0, p) * n));
export const lerp = (a, b, k) => a + (b - a) * k;

/* A box with a label. cls: dg-on (lit), dg-off (dim), dg-warn, dg-bad, dg-ok */
export function box(x, y, w, h, label, cls = 'dg-off', { size = 12, rx = 8, sub = '' } = {}) {
  const lit = cls !== 'dg-off';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}" opacity="${lit ? 1 : .9}"/>` +
    `<text x="${x + w / 2}" y="${y + h / 2 + (sub ? -2 : size * .35)}" text-anchor="middle" font-size="${size}" font-weight="700" style="fill:${lit ? '#04131f' : 'var(--ink-2)'}">${esc(label)}</text>` +
    (sub ? `<text x="${x + w / 2}" y="${y + h / 2 + size * .95}" text-anchor="middle" font-size="${size * .78}" style="fill:${lit ? '#04131f' : 'var(--muted)'}">${esc(sub)}</text>` : '');
}
export const line = (x1, y1, x2, y2, cls = 'dg-line') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
export const dot = (x, y, r = 5, cls = 'dg-warn') => `<circle cx="${x}" cy="${y}" r="${r}" class="${cls}"/>`;
export const text = (x, y, s, { size = 12, anchor = 'middle', cls = '', weight = 600 } = {}) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}"${cls ? ` class="${cls}"` : ''}>${esc(s)}</text>`;

/* A row of steps with arrows; steps up to `active` are lit, `active` itself is highlighted. Wraps onto rows of `per`. */
export function chain(items, active, { w = 400, per = 4, bh = 34, gap = 14, size = 11 } = {}) {
  const rows = Math.ceil(items.length / per), bw = (w - gap * (per - 1)) / per; let out = '';
  items.forEach((it, i) => {
    const r = Math.floor(i / per), c = i % per, x = c * (bw + gap), y = r * (bh + 18);
    const cls = i === active ? 'dg-warn' : i < active ? 'dg-on' : 'dg-off';
    out += box(x, y, bw, bh, it, cls, { size });
    if (i < items.length - 1) out += c < per - 1 ? line(x + bw + 2, y + bh / 2, x + bw + gap - 2, y + bh / 2, i < active ? 'dg-hot' : 'dg-line') : line(x + bw / 2, y + bh + 2, x + bw / 2, y + bh + 16, i < active ? 'dg-hot' : 'dg-line');
  });
  return svg(w, rows * (bh + 18) - 18, out);
}

/* Horizontal bars: rows [{label, v, note, cls}], scaled to max. */
export function bars(rows, max, { w = 400, bh = 22, gap = 10, lw = 110 } = {}) {
  let out = '';
  rows.forEach((r, i) => {
    const y = i * (bh + gap), bw = Math.max(4, (w - lw - 70) * Math.min(1, r.v / max));
    out += text(lw - 8, y + bh * .7, r.label, { anchor: 'end', size: 12 }) + `<rect x="${lw}" y="${y}" width="${bw}" height="${bh}" rx="6" class="${r.cls || 'dg-on'}"/>` + text(lw + bw + 8, y + bh * .7, r.note ?? r.v, { anchor: 'start', size: 12, weight: 700 });
  });
  return svg(w, rows.length * (bh + gap) - gap, out);
}

/* Point along a polyline [[x,y],...] at fraction k. */
export function along(pts, k) {
  const seg = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let d = Math.max(0, Math.min(1, k)) * L;
  for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const f = seg[i] ? Math.min(1, d / seg[i]) : 0; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; } d -= seg[i]; }
  return pts[pts.length - 1];
}
export const poly = (pts, cls = 'dg-line') => `<polyline points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" class="${cls}"/>`;
