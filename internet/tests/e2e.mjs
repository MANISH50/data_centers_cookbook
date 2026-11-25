// End-to-end test of the Issue 06 photo walkthrough, including the Try it panels (Playwright). Serve the repo root, then:
//   node internet/tests/e2e.mjs http://localhost:8765/
import { run } from '../../shared/tests/e2e-walkthrough.mjs';

await run({
  dir: 'internet', chapters: 14, sources: 16,
  extra: async (p, { check, seekTo, W }) => {
    const tl = await p.evaluate(() => window.__wt.TL.beats.map(b => [b.start, b.try || '', b.cue || '']));
    const at = k => tl.find(x => x[1] === k)[0] + 1;
    const routeAt = tl.find(x => x[2] === 'route')[0] + 2;
    await seekTo(p, routeAt); await p.waitForTimeout(400);
    check(await p.locator('#diagram.wide svg use').count() === 1 && /km of cable/.test(await p.textContent('#diagram .dg-status')), 'the flat map shows the route and its light-speed delay');
    // Route
    await seekTo(p, at('route')); await p.waitForTimeout(300);
    check(await p.locator('#tryBtn').isVisible(), 'Try it button appears on hands-on beats');
    await p.click('#tryBtn'); await p.waitForTimeout(500);
    check(await p.locator('#tryPanel').isVisible() && !(await W(p)).playing && !(await W(p)).speaking, 'Try it opens a panel, pauses, and the guide stops');
    await p.selectOption('#tFrom', 'sydney'); await p.selectOption('#tTo', 'london'); await p.waitForTimeout(800);
    const res = await p.textContent('#tRes');
    check(/Sydney →.*→ London/.test(res) && /km/.test(res) && /ms/.test(res) && await p.locator('#tViz svg').count() === 1, 'route panel: path on a map, distance and light-speed delay');
    await p.click('#tryClose'); check(await p.locator('#tryPanel').isHidden(), 'Back closes the panel');
    // Cut
    await seekTo(p, at('cut')); await p.waitForTimeout(300); await p.click('#tryBtn'); await p.waitForTimeout(800);
    const cut = await p.textContent('#tRes');
    check(/Cape Town|Lisbon/.test(cut) && /After the cut/.test(cut) && await p.locator('#tViz .dg-bad-line').count() >= 1, 'cutting a cable shows the detour and the longer trip');
    await p.click('#tCutBtn'); await p.waitForTimeout(800);
    check(!(await p.textContent('#tRes')).includes('Cape Town'), 'repairing it restores the short route');
    await p.click('#tryClose');
    // DNS
    await seekTo(p, at('dns')); await p.waitForTimeout(300); await p.click('#tryBtn');
    for (let i = 0; i < 7; i++) await p.click('#tNext');
    await p.waitForTimeout(500);
    check((await p.textContent('#tStep')).includes('Step 8 of 8'), 'DNS stepper reaches the answer');
    await p.click('#tryClose');
    // TCP
    await seekTo(p, at('tcp')); await p.waitForTimeout(300); await p.click('#tryBtn'); await p.selectOption('#tDrop', '5'); await p.waitForTimeout(6800);
    const tcp = await p.textContent('#tRes');
    check(tcp.includes('all 6 packets') && tcp.includes('packet 5 is simply missing'), 'TCP resends, UDP skips the lost packet');
    await p.click('#tryClose');
  }
});
