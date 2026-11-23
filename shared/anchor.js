/* YOUR GUIDE: an illustrated presenter who reads the captions aloud with the browser's own voice (Web Speech API).
   Shared by the 3D tours (data-centers/, internet/). No network, no recordings: speech is made on the reader's device.
   The pure helpers (pickVoice, speakable, holdAt) are unit-tested; createAnchor() is the DOM part. */

/* ---------- pure helpers ---------- */
const FEMALE = /samantha|karen|moira|tessa|serena|victoria|veena|fiona|allison|\bava\b|susan|zira|aria|jenny|sonia|libby|neerja|heera|catherine|hazel|natasha|clara|emma|michelle|joanna|kendra|kimberly|salli|ivy|amy|female|google us english|google uk english female/i;
const MALE = /daniel|\balex\b|fred|david|mark|\bguy\b|ryan|rishi|ravi|george|james|thomas|oliver|arthur|aaron|gordon|lee\b|\bmale\b|prabhat/i;
const NICE = /natural|neural|online|enhanced|premium|google/i;

/* Best voice for `lang` (default English): a woman's voice if the device has one, preferring the better-sounding online ones. */
export function pickVoice(voices, lang = 'en') {
  const list = (voices || []).filter(v => String(v.lang || '').toLowerCase().replace('_', '-').startsWith(lang));
  if (!list.length) return null;
  const score = v => (FEMALE.test(v.name) && !/\bmale\b/i.test(v.name.replace(/female/i, '')) ? 10 : 0) - (MALE.test(v.name) && !FEMALE.test(v.name) ? 8 : 0)
    + (NICE.test(v.name) ? 3 : 0) + (/en-(in|gb)/i.test(v.lang) ? 1 : 0) + (v.default ? .5 : 0);
  return list.slice().sort((a, b) => score(b) - score(a))[0];
}

