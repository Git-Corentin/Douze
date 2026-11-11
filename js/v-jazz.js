/* Douze — accords jazz, jazzifieur, phrasé, grilles */
(function () {
  const P = window.P, T = P.T, A = P.A, h = P.h;
  const JQ = [['maj7', 'maj7'], ['m7', 'm7'], ['7', '7'], ['m7b5', 'm7♭5'], ['dim7', 'dim7'], ['6', '6'], ['m6', 'm6'], ['mMaj7', 'm(maj7)'], ['7sus4', '7sus4'], ['7b9', '7♭9'], ['7#9', '7♯9'], ['7alt', '7alt']];
  const STYLES = {
    shellA: ['Coquille 1-7-3', "Fondamentale, septième, puis la tierce une dixième au-dessus de la basse. Trois notes, et l'accord est entièrement défini. C'est la main gauche de Bud Powell."],
    shellB: ['Coquille 1-3-7', "Fondamentale, tierce, septième : la même coquille dans l'autre sens. Dans un ii–V–I on alterne les deux formes et la main ne bouge presque pas."],
    rootA: ['Sans fondamentale, forme A', "3-5-7-9 (ou 3-13-7-9 sur un accord 7). Le bassiste joue la fondamentale ; toi, tu joues la couleur. À placer autour du Do central."],
    rootB: ['Sans fondamentale, forme B', "7-9-3-5 : la forme A retournée. On choisit A ou B selon ce qui garde la main au milieu du clavier, et on les enchaîne dans les cadences."],
    two: ['Deux mains', "Main gauche : fondamentale et septième. Main droite : tierce, puis les couleurs. Pour accompagner un chanteur ou jouer un thème en accords."],
    quartal: ['En quartes', "Des quartes empilées : son ouvert, moderne, ambigu. C'est l'accord de « So What » et de tout le jazz modal des années 60."],
  };
  const vMarks = (v, c, lab) => v.map(x => ({ m: x.m, c: x.deg === '1' ? 'c' : x.hand === 'L' ? 'a' : 'b', t: lab === 'note' ? T.fmt(T.simplify(T.spell(c.root, x.deg))) : T.fmtDeg(x.deg) }));
  /* fondamentale + notes guides gardées dans une fenêtre fixe : la conduite des voix se fait toute seule */
  const guideV = c => { const v = T.vTokens(c); return [{ m: T.lowIn(c.rpc, 36), deg: '1', hand: 'L' }, ...[v.third, v.sev].map(t => ({ m: T.lowIn(c.rpc + T.TOK[t], 52), deg: t, hand: 'R' })).sort((a, b) => a.m - b.m)]; };
  const COLORS = [['7', ['3', '5', '1'], 'Nu : 1 3 5 ♭7'], ['9', ['3', '5', '9'], 'Neuvième : plus rond'], ['13', ['3', '13', '9'], 'Treizième : brillant, « big band »'], ['7♭9', ['3', '5', 'b9'], '♭9 : dramatique, appelle le mineur'], ['7♯9', ['3', 'b7', '#9'], '♯9 : l\'accord « Hendrix », bluesy'],
    ['7♯11', ['3', '#11', '13'], '♯11 : lydien dominant, flottant'], ['7♭13', ['3', 'b13', '1'], '♭13 : sombre'], ['7alt', ['3', 'b13', '#9'], 'Altéré : toutes les tensions']];

  P.views.accords = {
    key: 'Sol', t: 'Accords jazz', d: "Septièmes, coquilles, voicings sans fondamentale, ii–V–I : ce que fait la main gauche des jazzmen.",
    lead: "Si tes accords ne sonnent pas jazz, ce n'est pas qu'il te manque des accords compliqués. C'est une affaire de disposition : quelles notes garder, lesquelles jeter, et comment passer d'un accord au suivant en bougeant le moins possible.",
    render(el) {
      let kpc = P.S.key, tonic = P.tonic(); const tn = T.fmt(tonic);
      let lab = P.S.lab;
      P.onKey = (pc, old) => { kpc = pc; tonic = P.tonic(); rpc = T.mod(rpc + pc - old); rootSel(); draw(); draw2(); };
      el.append(P.prose(`
<h2>1. Tout accord a quatre sons</h2>
<p>En jazz, l'accord de base n'est pas l'accord parfait mais l'accord de septième. Quatre qualités couvrent neuf grilles sur dix : <b>maj7</b> (1 3 5 7), <b>7</b> (1 3 5 ♭7), <b>m7</b> (1 ♭3 5 ♭7) et <b>m7♭5</b> (1 ♭3 ♭5 ♭7). Première étape : savoir les plaquer sur les douze fondamentales.</p>
<h2>2. La tierce et la septième font tout le travail</h2>
<p>La fondamentale, le bassiste la joue. La quinte n'apporte rien. Ce qui dit si l'accord est majeur, mineur ou de dominante, ce sont la <b>tierce</b> et la <b>septième</b> : les notes guides. Une « coquille », c'est la fondamentale plus ces deux notes. Tout le reste est de la couleur qu'on ajoute par-dessus.</p>
<h2>3. Quand tu n'es plus seul, enlève la fondamentale</h2>
<p>Les voicings sans fondamentale de Bill Evans remplacent 1 et 5 par 9 et 13. Quatre notes serrées au milieu du clavier, deux formes (A et B), et c'est le son du trio jazz moderne. En solo, joue d'abord la basse, puis le voicing.</p>`));

      /* explorateur de voicings */
      let rpc = kpc, q = 'maj7', style = 'rootA';
      const kbHost = h('div'), kb = new P.Keyboard(kbHost, { from: 36, to: 84 }), txt = h('p'), ttl = h('div', { class: 'now' });
      const draw = play => {
        const c = T.mk(T.SIMPLE[rpc], q), v = T.voicing(c, style);
        kb.mark(vMarks(v, c, lab)); txt.textContent = STYLES[style][1];
        ttl.innerHTML = ''; ttl.append(h('strong', {}, T.chordName(c)), h('span', {}, v.map(x => T.fmtDeg(x.deg)).join(' – ')));
        if (play) { const t = A.now() + 0.03; if (v[0].deg !== '1') A.piano(T.lowIn(rpc, 36), t, 2, 0.5); A.chord(v.map(x => x.m), t + (v[0].deg !== '1' ? 0.35 : 0), 2, 0.5, 0.02); }
      };
      const rootHost = h('span');
      const rootSel = () => { rootHost.innerHTML = ''; rootHost.append(P.sel(T.SIMPLE.map((n, i) => [i, T.fmt(n, true)]), rpc, v => { rpc = +v; draw(true); })); };
      rootSel();
      el.append(P.tool('Voir et entendre un voicing',
        P.row(P.field('Fondamentale', rootHost), P.field('Accord', P.sel(JQ, q, v => { q = v; draw(true); })), P.labSeg(v => { lab = v; draw(); })),
        P.seg(Object.entries(STYLES).map(([k, s]) => [k, s[0]]), style, v => { style = v; draw(true); }),
        ttl, txt, kbHost,
        P.row(P.btn('Écouter', () => draw(true), 'solid'), P.btn('Fondamentale suivante (cycle des quartes)', () => { rpc = (rpc + 5) % 12; rootSel(); draw(true); })),
        h('p', { class: 'legend' }, h('span', { class: 'lg mk-c' }, 'fondamentale'), h('span', { class: 'lg mk-a' }, 'main gauche'), h('span', { class: 'lg mk-b' }, 'main droite'))));
      draw();

      /* ii-V-I */
      el.append(P.prose(`
<h2>4. Le ii–V–I : la phrase que le jazz répète sans cesse</h2>
<p>Trois accords dont les fondamentales descendent de quinte en quinte : ii mineur 7, V7, I majeur 7. Les standards en sont faits à 80 %. Regarde ce qui se passe dans les voix du milieu : <b>la septième de chaque accord descend d'un demi-ton pour devenir la tierce du suivant</b>, et l'autre note guide ne bouge pas. C'est ce minuscule mouvement que l'oreille entend comme « du jazz ». Travaille-le dans les douze tonalités : c'est le meilleur investissement de tout ce site.</p>`));
      let mode = 'maj', st2 = 'guide', bpm2 = 110;
      const cols = h('div', { class: 'tri' }), kbs = [];
      const grid2 = () => (mode === 'maj' ? 'ii7 | V7 | Imaj7 | Imaj7' : 'iiø | V7b9 | i6 | i6');
      const voic = () => { let prev = null; return T.parseGrid(grid2(), tonic).slice(0, 3).map(b => { const c = b[0]; prev = st2 === 'guide' ? guideV(c) : T.voicing(c, 'auto', prev); return { c, v: prev }; }); };
      const draw2 = () => {
        cols.innerHTML = ''; kbs.length = 0;
        bars2 = T.parseGrid(grid2(), tonic);
        voic().forEach(({ c, v }) => {
          const host = h('div'), k = new P.Keyboard(host, { from: 36, to: 72, small: true, minKey: 11, mob: st2 === 'guide' ? [36, 64] : [41, 71] });
          k.mark(v.map(x => ({ m: x.m, c: x.deg === '1' ? 'c' : x.deg === T.vTokens(c).sev ? 'b' : 'a', t: lab === 'note' ? T.fmt(T.simplify(T.spell(c.root, x.deg))) : T.fmtDeg(x.deg) })));
          kbs.push(k); cols.append(h('div', { class: 'tri-c' }, h('strong', {}, T.chordName(c)), h('span', {}, T.roman(c, kpc)), host));
        });
      };
      let bars2 = [];
      const band2 = new P.Band({ get bars() { return bars2; }, get bpm() { return bpm2; }, feel: 'swing', comp: false,
        onChord(c, bar) { const vs = voic(); const i = Math.min(bar, 2); A.chord(vs[i].v.filter(x => st2 !== 'guide' || x.deg !== '1').map(x => x.m), 0, 1.6, 0.42, 0.01); cols.querySelectorAll('.tri-c').forEach((e, j) => e.classList.toggle('on', j === i)); },
        onStop() { cols.querySelectorAll('.tri-c').forEach(e => e.classList.remove('on')); } });
      el.append(P.tool(`ii–V–I en ${tn}`,
        P.row(P.seg([['maj', 'Majeur'], ['min', 'Mineur']], mode, v => { mode = v; draw2(); }), P.seg([['guide', 'Fondamentale et notes guides'], ['rootless', 'Sans fondamentale']], st2, v => { st2 = v; draw2(); })),
        cols,
        h('p', { class: 'legend' }, h('span', { class: 'lg mk-b' }, 'septième'), h('span', { class: 'lg mk-a' }, 'tierce et couleurs'), ' Suis la note rose d\'un clavier au suivant : elle descend d\'un demi-ton et devient verte.'),
        P.row(P.playToggle(band2.loop, ['Écouter avec basse et batterie', 'Arrêter']), P.tempo('ii', 110, v => (bpm2 = v)), P.btn('Tonalité suivante', () => P.setKey((kpc + 5) % 12)))));
      draw2();

      /* couleurs du V */
      el.append(P.prose(`
<h2>5. Les couleurs : 9, 11, 13 et leurs altérations</h2>
<p>Au-dessus de la septième, on continue d'empiler des tierces : neuvième, onzième, treizième. Sur les accords majeurs et mineurs on ajoute surtout la 9. C'est sur l'accord de dominante que tout est permis : comme il est fait pour créer de la tension, on peut altérer sa neuvième (♭9, ♯9), sa onzième (♯11) et sa treizième (♭13). Règle pratique : <b>V7 vers un accord majeur → 9 et 13 naturelles ; V7 vers un accord mineur → ♭9 et ♭13.</b></p>`));
      const V = T.romanToChord('V7', tonic), I = T.romanToChord('Imaj7', tonic);
      const kb3Host = h('div'), kb3 = new P.Keyboard(kb3Host, { from: 36, to: 84 });
      const cbtns = h('div', { class: 'chips' });
      COLORS.forEach(([name, toks, d]) => cbtns.append(h('button', { class: 'chip', type: 'button', onclick: () => {
        const root = T.lowIn(V.rpc, 36), v = [{ m: root, deg: '1', hand: 'L' }, ...T.stack(V.rpc, ['b7'], root + 1).map(x => ({ ...x, hand: 'L' })), ...T.stack(V.rpc, toks, 55).map(x => ({ ...x, hand: 'R' }))];
        kb3.mark(vMarks(v, V, lab)); const t = A.now() + 0.03; A.chord(v.map(x => x.m), t, 1.5, 0.5, 0.015);
        const iv = T.voicing(I, 'two'); A.chord(iv.map(x => x.m), t + 1.6, 2, 0.45, 0.015); A.at(t + 1.6, () => kb3.mark(vMarks(iv, I, lab)));
      } }, h('b', {}, T.fmt(V.root, true) + name), h('span', {}, d))));
      el.append(P.tool(`Colorer le V7 de ${tn}, puis résoudre`, cbtns, kb3Host));

      /* triton */
      el.append(P.prose(`
<h2>6. La substitution tritonique</h2>
<p>La tierce et la septième d'un accord 7 sont à un triton l'une de l'autre, et un triton est symétrique. Conséquence : l'accord 7 situé à un triton de distance possède <em>les deux mêmes notes guides</em>, inversées. On peut donc remplacer ${T.chordName(V)} par ${T.chordName(T.romanToChord('bII7', tonic))} : la main ne change presque rien, la basse descend par demi-tons (ii, ♭II, I), et le son devient tout de suite plus sophistiqué.</p>`));
      const kb4Host = h('div'), kb4 = new P.Keyboard(kb4Host, { from: 36, to: 72 });
      const tri = g => () => { const chs = T.parseGrid(g, tonic).map(b => b[0]); P.playProg(chs, { bpm: 76, voice: c => guideV(c).slice(1).map(x => x.m), on: c => kb4.mark(vMarks(guideV(c), c, lab)) }); };
      el.append(P.tool('Comparer', P.row(P.btn('ii – V7 – I', tri('ii7 V7 Imaj7')), P.btn('ii – ♭II7 – I', tri('ii7 bII7 Imaj7')), P.btn('Les deux à la suite', tri('ii7 V7 Imaj7 Imaj7 ii7 bII7 Imaj7'))), kb4Host));

      el.append(P.prose(`
<h2>7. Plan de travail</h2>
<ol>
<li><b>Coquilles sur le cycle des quartes.</b> Forme 1-7-3 puis 1-3-7, les quatre qualités. Deux semaines.</li>
<li><b>ii–V–I en coquilles</b> dans la tonalité du jour, main gauche seule, puis en chantant la note guide qui descend.</li>
<li><b>Un standard simple.</b> Main gauche en coquilles, main droite : la mélodie. C'est déjà du piano jazz. La page <a href="#/reperes">Repères</a> propose un ordre de standards.</li>
<li><b>Voicings sans fondamentale</b>, forme A puis B, d'abord isolés, puis en ii–V–I (A–B–A et B–A–B).</li>
<li><b>Accompagne les grilles</b> de la page <a href="#/grilles">Grilles</a> en coupant le piano : c'est toi qui joues les accords, sur le rythme « Charleston » (temps 1, puis le « et » du 2).</li>
<li><b>Colore</b> : 9 partout, 13 sur les dominantes, altérations vers le mineur. Puis passe tes chansons au <a href="#/jazzifieur">Jazzifieur</a>.</li>
</ol>`));
    },
  };

  /* ============ JAZZIFIEUR ============ */
  function jazzify(bars, kpc, tonic, level) {
    const why = [], say = s => { if (!why.includes(s)) why.push(s); };
    const at = (pc, q) => T.mk(T.rootIn(tonic, pc - kpc), q), fam = T.family, nm = T.chordName;
    let out = bars.map(b => b.map(c => {
      const iv = T.mod(c.rpc - kpc); let q = c.q;
      if (['', '5', 'add9', 'sus2'].includes(q)) q = iv === 7 ? '7' : iv === 0 || iv === 5 || [1, 3, 8].includes(iv) ? 'maj7' : '7';
      else if (q === 'm') q = iv === 11 ? 'm7b5' : iv === 5 ? 'm6' : 'm7';
      else if (q === 'dim') q = iv === 11 ? 'm7b5' : 'dim7';
      else if (q === 'sus4') q = '7sus4'; else if (q === 'aug') q = '7#5';
      const n = T.mk(c.root, q, c.bass); n.was = c.q; return n;
    }));
    say("Chaque accord reçoit sa septième : maj7 sur I et IV, 7 sur V, m7 sur ii, iii et vi. Un accord majeur hors gamme devient un accord 7 (c'est presque toujours une dominante secondaire).");
    if (level >= 2) {
      const flat = out.flat();
      flat.forEach((c, i) => {
        const nx = flat[(i + 1) % flat.length], iv = T.mod(c.rpc - kpc);
        if (c.q === 'maj7') c.q = iv === 0 && i === flat.length - 1 ? '69' : 'maj9';
        else if (c.q === 'm7' && iv !== 4) c.q = 'm9';
        else if (c.q === '7') { const res = T.mod(c.rpc - nx.rpc) === 7; c.q = res && ['min', 'hdim'].includes(fam(nx.q)) ? '7b9' : res ? '13' : '9'; }
      });
      say("Extensions : 9 sur les accords majeurs et mineurs (sauf le iii, dont la neuvième sort de la gamme), 13 sur les dominantes qui résolvent sur du majeur, ♭9 sur celles qui résolvent sur du mineur.");
    }
    if (level >= 3) {
      const minor = c => ['min', 'hdim'].includes(fam(c.q));
      /* 1re passe : un V isolé devient ii–V */
      out = out.map((b, bi) => {
        if (b.length !== 1) return b;
        const X = b[0], Y = out[(bi + 1) % out.length][0], prev = out[(bi + out.length - 1) % out.length].slice(-1)[0];
        if (fam(X.q) !== 'dom' || T.mod(X.rpc - Y.rpc) !== 7 || (T.mod(prev.rpc - X.rpc) === 7 && minor(prev))) return b;
        const ii = at(X.rpc + 7, minor(Y) ? 'm7b5' : 'm9'); ii.ins = true;
        say(`${nm(X)} seul devient un ii–V : on le fait précéder de ${nm(ii)}, l'accord mineur situé une quinte au-dessus.`);
        return [ii, X];
      });
      /* 2e passe : dominante secondaire avant l'accord suivant */
      out = out.map((b, bi) => {
        if (b.length !== 1) return b;
        const X = b[0], Y = out[(bi + 1) % out.length][0];
        if (Y.rpc === X.rpc || (fam(X.q) === 'dom' && T.mod(X.rpc - Y.rpc) === 7)) return b;
        const D = at(Y.rpc + 7, minor(Y) ? '7b9' : '13'); if (D.rpc === X.rpc) return b;
        D.ins = true; D.target = Y;
        say(`${nm(D)} est la dominante de ${nm(Y)} : glissée dans la seconde moitié de la mesure, elle annonce l'accord suivant.`);
        return [X, D];
      });
    }
    if (level >= 4) {
      out.forEach(b => {
        if (b.length !== 2 || !b[1].target) return;
        const X = b[0], D = b[1], Y = D.target, step = T.mod(Y.rpc - X.rpc);
        if (step === 2) { const d = at(X.rpc + 1, 'dim7'); d.ins = true; b[1] = d; say(`Entre ${nm(X)} et ${nm(Y)}, un ton d'écart : ${nm(d)} fait le pont, la basse monte par demi-tons.`); }
        else if (step !== 1) { const s = at(D.rpc + 6, '9'); s.ins = true; b[1] = s; say(`${nm(s)} remplace ${nm(D)} (substitution tritonique) : la basse glisse d'un demi-ton vers ${nm(Y)}.`); }
      });
    }
    return { bars: out, why };
  }

  P.views.jazzifieur = {
    key: 'Sol♯', t: 'Jazzifieur', d: "Donne-lui les accords d'une chanson : il les réharmonise par étapes et t'explique pourquoi.",
    lead: "Colle une grille simple. L'outil la réharmonise en quatre niveaux, du plus sage au plus aventureux, en appliquant les recettes que les pianistes de jazz utilisent tous. Chaque changement est expliqué : le but est que tu finisses par le faire toi-même.",
    render(el) {
      const mkDef = () => P.romChords('I vi IV V', P.tonic()).map(T.chordName).join(' ');
      let tonic = P.tonic(), def = mkDef();
      P.onKey = () => { tonic = P.tonic(); def = mkDef(); ta.value = P.S.jz || def; run(); };
      const ta = h('textarea', { rows: 3, spellcheck: 'false', 'aria-label': 'Grille à réharmoniser' }); ta.value = P.S.jz || def;
      let level = 2, feel = 'swing', bpm = 104, res = null, kpc = 0, lab = P.S.lab;
      const out = h('div', { class: 'bars' }), why = h('ol', { class: 'why' }), info = h('p', { class: 'hint' });
      const kbHost = h('div'), kb = new P.Keyboard(kbHost, { from: 36, to: 84 });
      const band = new P.Band({ bars: [], get bpm() { return bpm; }, get feel() { return feel; },
        onChord(c, bar, v) { out.querySelectorAll('.on').forEach(x => x.classList.remove('on')); if (c._el) c._el.classList.add('on'); kb.mark([...(P.mob ? [] : [{ m: T.lowIn(c.rpc, 36), c: 'c', t: lab === 'note' ? T.fmt(c.root) : '1' }]), ...vMarks(v, c, lab)]); },
        onStop() { out.querySelectorAll('.on').forEach(x => x.classList.remove('on')); } });
      function run() {
        P.S.jz = ta.value === def ? '' : ta.value; P.save(); out.innerHTML = ''; why.innerHTML = '';
        const src = T.parseGrid(ta.value.replace(/\n/g, ta.value.includes('|') ? ' | ' : ' '), tonic);
        if (!src.length) { info.textContent = "Écris quelques accords séparés par des espaces (C Am F G), ou des mesures séparées par des barres (C Am | F G)."; band.bars = []; return; }
        kpc = T.detectKey(src.flat()).pc; const t = T.KEYS[kpc];
        info.textContent = `Tonalité détectée : ${T.fmt(t)} majeur. Une mesure par accord, sauf si tu écris des barres.`;
        res = jazzify(src, kpc, t, level); band.bars = res.bars;
        const chip = c => (c._el = h('button', { type: 'button', class: 'bch' + (c.ins ? ' ins' : ''), onclick: () => {
          const v = T.voicing(c, 'auto'); kb.mark([...(P.mob ? [] : [{ m: T.lowIn(c.rpc, 36), c: 'c', t: '1' }]), ...vMarks(v, c, lab)]);
          A.piano(T.lowIn(c.rpc, 36), 0, 1.6, 0.5); A.chord(v.map(x => x.m), A.now() + 0.25, 1.6, 0.5, 0.015);
        } }, h('b', {}, T.chordName(c)), h('i', {}, T.roman(c, kpc))));
        res.bars.forEach((b, i) => out.append(h('div', { class: 'bar' }, h('small', {}, src[i].map(T.chordName).join(' ')), h('div', { class: 'bar-c' }, b.map(chip)))));
        res.why.forEach(w => why.append(h('li', {}, w)));
      }
      ta.addEventListener('input', () => { band.loop.stop(); run(); });
      el.append(P.tool('La grille de départ', ta, h('p', { class: 'hint' }, 'La grille suit la tonalité du site : change-la en haut de page, même pendant la lecture, et tout se transpose.'), info,
        P.row(P.field('Niveau', P.seg([[1, '1. Septièmes'], [2, '2. Couleurs'], [3, '3. Dominantes ajoutées'], [4, '4. Substitutions']], level, v => { level = v; band.loop.stop(); run(); }))),
        out,
        P.row(P.playToggle(band.loop, ['Écouter la version jazz', 'Arrêter']), P.btn('Écouter l\'original', () => P.playProg(T.parseGrid(ta.value.replace(/\n/g, ' '), tonic).flat(), { bpm: 88 })),
          P.field('Style', P.sel([['swing', 'Swing'], ['bossa', 'Bossa'], ['pop', 'Ballade binaire']], feel, v => (feel = v))), P.tempo('jz', 104, v => (bpm = v))),
        h('p', { class: 'legend' }, 'En petit, l\'accord d\'origine. Les accords encadrés en pointillés ont été ajoutés. Clique un accord pour voir son voicing.'),
        kbHost, h('h4', {}, 'Ce qui a été fait, et pourquoi'), why));
      run();
      el.append(P.prose(`
<h2>Les recettes, à refaire à la main</h2>
<ol>
<li><b>Ajoute les septièmes.</b> C'est 70 % de la couleur. Si tu ne fais qu'une chose, fais celle-ci.</li>
<li><b>Avant chaque accord, demande-toi : quel est son V ?</b> Glisse-le sur les deux derniers temps de la mesure précédente. Vers un accord mineur, mets-lui une ♭9.</li>
<li><b>Tout V peut devenir ii–V.</b> Coupe sa durée en deux et place devant lui le m7 une quinte plus haut.</li>
<li><b>Tout V7 peut être remplacé par l'accord 7 à un triton.</b> Idéal quand la mélodie est sur la tierce ou la septième.</li>
<li><b>Deux accords à un ton d'écart ?</b> Un diminué 7 entre les deux.</li>
<li><b>Vérifie avec la mélodie.</b> La note chantée doit appartenir à l'accord ou en être une extension agréable (9, 13). Si ça frotte, reviens d'un niveau en arrière : la mélodie a toujours raison.</li>
</ol>
<p>À l'inverse, une réharmonisation n'est jamais obligatoire. Les meilleurs pianistes en mettent peu, au bon endroit : souvent la fin d'une phrase, là où la mélodie tient une note longue.</p>`));
    },
  };

  /* ============ PHRASÉ ============ */
  const II = 'ii7 | V7 | Imaj7 | Imaj7';
  const DEMOS = [
    { t: 'Le swing et les accents', grid: II, flatFeel: true,
      d: "Les mêmes notes, deux fois. En jazz, les croches sont inégales (longue, courte) et l'accent tombe sur la croche faible, entre les temps. Joue une simple gamme comme ça et elle sonne déjà. C'est la première chose à travailler, avant toute théorie.",
      a: 'D4 E4 F4 G4 A4 B4 C5 D5 | B4 A4 G4 F4 E4 D4 C4 B3 | C4 - - - . . . .', b: 'D4 E4 F4 G4 A4 B4 C5 D5 | B4 A4 G4 F4 E4 D4 C4 B3 | C4 - - - . . . .' },
    { t: 'Viser les notes de l\'accord', grid: II,
      d: "Version plate : la gamme monte et descend sans écouter l'harmonie. Version jazz : sur le premier temps de chaque mesure tombe la tierce du nouvel accord. La ligne « raconte » les accords, même sans main gauche.",
      a: 'D4 E4 F4 G4 A4 G4 F4 E4 | D4 E4 F4 G4 A4 G4 F4 E4 | D4 - - - . . . .', b: 'F4 G4 A4 C5 E5 D5 C5 A4 | B4 A4 G4 F4 D4 F4 A4 F4 | E4 - - - . . . .' },
    { t: 'L\'approche chromatique', grid: II,
      d: "On arrive sur chaque note de l'accord par le demi-ton juste en dessous, placé entre les temps. Les notes « fausses » ne durent qu'une croche faible : l'oreille n'entend que l'élan vers la bonne.",
      a: 'D4 . F4 . A4 . C5 . | B4 . D5 . F5 . B4 . | E4 - - . G4 - . .', b: 'D4 E4 F4 G#4 A4 B4 C5 A#4 | B4 C#5 D5 E5 F5 D5 B4 D#4 | E4 - . F#4 G4 - . .' },
    { t: 'L\'encerclement', grid: II,
      d: "Avant de jouer la note visée, on joue sa voisine du dessus, puis celle du dessous. La cible arrive sur le temps. C'est LA tournure bebop : écoute comme la ligne semble soudain savoir où elle va.",
      a: 'F4 A4 . . F4 A4 . . | B4 D5 . . F5 D5 . . | E5 - - . . . . .', b: 'F4 A4 G4 E4 F4 A4 C5 A#4 | B4 D5 G5 E5 F5 D5 F5 D#5 | E5 - - . . . . .' },
    { t: 'La gamme bebop', grid: 'V7 | V7 | Imaj7 | Imaj7',
      d: "Une gamme de sept notes jouée en croches décale les notes de l'accord hors des temps. Ajoute une note de passage (ici entre la fondamentale et la septième) : huit notes, et les sons de l'accord retombent sur chaque temps.",
      a: 'G5 F5 E5 D5 C5 B4 A4 G4 | F4 E4 D4 C4 B3 A3 G3 F3 | E3 - - . . . . .', b: 'G5 F#5 F5 E5 D5 C5 B4 A4 | G4 F#4 F4 E4 D4 C4 B3 A3 | G3 - - . . . . .' },
    { t: 'L\'arpège depuis la tierce', grid: II,
      d: "Au lieu de 1-3-5-7, joue 3-5-7-9. Tu évites la fondamentale (trop « exercice ») et tu attrapes la neuvième. Sur le V7 on pousse jusqu'à la ♭9 pour le piment.",
      a: 'D4 F4 A4 C5 . . . . | G4 B4 D5 F5 . . . . | C4 E4 G4 B4 - . . .', b: 'F4 A4 C5 E5 D5 C5 A4 C5 | B4 D5 F5 A5 G#5 G5 F5 D5 | E5 - - . . . . .' },
    { t: 'Les blue notes et les appoggiatures', grid: 'I7 | I7 | IV7 | I7',
      d: "La tierce mineure écrasée sur la tierce majeure, comme un doigt qui glisse d'une touche noire à la blanche voisine. Ajoute la sixte et tu as le vocabulaire de Wynton Kelly et de Red Garland.",
      a: 'C4 E4 G4 A4 C5 A4 G4 E4 | C4 - . . . . . . | F4 A4 C5 . . . . . | C4 - - . . . . .', b: 'd#4>E4 G4 A4 C5 d#5>E5 C5 A4 G4 | Bb4 A4 G4 Eb4 d#4>E4 C4 - . | Eb4 - C4 Eb4 F4 - . . | g#4>A4 G4 E4 C4 - . . .' },
    { t: 'Moins de notes, plus de rythme', grid: II,
      d: "Version plate : un flot de croches ininterrompu. Version jazz : un motif de deux notes, répété en l'adaptant à chaque accord, avec du silence autour. Un solo est une conversation, pas un exercice de vélocité.",
      a: 'D4 E4 F4 G4 A4 B4 C5 D5 | E5 D5 C5 B4 A4 G4 F4 E4 | D4 E4 F4 G4 A4 B4 C5 D5', b: '. . A4 C5 - . . . | . . A4 B4 - . . . | . G4 A4 E5 - - . .' },
    { t: 'Jouer « dehors » sur la dominante', grid: 'ii7 | V7alt | Imaj7 | Imaj7',
      d: "Sur le V7, on quitte la tonalité : les notes viennent de l'accord situé à un triton (ici, toutes les altérations d'un coup). La tension est maximale, et la résolution d'un demi-ton sur le I n'en est que plus satisfaisante.",
      a: 'F4 A4 C5 E5 G5 E5 D5 E5 | F5 E5 D5 B4 A4 G4 F4 D4 | C4 - - . . . . .', b: 'F4 A4 C5 E5 G5 E5 D5 E5 | F5 Eb5 Db5 B4 Ab4 F4 Eb4 Db4 | C4 - - . . . . .' },
  ];
  const LICKS = [
    { t: 'Le classique 3-5-7-9', grid: II, l: DEMOS[5].b, d: "Arpège depuis la tierce sur le ii, même chose sur le V avec 9 puis ♭9, encerclement de la tierce du I." },
    { t: 'La descente bebop', grid: II, l: 'A4 C5 D5 F5 A5 F5 E5 F#5 | G5 F#5 F5 E5 D5 C5 B4 A4 | G4 - - . . . . .', d: "Montée en arpège, puis gamme bebop de dominante descendante : fondamentale, 7 de passage, ♭7…" },
    { t: 'Tout en encerclements', grid: II, l: DEMOS[3].b, d: "Chaque note cible est encadrée par le dessus puis le dessous." },
    { t: 'Diminué sur le V', grid: 'ii7 | V7b9 | Imaj7 | Imaj7', l: 'G4 E4 F4 A4 C5 E5 D5 C5 | B4 D5 F5 Ab5 G5 F5 Eb5 Db5 | C5 - - . . . . .', d: "Sur le V7♭9, l'arpège 3-5-♭7-♭9 est un accord diminué. Puis descente altérée jusqu'à la tonique." },
    { t: 'Le triton', grid: 'ii7 | V7alt | Imaj7 | Imaj7', l: DEMOS[8].b, d: "Sur le V, l'arpège et la gamme de l'accord à un triton." },
    { t: 'Cadence mineure', grid: 'iiø | V7b9 | i6 | i6', l: 'F4 Ab4 C5 Eb5 D5 C5 Ab4 C5 | B4 D5 F5 Ab5 G5 F5 Eb5 D5 | C5 - . G4 A4 - . .', d: "ii–V–i mineur : arpège du m7♭5 depuis la tierce, diminué sur le V, arrivée sur la sixte de l'accord mineur." },
    { t: 'Blues', grid: 'I7 | I7 | IV7 | I7', l: DEMOS[6].b, d: "Appoggiatures ♭3→3, sixte, et la ♭3 assumée sur le IV7 (où elle devient la septième)." },
  ];

  P.views.phrase = {
    key: 'La', t: 'Phrasé jazz', d: "Pourquoi ta main droite ne sonne pas jazz, et les neuf gestes qui changent tout.",
    lead: "Tu joues les bonnes notes : celles de la gamme. Les jazzmen jouent aussi des notes « fausses », mais au bon endroit du temps, et ils visent toujours quelque chose. Chaque idée ci-dessous s'écoute en deux versions, plate puis jazz, sur la même rythmique.",
    render(el) {
      let bpm = 120, cur = null, lab = 'deg', trade = true, cycle = false;
      const kbHost = h('div', { class: 'sticky-kb' }), kb = new P.Keyboard(kbHost, { from: 48, to: 96, minKey: 16 }), status = h('div', { class: 'now' }, h('strong', {}, 'Clavier de démonstration'), h('span', {}, 'lance un exemple'));
      const o = { bars: [], get bpm() { return bpm; }, feel: 'swing' };
      const band = new P.Band(o);
      let spec = null, notes = [], kpc = P.S.key, off = 0, curCh = null;
      const keyLab = h('span', { class: 'dock-k' }, 'Tonalité : ' + T.fmt(P.tonic()));
      const build = () => { o.bars = T.parseGrid(spec.grid, T.KEYS[kpc]); off = kpc <= 6 ? kpc : kpc - 12; kb.mark(notes.map(n => ({ m: n.m + off, c: 'g', t: '' }))); keyLab.textContent = 'Tonalité : ' + T.fmt(T.KEYS[kpc]) + (spec.lick && cycle ? ', puis ' + T.fmt(T.KEYS[(kpc + 5) % 12]) : ''); };
      P.onKey = () => { if (spec && band.loop.on) { kpc = P.S.key; build(); } else keyLab.textContent = 'Tonalité : ' + T.fmt(P.tonic()); };
      o.onChorus = n => { if (spec.lick && cycle && n > 0 && n % 2 === 0) { kpc = (kpc + 5) % 12; build(); } };
      o.onChord = c => { curCh = c; status.firstChild.textContent = T.chordName(c); };
      o.onStop = () => { kb.live([]); document.querySelectorAll('.demo .on').forEach(b => { b.classList.remove('on'); }); cur = null; };
      o.lead = (abs, e, t, d, bar) => {
        const chorus = Math.floor(abs / o.bars.length);
        if (spec.lick && trade && chorus % 2 === 1) { if (e === 0 && bar === 0) A.at(t, () => { status.lastChild.textContent = 'à toi : rejoue la phrase'; kb.live([]); }); return; }
        notes.forEach(n => {
          if (n.bar !== bar || n.e !== e) return;
          const m = n.m + off, len = n.len * (60 / o.bpm / 2) * 0.95;
          if (n.grace != null) A.piano(n.grace + off, t - 0.06, 0.07, 0.45);
          A.piano(m, t, len, spec.flat ? 0.62 : e % 2 ? 0.8 : 0.58);
          A.at(t, () => { kb.live([m]); status.lastChild.textContent = curCh ? 'note jouée : ' + T.DEGNAMES[T.mod(m - curCh.rpc)] + ' de l\'accord' : ''; });
        });
      };
      const start = (s, btn) => {
        const same = cur === btn; band.loop.stop(); if (same) return;
        spec = s; kpc = P.S.key; notes = P.parseLine(s.line); o.feel = s.flat && s.flatFeel ? 'pop' : 'swing'; build();
        band.loop.start(); cur = btn; btn.classList.add('on');
      };
      const degLine = (grid, line) => {
        const bars = T.parseGrid(grid, 'C'), ns = P.parseLine(line);
        return bars.map((b, i) => ns.filter(n => n.bar === i).map(n => T.DEGNAMES[T.mod(n.m - b[0].rpc)]).join(' ')).filter(Boolean).join('  |  ');
      };
      el.append(P.prose(`<h2>Neuf idées, à écouter en deux versions</h2><p>Tout est joué en ${T.fmt(P.tonic())} sur un ii–V–I (ou un blues). Le clavier reste visible en bas de l'écran ; sous chaque exemple, la phrase est écrite en degrés <em>de l'accord du moment</em> : c'est ainsi qu'il faut la penser pour pouvoir la rejouer partout.</p>`));
      DEMOS.forEach((dm, i) => {
        const ba = P.btn('Version plate', e => start({ grid: dm.grid, line: dm.a, flat: true, flatFeel: dm.flatFeel }, e.currentTarget)), bb = P.btn('Version jazz', e => start({ grid: dm.grid, line: dm.b }, e.currentTarget), 'solid');
        el.append(h('article', { class: 'demo' }, h('h3', {}, (i + 1) + '. ' + dm.t), h('p', {}, dm.d), P.row(ba, bb), h('p', { class: 'degline' }, degLine(dm.grid, dm.b))));
      });
      el.append(P.prose(`<h2>Phrases à apprendre dans les douze tonalités</h2><p>Une phrase n'est à toi que lorsque tu peux la jouer sans réfléchir dans une tonalité que tu n'aimes pas. Méthode : écoute, chante, puis joue. Les réglages restent accrochés en bas de l'écran, au-dessus du clavier, et s'appliquent tout de suite, même pendant la lecture. « Question-réponse » joue la phrase une grille sur deux et te laisse la suivante. « Tour des 12 » monte d'une quarte toutes les deux grilles (la tonalité en cours et la suivante sont affichées) ; tu peux aussi changer de tonalité à la main en haut de page sans arrêter la musique.</p>`));
      const lk = h('div');
      LICKS.forEach(L => lk.append(h('article', { class: 'demo lick' }, h('h3', {}, L.t), h('p', {}, L.d), h('p', { class: 'degline' }, degLine(L.grid, L.l)),
        P.row(P.btn('Jouer en boucle', e => start({ grid: L.grid, line: L.l, lick: true }, e.currentTarget), 'solid')))));
      el.append(lk);
      el.append(P.prose(`
<h2>Ce qu'aucun exercice ne remplace</h2>
<p><b>Relever.</b> Choisis quatre mesures d'un solo que tu aimes (Wynton Kelly sur « Freddie Freeloader », Red Garland, Oscar Peterson sont de bons débuts : clairs, swingants, pas trop rapides). Ralentis, chante-les, trouve-les au clavier, puis transpose-les. Tu as déjà l'oreille pour ça : c'est exactement ce que tu fais avec les mélodies de chansons.</p>
<p><b>Chanter avant de jouer.</b> Si tu ne peux pas chanter une phrase, tes doigts jouent des réflexes. Improvise à la voix sur la page Grilles, puis cherche au clavier ce que tu as chanté.</p>
<p><b>Se limiter.</b> Un chorus entier avec trois notes. Un chorus en ne jouant que des tierces d'accord. Un chorus en commençant chaque phrase sur un « et ». Les contraintes fabriquent le style.</p>
<p><b>Le placement.</b> Joue légèrement en arrière du temps, détendu ; articule lié, avec de petits accents sur les croches faibles et sur les sommets de la ligne. Enregistre-toi : c'est le rythme, pas les notes, qui te dira si ça sonne.</p>`));
      el.append(h('div', { class: 'dock' },
        h('div', { class: 'dock-c' },
          P.seg([[true, 'Question-réponse'], [false, 'En boucle']], trade, v => (trade = v)),
          P.seg([[false, 'Même tonalité'], [true, 'Tour des 12']], cycle, v => { cycle = v; if (spec && band.loop.on) build(); }),
          P.tempo('phr', 120, v => (bpm = v)), P.btn('Arrêter', () => band.loop.stop()), keyLab),
        status, kbHost));
    },
  };

  /* ============ GRILLES ============ */
  const GRIDS = [
    ['iiVI', 'ii–V–I majeur', II, 'swing', "La cellule de base. Fais-la tourner dans les douze tonalités."],
    ['iiVi', 'ii–V–i mineur', 'iiø | V7b9 | i6 | i6', 'swing', "La cadence mineure : accord demi-diminué, dominante altérée, mineur 6."],
    ['anatole', 'Anatole (I–vi–ii–V)', 'Imaj7 vi7 | ii7 V7', 'swing', "Deux accords par mesure. Le manège sur lequel on apprend à enchaîner."],
    ['blues', 'Blues, trois accords', 'I7 | IV7 | I7 | I7 | IV7 | IV7 | I7 | I7 | V7 | IV7 | I7 | V7', 'swing', "Douze mesures. La gamme blues fonctionne du début à la fin."],
    ['jblues', 'Blues jazz', 'I7 | IV7 | I7 | v7 I7 | IV7 | #iv°7 | I7 | iiiø VI7b9 | ii7 | V7 | I7 VI7 | ii7 V7', 'swing', "Le blues avec ses ii–V : la grille des jam sessions."],
    ['mblues', 'Blues mineur', 'i7 | iv7 | i7 | i7 | iv7 | iv7 | i7 | i7 | bVI7 | V7b9 | i7 | iiø V7b9', 'swing', "Pentatonique mineure et dorien ; attention au ♭VI7–V7 des mesures 9 et 10."],
    ['cycle', 'Cycle diatonique', 'ii7 | V7 | Imaj7 | IVmaj7 | viiø | III7b9 | vi6 | vi6', 'swing', "ii–V–I majeur enchaîné à un ii–V–i du relatif mineur : la charpente de nombreux standards, dont « Les Feuilles mortes »."],
    ['rhythm', 'Anatole complet (section A)', 'I6 vi7 | ii7 V7 | iii7 VI7 | ii7 V7 | v7 I7 | IV6 iv6 | iii7 VI7 | ii7 V7', 'swing', "Huit mesures qui bougent vite. À prendre lentement."],
    ['desc', 'ii–V qui descendent d\'un ton', 'ii7 V7 | Imaj7 | i7 IV7 | bVIImaj7 | bvii7 bIII7 | bVImaj7 | ii7 V7 | Imaj7', 'swing', "Le I majeur devient mineur et repart en ii–V un ton plus bas : trois tonalités en huit mesures."],
    ['modal', 'Modal', 'ii7 | ii7 | ii7 | ii7 | biii7 | biii7 | ii7 | ii7', 'swing', "Un seul accord pendant longtemps, puis le même un demi-ton plus haut. Pense dorien et voicings en quartes."],
    ['bossa', 'Bossa', 'Imaj7 | Imaj7 | II7 | II7 | ii7 | bII7 | Imaj7 | bII7', 'bossa', "Croches égales, et un II7 lydien dominant en troisième mesure."],
    ['pop', 'Quatre accords pop', 'I | V | vi | IV', 'pop', "Pour travailler arpèges et improvisation pentatonique sur un terrain connu."],
  ];
  P.views.grilles = {
    key: 'La♯', t: 'Grilles', d: "Une section rythmique pour t'accompagner, avec la gamme de chaque accord affichée en direct.",
    lead: "Contrebasse, batterie et piano d'accompagnement jouent la grille ; toi, tu improvises. Pour chaque accord, le clavier montre les notes sûres et la gamme qui va avec. Coupe le piano pour travailler tes propres voicings.",
    render(el) {
      let gid = P.S.grid || 'iiVI', feel = null, bpm = 120, kpc = P.S.key, cycle = false, custom = P.S.gcustom || 'Dm7 G7 | Cmaj7 A7', lab = P.S.lab;
      const parts = { comp: true, bass: true, drums: true };
      const gridEl = h('div', { class: 'bars' }), info = h('div', { class: 'now' }), desc = h('p');
      const kbHost = h('div'), kb = new P.Keyboard(kbHost, { from: 36, to: 84, mob: [60, 83] });
      const o = { bars: [], get bpm() { return bpm; }, get feel() { return feel; }, get comp() { return parts.comp; }, get bass() { return parts.bass; }, get drums() { return parts.drums; }, countIn: true };
      const band = new P.Band(o);
      const custHost = h('div');
      const build = () => {
        const tonic = T.KEYS[kpc], g = GRIDS.find(x => x[0] === gid);
        o.bars = gid === 'custom' ? T.parseGrid(custom.replace(/\n/g, ' | '), tonic) : T.parseGrid(g[2], tonic);
        desc.textContent = g ? g[4] : "Écris ta grille en accords (Dm7 G7 | Cmaj7) ou en degrés (ii7 V7 | Imaj7), une barre entre les mesures. En degrés, elle suit la tonalité du site.";
        gridEl.innerHTML = '';
        o.bars.forEach(b => gridEl.append(h('div', { class: 'bar' }, h('div', { class: 'bar-c' }, b.map(c => (c._el = h('span', { class: 'bch' }, h('b', {}, T.chordName(c)), h('i', {}, T.roman(c, kpc)))))))));
        if (!band.loop.on) { info.innerHTML = ''; info.append(h('strong', {}, T.fmt(tonic) + (g && /^i[^i]|^iiø/.test(g[2]) ? ' mineur' : ' majeur')), h('span', {}, o.bars.length + ' mesures')); if (o.bars.length) showChord(o.bars[0][0], T.voicing(o.bars[0][0], 'auto')); }
      };
      const showChord = (c, v) => {
        const sid = T.chordScale(c, kpc), pcs = T.chordSemis(c.q).map(s => T.mod(c.rpc + s));
        const root = T.SIMPLE[c.rpc];
        const sc = P.marksScale(c.root, sid, 60, kb.to, 'none').map(x => { const semi = T.mod(x.m - c.rpc), strong = pcs.includes(x.m % 12); return { m: x.m, c: strong ? 'a' : 'g', t: lab === 'note' ? T.fmt(T.SIMPLE[x.m % 12]) : T.DEGNAMES[semi] }; });
        kb.mark(P.mob ? sc : [...sc, ...v.map(x => ({ m: x.m, c: 'b', t: T.fmtDeg(x.deg) })), { m: T.lowIn(c.rpc, 36), c: 'c', t: '1' }]);
        info.innerHTML = ''; info.append(h('strong', {}, T.chordName(c)), h('span', {}, 'gamme : ' + T.fmt(root) + ' ' + T.SCALES[sid].n.toLowerCase().replace(/ \(.*/, '')));
      };
      o.onChord = (c, bar, v) => { gridEl.querySelectorAll('.on').forEach(x => x.classList.remove('on')); if (c._el) c._el.classList.add('on'); showChord(c, v); };
      o.onChorus = n => { if (cycle && n > 0) { kpc = (kpc + 5) % 12; build(); } };
      o.onStop = () => { gridEl.querySelectorAll('.on').forEach(x => x.classList.remove('on')); kpc = P.S.key; build(); };
      P.onKey = () => { kpc = P.S.key; if (gid === 'custom') { custom = P.S.gcustom || custom; drawCustom(); } build(); };
      const pickGrid = v => { band.loop.stop(); gid = v; P.S.grid = v; P.save(); const g = GRIDS.find(x => x[0] === v); feel = g ? g[3] : feel || 'swing'; feelHost.innerHTML = ''; feelHost.append(feelSel()); drawCustom(); build(); };
      const feelSel = () => P.sel([['swing', 'Swing'], ['bossa', 'Bossa'], ['pop', 'Binaire']], feel, v => (feel = v));
      const feelHost = h('span');
      const drawCustom = () => {
        custHost.innerHTML = ''; if (gid !== 'custom') return;
        const ta = h('textarea', { rows: 3, spellcheck: 'false', 'aria-label': 'Ta grille' }); ta.value = custom;
        ta.addEventListener('input', () => { band.loop.stop(); custom = ta.value; P.S.gcustom = custom; P.save(); build(); }); custHost.append(ta);
      };
      const tog = (k, l) => P.seg([[true, l], [false, 'coupé']], parts[k], v => (parts[k] = v));
      el.append(P.tool('La rythmique',
        P.row(P.field('Grille', P.sel([...GRIDS.map(g => [g[0], g[1]]), ['custom', 'Ma propre grille…']], gid, pickGrid)), P.field('Style', feelHost), P.tempo('grid', 120, v => (bpm = v))),
        custHost, desc, gridEl, info, kbHost,
        h('p', { class: 'legend' }, h('span', { class: 'lg mk-a' }, 'notes de l\'accord'), h('span', { class: 'lg mk-g' }, 'reste de la gamme'), P.mob ? null : h('span', { class: 'lg mk-b' }, 'voicing joué par le piano'), P.mob ? null : h('span', { class: 'lg mk-c' }, 'basse')),
        P.row(P.playToggle(band.loop, ['Lancer (décompte de 4)', 'Arrêter']), P.seg([[false, 'Même tonalité'], [true, 'Une quarte plus haut à chaque tour']], cycle, v => (cycle = v))),
        P.row(P.field('Piano', tog('comp', 'joue')), P.field('Basse', tog('bass', 'joue')), P.field('Batterie', tog('drums', 'joue')), P.labSeg(v => { lab = v; build(); }))));
      pickGrid(GRIDS.some(g => g[0] === gid) || gid === 'custom' ? gid : 'iiVI');
      el.append(P.prose(`
<h2>Cinq façons de s'en servir</h2>
<ol>
<li><b>Main gauche seule.</b> Coupe le piano, joue les coquilles ou les voicings sans fondamentale sur le rythme Charleston (premier temps, puis le « et » du deuxième).</li>
<li><b>Notes guides à la main droite.</b> Une seule note par accord, la tierce ou la septième (en vert). Tu entendras la grille se dessiner toute seule.</li>
<li><b>Arpèges.</b> 1-3-5-7 montant sur chaque accord, puis 3-5-7-9, puis un accord montant, le suivant descendant.</li>
<li><b>Gamme avec cibles.</b> Joue la gamme affichée en croches, mais arrange-toi pour tomber sur une note verte au premier temps de chaque mesure.</li>
<li><b>Libre.</b> Chante une phrase, joue-la. Laisse deux temps de silence. Recommence. Puis active « une quarte plus haut à chaque tour ».</li>
</ol>
<p>Tempo : commence autour de 90 à 110. Le swing ne vient pas de la vitesse ; il se travaille très bien à 80.</p>`));
    },
  };
})();
