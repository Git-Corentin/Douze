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
    let src = P.S.hsrc || 'gen', level = P.S.hlvl || '1', nb = 4, tune = 'alea', keyMode = 'alea', q = null, guess = [], sel = 0, cur = -1, checked = false, player = null, loopBar = false;
    const fb = h('p', { class: 'fb', 'aria-live': 'polite' }, 'Appuie sur « Nouvelle mélodie ».'), grid = h('div', { class: 'hbars' }), pal = h('div', { class: 'answers' }), keyInfo = h('p', { class: 'hint' });
    const tonicName = () => T.SIMPLE[q.pc];
    const chordOf = r => T.romanToChord(r, tonicName());
    const sound = (r, soft) => { const c = chordOf(r); A.piano(T.lowIn(c.rpc, 38), 0, 1, soft ? 0.4 : 0.5); A.chord(T.closeVoicing(c, soft ? 55 : 60), 0, 1, soft ? 0.3 : 0.42, 0.01); };
    const hilite = () => grid.querySelectorAll('.hslot').forEach((e, j) => { e.classList.toggle('playing', j === cur); e.classList.toggle('sel', j === sel && !checked); });
    const segT = s => q.pick + s.bar * q.beats + s.start;
    /* joue à partir de la case `from` ; mode : 'mine' (mes accords, lus en direct) ou 'sol' (référence) */
    function play(from, mode) {
      if (!q) return; if (player) player.stop();
      const spb = 60 / q.bpm;
      const bar = q.segs[from].bar, first = loopBar ? q.segs.findIndex(s => s.bar === bar) : from;
      const t0 = first === 0 && !loopBar ? 0 : segT(q.segs[first]), tEnd = loopBar ? q.pick + (bar + 1) * q.beats : q.pick + q.nbars * q.beats;
      const ev = [];
      q.notes.forEach(n => { const at = q.pick + n.bar * q.beats + n.pos; if (at >= t0 - 1e-6 && at < tEnd - 1e-6) ev.push([(at - t0) * spb, t => A.piano(T.lowIn(q.pc, 55) + n.semi, t, n.dur * spb * 0.95, 0.8)]); });
      q.segs.forEach((s, i) => {
        const at = segT(s); if (at < t0 - 1e-6 || at >= tEnd - 1e-6) return;
        ev.push([(at - t0) * spb - 0.001, t => {
          A.at(t, () => { cur = i; sel = i; hilite(); });
          const r = mode === 'sol' ? s.ref : guess[i];
          if (r) { const c = chordOf(r); A.piano(T.lowIn(c.rpc, 36), t, s.len * spb * 0.95, 0.5); A.chord(T.closeVoicing(c, 55), t, s.len * spb * 0.95, 0.3, 0.01); }
        }]);
      });
      ev.push([(tEnd - t0) * spb, () => {}]);
      ev.sort((a, b) => a[0] - b[0]); if (ev[0][0] < 0) ev[0][0] = 0;
      const pl = (player = new A.Player(ev, () => { cur = -1; hilite(); stopB.hidden = true; if (pl.ended && loopBar && player === pl) setTimeout(() => { if (player === pl && q) play(first, mode); }, 0); }));
      pl.tail = loopBar ? 0 : 0.6; stopB.hidden = false; pl.start();
    }
    function draw() {
      grid.innerHTML = ''; pal.innerHTML = ''; if (!q) return;
      for (let b = 0; b < q.nbars; b++) {
        const bar = h('div', { class: 'hbar' }, h('small', {}, String(b + 1)));
        q.segs.forEach((s, i) => {
          if (s.bar !== b) return;
          let cls = '', sub = null;
          if (checked) { const ok = guess[i] && norm(guess[i]) === norm(s.ref), f = guess[i] ? fit(q, s, guess[i]) : 0; cls = ok ? 'ok' : f === 1 ? 'alt' : 'ko'; if (!ok) sub = h('small', {}, disp(s.ref)); }
          bar.append(h('button', { type: 'button', class: 'hslot ' + cls, style: `flex:${s.len}`, 'aria-label': 'Mesure ' + (b + 1) + ', rejouer à partir d\'ici', onclick: () => { sel = i; play(i, 'mine'); } }, guess[i] ? disp(guess[i]) : '?', sub));
        });
        grid.append(bar);
      }
      q.pool.forEach(r => pal.append(h('button', { type: 'button', class: 'ans', onclick: () => {
        const live = cur >= 0; sound(r, live); if (checked) return;
        guess[live ? cur : sel] = r;
        if (!live) { const nx = q.segs.findIndex((_, i) => i > sel && !guess[i]); if (nx >= 0) sel = nx; }
        draw();
      } }, h('b', {}, disp(r)), h('span', {}, T.chordName(chordOf(r))))));
      hilite();
    }
    const setInfo = () => { keyInfo.textContent = (q.name ? '« ' + q.name + ' » en ' : 'Tonalité : ') + T.fmt(tonicName()) + ' majeur' + (q.beats === 3 ? ', à trois temps' : '') + (q.pick ? ', avec une levée' : '') + '.'; };
    function ask() {
      const tu = src === 'tune' ? (tune === 'alea' ? P.pick(TUNES) : TUNES.find(t => t.id === tune)) : null;
      q = tu ? fromTune(tu) : generate(level, nb);
      q.pc = keyMode === 'fixe' ? P.S.key : Math.floor(Math.random() * 12);
      guess = []; sel = 0; cur = -1; checked = false; setInfo();
      fb.textContent = 'Pendant que la mélodie joue, touche un accord : il se pose sur la case en cours. Touche une case pour rejouer à partir de là.'; fb.className = 'fb';
      draw(); const lb = loopBar; loopBar = false; play(0, 'mine'); loopBar = lb;
    }
    function check() {
      if (!q) return;
      if (guess.filter(Boolean).length < q.segs.length) { fb.textContent = 'Il reste des cases vides.'; fb.className = 'fb ko'; return; }
      if (player) player.stop();
      checked = true; let ok = 0, alt = 0;
      q.segs.forEach((s, i) => { if (norm(guess[i]) === norm(s.ref)) ok++; else if (fit(q, s, guess[i]) === 1) alt++; });
      P.stat('harmoniser', q.name || 'Niveau ' + level, ok + alt === q.segs.length);
      const n = q.segs.length;
      fb.textContent = ok === n ? 'Exactement l\'harmonisation de référence.' : `${ok} sur ${n} comme la référence` + (alt ? `, ${alt} autre${alt > 1 ? 's' : ''} qui fonctionne${alt > 1 ? 'nt' : ''} aussi (en jaune : la mélodie appartient à ton accord)` : '') + (n - ok - alt ? `, ${n - ok - alt} qui frotte${n - ok - alt > 1 ? 'nt' : ''} (en rose, avec l'accord attendu)` : '') + '. Écoute les deux versions pour comparer.';
      fb.className = 'fb ' + (ok + alt === n ? 'ok' : 'ko'); draw();
    }
    const stopB = P.btn('Arrêter', () => { const pl = player; player = null; if (pl) pl.stop(); player = pl; }, 'on'); stopB.hidden = true;
    P.onKey = () => { if (q && keyMode === 'fixe') { q.pc = P.S.key; setInfo(); draw(); } };
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
      P.row(P.btn('Nouvelle mélodie', ask, 'solid'), P.btn('Écouter du début', () => { if (!q) return; const lb = loopBar; loopBar = false; play(0, 'mine'); loopBar = lb; }), stopB),
      keyInfo, fb, grid,
      P.row(P.field('Quand je touche une case', P.seg([[false, 'Rejouer jusqu\'à la fin'], [true, 'Boucler sur la mesure']], loopBar, v => { loopBar = v; if (!v && player && player.on) { const pl = player; player = null; pl.stop(); player = pl; } }))),
      pal,
      P.row(P.btn('Vérifier', check, 'solid'), P.btn('Écouter la solution', () => { if (!q) return; const lb = loopBar; loopBar = false; play(0, 'sol'); loopBar = lb; })),
      P.prose(`<h4>La table qui remplace les sites d'accords</h4>
<p>Chaque note de la gamme n'appartient qu'à deux ou trois accords. Repère la note sur laquelle la mélodie s'appuie (premier temps, note longue), et tu n'as plus que quelques candidats à essayer :</p>
<table class="htable"><tr><th>Note de la mélodie</th><th>Accords possibles</th></tr>
<tr><td>1</td><td>I, IV, vi</td></tr><tr><td>2</td><td>V, ii</td></tr><tr><td>3</td><td>I, vi, iii</td></tr><tr><td>4</td><td>IV, ii (ou V7)</td></tr><tr><td>5</td><td>I, V, iii</td></tr><tr><td>6</td><td>IV, vi, ii</td></tr><tr><td>7</td><td>V, iii</td></tr></table>
<p>Ensuite, départage à l'oreille : <b>le I repose, le IV s'éloigne, le V veut rentrer</b>. Un accord mineur (vi, ii, iii) est la version assombrie de son voisin majeur (vi pour I, ii pour IV, iii pour V ou I). Les accords changent presque toujours sur un temps fort, et la dernière note d'une chanson est sur le I. Une note étrangère à la gamme dans la mélodie signale un accord hors gamme : un ♯4 annonce II7, un ♯5 annonce III7, un ♭6 le iv mineur, un ♭7 le ♭VII.</p>`));
  };

  /* ============ oreille absolue ============ */
  P.earGames.absolue = function (host) {
    let what = 'note', set = '3', scr = true;
    const NS = { '3': [0, 5, 7], w: [0, 2, 4, 5, 7, 9, 11], all: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
    const kbWrap = h('div', {}, h('p', { class: 'hint' }, 'Tu peux répondre en jouant la note (à l\'écran, en MIDI ou au micro, à n\'importe quelle octave). Attention : chaque touche jouée compte comme une réponse.'));
    const kb = new P.Keyboard(kbWrap, { from: 48, to: 84, mob: [48, 72], onNote: m => { const q = g.q; if (what !== 'note' || !q || q.done) return; g.answer('n' + (m % 12)); } });
    const g = P.mcq(host, {
      id: 'absolue',
      opts: () => (what === 'note' ? NS[set].map(pc => ({ k: 'n' + pc, l: T.fmt(T.SIMPLE[pc]) }))
        : [...NS[set].map(pc => ({ k: 'M' + pc, l: T.fmt(T.SIMPLE[pc], true), s: 'majeur' })), ...NS[set].map(pc => ({ k: 'm' + pc, l: T.fmt(T.SIMPLE[pc], true) + 'm', s: 'mineur' }))]),
      settings: P.row(P.field('À reconnaître', P.seg([['note', 'Une note'], ['chord', 'Un accord']], what, v => { what = v; kbWrap.hidden = v !== 'note'; })),
        P.field('Parmi', P.sel([['3', 'Trois repères : Do, Fa, Sol'], ['w', 'Les sept touches blanches'], ['all', 'Les douze']], set, v => (set = v))),
        P.field('Avant chaque question', P.seg([[true, 'Brouiller l\'oreille'], [false, 'Silence']], scr, v => (scr = v)))),
      kb: kbWrap,
      onAsk: () => kb.clear(),
      make() {
        const pc = P.pick(NS[set]), minor = Math.random() < 0.5, base = 48 + pc + 12 * (what === 'note' ? P.pick([0, 1, 2]) : 0);
        const ms = what === 'note' ? [base] : [base - 12, ...T.chordSemis(minor ? 'm' : '').map(s => base + s)];
        return { ans: what === 'note' ? 'n' + pc : (minor ? 'm' : 'M') + pc,
          play(again) {
            let t = A.now() + 0.05;
            /* quelques notes sans rapport effacent le souvenir de la question précédente : sans cela on répond par comparaison */
            if (scr && !again) { for (let i = 0; i < 7; i++) A.piano(40 + Math.floor(Math.random() * 44), t + i * 0.085, 0.09, 0.35); t += 1.3; }
            A.chord(ms, t, 1.8, what === 'note' ? 0.75 : 0.5);
          },
          after() { if (what === 'note') kb.mark([{ m: 48 + pc, c: 'c', t: T.fmt(T.SIMPLE[pc]) }]); return 1100; } };
      },
    });
  };
  P.earTabs.push(['absolue', 'Oreille absolue', "Aucune cadence, aucun repère : une note (ou un accord) sonne, tu donnes son nom ou tu la joues. Soyons clairs : l'oreille absolue complète s'acquiert rarement à l'âge adulte, mais la mémoire des hauteurs se muscle. Commence par trois repères, et choisis-toi une note d'ancrage : le premier son d'une chanson que tu connais par cœur, que tu chantes chaque jour avant de vérifier au piano."]);

  P.earTabs.splice(1, 0, ['harmoniser', 'Accords d\'une mélodie', "Une mélodie sans accompagnement, dans une tonalité tirée au sort : à toi de trouver les accords qui vont dessous, comme quand tu cherches ceux d'une chanson. Plusieurs réponses peuvent être bonnes ; le site te dit lesquelles fonctionnent."]);
})();
