/* Issue 07 · How an AI Answers: the shared photo walkthrough plus the Try it panels (tokenizer, next-word picker,
   attention view, chip maths). */
import { startWalkthrough } from '../shared/walkthrough.js';
import { CHAPTERS, SOURCES, PHOTOS } from './data.js';
import { DIAGRAMS } from './diagrams.js';
import { createTry } from './try.js';

const extras = {};
const wt = startWalkthrough({ slug: 'llm', CHAPTERS, SOURCES, PHOTOS, DIAGRAMS, extras });
const tryIt = createTry({ wt, track: (name, data = {}) => { const ev = { name, ...data }; window.cookbookEvents.push(ev); } });
extras.beat = b => tryIt.beat(b);
tryIt.beat(wt.TL.beats.find(b => b.start <= wt.t && wt.t < b.end) || wt.TL.beats[0]);
window.__try = tryIt;
