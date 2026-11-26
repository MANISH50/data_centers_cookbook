// End-to-end test of the Issue 07 photo walkthrough, including the Try it panels (Playwright). Serve the repo root, then:
//   node llm/tests/e2e.mjs http://localhost:8765/
import { run } from '../../shared/tests/e2e-walkthrough.mjs';

await run({
  dir: 'llm', chapters: 16, sources: 17,
  extra: async (p, { check, seekTo, W }) => {
    const at = k => p.evaluate(k => window.__wt.TL.beats.find(b => b.try === k).start + 1, k);
    // Tokenizer
    await seekTo(p, await at('tokens')); await p.waitForTimeout(300);
    check(await p.locator('#tryBtn').isVisible(), 'Try it appears on hands-on beats');
    await p.click('#tryBtn'); await p.waitForTimeout(300);
    check(await p.locator('#tryPanel').isVisible() && !(await W(p)).playing && !(await W(p)).speaking, 'Try it pauses and the guide stops');
    await p.fill('#tText', 'Hello world'); await p.waitForTimeout(200);
    check(await p.locator('#tToks .tok').count() === 2 && /Tokens\s*2/.test(await p.textContent('#tRes')), 'tokenizer splits your text and counts tokens');
    await p.fill('#tText', 'unbelievably'); await p.waitForTimeout(200);
    check(await p.locator('#tToks .tok').count() > 1, 'a rare word becomes several tokens');
    await p.click('#tryClose');
    // Next word
    await seekTo(p, await at('next')); await p.waitForTimeout(300); await p.click('#tryBtn'); await p.waitForTimeout(300);
    await p.locator('#tT').fill('0.1'); await p.waitForTimeout(150);
    const top = await p.locator('#tViz text').nth(1).textContent();
    check(/9\d\.\d%|100\.0%/.test(top), `low temperature: “mat” takes almost all the probability (${top})`);
    await p.click('#tPick'); check(/The cat sat on the mat/.test(await p.textContent('#tOut')), 'Pick a word finishes the sentence');
    await p.locator('#tP').fill('0.3'); await p.locator('#tT').fill('2'); await p.waitForTimeout(150);
    check((await p.textContent('#tViz')).includes('cut by top-p'), 'top-p cuts the unlikely words');
    await p.click('#tryClose');
    // Attention
    await seekTo(p, await at('attn')); await p.waitForTimeout(300); await p.click('#tryBtn'); await p.waitForTimeout(300);
    check(/“animal”/.test(await p.textContent('#tRes')), '“it” looks most at “animal”');
    await p.click('#tWords .wbtn[data-i="0"]'); check(/only itself/.test(await p.textContent('#tRes')), 'the first word can only look at itself');
    check(await p.locator('#tWords .wbtn.future').count() === 10, 'later words are hidden (it only looks back)');
    await p.click('#tryClose');
    // Chip maths
    await seekTo(p, await at('chip')); await p.waitForTimeout(300); await p.click('#tryBtn'); await p.waitForTimeout(300);
    await p.click('#tAll'); check(/\[4, 10, 16\]/.test(await p.textContent('#tStep')), 'matrix maths: 9 multiply-adds give [4, 10, 16]');
    await p.selectOption('#tSize', '175e9'); await p.selectOption('#tChips', '8'); await p.waitForTimeout(150);
    const res = await p.textContent('#tRes');
    check(/350 GB/.test(res) && /memory speed/.test(res), 'chip maths: 175B in 16-bit = 350 GB, limited by memory speed');
    await p.selectOption('#tChips', '2'); await p.waitForTimeout(150);
    check(/not enough chips/.test(await p.textContent('#tRes')), 'too few H100s is flagged');
    await p.click('#tryClose');
  }
});
