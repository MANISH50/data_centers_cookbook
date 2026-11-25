/* Issue 06 · How the Internet Moves Data: the shared photo walkthrough, plus a flat world map for routes
   and the hands-on "Try it" panels. */
import { startWalkthrough } from '../shared/walkthrough.js';
import { CHAPTERS, SOURCES, PHOTOS } from './data.js';
import { DIAGRAMS, mountMapDefs } from './diagrams.js';
import { createTry } from './try.js';

mountMapDefs();
const extras = {};
const wt = startWalkthrough({ slug: 'internet', CHAPTERS, SOURCES, PHOTOS, DIAGRAMS, extras });
const tryIt = createTry({ wt, track: (name, data = {}) => { const ev = { name, ...data }; window.cookbookEvents.push(ev); } });
extras.beat = b => tryIt.beat(b);
tryIt.beat(wt.TL.beats.find(b => b.start <= wt.t && wt.t < b.end) || wt.TL.beats[0]);
window.__try = tryIt;
