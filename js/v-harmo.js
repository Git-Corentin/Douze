/* Douze — trouver les accords sous une mélodie */
(function () {
  const P = window.P, T = P.T, A = P.A, h = P.h;
  const MAJ = [0, 2, 4, 5, 7, 9, 11];
  /* airs du domaine public, écrits en degrés : "3:1.5" = degré 3 pendant 1,5 temps ; , et ' = octave en dessous / au-dessus */
  const TUNES = [
    { id: 'clair', n: 'Au clair de la lune', beats: 4, bpm: 108, bars: ['1 1 1 2', '3:2 2:2', '1 3 2 2', '1:4'], ch: ['I', 'I V', 'I V', 'I'] },
    { id: 'maman', n: 'Ah ! vous dirai-je, maman', beats: 4, bpm: 112, bars: ['1 1 5 5', '6 6 5:2', '4 4 3 3', '2 2 1:2', '5 5 4 4', '3 3 2:2', '5 5 4 4', '3 3 2:2'], ch: ['I', 'IV I', 'IV I', 'V I', 'I IV', 'I V', 'I IV', 'I V'] },
    { id: 'anniv', n: 'Joyeux anniversaire', beats: 3, bpm: 100, pickup: '5,:.75 5,:.25', bars: ['6, 5, 1', '7,:2 5,:.75 5,:.25', '6, 5, 2', '1:2 5,:.75 5,:.25', '5 3 1', '7, 6, 4:.75 4:.25', '3 1 2', '1:3'], ch: ['I', 'V', 'V', 'I', 'I', 'IV', 'I:2 V:1', 'I'] },
    { id: 'avignon', n: 'Sur le pont d\'Avignon', beats: 2, bpm: 92, bars: ['1:.5 1:.5 1', '2:.5 2:.5 2', '3:.5 4:.5 5:.5 1:.5', '7,:.5 1:.5 2:.5 5,:.5', '1:.5 1:.5 1', '2:.5 2:.5 2', '3:.5 4:.5 5:.5 1:.5', '2:.5 7,:.5 1'], ch: ['I', 'V', 'I', 'V', 'I', 'V', 'I', 'V I'] },
    { id: 'susanna', n: 'Oh! Susanna', beats: 4, bpm: 150, pickup: '1:.5 2:.5', bars: ['3 5 5:1.5 6:.5', '5 3 1:1.5 2:.5', '3 3 2 1', '2:3 1:.5 2:.5', '3 5 5:1.5 6:.5', '5 3 1:1.5 2:.5', '3 3 2 2', '1:3'], ch: ['I', 'I', 'I', 'V', 'I', 'I', 'I V', 'I'] },
    { id: 'ode', n: 'Ode à la joie', beats: 4, bpm: 120, bars: ['3 3 4 5', '5 4 3 2', '1 1 2 3', '3:1.5 2:.5 2:2', '3 3 4 5', '5 4 3 2', '1 1 2 3', '2:1.5 1:.5 1:2'], ch: ['I', 'V', 'I', 'I V', 'I', 'V', 'I', 'V I'] },
    { id: 'grace', n: 'Amazing Grace', beats: 3, bpm: 88, pickup: '5,', bars: ['1:2 3:.5 1:.5', '3:2 2', '1:2 6,', '5,:2 5,', '1:2 3:.5 1:.5', '3:2 2', '5:3', '5:3'], ch: ['I', 'I', 'IV', 'I', 'I', 'I', 'V', 'V'] },
    { id: 'nuit', n: 'Douce nuit', beats: 3, bpm: 96, bars: ['5:1.5 6:.5 5', '3:3', '5:1.5 6:.5 5', '3:3', "2':2 2'", '7:3', "1':2 1'", '5:3', '6:2 6', "1':1.5 7:.5 6", '5:1.5 6:.5 5', '3:3'], ch: ['I', 'I', 'I', 'I', 'V', 'V', 'I', 'I', 'IV', 'IV', 'I', 'I'] },
    { id: 'auld', n: 'Ce n\'est qu\'un au revoir', beats: 4, bpm: 96, pickup: '5,', bars: ['1:1.5 1:.5 1 3', '2:1.5 1:.5 2 3', '1:1.5 1:.5 3 5', '6:3 6', '5:1.5 3:.5 3 1', '2:1.5 1:.5 2 3', '1:1.5 6,:.5 6, 5,', '1:3'], ch: ['I', 'V', 'I', 'IV', 'I', 'V', 'IV V', 'I'] },
    { id: 'vent', n: 'Vive le vent (refrain)', beats: 4, bpm: 150, bars: ['3 3 3:2', '3 3 3:2', '3 5 1:1.5 2:.5', '3:4', '4 4 4:1.5 4:.5', '4 3 3 3:.5 3:.5', '3 2 2 3', '2:2 5:2'], ch: ['I', 'I', 'I', 'I', 'IV', 'I', 'II7', 'V'] },
    { id: 'aura', n: 'Aura Lee', beats: 4, bpm: 92, bars: ['5, 1 7, 1', '2 6, 2:2', '1 7, 6, 7,', '1:4'], ch: ['I', 'II7', 'V', 'I'] },
  ];
  const POOLS = { '1': ['I', 'IV', 'V'], '2': ['I', 'IV', 'V', 'vi'], '3': ['I', 'IV', 'V', 'vi', 'ii', 'iii'], '4': ['I', 'IV', 'V', 'vi', 'ii', 'iii', 'II7', 'III7', 'iv', 'bVII'] };
  const RHY = [[1, 1, 1, 1], [2, 1, 1], [1, 1, 2], [2, 2], [1.5, 0.5, 1, 1], [1, 1, 1, 0.5, 0.5], [1.5, 0.5, 2], [1, 0.5, 0.5, 2]];
  const norm = r => r.replace(/7$/, '');
  const disp = r => r.replace(/b/g, '♭');

  function parseNotes(str, bar) {
    let pos = 0; const out = [];
    str.trim().split(/\s+/).forEach(tk => {
      const m = /^(r|([b#]?)([1-7])([,']*))(?::([\d.]+))?$/.exec(tk), dur = m[5] ? +m[5] : 1;
      if (m[1] !== 'r') { let s = MAJ[+m[3] - 1] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0); for (const c of m[4]) s += c === ',' ? -12 : 12; out.push({ bar, pos, dur, semi: s }); }
      pos += dur;
    });
    return { notes: out, len: pos };
  }
  function fromTune(tu) {
    const notes = [], segs = []; let pick = 0;
    if (tu.pickup) { const p = parseNotes(tu.pickup, -1); pick = p.len; p.notes.forEach(n => notes.push({ ...n, pos: n.pos - p.len, bar: 0 })); }
    tu.bars.forEach((b, i) => notes.push(...parseNotes(b, i).notes));
    tu.ch.forEach((c, i) => { const parts = c.split(' '); let st = 0; parts.forEach(pt => { const [r, l] = pt.split(':'), len = l ? +l : tu.beats / parts.length; segs.push({ bar: i, start: st, len, ref: r }); st += len; }); });
    return { name: tu.n, beats: tu.beats, bpm: tu.bpm, nbars: tu.bars.length, notes, segs, pick, pool: [...new Set([...POOLS['3'], ...segs.map(s => s.ref)])] };
  }
  function generate(level, nbars) {
    const pool = POOLS[level], seq = [];
    for (let i = 0; i < nbars; i++) {
      if (i === 0) seq.push(level !== '1' && Math.random() < 0.2 ? 'vi' : 'I');
      else if (i === nbars - 1) seq.push('I');
      else if (i === nbars - 2) seq.push(Math.random() < 0.75 ? 'V' : 'IV');
      else { let r; do r = P.pick(pool.slice(0, 6)); while (r === seq[i - 1]); seq.push(r); }
    }
    if (level === '4') { const k = 1 + Math.floor(Math.random() * (nbars - 3)), c = P.pick(['II7', 'III7', 'iv', 'bVII']); seq[k] = c; seq[k + 1] = { II7: 'V', III7: 'vi', iv: 'I', bVII: 'IV' }[c]; }
    const notes = [], segs = seq.map((r, i) => ({ bar: i, start: 0, len: 4, ref: r }));
    let prev = P.pick([0, 4, 7]);
    const scale = []; for (let s = -5; s <= 14; s++) if (MAJ.includes(T.mod(s))) scale.push(s);
    seq.forEach((r, i) => {
      const c = T.romanToChord(r, 'C'), tones = T.chordSemis(c.q).slice(0, 3).map(s => T.mod(c.rpc + s)), colour = /II7|III7|iv|bVII/.test(r) && r !== 'vi';
      const cts = []; for (let s = -5; s <= 14; s++) if (tones.includes(T.mod(s))) cts.push(s);
      if (i === nbars - 1) { notes.push({ bar: i, pos: 0, dur: 4, semi: Math.abs(prev - 12) < Math.abs(prev) ? 12 : 0 }); return; }
      let pos = 0, first = true;
      P.pick(RHY).forEach(dur => {
        const strong = pos === 0 || pos === 2 || dur >= 1.5; let s;
        if (colour && first) { const t = T.mod(c.rpc + (r === 'bVII' ? 0 : T.chordSemis(c.q)[1])); s = cts.filter(x => T.mod(x) === t).sort((a, b) => Math.abs(a - prev) - Math.abs(b - prev))[0]; }
        else if (strong || colour) { const cs = cts.filter(x => x !== prev || Math.random() < 0.25).sort((a, b) => Math.abs(a - prev) - Math.abs(b - prev)); s = cs[Math.random() < 0.6 ? 0 : Math.min(1, cs.length - 1)]; }
        else { const j = scale.indexOf(scale.reduce((a, b) => (Math.abs(b - prev) < Math.abs(a - prev) ? b : a))); const up = prev < 2 ? true : prev > 10 ? false : Math.random() < 0.5; s = scale[Math.max(0, Math.min(scale.length - 1, j + (up ? 1 : -1)))]; }
        notes.push({ bar: i, pos, dur, semi: s }); prev = s; pos += dur; first = false;
      });
    });
    return { name: null, beats: 4, bpm: 104, nbars, notes, segs, pick: 0, pool };
  }
  /* un accord « va » sous un passage si les notes appuyées de la mélodie lui appartiennent */
  function fit(q, seg, r) {
    const c = T.romanToChord(r, 'C'); if (!c) return 0;
    const tones = T.chordSemis(c.q).map(s => T.mod(c.rpc + s)); if (r === 'V') tones.push(5);
    const half = q.beats === 4 ? 2 : 99;
    const strong = q.notes.filter(n => n.bar === seg.bar && n.pos >= seg.start && n.pos < seg.start + seg.len && (n.pos === seg.start || n.pos === half || n.dur >= 1.5));
    if (!strong.length) return 1;
    return strong.filter(n => tones.includes(T.mod(n.semi))).length / strong.length;
  }

  P.earGames.harmoniser = function (host) {
    let src = P.S.hsrc || 'gen', level = P.S.hlvl || '1', nb = 4, tune = 'alea', keyMode = 'alea', q = null, guess = [], sel = 0, checked = false, player = null;
    const fb = h('p', { class: 'fb', 'aria-live': 'polite' }, 'Appuie sur « Nouvelle mélodie ».'), grid = h('div', { class: 'hbars' }), pal = h('div', { class: 'answers' }), keyInfo = h('p', { class: 'hint' });
    const tonicName = () => T.SIMPLE[q.pc];
    const chordOf = r => T.romanToChord(r, tonicName());
    const sound = r => { const c = chordOf(r); A.piano(T.lowIn(c.rpc, 38), 0, 1, 0.5); A.chord(T.closeVoicing(c, 60), 0, 1, 0.42, 0.01); };
    function play(chords) {
      if (!q) return; if (player && player.on) { player.stop(); return; }
      const spb = 60 / q.bpm, tonic = T.lowIn(q.pc, 55), ev = [];
      q.notes.forEach(n => ev.push([(q.pick + n.bar * q.beats + n.pos) * spb, t => A.piano(tonic + n.semi, t, n.dur * spb * 0.95, 0.8)]));
      q.segs.forEach((s, i) => {
        const r = chords ? chords[i] : null, at = (q.pick + s.bar * q.beats + s.start) * spb;
        ev.push([at, t => { A.at(t, () => grid.querySelectorAll('.hslot').forEach((e, j) => e.classList.toggle('playing', j === i))); if (r) { const c = chordOf(r); A.piano(T.lowIn(c.rpc, 36), t, s.len * spb * 0.95, 0.5); A.chord(T.closeVoicing(c, 55), t, s.len * spb * 0.95, 0.3, 0.01); } }]);
      });
      ev.sort((a, b) => a[0] - b[0]);
      player = new A.Player(ev, () => grid.querySelectorAll('.playing').forEach(e => e.classList.remove('playing')));
      player.start();
    }
    function draw() {
      grid.innerHTML = ''; pal.innerHTML = ''; if (!q) return;
      for (let b = 0; b < q.nbars; b++) {
        const bar = h('div', { class: 'hbar' }, h('small', {}, String(b + 1)));
        q.segs.forEach((s, i) => {
          if (s.bar !== b) return;
          let cls = '', sub = null;
          if (checked) { const ok = guess[i] && norm(guess[i]) === norm(s.ref), f = guess[i] ? fit(q, s, guess[i]) : 0; cls = ok ? 'ok' : f === 1 ? 'alt' : 'ko'; if (!ok) sub = h('small', {}, disp(s.ref)); }
          bar.append(h('button', { type: 'button', class: 'hslot ' + cls + (i === sel && !checked ? ' sel' : ''), style: `flex:${s.len}`, onclick: () => { if (checked) { if (guess[i]) sound(guess[i]); return; } sel = i; draw(); } }, guess[i] ? disp(guess[i]) : '?', sub));
        });
        grid.append(bar);
      }
      q.pool.forEach(r => pal.append(h('button', { type: 'button', class: 'ans', onclick: () => { sound(r); if (checked) return; guess[sel] = r; const nx = q.segs.findIndex((_, i) => i > sel && !guess[i]); sel = nx >= 0 ? nx : Math.min(sel + 1, q.segs.length - 1); draw(); } }, h('b', {}, disp(r)), h('span', {}, T.chordName(chordOf(r))))));
    }
    function ask() {
      if (player) player.stop();
      const tu = src === 'tune' ? (tune === 'alea' ? P.pick(TUNES) : TUNES.find(t => t.id === tune)) : null;
      q = tu ? fromTune(tu) : generate(level, nb);
      q.pc = keyMode === 'fixe' ? P.S.key : Math.floor(Math.random() * 12);
      guess = []; sel = 0; checked = false;
      keyInfo.textContent = (q.name ? '« ' + q.name + ' » en ' : 'Tonalité : ') + T.fmt(tonicName()) + ' majeur' + (q.beats === 3 ? ', à trois temps' : '') + (q.pick ? ', avec une levée' : '') + '.';
      fb.textContent = 'Écoute la mélodie, chante la basse que tu imagines dessous, puis pose un accord dans chaque case.'; fb.className = 'fb';
      draw(); play(null);
    }
    function check() {
      if (!q) return;
      if (guess.filter(Boolean).length < q.segs.length) { fb.textContent = 'Il reste des cases vides.'; fb.className = 'fb ko'; return; }
      checked = true; let ok = 0, alt = 0;
      q.segs.forEach((s, i) => { if (norm(guess[i]) === norm(s.ref)) ok++; else if (fit(q, s, guess[i]) === 1) alt++; });
      P.stat('harmoniser', q.name || 'Niveau ' + level, ok + alt === q.segs.length);
      const n = q.segs.length;
      fb.textContent = ok === n ? 'Exactement l\'harmonisation de référence.' : `${ok} sur ${n} comme la référence` + (alt ? `, ${alt} autre${alt > 1 ? 's' : ''} qui fonctionne${alt > 1 ? 'nt' : ''} aussi (en jaune : la mélodie appartient à ton accord)` : '') + (n - ok - alt ? `, ${n - ok - alt} qui frotte${n - ok - alt > 1 ? 'nt' : ''} (en rose, avec l'accord attendu)` : '') + '. Écoute les deux versions pour comparer.';
      fb.className = 'fb ' + (ok + alt === n ? 'ok' : 'ko'); draw();
    }
    const subHost = h('div', { class: 'row' });
    const drawSub = () => {
      subHost.innerHTML = '';
      if (src === 'gen') subHost.append(P.field('Accords en jeu', P.sel([['1', 'I, IV, V'], ['2', 'I, IV, V, vi'], ['3', 'Les six accords de la gamme'], ['4', 'Avec un accord hors gamme']], level, v => { level = v; P.S.hlvl = v; P.save(); })),
        P.field('Longueur', P.seg([[4, '4 mesures'], [8, '8 mesures']], nb, v => (nb = v))));
      else subHost.append(P.field('Air', P.sel([['alea', 'Au hasard'], ...TUNES.map(t => [t.id, t.n])], tune, v => (tune = v))));
      subHost.append(P.field('Tonalité', P.seg([['alea', 'Au hasard'], ['fixe', 'Celle du site']], keyMode, v => (keyMode = v))));
    };
    drawSub();
    host.append(P.row(P.seg([['gen', 'Mélodies inventées'], ['tune', 'Airs connus']], src, v => { src = v; P.S.hsrc = v; P.save(); drawSub(); })), subHost,
      P.row(P.btn('Nouvelle mélodie', ask, 'solid'), P.btn('Réécouter la mélodie', () => play(null))),
      keyInfo, fb, grid, pal,
      P.row(P.btn('Écouter avec mes accords', () => play(guess)), P.btn('Vérifier', check, 'solid'), P.btn('Écouter la solution', () => q && play(q.segs.map(s => s.ref)))),
      h('p', { class: 'hint' }, 'Touche une case, puis un accord : il sonne quand tu le choisis. Les noms sous les degrés sont ceux de la tonalité en cours, pour essayer sur ton piano.'),
      P.prose(`<h4>La table qui remplace les sites d'accords</h4>
<p>Chaque note de la gamme n'appartient qu'à deux ou trois accords. Repère la note sur laquelle la mélodie s'appuie (premier temps, note longue), et tu n'as plus que quelques candidats à essayer :</p>
<table class="htable"><tr><th>Note de la mélodie</th><th>Accords possibles</th></tr>
<tr><td>1</td><td>I, IV, vi</td></tr><tr><td>2</td><td>V, ii</td></tr><tr><td>3</td><td>I, vi, iii</td></tr><tr><td>4</td><td>IV, ii (ou V7)</td></tr><tr><td>5</td><td>I, V, iii</td></tr><tr><td>6</td><td>IV, vi, ii</td></tr><tr><td>7</td><td>V, iii</td></tr></table>
<p>Ensuite, départage à l'oreille : <b>le I repose, le IV s'éloigne, le V veut rentrer</b>. Un accord mineur (vi, ii, iii) est la version assombrie de son voisin majeur (vi pour I, ii pour IV, iii pour V ou I). Les accords changent presque toujours sur un temps fort, et la dernière note d'une chanson est sur le I. Une note étrangère à la gamme dans la mélodie signale un accord hors gamme : un ♯4 annonce II7, un ♯5 annonce III7, un ♭6 le iv mineur, un ♭7 le ♭VII.</p>`));
  };
  P.earTabs.splice(1, 0, ['harmoniser', 'Accords d\'une mélodie', "Une mélodie sans accompagnement, dans une tonalité tirée au sort : à toi de trouver les accords qui vont dessous, comme quand tu cherches ceux d'une chanson. Plusieurs réponses peuvent être bonnes ; le site te dit lesquelles fonctionnent."]);
})();
