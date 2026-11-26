import test from 'node:test';
import assert from 'node:assert/strict';
import { readPrefs, writePrefs, toggled, DEFAULTS, KEY } from '../display.js';
import { chunks } from '../guide-dock.js';

const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), m }; };

test('first visit: guide, text and voice are all on', () => {
  assert.deepEqual(readPrefs(mem()), { guide: true, text: true, voice: true });
  assert.deepEqual(readPrefs(null), DEFAULTS);
});
test('saved choices are read back, one setting for the whole site', () => {
  const s = mem(); writePrefs(s, { guide: false, text: true, voice: false });
  assert.deepEqual(readPrefs(s), { guide: false, text: true, voice: false });
  assert.equal(JSON.parse(s.m.get(KEY)).guide, false);
});
test('older voice settings carry over; bad data falls back to the defaults', () => {
  assert.deepEqual(readPrefs(mem({ 'cookbook:voice': 'off', 'cookbook:voice:min': '1' })), { guide: false, text: true, voice: false });
  assert.deepEqual(readPrefs(mem({ [KEY]: '{not json' })), DEFAULTS);
  assert.deepEqual(readPrefs(mem({ [KEY]: '{"text":"no"}' })), DEFAULTS, 'non-boolean values are ignored');
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(readPrefs(blocked), DEFAULTS); assert.doesNotThrow(() => writePrefs(blocked, DEFAULTS));
});
test('toggled flips one switch and leaves the others', () => {
  assert.deepEqual(toggled(DEFAULTS, 'text'), { guide: true, text: false, voice: true });
});
test('chunks: long text is split at sentences into speakable pieces, nothing lost', () => {
  assert.deepEqual(chunks(''), []);
  assert.deepEqual(chunks('Short one.'), ['Short one.']);
  const long = Array.from({ length: 12 }, (_, i) => `Sentence number ${i + 1} is here, with a few more words to make it longer.`).join(' ');
  const c = chunks(long, 220);
  assert.ok(c.length > 3 && c.every(x => x.length <= 220), 'each piece fits');
  assert.equal(c.join(' ').replace(/\s+/g, ' '), long.replace(/\s+/g, ' '), 'all words kept, in order');
  const word = 'x'.repeat(30) + ' ' + 'word '.repeat(80);
  assert.ok(chunks(word, 100).every(x => x.length <= 100), 'a sentence with no full stop is still split');
});
