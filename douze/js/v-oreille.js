/* Douze — oreille relative */
(function () {
  const P = window.P, T = P.T, A = P.A, h = P.h;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const DEGN = { '1': 'tonique', b2: '', '2': 'sus-tonique', b3: 'tierce mineure', '3': 'médiante', '4': 'sous-dominante', '#4': 'triton', '5': 'dominante', b6: '', '6': 'sus-dominante', b7: 'sous-tonique', '7': 'sensible' };
  const cadence = (pc, minor, t) => {
    const tonic = T.SIMPLE[pc];
    P.romChords(minor ? 'i iv V i' : 'I IV V I', tonic).forEach((c, i) => { A.piano(T.lowIn(c.rpc, 40), t + i * 0.55, 0.6, 0.5); A.chord(T.closeVoicing(c, 62), t + i * 0.55, i === 3 ? 0.9 : 0.5, 0.42); });
    return t + 2.75;
  };

  /* moteur de QCM */
  function mcq(host, cfg) {
    let q = null, tried = false; const score = [0, 0];
    const grid = h('div', { class: 'answers' }), fb = h('p', { class: 'fb', 'aria-live': 'polite' }, 'Appuie sur « Nouvelle question ».'), sc = h('span', { class: 'score' }), stats = h('div', { class: 'stats' });
    const opts = () => cfg.opts();
    const drawOpts = () => { grid.innerHTML = ''; opts().forEach(o => grid.append(h('button', { type: 'button', class: 'ans', 'data-k': o.k, onclick: () => answer(o.k) }, h('b', {}, o.l), o.s ? h('span', {}, o.s) : null))); };
    const drawStats = () => {
      const s = P.S.stats[cfg.id] || {}; stats.innerHTML = '';
      opts().forEach(o => { const e = s[o.k]; if (!e) return; const p = Math.round(100 * e[0] / e[1]); stats.append(h('div', { class: 'st' }, h('span', {}, o.l), h('i', {}, h('u', { style: `width:${p}%` })), h('em', {}, p + ' % sur ' + e[1]))); });
      sc.textContent = score[1] ? `Cette séance : ${score[0]} sur ${score[1]}` : '';
    };
    const ask = () => { q = cfg.make(); tried = false; fb.textContent = 'Écoute…'; fb.className = 'fb'; drawOpts(); if (cfg.onAsk) cfg.onAsk(q); q.play(); };
    const answer = k => {
      if (!q || q.done) return;
      const ok = k === q.ans, b = grid.querySelector(`[data-k="${CSS.escape(k)}"]`);
      if (!tried) { P.stat(cfg.id, q.ans, ok); score[1]++; if (ok) score[0]++; } tried = true;
      if (b) b.classList.add(ok ? 'ok' : 'ko');
      if (ok) { q.done = true; const o = opts().find(x => x.k === k); fb.textContent = 'Oui : ' + o.l + (o.s ? ', ' + o.s : '') + '.'; fb.className = 'fb ok'; const wait = q.after ? q.after() : 900; A.after(wait, ask); }
      else { fb.textContent = "Ce n'est pas ça. Réécoute, chante la note, puis réessaie."; fb.className = 'fb ko'; }
      drawStats();
    };
    drawOpts(); drawStats();
    host.append(cfg.settings || '', P.row(P.btn('Nouvelle question', ask, 'solid'), P.btn('Réécouter', () => q && q.play(true)), cfg.extra || '', P.btn('Voir la réponse', () => { if (q && !q.done) { tried || (P.stat(cfg.id, q.ans, false), score[1]++); tried = true; answer(q.ans); } }), sc),
      fb, grid, cfg.kb || '', h('h4', {}, 'Tes résultats'), h('p', { class: 'hint' }, "Ils s'accumulent d'une séance à l'autre : regarde quelles réponses te résistent."), stats);
    return { answer, get q() { return q; } };
  }

  const GAMES = {
    degres(host) {
      let set = '135', keyMode = 'fixe', lastPc = -1;
      const SETS = { '135': ['1', '3', '5'], '15': ['1', '2', '3', '4', '5'], '7': ['1', '2', '3', '4', '5', '6', '7'], '12': T.ROMDEG, min: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] };
      const kbHost = h('div'), kb = new P.Keyboard(kbHost, { from: 48, to: 84, onNote: m => { const q = g.q; if (!q || q.done) return; const d = SETS[set].find(x => T.parseDeg(x).semi === T.mod(m - q.pc)); if (d) g.answer(d); } });
      const g = mcq(host, {
        id: 'degres',
        opts: () => SETS[set].map(d => ({ k: d, l: T.fmtDeg(d), s: DEGN[d] })),
        settings: P.row(P.field('Notes à reconnaître', P.sel([['135', '1, 3, 5'], ['15', '1 à 5'], ['7', 'Toute la gamme majeure'], ['min', 'Gamme mineure'], ['12', 'Les douze notes']], set, v => { set = v; lastPc = -1; })),
          P.field('Tonalité', P.seg([['fixe', 'Celle du site'], ['alea', 'Change à chaque fois']], keyMode, v => { keyMode = v; lastPc = -1; }))),
        extra: P.btn('Rejouer la cadence', () => { const q = g.q; if (q) { lastPc = -1; q.play(); } }),
        kb: h('div', {}, h('p', { class: 'hint' }, 'Tu peux aussi répondre en jouant la note, à l\'écran ou sur ton piano branché.'), kbHost),
        onAsk: () => kb.clear(),
        make() {
          const pc = keyMode === 'fixe' ? P.S.key : rnd(0, 11), minor = set === 'min', d = P.pick(SETS[set]), semi = T.parseDeg(d).semi;
          const tonic = T.lowIn(pc, 55), m = tonic + semi + (Math.random() < 0.3 && tonic + semi + 12 <= 80 ? 12 : 0);
          return { pc, ans: d,
            play(again) { let t = A.now() + 0.05; if (pc !== lastPc && !again) { t = cadence(pc, minor, t); lastPc = pc; } A.piano(m, t, 1.4, 0.75); },
            after() {
              const sc = (minor ? T.scaleSemis('aeolian') : T.scaleSemis('major')).concat(12), s = T.mod(m - tonic), base = m - s;
              const path = s <= 5 ? sc.filter(x => x < s).reverse() : sc.filter(x => x > s);
              const t = A.now() + 0.25; [s, ...path].forEach((x, i) => A.piano(base + x, t + i * 0.3, 0.4, 0.6));
              kb.mark([{ m, c: 'a', t: T.fmtDeg(d) }, { m: base + (s <= 5 ? 0 : 12), c: 'c', t: '1' }]);
              return 600 + (path.length + 1) * 300 + 700;
            } };
        },
      });
    },
    intervalles(host) {
      const IV = [[1, '2de mineure', '1 demi-ton'], [2, '2de majeure', '1 ton'], [3, '3ce mineure', ''], [4, '3ce majeure', ''], [5, 'Quarte', ''], [6, 'Triton', ''], [7, 'Quinte', ''], [8, '6te mineure', ''], [9, '6te majeure', ''], [10, '7e mineure', ''], [11, '7e majeure', ''], [12, 'Octave', '']];
      let set = 'base', dir = 'asc';
      const SETS = { base: [2, 4, 5, 7, 12], tierces: [3, 4, 8, 9], tous: IV.map(x => x[0]) };
      mcq(host, {
        id: 'intervalles',
        opts: () => IV.filter(x => SETS[set].includes(x[0])).map(x => ({ k: String(x[0]), l: x[1], s: x[2] })),
        settings: P.row(P.field('Intervalles', P.sel([['base', 'Les piliers : 2de, 3ce, 4te, 5te, 8ve'], ['tierces', 'Tierces et sixtes'], ['tous', 'Les douze']], set, v => (set = v))),
          P.field('Sens', P.seg([['asc', 'Montant'], ['desc', 'Descendant'], ['harm', 'Ensemble'], ['mix', 'Mélange']], dir, v => (dir = v)))),
        make() {
          const iv = P.pick(SETS[set]), root = rnd(50, 66), d = dir === 'mix' ? P.pick(['asc', 'desc', 'harm']) : dir;
          return { ans: String(iv), play() { const t = A.now() + 0.05; if (d === 'harm') A.chord([root, root + iv], t, 1.6, 0.6); else { const [a, b] = d === 'asc' ? [root, root + iv] : [root + iv, root]; A.piano(a, t, 0.8, 0.7); A.piano(b, t + 0.7, 1.3, 0.7); } } };
        },
      });
    },
    accords(host) {
      const N = { '': 'Majeur', m: 'Mineur', dim: 'Diminué', aug: 'Augmenté', sus4: 'Sus 4', maj7: 'maj7', '7': '7', m7: 'm7', m7b5: 'm7♭5', dim7: 'dim7', mMaj7: 'm(maj7)', maj9: 'maj9', m9: 'm9', '13': '13', '7b9': '7♭9', '7#9': '7♯9', '69': '6/9', m6: 'm6', '7#11': '7♯11' };
      const SETS = { tri: ['', 'm', 'dim', 'aug', 'sus4'], sev: ['maj7', '7', 'm7', 'm7b5', 'dim7', 'mMaj7'], jazz: ['maj9', 'm9', '13', '7b9', '7#9', '69', 'm6', '7#11'] };
      let set = 'tri';
      mcq(host, {
        id: 'accords', opts: () => SETS[set].map(q => ({ k: q || 'maj', l: N[q] })),
        settings: P.row(P.field('Famille', P.seg([['tri', 'Trois sons'], ['sev', 'Septièmes'], ['jazz', 'Couleurs jazz']], set, v => (set = v)))),
        make() {
          const q = P.pick(SETS[set]), root = rnd(48, 59), ms = T.chordSemis(q).map(s => root + s);
          return { ans: q || 'maj', play() { const t = A.now() + 0.05; A.chord(ms, t, 1.5, 0.5); ms.forEach((m, i) => A.piano(m, t + 1.7 + i * 0.28, 0.6, 0.6)); } };
        },
      });
    },
    modes(host) {
      const SETS = { sept: ['lydian', 'major', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian'], maj: ['lydian', 'major', 'mixolydian'], min: ['dorian', 'aeolian', 'phrygian'], jazz: ['melMin', 'harmMin', 'altered', 'lydDom', 'wholeTone', 'hwDim', 'blues'] };
      let set = 'maj';
      mcq(host, {
        id: 'modes', opts: () => SETS[set].map(k => ({ k, l: T.SCALES[k].n.replace(/ \(.*/, ''), s: T.fmtDeg(T.SCALES[k].ch) })),
        settings: P.row(P.field('Modes', P.sel([['maj', 'Les trois majeurs'], ['min', 'Les trois mineurs'], ['sept', 'Les sept'], ['jazz', 'Gammes du jazz']], set, v => (set = v)))),
        make() {
          const k = P.pick(SETS[set]), root = rnd(52, 60), semis = [...T.scaleSemis(k), 12];
          return { ans: k, play() { const t = A.now() + 0.05; A.piano(root - 12, t, 4.5, 0.5); A.piano(root - 5, t, 4.5, 0.3); [...semis, ...semis.slice(0, -1).reverse()].forEach((s, i) => A.piano(root + s, t + 0.3 + i * 0.24, 0.34, 0.62)); } };
        },
      });
    },
    progressions(host) {
      const POOLS = { '1': ['I', 'IV', 'V', 'vi'], '2': ['I', 'IV', 'V', 'vi', 'ii', 'iii'], '3': ['I', 'IV', 'V', 'vi', 'ii', 'iii', 'bVII', 'iv', 'III7', 'bVI'], jazz: ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'VI7', 'II7', 'bII7'] };
      let lvl = '1', keyMode = 'fixe', q = null, guess = [];
      const slots = h('div', { class: 'slots' }), pal = h('div', { class: 'answers' }), fb = h('p', { class: 'fb', 'aria-live': 'polite' }, 'Appuie sur « Nouvelle suite ».');
      const disp = r => r.replace(/b/g, '♭');
      const play = (rs, pc) => { const t = A.now() + 0.05; P.romChords(rs.join(' '), T.SIMPLE[pc]).forEach((c, i) => { A.piano(T.lowIn(c.rpc, 38), t + i * 1.3, 1.25, 0.6); A.chord(T.closeVoicing(c, 62), t + i * 1.3, 1.25, 0.45, 0.01); }); };
      const draw = res => {
        slots.innerHTML = '';
        for (let i = 0; i < 4; i++) slots.append(h('button', { type: 'button', class: 'slot ' + (res ? (guess[i] === q.seq[i] ? 'ok' : 'ko') : ''), onclick: () => { if (q && !q.done) { guess.length = i; draw(); } } }, guess[i] ? disp(guess[i]) : '?', res && guess[i] !== q.seq[i] ? h('small', {}, disp(q.seq[i])) : null));
        pal.innerHTML = ''; POOLS[lvl].forEach(r => pal.append(h('button', { type: 'button', class: 'ans', onclick: () => { if (q && !q.done && guess.length < 4) { guess.push(r); draw(); if (q) { const c = P.romChords(r, T.SIMPLE[q.pc])[0]; A.piano(T.lowIn(c.rpc, 38), 0, 0.9, 0.5); A.chord(T.closeVoicing(c, 62), 0, 0.9, 0.4); } } } }, h('b', {}, disp(r)))));
      };
      const ask = () => {
        const pool = POOLS[lvl], seq = [Math.random() < 0.6 ? pool[0] : P.pick(pool)];
        while (seq.length < 4) { const r = P.pick(pool); if (r !== seq[seq.length - 1]) seq.push(r); }
        q = { seq, pc: keyMode === 'fixe' ? P.S.key : rnd(0, 11) }; guess = []; fb.textContent = 'Écoute la basse : c\'est elle qui donne les degrés.'; fb.className = 'fb'; draw(); play(seq, q.pc);
      };
      const check = () => {
        if (!q || guess.length < 4) { fb.textContent = 'Remplis les quatre cases.'; return; }
        const n = guess.filter((g, i) => g === q.seq[i]).length; q.done = true;
        q.seq.forEach((r, i) => P.stat('progressions', r, guess[i] === r));
        fb.textContent = (n === 4 ? 'Tout juste. ' : n + ' sur 4. ') + 'En ' + T.fmt(T.SIMPLE[q.pc]) + ' : ' + P.romChords(q.seq.join(' '), T.SIMPLE[q.pc]).map(T.chordName).join(' – ') + '.'; fb.className = 'fb ' + (n === 4 ? 'ok' : 'ko'); draw(true);
      };
      draw();
      host.append(P.row(P.field('Niveau', P.sel([['1', 'I, IV, V, vi'], ['2', 'Les six accords de la gamme'], ['3', 'Avec emprunts et dominantes secondaires'], ['jazz', 'Accords de septième, couleurs jazz']], lvl, v => { lvl = v; q = null; guess = []; draw(); })),
        P.field('Tonalité', P.seg([['fixe', 'Celle du site'], ['alea', 'Au hasard']], keyMode, v => (keyMode = v)))),
        P.row(P.btn('Nouvelle suite', ask, 'solid'), P.btn('Réécouter', () => q && play(q.seq, q.pc)), P.btn('Écouter ma réponse', () => q && guess.length && play(guess, q.pc)), P.btn('Vérifier', check)),
        fb, slots, h('p', { class: 'hint' }, 'Clique les accords dans l\'ordre (chacun se fait entendre). Clique une case pour revenir en arrière.'), pal);
    },
    melodie(host) {
      let len = 4, scale = 'pentMaj', keyMode = 'fixe', first = true, q = null, pos = 0, errs = 0;
      const fb = h('p', { class: 'fb', 'aria-live': 'polite' }, 'Appuie sur « Nouvelle mélodie », écoute, puis rejoue-la sur le clavier.'), dots = h('div', { class: 'dots' });
      const kbHost = h('div'), kb = new P.Keyboard(kbHost, { from: 48, to: 88, onNote: m => {
        if (!q || q.done) return;
        if (m === q.notes[pos]) { pos++; drawDots(); if (pos === q.notes.length) { q.done = true; P.stat('melodie', String(len) + ' notes', errs === 0); fb.textContent = errs ? `Trouvée, avec ${errs} hésitation${errs > 1 ? 's' : ''}.` : 'Du premier coup.'; fb.className = 'fb ok'; A.after(1300, ask); } }
        else { errs++; kb.flash(m, 'bad', 350); fb.textContent = m > q.notes[pos] ? 'Trop haut.' : 'Trop bas.'; fb.className = 'fb ko'; }
      } });
      const drawDots = () => { dots.innerHTML = ''; q.notes.forEach((_, i) => dots.append(h('i', { class: i < pos ? 'on' : '' }))); };
      const play = () => { const t = A.now() + 0.05; A.chord([q.tonic - 12, q.tonic, q.tonic + 7], t, 0.7, 0.35); q.notes.forEach((m, i) => A.piano(m, t + 1 + i * 0.5, 0.55, 0.7)); };
      const ask = () => {
        const pc = keyMode === 'fixe' ? P.S.key : rnd(0, 11), tonic = T.lowIn(pc, 60), semis = T.scaleSemis(scale), pool = [];
        for (let m = tonic - 5; m <= tonic + 16; m++) if (semis.includes(T.mod(m - tonic))) pool.push(m);
        let i = pool.indexOf(tonic + P.pick(semis.filter(s => [0, 4, 3, 7].includes(s)))); const notes = [pool[i]];
        while (notes.length < len) { const j = i + P.pick([-2, -1, -1, 1, 1, 2]); if (j < 0 || j >= pool.length) continue; i = j; notes.push(pool[i]); }
        q = { notes, tonic, pc }; pos = 0; errs = 0; fb.textContent = 'Écoute, chante-la intérieurement, puis joue.'; fb.className = 'fb'; drawDots();
        kb.mark(first ? [{ m: notes[0], c: 'c', t: 'départ' }] : []); play();
      };
      host.append(P.row(P.field('Longueur', P.sel([3, 4, 5, 6, 8].map(n => [n, n + ' notes']), len, v => (len = +v))),
        P.field('Gamme', P.sel([['pentMaj', 'Pentatonique majeure'], ['major', 'Majeure'], ['aeolian', 'Mineure'], ['dorian', 'Dorien'], ['blues', 'Blues']], scale, v => (scale = v))),
        P.field('Tonalité', P.seg([['fixe', 'Celle du site'], ['alea', 'Au hasard']], keyMode, v => (keyMode = v))),
        P.field('Première note', P.seg([[true, 'Montrée'], [false, 'Cachée']], first, v => (first = v)))),
        P.row(P.btn('Nouvelle mélodie', ask, 'solid'), P.btn('Réécouter', () => q && play())), fb, dots, kbHost);
    },
  };
  const TABS = [['degres', 'Degrés', "Une cadence installe la tonalité, puis une note sonne. Laquelle est-ce : 1, 3, 5 ? C'est l'exercice central : il entraîne précisément ce qui te sert pour retrouver une mélodie."],
    ['progressions', 'Suites d\'accords', "Quatre accords s'enchaînent. Retrouve leurs degrés. À terme, c'est ce qui te dispensera d'aller chercher les grilles sur internet."],
    ['melodie', 'Rejouer une mélodie', "Le site joue quelques notes, tu les rejoues. Ton point fort : monte la longueur et cache la première note."],
    ['accords', 'Couleur d\'un accord', "Majeur, mineur, septième, demi-diminué… reconnaître la qualité d'un accord isolé."],
    ['intervalles', 'Intervalles', "La distance entre deux notes, hors de toute tonalité. Utile en complément, surtout pour les sauts dans une mélodie."],
    ['modes', 'Modes', "Une gamme monte et descend sur un bourdon : quel mode ? Cherche la note caractéristique."]];

  P.views.oreille = {
    key: 'Si', t: 'Oreille relative', d: "Reconnaître les degrés, les accords et les suites d'accords, sans jamais nommer une note absolue.",
    lead: "L'oreille relative n'est pas un don : c'est la mémoire du caractère de chaque degré par rapport à une tonique. Beaucoup de pédagogues le constatent : on progresse plus vite en reconnaissant des degrés dans une tonalité qu'en devinant des intervalles isolés.",
    render(el) {
      let tab = P.S.ear && GAMES[P.S.ear] ? P.S.ear : 'degres';
      const host = h('div'), intro = h('p', { class: 'tab-intro' });
      const show = () => { A.stopAll(); P.kbs.clear(); host.innerHTML = ''; intro.textContent = TABS.find(t => t[0] === tab)[2]; GAMES[tab](host); };
      el.append(P.tool('', P.seg(TABS.map(t => [t[0], t[1]]), tab, v => { tab = v; P.S.ear = v; P.save(); show(); }), intro, host));
      show();
      el.append(P.prose(`
<h2>Pourquoi les degrés plutôt que les intervalles</h2>
<p>Do–Mi et Sol–Si sont la même tierce majeure, mais dans une chanson en Do ils ne produisent pas du tout la même sensation : le premier est « maison–couleur », le second « tension–tension ». Ce que l'oreille retient d'une mélodie, c'est cette fonction. Un entraînement par degrés commence donc toujours par installer la tonalité (une cadence), puis fait entendre une note à situer.</p>
<h2>La méthode en quatre temps</h2>
<ol>
<li><b>Chante la tonique</b> après la cadence, avant même d'écouter la note. Si tu perds la tonique, tout le reste devine.</li>
<li><b>Chante la note, puis redescends (ou remonte) jusqu'à la tonique</b> en comptant les marches. Le site joue ce chemin quand tu trouves la bonne réponse. Au bout de quelques semaines, tu n'auras plus besoin de compter : le 3 « sonne 3 ».</li>
<li><b>Commence par 1, 3, 5</b> jusqu'à 90 % de réussite, puis 1 à 5, puis la gamme entière, puis les douze notes. Monter trop vite ralentit tout.</li>
<li><b>Dix minutes par jour</b>, pas une heure par semaine. Et change de tonalité : l'oreille relative, c'est justement ce qui ne dépend pas de la tonalité.</li>
</ol>
<h2>Sortir du site</h2>
<p><b>La basse d'abord.</b> Pour trouver les accords d'une chanson, chante la note la plus grave à chaque changement, puis demande-toi quel degré c'est. La plupart du temps la basse joue la fondamentale ; le reste se déduit (majeur sur 1, 4, 5, mineur sur 2, 3, 6).</p>
<p><b>Des repères.</b> Associe chaque degré à une chanson que tu connais par cœur : le saut 1→5 qui ouvre un thème célèbre, le 5→1 d'un « ta-daa » final, le 7→1 d'une fin de phrase… Tes propres repères valent mieux que ceux d'une liste.</p>
<p><b>Chante en chiffres</b> les mélodies que tu joues déjà. C'est la passerelle entre ton oreille (déjà bonne) et le système des degrés (le vocabulaire qui lui manquait).</p>`));
    },
  };
})();