/* Caption text → words a speech engine reads well (units and symbols spelled out). */
const SUBS = [
  [/₹\s?([\d,.]+)/g, '$1 rupees'], [/≈\s?/g, 'about '], [/~\s?/g, 'about '], [/(\d)\s?×/g, '$1 times'], [/×/g, ' times '], [/\s?→\s?/g, ', then '], [/–/g, ' to '],
  [/(\d)\s?L\/kWh/g, '$1 litres per kilowatt hour'], [/(\d)\s?TWh\b/g, '$1 terawatt hours'], [/(\d)\s?kWh\b/g, '$1 kilowatt hours'], [/(\d)\s?Wh\b/g, '$1 watt hours'],
  [/(\d)\s?kW\b/g, '$1 kilowatts'], [/(\d)\s?MW\b/g, '$1 megawatts'], [/(\d)\s?GW\b/g, '$1 gigawatts'], [/(\d)\s?km\b/g, '$1 kilometres'], [/(\d)\s?ms\b/g, '$1 milliseconds'],
  [/(\d)\s?m²/g, '$1 square metres'], [/(\d)\s?°C\b/g, '$1 degrees Celsius'], [/(\d)\s?ml\b/g, '$1 millilitres'], [/(\d)\s?TB\b/g, '$1 terabytes'], [/(\d)\s?Gbps\b/g, '$1 gigabits per second'],
  [/(\d)\s?Tbps\b/g, '$1 terabits per second'], [/(\d)\s?m\b/g, '$1 metres'], [/(\d)\s?cm\b/g, '$1 centimetres'], [/(\d)\s?s\b/g, '$1 seconds'], [/\bFY(\d\d)\b/g, 'financial year 20$1'],
  [/[“”"]/g, ''], [/\s+/g, ' ']
];
export const speakable = text => SUBS.reduce((s, [re, to]) => s.replace(re, to), String(text || '')).trim();

/* While the guide is still talking, the film waits at the end of the beat instead of running ahead of her. */
export const HOLD_EDGE = .04;
export const holdAt = (next, beatEnd, busy, prev = next) => busy && next > beatEnd - HOLD_EDGE ? Math.max(prev, Math.min(next, beatEnd - HOLD_EDGE)) : next;

/* ---------- the drawn presenter (inline SVG, no photo of a real person) ---------- */
const FACE = `<svg class="ga-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
  <defs><radialGradient id="gaBg" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#1d3150"/><stop offset="1" stop-color="#0b1426"/></radialGradient></defs>
  <circle cx="60" cy="60" r="60" fill="url(#gaBg)"/>
  <g class="ga-head">
    <path d="M30 58c0-24 12-38 30-38s31 13 31 38c0 14-3 30-6 40H36c-4-10-6-26-6-40z" fill="#1f1512"/>
    <path d="M24 120c2-20 16-28 36-28s34 8 36 28z" fill="var(--ga-coat,#0e7490)"/>
    <path d="M52 92l8 12 8-12" fill="#e8eef8"/>
    <rect x="53" y="76" width="14" height="18" rx="6" fill="#b97a57"/>
    <ellipse cx="60" cy="58" rx="20" ry="24" fill="#c98c66"/>
    <ellipse cx="40.5" cy="60" rx="3.6" ry="5.5" fill="#b97a57"/><ellipse cx="79.5" cy="60" rx="3.6" ry="5.5" fill="#b97a57"/>
    <circle cx="40.5" cy="67" r="1.8" fill="var(--ga-accent,#22d3ee)"/><circle cx="79.5" cy="67" r="1.8" fill="var(--ga-accent,#22d3ee)"/>
    <path d="M39 54c0-17 9-26 22-26 12 0 21 8 21 24-7-1-15-6-19-13-3 7-12 13-24 15z" fill="#2b1d18"/>
    <g class="ga-eyes"><ellipse cx="52" cy="58" rx="2.6" ry="3" fill="#1b1310"/><ellipse cx="68" cy="58" rx="2.6" ry="3" fill="#1b1310"/>
      <circle cx="52.9" cy="57" r=".8" fill="#fff"/><circle cx="68.9" cy="57" r=".8" fill="#fff"/></g>
    <path d="M47 51.5q5-3 9 0M64 51.5q5-3 9 0" stroke="#2b1d18" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M60 60q-1.6 5.5.4 6.6" stroke="#a5694a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <ellipse cx="49" cy="66" rx="3.2" ry="1.8" fill="#e0866f" opacity=".35"/><ellipse cx="71" cy="66" rx="3.2" ry="1.8" fill="#e0866f" opacity=".35"/>
    <g class="ga-mouth"><path class="ga-closed" d="M54.5 71.5q5.5 3.6 11 0" stroke="#7a3328" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path class="ga-open" d="M54.5 71q5.5-1 11 0q-1 6.2-5.5 6.2T54.5 71z" fill="#6d2a22"/><path class="ga-open" d="M56.5 71.4q3.5-.5 7 0v1.2h-7z" fill="#f4f1ec"/></g>
    <path d="M79 61q5 6 1 13" stroke="#263247" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="79.6" cy="74.2" r="2" fill="#263247"/>
  </g>
  <g class="ga-hand"><path d="M88 122l6-30" stroke="var(--ga-coat,#0e7490)" stroke-width="10" stroke-linecap="round"/>
    <circle cx="94.5" cy="89" r="5" fill="#c98c66"/><path d="M95 85l3-9" stroke="#c98c66" stroke-width="3.4" stroke-linecap="round"/></g>
</svg>`;

/* createAnchor: mounts the guide into `mount` (the caption box) and the Voice button. The player calls sync() every frame. */
export function createAnchor({ mount, button, storageKey = 'cookbook:voice', track = () => {} }) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const Utter = typeof window !== 'undefined' ? window.SpeechSynthesisUtterance : null;
  const el = document.createElement('div');
  el.className = 'guide'; el.id = 'guide';
  el.innerHTML = `${FACE}<button type="button" class="ga-min" aria-label="Hide the guide" title="Hide the guide"><span aria-hidden="true">–</span></button><span class="ga-hint" hidden>🔊 Tap to hear your guide</span>`;
  mount.prepend(el); mount.classList.add('has-guide');
  if (!synth || !Utter) { el.classList.add('mute'); if (button) button.hidden = true; return { sync() {}, reset() {}, stop() {}, holding: () => false, state: { supported: false } }; }

  let on = true; try { on = localStorage.getItem(storageKey) !== 'off'; } catch (e) { /* storage blocked */ }
  let unlocked = !!(navigator.userActivation && navigator.userActivation.hasBeenActive);
  let voice = null, utter = null, beatI = -1, done = false, text = '', lastChar = 0, resumeFrom = 0, rate = 1, startedAt = 0, gotStart = false, gen = 0, paused = false;
  const state = { supported: true, get on() { return on; }, get speaking() { return !!utter; }, get beat() { return beatI; }, spoken: [] };
  const choose = () => { voice = pickVoice(synth.getVoices()); };
  choose(); synth.addEventListener?.('voiceschanged', choose);

  const minBtn = el.querySelector('.ga-min');
  const setMin = m => { mount.classList.toggle('guide-min', m); minBtn.setAttribute('aria-label', m ? 'Show the guide' : 'Hide the guide'); minBtn.title = m ? 'Show the guide' : 'Hide the guide'; minBtn.firstElementChild.textContent = m ? '+' : '–'; try { localStorage.setItem(storageKey + ':min', m ? '1' : ''); } catch (e) { /* storage blocked */ } };
  minBtn.onclick = e => { e.stopPropagation(); setMin(!mount.classList.contains('guide-min')); };
  try { if (localStorage.getItem(storageKey + ':min')) setMin(true); } catch (e) { /* storage blocked */ }
  const hint = el.querySelector('.ga-hint');
  const showHint = v => { hint.hidden = !v; };
  const unlock = () => { if (unlocked) return; unlocked = true; showHint(false); };
  addEventListener('pointerdown', unlock, { capture: true }); addEventListener('keydown', unlock, { capture: true });

  function setBtn() { if (!button) return; button.setAttribute('aria-pressed', on); button.setAttribute('aria-label', on ? 'Turn the guide’s voice off' : 'Turn the guide’s voice on'); button.title = on ? 'Voice on (V)' : 'Voice off (V)'; if (button.firstElementChild) button.firstElementChild.textContent = on ? '🔊' : '🔇'; el.classList.toggle('mute', !on); }
  setBtn();
  function stop() { gen++; if (utter) { utter = null; synth.cancel(); } el.classList.remove('talk', 'word'); }
  function speak(i, b, from) {
    stop(); const g = gen;
    beatI = i; done = false; text = speakable(b.text); lastChar = resumeFrom = Math.max(0, Math.min(text.length, from || 0));
    const part = text.slice(resumeFrom).trim(); if (!part) { done = true; return; }
    const u = new Utter(part); u.lang = voice?.lang || 'en-GB'; if (voice) u.voice = voice; u.rate = rate; u.pitch = 1.05;
    u.onstart = () => { if (g !== gen) return; gotStart = true; el.classList.add('talk'); };
    u.onboundary = e => { if (g !== gen) return; lastChar = resumeFrom + (e.charIndex || 0); el.classList.add('word'); clearTimeout(u._w); u._w = setTimeout(() => el.classList.remove('word'), 140); };
    u.onend = u.onerror = () => { if (g !== gen) return; utter = null; done = true; el.classList.remove('talk', 'word'); };
    utter = u; gotStart = false; startedAt = performance.now(); state.spoken.push(part);
    synth.speak(u);
  }
  button && (button.onclick = () => { on = !on; try { localStorage.setItem(storageKey, on ? 'on' : 'off'); } catch (e) { /* storage blocked */ } if (!on) stop(); else { unlock(); done = false; beatI = -1; } setBtn(); track('voice', { on }); });

  return {
    state,
    /* every frame: { i (beat index), beat, playing, speed } */
    sync({ i, beat, playing, speed = 1 }) {
      el.classList.toggle('point', !!(beat && (beat.photo || (beat.labels && beat.labels.length))));
      const r = Math.min(2, speed);
      if (!on) return;
      if (!unlocked) { showHint(playing); return; }
      if (!playing) { if (utter) { const keep = { i: beatI, c: lastChar }; stop(); beatI = keep.i; resumeFrom = keep.c; done = false; paused = true; } return; }
      if (i !== beatI) { paused = false; rate = r; speak(i, beat, 0); return; }
      if (paused && !utter && !done) { paused = false; rate = r; speak(i, beat, resumeFrom); return; }
      if (utter && r !== rate) { rate = r; speak(i, beat, lastChar); }
    },
    /* a seek or chapter jump: speak the new beat from its start */
    reset() { stop(); beatI = -1; done = false; paused = false; },
    stop() { stop(); },
    /* should the film wait for her at the end of beat i? (safety: never wait on a voice that never starts, or for over 25 s) */
    holding(i) {
      if (!on || !unlocked || i !== beatI || done || paused) return false;
      const age = performance.now() - startedAt;
      if (!utter) return false;
      if (!gotStart && age > 3000) return false;
      return age < 25000;
    }
  };
}
