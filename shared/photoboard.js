/* PHOTO BOARDS: real photographs standing inside the 3D tours, in place of the drawn models.
   A beat with `photo: 'id'` shows that photo on a framed board between the camera and what the beat is about.
   Pure maths (boardFrame, fadeAt) is unit-tested; createBoards() is the three.js part. Photos load lazily, a beat or two ahead. */

/* Where a beat's board stands: a point part of the way from the beat's look point toward its camera, facing the camera. */
export function boardFrame(beat, toward = .32) {
  const az = (beat.view.az + 3.5) * Math.PI / 180, el = beat.view.el * Math.PI / 180, d = beat.view.dist * toward;
  const [x, y, z] = beat.look;
  return { pos: [x + d * Math.cos(el) * Math.sin(az), y + d * Math.sin(el), z + d * Math.cos(el) * Math.cos(az)], rotY: az, rotX: -el, camDist: beat.view.dist * (1 - toward) };
}

/* Opacity of beat i's photo at time t: fades in over the first second (unless the previous beat shows the same photo)
   and out over the last half second (unless the next beat does). A pure function of time, so scrubbing just works. */
export function fadeAt(beats, i, t, inS = 1.1, outS = .5) {
  const b = beats[i]; if (!b || !b.photo) return 0;
  const local = t - b.start, left = b.end - t;
  const a = beats[i - 1]?.photo === b.photo ? 1 : Math.min(1, Math.max(0, local / inS));
  const z = beats[i + 1]?.photo === b.photo ? 1 : Math.min(1, Math.max(0, left / outS));
  const k = Math.min(a, z);
  return k * k * (3 - 2 * k);
}

/* Photo-relative point (u across, v down, 0..1) → world position on the board. */
export function uvToLocal([u, v], w, h) { return [(u - .5) * w, (.5 - v) * h, .02]; }

