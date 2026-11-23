// Fake Web Speech API for end-to-end tests (inject with page.addInitScript). Each utterance "speaks"
// one word every window.__msPerWord ms (default 60) and records its text in window.__spoken.
(() => {
  window.__spoken = []; window.__msPerWord = window.__msPerWord || 60;
  class U { constructor(text) { this.text = text; this.lang = ''; this.voice = null; this.rate = 1; this.pitch = 1; } }
  let cur = null, timer = 0;
  const voices = [{ name: 'Daniel', lang: 'en-GB', default: true }, { name: 'Samantha', lang: 'en-US' }];
  const synth = {
    speaking: false, pending: false, paused: false,
    getVoices: () => voices, addEventListener() {}, removeEventListener() {},
    speak(u) {
      if (cur) return; // real engines queue; the guide always cancels first
      cur = u; synth.speaking = true; window.__spoken.push({ text: u.text, voice: u.voice && u.voice.name, rate: u.rate });
      const words = [...u.text.matchAll(/\S+/g)]; let k = 0;
      setTimeout(() => u.onstart && u.onstart({}), 5);
      const step = () => {
        if (cur !== u) return;
        if (k < words.length) { u.onboundary && u.onboundary({ name: 'word', charIndex: words[k].index }); k++; timer = setTimeout(step, window.__msPerWord / (u.rate || 1)); }
        else { cur = null; synth.speaking = false; u.onend && u.onend({}); }
      };
      timer = setTimeout(step, 10);
    },
    cancel() { if (!cur) return; const u = cur; cur = null; synth.speaking = false; clearTimeout(timer); window.__cancels = (window.__cancels || 0) + 1; u.onerror && u.onerror({ error: 'interrupted' }); },
    pause() {}, resume() {}
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = U;
})();
