/* Douze — arpèges et main gauche */
(function () {
  const P = window.P, T = P.T, A = P.A, h = P.h;
  const PATS = [
    { id: 'p158', hand: 'L', n: 'Fondamentale, quinte, octave', s: ['1', '5', '8', '5'], f: '5 – 2 – 1 – 2', d: "Le socle. La main garde une forme fixe : c'est elle qu'il faut savoir poser sans regarder sur les douze fondamentales." },
    { id: 'p1510', hand: 'L', n: 'La dixième', s: ['1', '5', '10', '5'], f: '5 – 2 – 1 – 2', d: "On remplace l'octave par la tierce au-dessus. Le son « ballade » instantané : la tierce chante dans le médium, loin de la basse." },
    { id: 'pwave', hand: 'L', n: 'La vague 1-5-8-9-10', s: ['1', '5', '8', '9', '10', '9', '8', '5'], f: '5 – 2 – 1 – 2 – 1 … (le 2 passe par-dessus le pouce)', d: "L'accompagnement des ballades pop. Le pouce pivote sur l'octave pendant que l'index va chercher la neuvième et la dixième." },
    { id: 'proll', hand: 'L', n: 'Grand arpège ouvert', s: ['1', '5', '8', '10', '12', '10', '8', '5'], f: '5 – 2 – 1 – 3 – 2 – 3 – 1 – 2', d: "Deux positions de main reliées par le pouce. À la pédale, c'est tout le piano qui résonne." },
    { id: 'palb', hand: 'L', n: 'Basse d\'Alberti', s: ['1', '5', '3', '5'], f: '5 – 1 – 3 – 1', d: "Position serrée, sans déplacement. Classique, mais très utile dans le médium pour laisser la place à la mélodie." },
    { id: 'p68', hand: 'L', n: 'Ternaire (6/8, valse lente)', s: ['1', '5', '8', '10', '8', '5'], f: '5 – 2 – 1 – 2 – 1 – 2', d: "Six croches par mesure. Pour toutes les chansons qui se balancent à trois." },
    { id: 'pstride', hand: 'L', n: 'Basse, accord', s: ['1', null, ['5', '8', '10'], null, '5', null, ['5', '8', '10'], null], f: '5, puis 3-2-1 plaqués', d: "La pompe : basse sur les temps 1 et 3, accord sur 2 et 4. L'ancêtre du stride. Regarde l'accord, pas la basse." },
    { id: 'p7', hand: 'L', n: 'Arpège de septième 1-5-7-10', s: ['1', '5', '7', '10', '7', '5'], f: '5 – 2 – 1 – 2 – 1 – 2', d: "Fondamentale, quinte, septième, dixième : la version jazz de la vague. Sublime sur les accords maj7 et m7." },
    { id: 'r2oct', hand: 'R', n: 'Arpège sur deux octaves', s: ['1', '3', '5', '8', '10', '12', '15', '12', '10', '8', '5', '3'], f: 'Voir les règles de doigté plus bas', d: "L'arpège « de concours ». Le passage du pouce est tout le problème : il doit atterrir sur une touche blanche." },
    { id: 'rinv', hand: 'R', n: 'Renversements enchaînés', s: ['1', '3', '5', '8', '3', '5', '8', '10', '5', '8', '10', '12', '8', '10', '12', '15'], f: '1-2-3-5 à chaque position', d: "Les trois renversements à la suite. C'est eux qui te permettent de trouver l'accord sous la mélodie sans sauter." },
    { id: 'r1235', hand: 'R', n: 'Cellule 1-2-3-5', s: ['1', '2', '3', '5', '8', '5', '3', '2'], f: '1 – 2 – 3 – 5', d: "Quatre notes, une position de main. La brique d'improvisation la plus rentable : jouable sur n'importe quel accord, immédiatement mélodique." },
    { id: 'r1357', hand: 'R', n: 'Arpège de septième', s: ['1', '3', '5', '7', '8', '7', '5', '3'], f: '1 – 2 – 3 – 4 – 5', d: "Les quatre sons de l'accord. À savoir dans les quatre qualités principales et les douze tonalités." },
    { id: 'r3579', hand: 'R', n: 'Depuis la tierce : 3-5-7-9', s: ['3', '5', '7', '9', '7', '5', '3', '1'], f: '1 – 2 – 3 – 5', d: "Le même arpège commencé une tierce plus haut : il contient la neuvième et sonne tout de suite jazz. Sur Cmaj7, c'est un accord de Mi mineur 7." },
  ];
  function tokSemi(t, c) {
    const f = T.chordDegs(c.q), get = n => f.find(d => d.n === n);
    const third = (get(3) || get(4) || get(2) || { semi: 7 }).semi, fifth = (get(5) || { semi: 7 }).semi;
    const sev = get(7) ? get(7).semi : get(6) ? 9 : 12, nine = (f.find(d => d.n === 9) || { semi: 14 }).semi;
    return { '1': 0, '2': nine - 12, '3': third, '5': fifth, '6': 9, '7': sev, '8': 12, '9': nine, '10': 12 + third, '12': 12 + fifth, '15': 24 }[t];
  }
  const QUALS = [['', 'majeur'], ['m', 'mineur'], ['maj7', 'maj7'], ['m7', 'm7'], ['7', '7 (dominante)'], ['m7b5', 'm7♭5'], ['dim', 'diminué'], ['sus4', 'sus4']];
  const SRC_PROGS = ['I V vi IV', 'vi IV I V', 'I vi IV V', 'ii7 V7 Imaj7 Imaj7', 'Imaj7 vi7 ii7 V7', 'I V vi iii IV I IV V'];
  const isB = pc => [1, 3, 6, 8, 10].includes(pc);

  P.views.arpeges = {
    key: 'Fa', t: 'Arpèges et renversements', d: "Les formules d'accompagnement et toutes les positions d'un accord, dans les douze tonalités.",
    lead: "Si tes arpèges coulent sur les touches blanches et accrochent ailleurs, ce n'est pas un problème de doigts : c'est que ta main ne connaît que deux ou trois formes d'accord sur six. On les apprend par familles, pas dans l'ordre chromatique.",
    render(el) {
      let kpc = P.S.key, tonic = P.tonic();
      let src = 'chord', rpc = kpc, q = '', pat = PATS[2], bpm = 80, order = 'quartes', reps = 2, click = false, prog = SRC_PROGS[0], lab = P.S.lab;
      const kbHost = h('div'), kb = new P.Keyboard(kbHost, { from: 36, to: 96, minKey: 18 });
      const now = h('div', { class: 'now' });
      const famHost = h('div', { class: 'fams' });
      const families = () => {
        const sem = T.chordSemis(q).slice(0, 3), g = {};
        for (let p = 0; p < 12; p++) { const k = sem.map(s => (isB((p + s) % 12) ? 'N' : 'B')).join(''); (g[k] = g[k] || []).push(p); }
        return Object.entries(g).sort((a, b) => a[0].split('N').length - b[0].split('N').length);
      };
      const seq = () => {
        if (src === 'chord') return [T.mk(T.SIMPLE[rpc], q)];
        if (src === 'prog') return P.romChords(prog, tonic);
        const pcs = order === 'quartes' ? P.FOURTHS.map(x => (x + kpc) % 12) : order === 'chroma' ? [...Array(12)].map((_, i) => (kpc + i) % 12)
          : order === 'formes' ? families().flatMap(f => f[1]) : P.FOURTHS.slice().sort(() => Math.random() - 0.5);
        return pcs.map(p => T.mk(T.SIMPLE[p], q));
      };
      let chords = seq();
      const notesOf = (c, tok) => {
        const base = T.lowIn(c.rpc, pat.hand === 'L' ? 36 : 53);
        return (Array.isArray(tok) ? tok : [tok]).map(t => base + tokSemi(t, c));
      };
      const showChord = (c, nxt) => {
        const all = [...new Set(pat.s.filter(Boolean).flatMap(t => notesOf(c, t)))];
        kb.mark(all.map(m => { const semi = T.mod(m - c.rpc), d = T.chordDegs(c.q).find(x => x.semi % 12 === semi); return { m, c: semi === 0 ? 'c' : pat.hand === 'L' ? 'a' : 'b', t: lab === 'note' ? T.fmt(d ? T.spell(c.root, d) : T.SIMPLE[m % 12]) : d ? T.fmtDeg(d.t) : T.DEGNAMES[semi] }; }));
        now.innerHTML = ''; now.append(h('strong', {}, T.chordName(c)), h('span', {}, nxt && nxt !== c ? 'ensuite ' + T.chordName(nxt) : ''));
      };
      const loop = new A.Loop({
        get bpm() { return bpm; }, swing: 0, onStop: () => { kb.live([]); },
        onStep(s, t, d) {
          const L = pat.s.length, rep = Math.floor(s / L), i = s % L, ci = Math.floor(rep / reps) % chords.length, c = chords[ci];
          if (i === 0 && rep % reps === 0) A.at(t, () => showChord(c, chords[(ci + 1) % chords.length]));
          if (click && i % 2 === 0) A.drum(i === 0 ? 'clickHi' : 'click', t, 0.5);
          const tok = pat.s[i]; if (tok == null) return;
          const ms = notesOf(c, tok);
          ms.forEach(m => A.piano(m, t, d * (pat.hand === 'L' ? 2.4 : 1.1), i === 0 ? 0.72 : 0.56));
          A.at(t, () => kb.live(ms));
        },
      });
      const refresh = () => { chords = seq(); showChord(chords[0], chords[1]); patInfo(); drawFams(); };
      const patText = h('div', { class: 'pat-info' });
      const patInfo = () => { patText.innerHTML = ''; patText.append(h('p', {}, pat.d), h('p', { class: 'hint' }, (pat.hand === 'L' ? 'Main gauche. ' : 'Main droite. ') + 'Formule : ' + pat.s.map(x => (x == null ? '·' : Array.isArray(x) ? '[' + x.join(' ') + ']' : x)).join(' ') + '. Doigté : ' + pat.f + '.')); };
      const drawFams = () => {
        famHost.innerHTML = '';
        families().forEach(([k, pcs]) => famHost.append(h('div', { class: 'fam' },
          h('span', { class: 'shape' }, k.split('').map(x => h('i', { class: x === 'N' ? 'n' : '' }))),
          pcs.map(p => h('button', { type: 'button', class: p === rpc && src === 'chord' ? 'on' : '', onclick: () => { rpc = p; src = 'chord'; srcSeg(); refresh(); } }, T.chordName(T.mk(T.SIMPLE[p], q)))))));
      };
      const srcHost = h('span'), subHost = h('div', { class: 'row' });
      const srcSeg = () => {
        srcHost.innerHTML = ''; srcHost.append(P.seg([['chord', 'Un accord'], ['prog', 'Une suite d\'accords'], ['tour', 'Le tour des 12']], src, v => { src = v; srcSeg(); refresh(); }));
        subHost.innerHTML = '';
        if (src === 'chord') subHost.append(P.field('Fondamentale', P.sel(T.SIMPLE.map((n, i) => [i, T.fmt(n, true)]), rpc, v => { rpc = +v; refresh(); })));
        if (src === 'prog') subHost.append(P.field('Suite (dans la tonalité du site)', P.sel(SRC_PROGS.map(p => [p, p.replace(/b/g, '♭') + '   ' + P.romChords(p, tonic).map(T.chordName).join(' ')]), prog, v => { prog = v; refresh(); })));
        if (src === 'tour') subHost.append(P.field('Ordre', P.sel([['quartes', 'Cycle des quartes'], ['formes', 'Par familles de formes'], ['chroma', 'Chromatique'], ['alea', 'Au hasard']], order, v => { order = v; refresh(); })));
        if (src !== 'prog') subHost.append(P.field('Accord', P.sel(QUALS, q, v => { q = v; refresh(); })));
        subHost.append(P.field('Mesures par accord', P.sel([[1, '1'], [2, '2'], [4, '4']], reps, v => { reps = +v; })));
      };
      srcSeg();
      const pb = P.playToggle(loop);
      el.append(P.prose(`
<h2>Six formes, pas douze accords</h2>
<p>Regarde un accord parfait comme un dessin de touches blanches et noires. Il n'existe que six dessins possibles, et les douze accords s'y répartissent. Tu maîtrises déjà la première famille (tout blanc). Travaille les autres <em>une famille à la fois</em> : dans une même famille, la main fait exactement le même geste, seul l'endroit change.</p>`));
      el.append(P.tool('Atelier d\'arpèges',
        P.row(P.field('Formule', P.sel([{ group: 'Main gauche', items: PATS.filter(p => p.hand === 'L').map(p => [p.id, p.n]) }, { group: 'Main droite', items: PATS.filter(p => p.hand === 'R').map(p => [p.id, p.n]) }], pat.id, v => { pat = PATS.find(p => p.id === v); refresh(); })), srcHost),
        subHost, patText, now, kbHost,
        P.row(pb, P.tempo('arp', 80, v => (bpm = v)), P.seg([[false, 'Sans métronome'], [true, 'Avec']], click, v => (click = v)), P.labSeg(v => { lab = v; refresh(); })),
        h('h4', {}, 'Les familles de formes pour cet accord'), h('p', { class: 'hint' }, 'Carré clair = touche blanche, carré foncé = touche noire, dans l\'ordre fondamentale, tierce, quinte. Clique un accord pour le travailler.'), famHost));
      refresh();

      el.append(P.prose(`
<h2>Les renversements : le même accord, posé autrement</h2>
<p>Un accord à trois sons a trois positions, selon la note qu'on met en bas. Sur un site de grilles, « C/E » veut dire : accord de Do, Mi à la basse, donc premier renversement. Mais les renversements servent surtout à deux choses qu'aucune grille n'écrit : <b>enchaîner les accords sans déplacer la main</b>, et <b>placer la note de la mélodie en haut de l'accord</b> à la main droite.</p>
<p>Pour les plaquer sans réfléchir, ne compte pas les notes : repère <b>où se trouve la fondamentale</b> et quelle forme prend la main.</p>
<ul>
<li><b>État fondamental</b> (Do Mi Sol) : deux tierces empilées, fondamentale en bas. Main droite 1-3-5, main gauche 5-3-1.</li>
<li><b>Premier renversement</b> (Mi Sol Do) : une tierce puis une quarte, fondamentale <em>en haut</em>. Main droite 1-2-5, main gauche 5-3-1.</li>
<li><b>Deuxième renversement</b> (Sol Do Mi) : une quarte puis une tierce, fondamentale <em>au milieu</em>. Main droite 1-3-5, main gauche 5-2-1.</li>
</ul>
<p>Le grand écart (la quarte) te dit tout : la fondamentale est toujours la note du haut de cette quarte. Travaille d'abord les accords de la tonalité du jour, consigne « la basse », puis « la note du haut » : c'est exactement le réflexe dont tu as besoin pour jouer une mélodie avec son accord dessous dans la même main.</p>`));
      const renvKey = P.renvTools(el);
      P.onKey = (pc, old) => { rpc = T.mod(rpc + pc - old); kpc = pc; tonic = P.tonic(); srcSeg(); refresh(); renvKey(); };

      el.append(P.prose(`
<h2>Les règles de doigté qui débloquent les touches noires</h2>
<ol>
<li><b>Le pouce vit sur les touches blanches.</b> Dès qu'un arpège dure plus d'une octave, organise-toi pour que le pouce passe sur une blanche. Sur un accord qui commence par une noire (Mi♭, La♭, Si♭, Ré♭), la main droite démarre avec l'index sur la noire et le pouce prend la première blanche : 2 – 1 – 2 – 4, puis on recommence.</li>
<li><b>Tout noir = comme tout blanc.</b> Fa♯ majeur et Mi♭ mineur se doigtent comme Do majeur (1 – 2 – 3), main simplement avancée vers le fond des touches.</li>
<li><b>Avance la main dans le clavier.</b> Dans les tonalités chargées, joue les blanches entre les noires et non au bord. C'est le changement de posture qui fait disparaître l'impression de « marcher sur des œufs ».</li>
<li><b>Main gauche, arpège montant</b> : 5 – 4 – 2 – 1 en général ; prends le 3 à la place du 4 quand la tierce est une noire et la fondamentale une blanche (Ré, La, Mi majeurs).</li>
<li><b>Pense le geste, pas les notes.</b> Dans la vague 1-5-8-9-10, le poignet tourne autour du pouce comme une poignée de porte. Si les doigts cherchent les touches une à une, ralentis jusqu'à ce que ce soit un seul mouvement.</li>
</ol>
<h2>Comment devenir fluide dans toutes les tonalités</h2>
<ol>
<li><b>À l'aveugle.</b> Pose la forme de main gauche (1-5-8) sur chaque fondamentale du cycle des quartes sans jouer, juste pour sentir l'écart. Puis joue.</li>
<li><b>Une formule, douze tonalités</b>, plutôt que douze formules dans une tonalité. Lance « Le tour des 12 » à tempo lent, deux mesures par accord ; le prochain accord est annoncé, prépare-le des yeux.</li>
<li><b>Tout de suite en musique.</b> Passe sur « Une suite d'accords » : la même formule sur I–V–vi–IV dans la tonalité du jour, puis ajoute la mélodie d'une chanson que tu connais.</li>
<li><b>Lent et régulier vaut mieux que vite et haché.</b> Monte le tempo de 4 en 4 seulement quand trois passages de suite sont propres.</li>
<li><b>Cinq minutes par jour dans la tonalité du jour</b> font plus qu'une heure le dimanche : en deux semaines tu as visité chaque tonalité.</li>
</ol>
<h2>Au-delà de l'arpège : rendre la main gauche vivante</h2>
<p>Varie la formule à l'intérieur d'une même chanson : dixièmes dans le couplet, vague dans le refrain, accords plaqués sur le pont. Laisse des trous : une main gauche qui se tait sur le quatrième temps respire. Et sur un accord qui dure, change de renversement plutôt que de répéter.</p>`));
    },
  };
})();
