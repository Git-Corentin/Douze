/* Douze — écoute du piano par le micro (une note à la fois) */
(function () {
  const P = window.P, A = P.A, T = P.T;
  const M = (P.mic = { on: false, heard: null, state: 'coupé' });
  let stream = null, an = null, src = null, buf = null, timer = null;
  let cand = -1, n = 0, last = -1, rearm = true, prevRms = 0, quiet = 0;

  /* YIN : estimation de la fréquence fondamentale */
  function pitch(b, sr) {
    const W = 1536, tmin = Math.max(2, Math.floor(sr / 2100)), tmax = Math.min(Math.floor(sr / 58), b.length - W - 1);
    const d = new Float32Array(tmax + 2); let run = 0, tau = -1;
    for (let t = 1; t <= tmax; t++) { let s = 0; for (let i = 0; i < W; i++) { const x = b[i] - b[i + t]; s += x * x; } run += s; d[t] = run ? (s * t) / run : 1; }
    for (let t = tmin; t < tmax; t++) if (d[t] < 0.13) { while (t + 1 < tmax && d[t + 1] < d[t]) t++; tau = t; break; }
    if (tau < 2) return 0;
    const a = d[tau - 1], c = d[tau + 1], den = a - 2 * d[tau] + c;
    return sr / (tau + (den ? (a - c) / (2 * den) : 0));
  }
  function tick() {
    const x = A.ctx(); an.getFloatTimeDomainData(buf);
    let e = 0; for (let i = 0; i < 2048; i++) e += buf[i] * buf[i];
    const rms = Math.sqrt(e / 2048);
    /* on n'écoute pas pendant que le site joue : le haut-parleur du téléphone serait pris pour ton piano */
    if (x.currentTime < (A.busy || 0)) { n = 0; cand = -1; rearm = true; prevRms = rms; return; }
    if (rms < 0.012) { if (++quiet > 3) { rearm = true; last = -1; } n = 0; cand = -1; prevRms = rms; return; }
    quiet = 0;
    if (rms > prevRms * 1.7 && rms > 0.03) rearm = true;
    prevRms = prevRms * 0.6 + rms * 0.4;
    const f = pitch(buf, x.sampleRate); if (!f) { n = 0; return; }
    const m = Math.round(69 + 12 * Math.log2(f / 440)); if (m < 33 || m > 96) return;
    if (m === cand) n++; else { cand = m; n = 1; }
    if (n === 3 && (m !== last || rearm)) {
      last = m; rearm = false; M.heard = m; P.noteIn(m, 'mic'); if (P.onMic) P.onMic();
    }
  }
  M.start = async () => {
    if (M.on) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { M.state = 'indisponible (il faut une page en https)'; P.onMic && P.onMic(); return; }
    try {
      const x = A.ctx();
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      src = x.createMediaStreamSource(stream); an = x.createAnalyser(); an.fftSize = 4096; src.connect(an);
      buf = new Float32Array(an.fftSize); timer = setInterval(tick, 45);
      M.on = true; M.state = 'à l\'écoute'; M.heard = null;
    } catch (e) { M.state = 'accès au micro refusé'; }
    P.onMic && P.onMic();
  };
  M.stop = () => {
    if (timer) clearInterval(timer); timer = null;
    if (stream) stream.getTracks().forEach(t => t.stop()); stream = null;
    if (src) src.disconnect(); src = null; M.on = false; M.state = 'coupé'; M.heard = null; P.onMic && P.onMic();
  };
  M._pitch = pitch;
  M.toggle = () => (M.on ? M.stop() : M.start());
  M.label = () => (M.on ? 'Micro : ' + (M.heard != null ? T.fmt(T.SIMPLE[M.heard % 12]) : 'j\'écoute') : 'Micro');
})();
