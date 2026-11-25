/* Issue 01 · the few flat diagrams that sit over the photos, for ideas a camera can't see.
   Keyed by a beat's `cue`; each takes the cue progress p (0..1) and returns { title, svg, status? }.
   Numbers come from data.js beats and their sources; drawings are illustrations, not to scale. */
import { svg, box, line, dot, text, chain, bars, step, along, poly } from '../shared/diagram-kit.js';

export const DIAGRAMS = {
  smc: p => { const k = step(p, 3); return { title: 'Three jobs', svg: svg(400, 60, ['Store', 'Move', 'Compute'].map((s, i) => box(i * 140, 6, 120, 48, s, i === k ? 'dg-warn' : 'dg-on', { size: 15, sub: ['keep it safe', 'send it on', 'work it out'][i] })).join('')) }; },
  sizes: p => ({ title: 'Every size', svg: chain(['Server closet', 'Company', 'Colocation', 'Hyperscale'], step(p, 4), { per: 4, size: 11 }) }),
  zones: p => ({ title: 'What the building is for', svg: chain(['Servers', 'Power', 'Cooling', 'Network', 'Security'], step(p, 5), { per: 5, size: 11 }) }),
  storage: p => ({ title: 'Speed ↔ cost', svg: bars([{ label: 'RAM', v: 4, note: 'your desk' }, { label: 'SSD', v: 3, note: 'filing cabinet' }, { label: 'Hard disk', v: 2, note: 'warehouse' }, { label: 'Tape', v: 1, note: 'deep archive', cls: p > .8 ? 'dg-warn' : 'dg-on' }], 4, { bh: 18 }) }),
  copies: p => { const k = step(p, 4); const cls = i => k === 1 && i === 1 ? 'dg-bad' : k >= 2 && i === 1 ? (k === 2 ? 'dg-warn' : 'dg-on') : 'dg-on'; return { title: 'Never just one copy', svg: svg(400, 70, [0, 1, 2].map(i => box(i * 140, 4, 120, 46, `Copy ${i + 1}`, cls(i), { size: 13, sub: k === 1 && i === 1 ? 'drive failed' : k === 2 && i === 1 ? 'rebuilding…' : 'safe' })).join('') + text(200, 66, k >= 3 ? 'All copies healthy again' : ' ', { size: 11, cls: 'dg-muted' })) }; },
  spineleaf: p => { const fail = p > .6; let o = ''; const S = [60, 160, 240, 340], L = [20, 75, 130, 185, 215, 270, 325, 380];
    S.forEach((x, i) => L.forEach(lx => { o += line(x, 26, lx, 92, fail && i === 1 ? 'dg-line' : 'dg-hot'); }));
    S.forEach((x, i) => { o += box(x - 34, 8, 68, 20, 'spine', fail && i === 1 ? 'dg-bad' : 'dg-on', { size: 10, rx: 5 }); }); L.forEach(x => { o += box(x - 22, 92, 44, 18, 'leaf', 'dg-off', { size: 10, rx: 5 }); });
    return { title: 'Spine and leaf', svg: svg(400, 114, o), status: fail ? 'One spine down: every rack still connected' : null }; },
  eastwest: () => ({ title: 'Where traffic goes (Cisco estimate)', svg: bars([{ label: 'Inside', v: 70, note: '≈ 70%' }, { label: 'To the internet', v: 30, note: '≈ 30%', cls: 'dg-off' }], 100) }),
  crowd: p => { let o = text(100, 14, 'CPU: a few big cores', { size: 11 }) + text(300, 14, 'GPU: thousands of small ones', { size: 11 });
    for (let i = 0; i < 4; i++) o += box(30 + (i % 2) * 72, 24 + Math.floor(i / 2) * 44, 64, 38, '', 'dg-on');
    for (let i = 0; i < 160; i++) o += `<rect x="${210 + (i % 20) * 9.5}" y="${24 + Math.floor(i / 20) * 10.5}" width="7.5" height="8.5" rx="1.5" class="${(i * 7 + Math.floor(p * 40)) % 5 ? 'dg-on' : 'dg-warn'}"/>`;
    return { title: 'Why GPUs?', svg: svg(400, 112, o) }; },
  req: p => ({ title: 'The journey of a request', svg: chain(['DNS', 'Routers + fibre', 'Meet-me room', 'Firewall', 'Load balancer', 'Web server', 'App server', 'Database'], p >= .82 ? 7 : step(p / .82, 8), { per: 4, size: 10.5 }), status: p >= .82 ? 'The answer travels back the same way' : null }),
  chat: p => { const words = ['The', 'answer', 'is', 'written', 'one', 'token', 'at', 'a', 'time…']; const n = Math.max(1, Math.round(p * words.length));
    return { title: 'A chatbot streams its answer', svg: svg(400, 50, words.slice(0, n).map((w, i) => { const x = 4 + words.slice(0, i).reduce((a, s) => a + s.length * 7.4 + 14, 0); return box(x, 8, w.length * 7.4 + 8, 26, w, i === n - 1 ? 'dg-warn' : 'dg-on', { size: 11, rx: 6 }); }).join('')) }; },
  power: p => ({ title: 'Power steps down on its way in', svg: chain(['Grid', 'Substation', 'Transformer', 'Switchgear', 'UPS', 'PDU', 'Rack strip', 'Server'], step(p, 8), { per: 4, size: 10.5 }) }),
  ab: () => { let o = ''; [['A', 18], ['B', 70]].forEach(([s, y]) => { ['Switchgear', 'UPS', 'PDU'].forEach((n, i) => { o += box(10 + i * 92, y, 80, 30, `${n} ${s}`, 'dg-on', { size: 10 }); if (i) o += line(10 + i * 92 - 12, y + 15, 10 + i * 92, y + 15, 'dg-hot'); }); o += line(270, y + 15, 318, 59, 'dg-hot'); });
    o += box(318, 40, 76, 38, 'Server', 'dg-warn', { size: 12, sub: '2 power supplies' }); return { title: 'Paths A and B (2N)', svg: svg(400, 104, o) }; },
  cut: p => { const s = p < .02 ? 0 : p < .45 ? 1 : p < .9 ? 2 : 3;
    const o = [['Grid', s === 0 || s === 3 ? 'dg-ok' : 'dg-bad'], ['UPS batteries', s === 1 ? 'dg-warn' : 'dg-off'], ['Generators', s === 2 ? 'dg-warn' : 'dg-off'], ['Servers', 'dg-on']].map(([n, c], i) => box(i * 102, 8, 92, 40, n, c, { size: 12, sub: ['', 'carry the load', 'carry the load', 'never notice'][i] && (c !== 'dg-off' ? ['on', 'carrying', 'carrying', 'running'][i] : '') })).join('');
    return { title: 'A power cut', svg: svg(400, 56, o), status: ['Grid: on', `Grid: OFF · servers on UPS batteries · ${Math.round((p - .02) / .43 * 10)} s`, 'Grid: OFF · generators carrying the load', 'Grid: back · load returned to the grid'][s] }; },
  air: p => { const k = step(p, 3); let o = '';
    [40, 170, 230, 360].forEach((x, i) => { o += box(x - 22, 20, 44, 70, 'rack', 'dg-off', { size: 10 }); });
    o += `<rect x="64" y="20" width="84" height="70" rx="6" fill="#1d4ed8" opacity=".35"/><rect x="252" y="20" width="84" height="70" rx="6" fill="#ff6a3d" opacity=".3"/>` + text(106, 112, 'cold aisle (fronts)', { size: 11 }) + text(294, 112, 'hot aisle (backs)', { size: 11 });
    o += text(200, 14, k === 0 ? 'Inlet air about 18–27 °C' : k === 1 ? 'Containment keeps hot and cold apart' : 'Cold air rises through floor tiles', { size: 11 });
    if (k === 2) for (let i = 0; i < 3; i++) o += `<path d="M${80 + i * 26} 100 v-${14 + 8 * Math.sin(p * 20 + i)}" class="dg-hot"/>`;
    return { title: 'Cold aisle, hot aisle', svg: svg(400, 118, o) }; },
  heatout: p => ({ title: 'Where the heat goes', svg: chain(['Server', 'Hot air', 'CRAH coils', 'Chiller', 'Cooling tower', 'Outside air'], step(p, 6), { per: 3, size: 11 }) }),
  red: (p, b) => { const n = b.bi === 1 ? 'N' : b.bi === 2 ? 'N+1' : '2N'; const count = n === 'N' ? 4 : n === 'N+1' ? 5 : 8, failed = p > .5 ? 0 : -1; let o = '';
    for (let i = 0; i < count; i++) o += box(4 + (i % 8) * 49, 6 + (n === '2N' ? Math.floor(i / 4) * 44 : 0), 42, 36, n === '2N' ? (i < 4 ? 'A' : 'B') : i < 4 ? 'unit' : 'spare', i === failed ? 'dg-bad' : i >= 4 && n === 'N+1' ? 'dg-warn' : 'dg-on', { size: 10 });
    const short = n === 'N' && failed === 0;
    return { title: `${n}: ${n === 'N' ? 'exactly what you need' : n === 'N+1' ? 'one spare' : 'a full second copy'}`, svg: svg(400, n === '2N' ? 92 : 48, o), status: failed === 0 ? (short ? 'One unit failed: the hall runs short' : 'One unit failed: still enough') : null }; },
  nines: () => ({ title: 'Downtime allowed per year', svg: bars([{ label: '99.9%', v: 526, note: '≈ 8.8 hours' }, { label: '99.99%', v: 53, note: '≈ 53 minutes' }, { label: '99.999%', v: 5.3, note: '≈ 5 minutes' }], 526) }),
  tiers: () => ({ title: 'Uptime Institute tiers: expected downtime a year', svg: bars([{ label: 'Tier I', v: 28.8, note: '≈ 28.8 h' }, { label: 'Tier II', v: 22, note: '≈ 22 h' }, { label: 'Tier III', v: 1.6, note: '≈ 1.6 h' }, { label: 'Tier IV', v: .44, note: '≈ 26 min' }], 28.8, { bh: 18 }) }),
  dr: p => { const k = p > .5; return { title: 'A second site, far away', svg: svg(400, 70, box(10, 12, 140, 46, 'Main site', k ? 'dg-bad' : 'dg-on', { size: 13, sub: k ? 'flood, fire, blackout' : 'running' }) + line(152, 35, 248, 35, 'dg-hot') + text(200, 28, 'copies data', { size: 10, cls: 'dg-muted' }) + box(250, 12, 140, 46, 'Second site', k ? 'dg-warn' : 'dg-off', { size: 13, sub: k ? 'takes over' : 'ready' })) }; },
  virt: (p, b) => { const k = b.bi; let o = '';
    if (k === 0) { for (let i = 0; i < 4; i++) { o += box(i * 100 + 4, 10, 90, 70, `App ${i + 1}`, 'dg-off', { size: 11, sub: 'busy 12–18%' }); o += `<rect x="${i * 100 + 4}" y="${80 - 11}" width="90" height="11" rx="3" class="dg-warn"/>`; } }
    else if (k === 1) { o += box(4, 54, 392, 30, 'One physical server + hypervisor', 'dg-on', { size: 11 }); for (let i = 0; i < 4; i++) o += box(4 + i * 99, 8, 92, 40, `VM ${i + 1}`, 'dg-warn', { size: 11, sub: 'own OS' }); }
    else if (k === 2) { o += box(4, 54, 392, 30, 'One shared operating system', 'dg-on', { size: 11 }); for (let i = 0; i < 8; i++) o += box(4 + i * 49.5, 14, 44, 32, '▣', 'dg-warn', { size: 12 }); }
    else { o += bars([{ label: 'Company servers', v: 15, note: '12–18% busy', cls: 'dg-off' }, { label: 'Cloud servers', v: 65, note: '≈ 65% busy' }], 100, { lw: 130 }).replace(/^<svg[^>]*>|<\/svg>$/g, ''); }
    return { title: ['One app per server', 'Virtual machines', 'Containers', 'The cloud'][Math.min(3, k)], svg: svg(400, 90, o) }; },
  globe: () => { let o = ''; [['Region A', 10], ['Region B', 210]].forEach(([n, x]) => { o += `<rect x="${x}" y="4" width="180" height="84" rx="12" class="dg-off"/>` + text(x + 90, 20, n, { size: 12 }); for (let i = 0; i < 3; i++) o += box(x + 10 + i * 56, 32, 48, 44, `Zone ${i + 1}`, 'dg-on', { size: 10 }); });
    return { title: 'Regions and availability zones', svg: svg(400, 92, o) }; },
  trace: (p, b) => { const L = { 1: ['Edge cache', 'Network', 'Storage hall'], 2: ['Bank apps', 'Databases', 'Logs', 'Backup site'], 3: ['Your laptop', 'Network', 'AI chips'], 4: ['VMs', 'Object storage', 'Network shuffle'], 5: ['Trainium', 'TPUs', 'GPUs'] }[b.bi] || ['Network', 'Servers', 'Storage'];
    return { title: 'What it leans on', svg: chain(L, step(p, L.length), { per: L.length, size: 11 }) }; },
  pue: () => ({ title: 'PUE = total power ÷ IT power', svg: bars([{ label: 'Perfect', v: 1, note: '1.0', cls: 'dg-off' }, { label: 'Google fleet 2024', v: 1.09, note: '1.09' }, { label: 'World average', v: 1.54, note: '≈ 1.54', cls: 'dg-warn' }], 1.6, { lw: 130 }) }),
  site: p => ({ title: 'Choosing a site', svg: chain(['Power', 'Fibre routes', 'Water', 'Floods + quakes', 'Climate', 'Distance to users'], step(p, 6), { per: 3, size: 11 }) }),
  build: p => ({ title: 'How it gets built', svg: chain(['Land + power', 'Design + permits', 'The shell', 'Fit-out'], step(p, 4), { per: 4, size: 11 }) }),
  day: p => { const times = ['07:00 Shift handover', '08:00 Walk-around', '10:00 Swap a failed drive', '13:00 Generator test', '15:00 Deliveries', '18:00 Planned maintenance', '02:00 Night alarm: the spare took over']; const k = step(p, times.length);
    return { title: 'A day in the life', svg: svg(400, 30, times.map((s, i) => `<rect x="${i * 57}" y="6" width="52" height="16" rx="4" class="${i === k ? 'dg-warn' : i < k ? 'dg-on' : 'dg-off'}"/>`).join('')), status: times[k] }; }
};
