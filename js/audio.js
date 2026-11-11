/* Douze — son : piano (échantillons + synthé de secours), basse, batterie, boucles */
(function () {
  const P = window.P;
  const A = (P.A = { samples: {}, sampleState: 'synthé', loops: new Set(), timers: new Set() });
  let c, master, noise;

  function impulse(sec) {
    const n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    return b;
  }
  function ctx() {
    if (!c) {
      c = new (window.AudioContext || window.webkitAudioContext)();
      master = c.createGain(); master.gain.value = P.S.vol;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
      master.connect(comp); comp.connect(c.destination);
      const rev = c.createConvolver(); rev.buffer = impulse(1.7);
      const rg = c.createGain(); rg.gain.value = 0.14;
      A.rev = c.createGain(); A.rev.connect(rev); rev.connect(rg); rg.connect(master);
      noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      if (P.S.samples) loadSamples();
      /* iPhone : un élément audio muet fait passer le son même avec le bouton silencieux enclenché */
      try {
        const n = 2205, hdr = 44, b = new Uint8Array(hdr + n), dv = new DataView(b.buffer), wr = (o, str) => [...str].forEach((ch, i) => (b[o + i] = ch.charCodeAt(0)));
        wr(0, 'RIFF'); dv.setUint32(4, 36 + n, true); wr(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
        dv.setUint32(24, 22050, true); dv.setUint32(28, 22050, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true); wr(36, 'data'); dv.setUint32(40, n, true); b.fill(128, hdr);
        const el = new Audio(URL.createObjectURL(new Blob([b], { type: 'audio/wav' }))); el.loop = true; el.setAttribute('playsinline', ''); el.play().catch(() => {});
      } catch (e) { /* sans importance */ }
    }
    if (c.state === 'suspended') c.resume();
    return c;
  }
  A.ctx = ctx;
  A.now = () => ctx().currentTime;
  A.setVol = v => { if (master) master.gain.value = v; };

  /* Piano à queue Salamander (domaine public / CC-BY), hébergé par le projet Tone.js.
     Si le chargement échoue (hors ligne), on retombe sur le synthé intégré. */
  const SBASE = 'https://tonejs.github.io/audio/salamander/';
  const SN = [['C1', 24], ['Fs1', 30], ['C2', 36], ['Fs2', 42], ['C3', 48], ['Fs3', 54], ['C4', 60], ['Fs4', 66], ['C5', 72], ['Fs5', 78], ['C6', 84], ['Fs6', 90], ['C7', 96]];
  async function loadSamples() {
    if (A.loading) return; A.loading = true; A.sampleState = 'chargement…'; P.onSound && P.onSound();
    let ok = 0;
    await Promise.all(SN.map(async ([n, m]) => {
      try {
        const r = await fetch(SBASE + n + '.mp3'); if (!r.ok) throw 0;
        A.samples[m] = await c.decodeAudioData(await r.arrayBuffer()); ok++;
      } catch (e) { /* synthé */ }
    }));
    A.loading = false; A.sampleState = ok ? 'piano à queue' : 'synthé'; P.onSound && P.onSound();
  }
  A.loadSamples = () => { ctx(); loadSamples(); };

  A.piano = (m, t, dur = 1.2, vel = 0.7) => {
    const x = ctx(); t = Math.max(t || 0, x.currentTime);
    const g = x.createGain(); g.connect(master); g.connect(A.rev);
    A.busy = Math.max(A.busy || 0, t + Math.min(dur, 1.6) + 0.35);
    let best = null, bd = 99;
    if (P.S.samples) for (const k in A.samples) { const d = Math.abs(k - m); if (d < bd) { bd = d; best = +k; } }
    if (best != null && bd <= 7) {
      const s = x.createBufferSource(); s.buffer = A.samples[best]; s.playbackRate.value = Math.pow(2, (m - best) / 12);
      g.gain.setValueAtTime(vel * 1.25, t); g.gain.setValueAtTime(vel * 1.25, t + dur);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.4);
      s.connect(g); s.start(t); s.stop(t + dur + 0.45);
      return;
    }
    const f = 440 * Math.pow(2, (m - 69) / 12);
    const lp = x.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(f * 7, 9000), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.7, 320), t + 1.1);
    lp.connect(g);
    [[1, 'triangle', 0.55], [2, 'sine', 0.16], [1.003, 'sine', 0.3], [3, 'sine', 0.05]].forEach(([r, ty, a]) => {
      const o = x.createOscillator(); o.type = ty; o.frequency.value = f * r;
      const og = x.createGain(); og.gain.value = a; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.5);
    });
    const len = Math.max(0.5, 3 - (m - 36) * 0.035), hold = Math.min(dur, len);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * 0.55, t + 0.006);
    g.gain.exponentialRampToValueAtTime(vel * 0.14, t + hold + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, t + hold + 0.32);
  };
  A.chord = (ms, t, dur = 1.5, vel = 0.55, strum = 0) => { t = t || A.now(); ms.forEach((m, i) => A.piano(m, t + i * strum, dur, vel)); };
  /* [[midi, début(s), durée(s), vél]] à partir de maintenant */
  A.seq = (list, t0) => { t0 = t0 || A.now() + 0.05; list.forEach(([m, s, d, v]) => A.piano(m, t0 + s, d || 0.5, v || 0.7)); return t0; };

  A.bass = (m, t, dur = 0.4, vel = 0.8) => {
    const x = ctx(); t = Math.max(t || 0, x.currentTime); A.busy = Math.max(A.busy || 0, t + dur + 0.4); const f = 440 * Math.pow(2, (m - 69) / 12);
    const g = x.createGain(), lp = x.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.connect(g); g.connect(master);
    [['triangle', 1, 0.8], ['sine', 1, 0.6], ['sawtooth', 1, 0.12]].forEach(([ty, r, a]) => {
      const o = x.createOscillator(); o.type = ty; o.frequency.value = f * r; const og = x.createGain(); og.gain.value = a;
      o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.3);
    });
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * 0.6, t + 0.012);
    g.gain.exponentialRampToValueAtTime(vel * 0.22, t + dur); g.gain.exponentialRampToValueAtTime(0.0008, t + dur + 0.18);
  };
  A.drum = (kind, t, vel = 0.5) => {
    const x = ctx(); t = Math.max(t || 0, x.currentTime); const g = x.createGain(); g.connect(master);
    if (kind === 'kick') {
      const o = x.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2); o.connect(g); o.start(t); o.stop(t + 0.22); return;
    }
    if (kind === 'click' || kind === 'clickHi') {
      const o = x.createOscillator(); o.type = 'square'; o.frequency.value = kind === 'clickHi' ? 1760 : 1100;
      g.gain.setValueAtTime(vel * 0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); o.connect(g); o.start(t); o.stop(t + 0.06); return;
    }
    const s = x.createBufferSource(); s.buffer = noise; const fl = x.createBiquadFilter();
    const cfg = { ride: ['highpass', 6500, 0.28], hat: ['highpass', 9000, 0.045], rim: ['bandpass', 1900, 0.07], brush: ['bandpass', 3500, 0.13] }[kind];
    fl.type = cfg[0]; fl.frequency.value = cfg[1]; s.connect(fl); fl.connect(g);
    g.gain.setValueAtTime(vel * (kind === 'ride' ? 0.32 : 0.5), t); g.gain.exponentialRampToValueAtTime(0.001, t + cfg[2]);
    s.start(t, Math.random() * 0.5); s.stop(t + cfg[2] + 0.02);
    if (kind === 'ride') { const o = x.createOscillator(); o.type = 'square'; o.frequency.value = 5300; const og = x.createGain(); og.gain.setValueAtTime(vel * 0.02, t); og.gain.exponentialRampToValueAtTime(0.0005, t + 0.25); o.connect(og); og.connect(master); o.start(t); o.stop(t + 0.26); }
  };

  /* Boucle à la croche : o = {bpm, swing 0..1, onStep(i, t, durCroche)} — o est lu en direct */
  A.Loop = function (o) {
    let timer = null, next = 0, step = 0;
    const dur = i => { const beat = 60 / o.bpm, long = beat * (0.5 + (o.swing || 0) * 0.1667); return i % 2 === 0 ? long : beat - long; };
    const tick = () => { const x = ctx(); while (next < x.currentTime + 0.14) { const d = dur(step); o.onStep(step, next, d); next += d; step++; } };
    this.start = () => { this.stop(); A.stopAll(); const x = ctx(); next = x.currentTime + 0.1; step = 0; timer = setInterval(tick, 25); A.loops.add(this); tick(); this.on = true; A.wake(true); };
    this.stop = () => { if (timer) clearInterval(timer); timer = null; A.loops.delete(this); const was = this.on; this.on = false; if (was && o.onStop) o.onStop(); if (this._sync) this._sync(); if (!A.loops.size) A.wake(false); };
    this.toggle = () => (this.on ? this.stop() : this.start());
  };
  /* l'écran du téléphone reste allumé tant qu'une boucle joue */
  let lock = null;
  A.wake = on => {
    if (!navigator.wakeLock) return;
    if (on && !lock) navigator.wakeLock.request('screen').then(l => { lock = l; l.addEventListener('release', () => (lock = null)); }, () => {});
    if (!on && lock) { lock.release().catch(() => {}); lock = null; }
  };
  /* lecteur d'événements datés (en secondes), interrompable : ev = [[t, fn(tAudio)], …] */
  A.Player = function (ev, onEnd) {
    let timer = null, i = 0, t0 = 0;
    const tick = () => { const x = ctx(); while (i < ev.length && t0 + ev[i][0] < x.currentTime + 0.18) { ev[i][1](t0 + ev[i][0]); i++; } if (i >= ev.length) { const end = t0 + ev[ev.length - 1][0]; A.at(end + 0.6, () => this.stop()); clearInterval(timer); timer = null; } };
    this.start = () => { A.stopAll(); const x = ctx(); t0 = x.currentTime + 0.12; i = 0; this.on = true; A.loops.add(this); A.wake(true); timer = setInterval(tick, 40); tick(); };
    this.stop = () => { if (timer) clearInterval(timer); timer = null; A.loops.delete(this); const was = this.on; this.on = false; if (was && onEnd) onEnd(); if (!A.loops.size) A.wake(false); };
  };
  A.at = (t, fn) => { const id = setTimeout(() => { A.timers.delete(id); fn(); }, Math.max(0, (t - (c ? c.currentTime : 0)) * 1000)); A.timers.add(id); return id; };
  A.after = (ms, fn) => { const id = setTimeout(() => { A.timers.delete(id); fn(); }, ms); A.timers.add(id); return id; };
  A.stopAll = () => { [...A.loops].forEach(l => l.stop()); A.timers.forEach(clearTimeout); A.timers.clear(); };
})();
