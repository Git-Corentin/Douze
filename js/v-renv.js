/* Douze — renversements : plaquer un accord dans toutes ses positions */
(function () {
  const P = window.P, T = P.T, A = P.A, h = P.h;
  const INV = ['état fondamental', '1er renversement', '2e renversement', '3e renversement'];
  const WHERE = ['fondamentale en bas', 'fondamentale en haut', 'fondamentale au milieu', 'fondamentale juste au-dessus de la basse'];
  const tones = c => T.chordSemis(c.q).slice(0, 4);
  /* notes de l'accord c dans sa position k, basse à partir de lo */
  const notes = (c, k, lo = 48) => { const t = tones(c), n = t.length, bass = T.lowIn(c.rpc + t[k], lo); return t.map((_, i) => bass + t[(k + i) % n] + (k + i >= n ? 12 : 0) - t[k]); };
  const toneName = (c, i) => T.simplify(T.spell(c.root, T.chordDegs(c.q)[i]));
  const marks = (c, ms, lab) => ms.map(m => { const i = tones(c).findIndex(s => T.mod(c.rpc + s) === m % 12); return { m, c: i === 0 ? 'c' : 'a', t: lab === 'note' ? T.fmt(toneName(c, i)) : T.fmtDeg(T.chordDegs(c.q)[i].t) }; });
  const slash = (c, k) => T.chordName(c) + (k ? '/' + T.fmt(toneName(c, k), true) : '');
  const PROGS = ['I V vi IV', 'vi IV I V', 'I vi IV V', 'I IV V IV', 'I V vi iii IV I IV V', 'Imaj7 vi7 ii7 V7'];

  P.renvTools = function (el) {
    /* ---------- défi ---------- */
    let pool = 'ton', invF = 'all', style = 'slash', cur = null, seq = 0, lab = P.S.lab; const got = new Set(), times = [];
    const prompt = h('div', { class: 'now renv-q' }), fb = h('p', { class: 'fb', 'aria-live': 'polite' }, 'Appuie sur « Nouvel accord », puis joue-le.'), avg = h('span', { class: 'score' });
    const kbHost = h('div'), posRow = h('div', { class: 'row' });
    const kb = new P.Keyboard(kbHost, { from: 48, to: 84, mob: [48, 72], onNote: (m, src) => {
      if (!cur || cur.done) return;
      const exp = notes(cur.c, cur.k), pcs = exp.map(x => x % 12), n = exp.length;
      if (src === 'mic') { /* au micro : les notes une par une, du grave à l'aigu */
        if (m % 12 === pcs[seq]) { seq++; kb.mark(exp.slice(0, seq).map(x => ({ m: x, c: 'g', t: '' }))); if (seq === n) win(); }
        else if (!(seq > 0 && m % 12 === pcs[seq - 1])) miss('Ce n\'est pas la note attendue : reprends depuis la basse.');
        return;
      }
      if (src === 'click' && got.has(m)) got.delete(m); else got.add(m);
      kb.mark([...got].map(x => ({ m: x, c: 'g', t: '' })));
      if (got.size < n) return;
      const arr = [...got].sort((a, b) => a - b), same = new Set(arr.map(x => x % 12)).size === n && arr.every(x => pcs.includes(x % 12));
      if (same && arr[0] % 12 === pcs[0]) win(arr);
      else miss(same ? 'Ce sont les bonnes notes, mais pas la bonne en bas : la basse doit être ' + T.fmt(toneName(cur.c, cur.k)) + '.' : 'Ce ne sont pas les notes de ' + T.chordName(cur.c) + '.');
    } });
    const win = arr => {
      const dt = (Date.now() - cur.t0) / 1000, exp = arr || notes(cur.c, cur.k); cur.done = true;
      if (!cur.shown) { times.push(dt); P.stat('renv', INV[cur.k], cur.tries === 0); }
      A.chord(exp, 0, 1.2, 0.5); kb.mark(marks(cur.c, exp, lab));
      fb.textContent = `Oui, en ${dt.toFixed(1)} s : ${slash(cur.c, cur.k)}, ${INV[cur.k]} (${WHERE[cur.k]}).`; fb.className = 'fb ok';
      const last = times.slice(-10); avg.textContent = last.length < 2 ? 'Objectif : moins de 2 s par accord.' : `Moyenne des ${last.length} derniers : ${(last.reduce((a, b) => a + b, 0) / last.length).toFixed(1)} s. Objectif : moins de 2 s.`;
      A.after(1300, next);
    };
    const miss = msg => { cur.tries++; got.clear(); seq = 0; fb.textContent = msg; fb.className = 'fb ko'; A.after(350, () => { if (cur && !cur.done) kb.clear(); }); };
    const pickChord = () => {
      if (pool === 'ton') return P.pick(P.romChords('I ii iii IV V vi', P.tonic()));
      const q = pool === 'maj' ? '' : pool === 'min' ? 'm' : pool === 'both' ? P.pick(['', 'm']) : P.pick(['maj7', 'm7', '7']);
      return T.mk(T.SIMPLE[Math.floor(Math.random() * 12)], q);
    };
    function next() {
      let c, k, guard = 0;
      do { c = pickChord(); const n = tones(c).length; k = invF === 'all' ? Math.floor(Math.random() * n) : Math.min(+invF, n - 1); } while (cur && T.chordName(c) === T.chordName(cur.c) && k === cur.k && guard++ < 8);
      cur = { c, k, t0: Date.now(), tries: 0 }; got.clear(); seq = 0; kb.clear();
      const n = tones(c).length, top = toneName(c, (k + n - 1) % n);
      prompt.innerHTML = '';
      prompt.append(h('strong', {}, style === 'slash' ? slash(c, k) : T.chordName(c)),
        h('span', {}, style === 'slash' ? (k ? 'basse : ' + T.fmt(toneName(c, k)) : 'fondamentale à la basse') : style === 'name' ? INV[k] : T.fmt(top) + ' en haut'));
      fb.textContent = 'Joue les ' + n + ' notes, dans n\'importe quelle octave.'; fb.className = 'fb';
      posRow.innerHTML = '';
    }
    const reveal = () => {
      if (!cur) return; cur.shown = true; posRow.innerHTML = '';
      tones(cur.c).forEach((_, k) => posRow.append(P.btn((k === cur.k ? 'Demandé : ' : '') + slash(cur.c, k), () => { const ms = notes(cur.c, k); kb.mark(marks(cur.c, ms, lab)); A.chord(ms, 0, 1.3, 0.5, 0.02); fb.textContent = INV[k] + ' : ' + WHERE[k] + '.'; fb.className = 'fb'; }, k === cur.k ? 'solid' : '')));
      const ms = notes(cur.c, cur.k); kb.mark(marks(cur.c, ms, lab)); A.chord(ms, 0, 1.3, 0.5, 0.02); got.clear(); seq = 0;
    };
    el.append(P.tool('Défi : plaquer l\'accord demandé',
      P.row(P.field('Accords', P.sel([['ton', 'Ceux de la tonalité du site'], ['maj', 'Majeurs, les 12'], ['min', 'Mineurs, les 12'], ['both', 'Majeurs et mineurs'], ['sev', 'Septièmes (maj7, m7, 7)']], pool, v => { pool = v; next(); })),
        P.field('Position', P.sel([['all', 'Toutes'], ['0', 'État fondamental'], ['1', '1er renversement'], ['2', '2e renversement'], ['3', '3e (septièmes)']], invF, v => { invF = v; next(); }))),
      P.row(P.field('Consigne donnée par', P.seg([['slash', 'La basse (C/E)'], ['name', 'Le renversement'], ['top', 'La note du haut']], style, v => { style = v; next(); }))),
      prompt, fb, kbHost,
      P.row(P.btn('Nouvel accord', next, 'solid'), P.btn('Voir les positions', reveal), avg), posRow,
      h('p', { class: 'hint' }, 'Sur le clavier à l\'écran, touche les notes une à une (retouche-en une pour l\'enlever). Avec un piano MIDI, plaque l\'accord. Au micro, égrène-le du grave à l\'aigu, le micro n\'entendant qu\'une note à la fois. Le chrono tourne dès que la consigne s\'affiche.')));

    /* ---------- enchaînements ---------- */
    let prog = PROGS[0], startK = 0, bpm = 66, prev = null, lab2 = P.S.lab;
    const kb2Host = h('div'), kb2 = new P.Keyboard(kb2Host, { from: 41, to: 84, mob: [41, 76] }), now2 = h('div', { class: 'now' }, h('strong', {}, ''), h('span', {}, ''));
    const voice = c => {
      const n = tones(c).length; let best = null, bc = 1e9;
      for (let k = 0; k < n; k++) for (const lo of [41, 53]) {
        const v = notes(c, k, lo); if (v[0] < 45 || v[n - 1] > 76) continue;
        const cost = prev ? (prev.length === n ? v.reduce((s, x, i) => s + Math.abs(x - prev[i]), 0) : Math.abs(v[0] - prev[0]) * n) : (k === Math.min(startK, n - 1) ? 0 : 50) + Math.abs(v[0] - 57) / 10;
        if (cost < bc) { bc = cost; best = v; }
      }
      return best;
    };
    const loop2 = new A.Loop({ get bpm() { return bpm; }, swing: 0, onStop: () => { prev = null; },
      onStep(s, t, d) {
        if (s % 4) return;
        const list = P.romChords(prog, P.tonic());
        if (s % 8 === 0) {
          const c = list[(s / 8) % list.length], v = voice(c); prev = v; loop2.cur = v;
          const k = tones(c).findIndex(x => T.mod(c.rpc + x) === v[0] % 12);
          A.piano(T.lowIn(c.rpc, 36), t, d * 7.6, 0.55); A.chord(v, t, d * 3.8, 0.5, 0.012);
          A.at(t, () => { kb2.mark(marks(c, v, lab2)); now2.firstChild.textContent = slash(c, k); now2.lastChild.textContent = INV[k] + ', ' + WHERE[k]; });
        } else if (loop2.cur) A.chord(loop2.cur, t, d * 3.6, 0.36, 0.012);
      } });
    el.append(P.tool('Enchaîner sans sauter',
      h('p', {}, 'La même suite d\'accords, mais chaque accord prend la position la plus proche du précédent : la main ne se déplace presque plus, et les notes communes restent sous les mêmes doigts. C\'est à cela que servent les renversements.'),
      P.row(P.field('Suite (dans la tonalité du site)', P.sel(PROGS.map(p => [p, p]), prog, v => { prog = v; prev = null; })),
        P.field('Premier accord', P.seg([[0, 'Fondamental'], [1, '1er renv.'], [2, '2e renv.']], startK, v => { startK = v; prev = null; }))),
      now2, kb2Host,
      P.row(P.playToggle(loop2, ['Écouter et suivre', 'Arrêter']), P.tempo('renv', 66, v => (bpm = v)), P.labSeg(v => { lab2 = v; }))));
    next();
    return () => { prev = null; if (pool === 'ton') next(); };
  };
})();
