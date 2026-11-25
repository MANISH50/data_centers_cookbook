/* Issue 01 · Inside the Cloud: starts the shared photo walkthrough with this issue's content. */
import { startWalkthrough } from '../shared/walkthrough.js';
import { CHAPTERS, SOURCES, PHOTOS } from './data.js';
import { DIAGRAMS } from './diagrams.js';

startWalkthrough({ slug: 'data-centers', CHAPTERS, SOURCES, PHOTOS, DIAGRAMS });
