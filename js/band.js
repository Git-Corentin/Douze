/* Douze — section rythmique : contrebasse qui marche, cymbale, piano d'accompagnement */
(function () {
  const P = window.P, T = P.T, A = P.A;

  /* o = {bars:[[accord,…],…], bpm, feel:'swing'|'bossa'|'pop', comp, bass, drums, countIn,
          onChord(ch, mesure, voicing, abs), onBar(mesure, abs), onChorus(n), lead(abs, croche, t, d, mesure)} */
  P.Band = function (o) {
    let prevV = null, cur = null, lastBass = 34, pat = [0, 3];
    const chordAt = (bar, beat) => { const b = o.bars[bar], n = b.length; return b[n === 1 ? 0 : n === 2 ? (beat < 2 ? 0 : 1) : n === 3 ? [0, 0, 1, 2][beat] : Math.min(beat, n - 1)]; };
    const fifthOf = c => T.TOK[T.vTokens(c).fifth];
    const loop = new A.Loop({
      get bpm() { return o.bpm; }, get swing() { return o.feel === 'swing' ? (o.swing == null ? 0.9 : o.swing) : 0; },
      onStop: () => { prevV = null; cur = null; o.onStop && o.onStop(); },
      onStep(s, t, d) {
        if (o.countIn) { if (s < 8) { if (s % 2 === 0) A.drum(s === 0 ? 'clickHi' : 'click', t, 0.6); return; } s -= 8; }
        let n = o.bars.length; const abs = Math.floor(s / 8), e = s % 8, beat = e >> 1;
        if (e === 0 && abs % n === 0 && o.onChorus) { o.onChorus(Math.floor(abs / n)); n = o.bars.length; }
        const bar = abs % n, ch = chordAt(bar, beat), beatDur = 60 / o.bpm;
        if (e === 0 && o.onBar) A.at(t, () => o.onBar(bar, abs));
        if (e % 2 === 0 && ch !== cur) { cur = ch; prevV = T.voicing(ch, 'auto', prevV); const v = prevV; A.at(t, () => o.onChord && o.onChord(ch, bar, v, abs)); }
        const vm = prevV.map(x => x.m), feel = o.feel || 'swing';
        const nextCh = beat < 3 ? chordAt(bar, beat + 1) : chordAt((bar + 1) % n, 0);
        const root = T.lowIn(ch.rpc, 28);

        if (o.drums !== false) {
          if (feel === 'swing') {
            if (e % 2 === 0) A.drum('ride', t, beat % 2 ? 0.55 : 0.42); else if (e === 3 || e === 7) A.drum('ride', t, 0.28);
            if (e === 2 || e === 6) A.drum('hat', t, 0.5);
            if (e === 0) A.drum('kick', t, 0.18);
          } else if (feel === 'bossa') {
            A.drum('hat', t, e % 2 ? 0.14 : 0.24);
            if ((abs % 2 ? [2, 5] : [0, 3, 6]).includes(e)) A.drum('rim', t, 0.45);
            if (e === 0 || e === 3 || e === 4 || e === 7) A.drum('kick', t, e % 4 === 0 ? 0.4 : 0.22);
          } else {
            A.drum('hat', t, e % 2 ? 0.12 : 0.22);
            if (e === 0 || e === 4 || e === 5) A.drum('kick', t, e === 5 ? 0.25 : 0.5);
            if (e === 2 || e === 6) A.drum('brush', t, 0.5);
          }
        }
        if (o.bass !== false) {
          let note = null, len = beatDur * 0.92;
          if (feel === 'swing') {
            if (e % 2 === 0) {
              const first = beat === 0 || chordAt(bar, beat - 1) !== ch;
              if (first) note = root;
              else if (nextCh !== ch || beat === 3) {
                const nr = T.lowIn(nextCh.rpc, 28);
                note = nextCh.rpc === ch.rpc && Math.random() < 0.5 ? root + fifthOf(ch) : nr + (Math.random() < 0.5 ? -1 : 1);
              } else {
                const cands = [...T.chordSemis(ch.q).slice(1, 4).map(x => root + (x % 12)), root + 12].filter(x => x !== lastBass);
                cands.sort((a, b) => Math.abs(a - lastBass) - Math.abs(b - lastBass));
                note = cands[Math.random() < 0.65 ? 0 : 1];
              }
            }
          } else if (feel === 'bossa') {
            if (e === 0) { note = root; len = beatDur * 1.4; } else if (e === 3 || e === 4) note = root + fifthOf(ch) - (root > 33 ? 12 : 0);
            else if (e === 7) { note = T.lowIn(nextCh.rpc, 28); len = d; }
            if (e === 3) len = d;
          } else {
            if (e === 0 || e === 4) { note = T.lowIn((e === 4 ? chordAt(bar, 2) : ch).rpc, 28); len = beatDur * 1.4; } else if (e === 3 || e === 7) { note = root; len = d * 0.9; }
          }
          if (note != null) { A.bass(note, t, len, 0.85); lastBass = note; }
        }
        if (o.comp !== false) {
          const multi = o.bars[bar].length > 1;
          if (feel === 'swing') {
            if (e === 0) pat = P.pick(multi ? [[0, 4], [0, 3, 4], [0, 4, 7], [1, 4]] : [[0, 3], [0, 5], [3, 6], [2, 5], [0, 3, 6], [1, 4], [0]]);
            if (pat.includes(e)) A.chord(vm, t, e === 0 ? beatDur * 0.9 : d * 1.1, 0.36);
          } else if (feel === 'bossa') {
            if ((abs % 2 ? [2, 5] : [0, 3, 6]).includes(e)) A.chord(vm, t, d * 1.6, 0.34);
          } else if (e === 0 || e === 4) A.chord(vm, t, beatDur * 1.9, e ? 0.3 : 0.38, 0.015);
        }
        if (o.lead) o.lead(abs, e, t, d, bar);
      },
    });
    this.loop = loop;
    Object.defineProperty(this, 'bars', { get: () => o.bars, set: v => { o.bars = v; } });
  };

  /* suite d'accords plaqués, pour écouter une progression */
  P.playProg = (chs, o = {}) => {
    const beats = o.beats || 2;
    const L = new A.Loop({
      bpm: o.bpm || 84, swing: 0, onStop: o.onStop,
      onStep(s, t, d) {
        const per = beats * 2, i = Math.floor(s / per);
        if (i >= chs.length && !o.loop) { if (s % per === 0) A.at(t, () => L.stop()); return; }
        if (s % per === 0) {
          const c = chs[i % chs.length];
          A.piano(T.lowIn(c.bass ? c.bpc : c.rpc, 36), t, d * per * 0.95, 0.6);
          A.chord(o.voice ? o.voice(c, i) : T.closeVoicing(c, 62), t, d * per * 0.95, 0.5, 0.012);
          if (o.on) A.at(t, () => o.on(c, i % chs.length));
        }
      },
    });
    L.start(); return L;
  };

  /* Ligne mélodique : "F4 A4 C5 - . eb4>E4 | …" (une case = une croche, - prolonge, . silence, x>Y appoggiature) */
  const NOTE = /^([A-Ga-g])([#b]?)(-?\d)$/;
  const midiOf = s => { const m = NOTE.exec(s); return 12 * (+m[3] + 1) + T.parseNote(m[1].toUpperCase() + m[2]).pc; };
  P.parseLine = str => {
    const out = [];
    str.split('|').forEach((bar, bi) => {
      let last = null;
      bar.trim().split(/\s+/).forEach((tk, e) => {
        if (tk === '-') { if (last) last.len++; return; }
        if (tk === '.') { last = null; return; }
        const [g, main] = tk.includes('>') ? tk.split('>') : [null, tk];
        last = { bar: bi, e, m: midiOf(main), grace: g ? midiOf(g) : null, len: 1 }; out.push(last);
      });
    });
    return out;
  };
})();
