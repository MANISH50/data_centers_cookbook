// End-to-end test of the Issue 01 photo walkthrough (Playwright). Serve the repo root, then:
//   node data-centers/tests/e2e.mjs http://localhost:8765/
import { run } from '../../shared/tests/e2e-walkthrough.mjs';

await run({
  dir: 'data-centers', chapters: 13, sources: 15,
  extra: async (p, { check, seekTo }) => {
    const cut = await p.evaluate(() => window.__wt.TL.beats.filter(b => b.cue === 'cut').map(b => b.start));
    await seekTo(p, cut[0] + 6); await p.waitForTimeout(300);
    check(/UPS batteries/.test(await p.textContent('#diagram .dg-status')), 'power cut: the status line says the batteries carry the load');
    await seekTo(p, cut[1] + 6); await p.waitForTimeout(300);
    check(/generators/.test(await p.textContent('#diagram .dg-status')), 'power cut: then the generators take over');
    const st = await p.evaluate(() => window.__wt.TL.beats.find(b => b.stat && b.stat[0] === '54%').start + 2);
    await seekTo(p, st); await p.waitForTimeout(400);
    check(await p.locator('#stat').isVisible() && (await p.textContent('#stat')).includes('54%'), 'stat card shows a sourced number (54%)');
  }
});