export function createBoards(THREE, scene, photos, { base = '', anisotropy = 1, onLoad = () => {} } = {}) {
  const byId = Object.fromEntries(photos.map(p => [p.id, p]));
  const cache = {}; // id → { tex, ready, aspect }
  function load(id) {
    if (cache[id] || !byId[id]) return cache[id];
    const ph = byId[id], c = cache[id] = { ready: false, aspect: ph.w && ph.h ? ph.w / ph.h : 1.5, tex: null, failed: false };
    const img = new Image(); img.decoding = 'async';
    img.onload = () => { const tex = new THREE.CanvasTexture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = anisotropy; tex.needsUpdate = true; c.tex = tex; c.aspect = img.naturalWidth / img.naturalHeight; c.ready = true; onLoad(id); };
    img.onerror = () => { c.failed = true; };
    img.src = base + ph.file;
    return c;
  }

  // one board, re-dressed for whichever photo is showing
  const g = new THREE.Group(); g.rotation.order = 'YXZ'; g.visible = false; g.renderOrder = 5; scene.add(g);
  const mk = (mat, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); m.position.z = z; g.add(m); return m; };
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x0b1220, transparent: true, fog: false, toneMapped: false });
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, fog: false, toneMapped: false });
  const photoMat = new THREE.MeshBasicMaterial({ color: 0x1a2438, transparent: true, fog: false, toneMapped: false });
  const capMat = new THREE.MeshBasicMaterial({ transparent: true, fog: false, toneMapped: false });
  const edge = mk(edgeMat, -.03), frame = mk(frameMat, -.02), pic = mk(photoMat, 0), cap = mk(capMat, .01);
  // drawn last and on top of everything: the photo stands in for the model behind it
  [edge, frame, pic, cap].forEach((m, k) => { m.material.depthWrite = false; m.material.depthTest = false; m.renderOrder = 50 + k; });
  const capCanvas = document.createElement('canvas'); capCanvas.width = 1024; capCanvas.height = 64;
  const capTex = new THREE.CanvasTexture(capCanvas); capTex.colorSpace = THREE.SRGBColorSpace; capMat.map = capTex;
  let shownId = null, size = { w: 1, h: 1 };

  function drawCap(ph) {
    const x = capCanvas.getContext('2d'); x.clearRect(0, 0, 1024, 64);
    x.fillStyle = '#0b1220'; x.fillRect(0, 0, 1024, 64);
    x.fillStyle = '#38bdf8'; x.font = '700 26px system-ui, sans-serif'; x.textBaseline = 'middle';
    const tag = 'REAL PHOTO'; x.fillText(tag, 18, 33); const tw = x.measureText(tag).width;
    x.fillStyle = '#eaf0fb'; x.font = '600 26px system-ui, sans-serif';
    let title = ph.title; const room = 1024 - 36 - tw - 24;
    while (x.measureText(title).width > room && title.length > 8) title = title.slice(0, -2);
    if (title !== ph.title) title = title.trimEnd() + '…';
    x.fillText(title, 18 + tw + 20, 33);
    capTex.needsUpdate = true;
  }

  return {
    preload(ids) { ids.forEach(id => id && load(id)); },
    /* tl: timeline; i: beat index; t: time; fit: the player's phone fit factor; aspect: camera aspect; fov in degrees */
    update(tl, i, t, { fit = 1, aspect = 1.6, fov = 45 } = {}) {
      const b = tl.beats[i];
      // look ahead: the next beats' photos start loading now
      this.preload([b.photo, tl.beats[i + 1]?.photo, tl.beats[i + 2]?.photo, tl.beats[i + 3]?.photo]);
      const k = fadeAt(tl.beats, i, t);
      if (!b.photo || k <= 0) { g.visible = false; shownId = null; return null; }
      const ph = byId[b.photo], c = load(b.photo);
      if (shownId !== b.photo) { shownId = b.photo; drawCap(ph); photoMat.map = c.ready ? c.tex : null; photoMat.color.setHex(c.ready ? 0xffffff : 0x1a2438); photoMat.needsUpdate = true; }
      if (c.ready && photoMat.map !== c.tex) { photoMat.map = c.tex; photoMat.color.setHex(0xffffff); photoMat.needsUpdate = true; }
      const f = boardFrame(b), d = f.camDist * fit, span = 2 * d * Math.tan(fov * Math.PI / 360);
      // about 42% of the view's height (the caption and bars take the rest), never more than 80% of its width
      const tall = c.aspect < 1; let h = span * (tall ? .5 : .42), w = h * c.aspect; if (w > span * aspect * .8) { w = span * aspect * .8; h = w / c.aspect; }
      size = { w, h };
      g.position.set(...f.pos); g.rotation.set(f.rotX, f.rotY, 0);
      const pad = h * .035, capH = tall ? 0 : Math.max(h * .085, w / 16 * .9); cap.visible = !tall;
      pic.scale.set(w, h, 1);
      frame.scale.set(w + pad * 2, h + pad * 2 + capH, 1); frame.position.y = -capH / 2;
      edge.scale.set(w + pad * 2 + h * .012, h + pad * 2 + capH + h * .012, 1); edge.position.y = -capH / 2;
      cap.scale.set(w + pad * 2, capH, 1); cap.position.y = -h / 2 - pad / 2 - capH / 2;
      const rise = (1 - k) * h * .08; g.position.y -= rise;
      [edgeMat, frameMat, photoMat, capMat].forEach(m => { m.opacity = k; });
      edgeMat.opacity = k * .9;
      g.visible = true; g.updateMatrixWorld(true);
      return { id: b.photo, ready: c.ready, failed: c.failed, opacity: k };
    },
    /* world position of a point on the showing photo (for HTML labels) */
    at(uv) { const [x, y, z] = uvToLocal(uv, size.w, size.h); const v = new THREE.Vector3(x, y, z); return g.visible ? pic.parent.localToWorld(v).toArray() : null; },
    get loaded() { return Object.entries(cache).filter(([, c]) => c.ready).map(([id]) => id); },
    get failed() { return Object.entries(cache).filter(([, c]) => c.failed).map(([id]) => id); },
    group: g
  };
}

/* Checks for the unit tests: every photo has a credit and a licence link, and every beat's photo exists. */
export function validatePhotos(chapters, photos) {
  const errs = [], ids = new Set();
  for (const p of photos) {
    if (ids.has(p.id)) errs.push(`duplicate photo id ${p.id}`); ids.add(p.id);
    for (const k of ['file', 'title', 'alt', 'author', 'licence', 'url']) if (!p[k]) errs.push(`photo ${p.id}: missing ${k}`);
    if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(p.url || '')) errs.push(`photo ${p.id}: url is not a Wikimedia Commons file page`);
    if (!/^(CC0|Public domain|CC BY(-SA)? [\d.]+)/.test(p.licence || '')) errs.push(`photo ${p.id}: licence ${p.licence} is not a free licence we use`);
    if (/BY/.test(p.licence) && !/^https?:\/\/creativecommons\.org\//.test(p.licUrl || '')) errs.push(`photo ${p.id}: CC BY licence needs a link`);
    if (!(p.w > 0 && p.h > 0)) errs.push(`photo ${p.id}: missing size`);
    for (const [, uv] of p.labels || []) if (!(uv[0] >= 0 && uv[0] <= 1 && uv[1] >= 0 && uv[1] <= 1)) errs.push(`photo ${p.id}: label outside the photo`);
  }
  chapters.forEach((c, ci) => c.beats.forEach((b, bi) => { if (b.photo && !ids.has(b.photo)) errs.push(`chapter ${ci + 1} beat ${bi}: unknown photo ${b.photo}`); }));
  const used = new Set(chapters.flatMap(c => c.beats.map(b => b.photo)).filter(Boolean));
  for (const id of ids) if (!used.has(id)) errs.push(`photo ${id} is never shown`);
  return errs;
}
