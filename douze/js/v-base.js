/* Douze — accueil, degrés, transposeur, modes */
(function () {
  const P = window.P, T = P.T, A = P.A, h = P.h;

  /* ============ ACCUEIL ============ */
  P.views.accueil = {
    key: 'Do', t: 'Accueil', h1: 'Douze tonalités, une seule façon de penser',
    lead: "Un cahier de piano pour qui joue d'oreille : apprendre à voir la musique en degrés, délier les deux mains dans les tonalités « à touches noires », faire sonner des accords et des phrases de jazz, et entraîner son oreille relative. Tout s'écoute, tout se transpose.",
    render(el) {
      const kd = P.keyOfDay(), ch = P.challenge();
      el.append(h('section', { class: 'today' },
        h('div', { class: 'today-k' }, h('span', { class: 'today-l' }, "Tonalité du jour"), h('strong', {}, T.fmt(T.KEYS[kd])), h('span', { class: 'today-s' }, 'majeur')),
        h('div', { class: 'today-b' },
          h('p', { class: 'today-c' }, h('b', {}, 'Défi du jour. '), ch),
          P.row(P.btn('Passer le site en ' + T.fmt(T.KEYS[kd]), () => P.setKey(kd), 'solid'), h('a', { class: 'btn', href: '#/routine' }, 'Ouvrir la séance du jour')),
          h('p', { class: 'hint' }, P.S.streak.n > 0 ? `Série en cours : ${P.S.streak.n} jour${P.S.streak.n > 1 ? 's' : ''} de travail.` : "Chaque jour le site propose une autre tonalité, en suivant le cycle des quartes : en douze jours tu as fait le tour."))));

      el.append(P.prose(`
<h2>L'idée</h2>
<p>Tu sais déjà retrouver une mélodie et plaquer les accords d'une grille. Ce qui te manque n'est pas de l'oreille, c'est une <em>carte</em>. Quand on pense « Do, La mineur, Fa, Sol », chaque tonalité est un nouveau pays. Quand on pense « un, six, quatre, cinq », il n'y a plus qu'un seul morceau, et douze manières de poser les mains dessus. Tous les pianistes qui transposent à la volée, tous les jazzmen qui « savent quels accords faire » pensent ainsi.</p>
<p>Le site suit cet ordre. Les sept touches blanches du menu sont les chapitres ; les cinq touches noires sont des outils à garder sous la main.</p>`));

      const order = ['degres', 'modes', 'arpeges', 'accords', 'phrase', 'oreille'];
      const ol = h('ol', { class: 'toc' });
      order.forEach(id => { const v = P.views[id]; ol.append(h('li', {}, h('a', { href: '#/' + id }, h('strong', {}, v.t), h('span', {}, v.d)))); });
      el.append(h('h2', { class: 'h2' }, 'Le parcours'), ol);
      const ul = h('ul', { class: 'toc toc-tools' });
      ['routine', 'transposeur', 'reperes', 'jazzifieur', 'grilles'].forEach(id => { const v = P.views[id]; ul.append(h('li', {}, h('a', { href: '#/' + id }, h('strong', {}, v.t), h('span', {}, v.d)))); });
      el.append(h('h2', { class: 'h2' }, 'Les outils'), ul);

      el.append(P.prose(`
<h2>Mode d'emploi</h2>
<p><strong>La tonalité en haut de page commande tout le site.</strong> Change-la et chaque exemple, chaque clavier, chaque grille se transpose. C'est voulu : n'apprends rien en Do seulement.</p>
<p><strong>Les accords s'écrivent en lettres</strong> (C, Am, F…), comme sur les sites de grilles. Les notes s'affichent en Do-Ré-Mi ou en lettres, au choix dans les réglages. C = Do, D = Ré, E = Mi, F = Fa, G = Sol, A = La, B = Si.</p>
<p><strong>Branche ton piano numérique en USB</strong> (Chrome ou Edge) : les touches que tu joues s'allument sur les claviers du site, et les exercices d'oreille acceptent tes réponses jouées. Sans câble, clique sur les claviers à l'écran.</p>
<p><strong>Le son</strong> est un vrai piano à queue échantillonné, téléchargé au premier clic ; hors connexion, un synthé prend le relais. Tes réglages, tes scores et ta série restent dans ton navigateur, rien n'est envoyé nulle part.</p>`));
    },
  };

  /* ============ DEGRÉS ============ */
  const R3 = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], R7 = ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø'];
  const FN = ['T', 'S', 'T', 'S', 'D', 'T', 'D'];
  const PROGS = [
    ['Les quatre accords', 'I V vi IV', "La suite la plus utilisée de la pop des trente dernières années."],
    ['La même, départ mineur', 'vi IV I V', "Mêmes accords, on commence sur le vi : tout de suite plus mélancolique."],
    ['Années 50', 'I vi IV V', "Doo-wop, slows : la tonique, son relatif, puis IV–V pour revenir."],
    ['Trois accords', 'I IV V IV', "Rock, folk, chansons à boire : I, IV, V suffisent à harmoniser une gamme entière."],
    ['Canon', 'I V vi iii IV I IV V', "La basse descend par degrés conjoints. Des dizaines de chansons en sortent."],
    ['Cadence jazz', 'ii7 V7 Imaj7 Imaj7', "ii–V–I : la phrase harmonique de base du jazz. Voir le chapitre Accords jazz."],
    ['Anatole', 'Imaj7 vi7 ii7 V7', "I–vi–ii–V : le « turnaround » qui tourne en rond, fin de grille par excellence."],
    ['Cycle complet', 'vi7 ii7 V7 Imaj7 IVmaj7 viiø III7 vi7', "Les fondamentales descendent de quinte en quinte : toute la gamme y passe."],
    ['Andalouse', 'vi V IV III', "Descente mineure qui finit sur un III majeur (le V du relatif mineur)."],
    ['Mineur épique', 'vi IV V vi', "Musiques de film et de jeu vidéo ; essaie aussi vi–♭VII–… en mode éolien."],
    ['Emprunt plagal', 'I IV iv I', "Le iv mineur emprunté : la nostalgie instantanée."],
    ['Rock modal', 'I bVII IV I', "Le ♭VII vient du mixolydien : couleur rock britannique."],
    ['Gospel', 'I I7 IV #iv°7 I/5 V7 I', "Montée chromatique de la basse 4–♯4–5 : la signature gospel."],
  ];
  const OUT = [
    ['iv', 'Sous-dominante mineure', 'I IV iv I', "Empruntée au mineur. Sa note clé est le ♭6 de la tonalité."],
    ['♭VII', 'Emprunt mixolydien', 'I bVII IV I', "Un ton sous la tonique. Remplace souvent le V dans le rock."],
    ['♭VI', 'Emprunt éolien', 'I bVI bVII I', "♭VI–♭VII–I : la montée héroïque."],
    ['III7', 'Dominante du vi', 'I III7 vi IV', "Un accord majeur là où on attend du mineur : il « tire » vers le vi."],
    ['VI7', 'Dominante du ii', 'I VI7 ii7 V7', "Très courant en jazz : I–VI7–ii–V."],
    ['II7', 'Dominante du V', 'I II7 V7 I', "La « dominante de la dominante »."],
    ['I7', 'Dominante du IV', 'I I7 IV iv', "On ajoute la ♭7 au I pour basculer vers le IV."],
    ['♭II7', 'Substitution tritonique', 'ii7 bII7 Imaj7 Imaj7', "Remplace le V7 : la basse descend par demi-tons."],
    ['♯iv°7', 'Diminué de passage', 'IV #iv°7 I/5 V7', "Relie IV à V par la basse."],
  ];
  /* jeton avec basse "I/5" → accord I sur basse degré 5 */
  function rom(tok, tonic) {
    const [a, b] = tok.split('/'); const c = T.romanToChord(a, tonic); if (!c) return null;
    if (b) { c.bass = T.rootIn(tonic, T.parseDeg(b).semi); c.bpc = T.parseNote(c.bass).pc; }
    return c;
  }
  P.romChords = (str, tonic) => str.split(/\s+/).map(t => rom(t, tonic)).filter(Boolean);

  P.views.degres = {
    key: 'Ré', t: 'Les degrés', d: "Numéroter la gamme et les accords : la clé pour transposer et jouer d'oreille.",
    lead: "Une chanson n'est pas une suite de notes, c'est une suite de distances par rapport à une tonique. Donne un numéro à chaque note de la gamme et à chaque accord : tu n'apprends plus qu'un seul système au lieu de douze.",
    render(el) {
      const tonic = P.tonic(), kpc = P.S.key, tn = T.fmt(tonic);
      el.append(P.prose(`
<h2>Sept notes, sept numéros</h2>
<p>Une gamme majeure, c'est toujours la même recette : ton, ton, demi-ton, ton, ton, ton, demi-ton. On numérote ses notes de 1 à 7. En ${tn} majeur : ${T.scaleDegs('major').map(d => `<b>${d.t}</b> ${T.fmt(T.spell(tonic, d))}`).join(', ')}. Une mélodie devient alors une suite de chiffres. « Au clair de la lune » : 1 1 1 2 3 2 1 3 2 2 1. Joue ces chiffres dans n'importe quelle tonalité, c'est la même chanson.</p>
<p>Chaque degré a un caractère, indépendant de la tonalité, et c'est lui que ton oreille reconnaît déjà sans le savoir : le <b>1</b> est la maison ; le <b>5</b> est stable mais ouvert ; le <b>3</b> donne la couleur (majeur ou mineur) ; le <b>7</b> est aimanté vers le 1 un demi-ton plus haut ; le <b>4</b> veut redescendre sur le 3 ; le <b>2</b> et le <b>6</b> flottent. L'atelier Oreille entraîne exactement cela.</p>
<h2>Sept accords, toujours dans le même ordre</h2>
<p>Empile deux tierces sur chaque note de la gamme : tu obtiens sept accords, et leur nature ne change jamais. <b>I, IV, V sont majeurs ; ii, iii, vi sont mineurs ; vii° est diminué.</b> Majuscule pour majeur, minuscule pour mineur. Chacun a un rôle : repos (tonique), départ (sous-dominante), tension (dominante). Une grille de chanson est presque toujours un aller-retour repos → départ → tension → repos.</p>`));

      let sev = false, lab = P.S.lab, curChord = null;
      const kbHost = h('div'); const kb = new P.Keyboard(kbHost, { from: 48, to: 84 });
      const draw = () => {
        const base = P.marksScale(tonic, 'major', 48, 84, lab).map(x => ({ ...x, c: x.c === 'c' && !curChord ? 'c' : 'g' }));
        if (!curChord) return kb.mark(base);
        const ms = [T.lowIn(curChord.rpc, 48), ...T.closeVoicing(curChord, 68)];
        kb.mark([...base, ...ms.map(m => ({ m, c: m % 12 === curChord.rpc ? 'c' : 'a', t: lab === 'note' ? T.fmt(T.SIMPLE[m % 12]) : T.fmtDeg(T.ROMDEG[T.mod(m - kpc)]) }))]);
      };
      const chips = h('div', { class: 'chips' });
      const playCh = c => { curChord = c; draw(); A.piano(T.lowIn(c.rpc, 48), 0, 1.6, 0.6); A.chord(T.closeVoicing(c, 68), 0, 1.6, 0.5, 0.015); };
      const drawChips = () => {
        chips.innerHTML = '';
        (sev ? R7 : R3).forEach((r, i) => { const c = T.romanToChord(r, tonic); chips.append(h('button', { class: 'chip fn-' + FN[i], type: 'button', onclick: () => playCh(c) }, h('b', {}, T.roman(c, kpc)), h('span', {}, T.chordName(c)))); });
      };
      drawChips(); draw();
      el.append(P.tool(`Les accords de ${tn} majeur`,
        P.row(P.seg([[false, 'Trois sons'], [true, 'Quatre sons (septièmes)']], sev, v => { sev = v; drawChips(); }), P.labSeg(v => { lab = v; draw(); }),
          P.btn('Écouter la gamme', () => { curChord = null; draw(); const r = T.lowIn(kpc, 55); A.seq([...T.scaleSemis('major'), 12].map((s, i) => [r + s, i * 0.28, 0.4])); })),
        chips,
        h('p', { class: 'legend' }, h('span', { class: 'lg fn-T' }, 'repos'), h('span', { class: 'lg fn-S' }, 'départ'), h('span', { class: 'lg fn-D' }, 'tension'), ' Clique un accord : les chiffres sur le clavier sont les degrés de la gamme qui le composent.'),
        kbHost));

      /* progressions */
      el.append(P.prose(`<h2>Les suites d'accords à connaître par cœur</h2><p>Presque toutes les chansons recombinent une poignée de formules. Apprends-les en chiffres, écoute-les ici en ${tn}, puis change de tonalité en haut de page et rejoue-les. Quand tu cherches les accords d'une chanson, commence par te demander laquelle de ces formules tu entends.</p>`));
      const list = h('div', { class: 'plist' }); let playing = null;
      PROGS.forEach(([name, rs, txt]) => {
        const chs = P.romChords(rs, tonic);
        const cells = chs.map(c => h('span', { class: 'pc' }, h('b', {}, T.roman(c, kpc) + (c.bass ? '/' + T.fmtDeg(T.ROMDEG[T.mod(c.bpc - kpc)]) : '')), h('i', {}, T.chordName(c))));
        const b = P.btn('Écouter', () => {
          if (playing) playing.stop();
          list.querySelectorAll('.pc.on').forEach(x => x.classList.remove('on'));
          playing = P.playProg(chs, { bpm: 92, on: (c, i) => { cells.forEach((x, j) => x.classList.toggle('on', i === j)); curChord = c; draw(); }, onStop: () => cells.forEach(x => x.classList.remove('on')) });
        });
        list.append(h('div', { class: 'prow' }, h('div', { class: 'prow-h' }, h('strong', {}, name), h('span', {}, txt)), h('div', { class: 'prow-c' }, cells), b));
      });
      el.append(list);

      /* cercle */
      el.append(P.prose(`<h2>Le cercle des quintes</h2><p>Les douze tonalités rangées par ressemblance : deux voisines ne diffèrent que d'une note. Les voisins immédiats de ta tonique sont son IV (à gauche) et son V (à droite), et les mineurs à l'intérieur sont les ii, vi, iii. Autrement dit, les six accords principaux d'une tonalité sont un quartier du cercle. Lu dans le sens inverse des aiguilles, c'est le cycle des quartes : l'ordre dans lequel les jazzmen travaillent tout, parce que c'est l'ordre dans lequel les accords s'enchaînent (ii → V → I).</p>`));
      const R = 170, cx = 180, cy = 180;
      const pt = (r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
      const wedge = (r1, r2, a0, a1) => { const [x1, y1] = pt(r2, a0), [x2, y2] = pt(r2, a1), [x3, y3] = pt(r1, a1), [x4, y4] = pt(r1, a0); return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`; };
      let svg = `<svg viewBox="0 0 360 360" class="circle" role="group" aria-label="Cercle des quintes">`;
      for (let i = 0; i < 12; i++) {
        const pc = (i * 7) % 12, a0 = i * 30 - 105, cls = pc === kpc ? 'cur' : pc === (kpc + 5) % 12 || pc === (kpc + 7) % 12 ? 'near' : '';
        const [tx, ty] = pt(138, a0 + 15), [mx, my] = pt(88, a0 + 15);
        svg += `<g class="cw ${cls}" data-pc="${pc}" tabindex="0" role="button" aria-label="${T.fmt(T.KEYS[pc])} majeur"><path d="${wedge(110, R, a0, a0 + 30)}"/><path class="in" d="${wedge(64, 110, a0, a0 + 30)}"/><text x="${tx}" y="${ty + 6}" class="ct">${T.fmt(T.KEYS[pc])}</text><text x="${mx}" y="${my + 4}" class="cm">${T.fmt(T.MINKEYS[(pc + 9) % 12])}m</text></g>`;
      }
      svg += `<text x="180" y="176" class="cc">${tn}</text><text x="180" y="196" class="cs">majeur</text></svg>`;
      const cw = h('div', { class: 'circle-w', html: svg });
      cw.querySelectorAll('.cw').forEach(g => { const go = () => P.setKey(+g.dataset.pc); g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
      el.append(h('div', { class: 'split' }, cw, P.prose(`<p><b>Clique une tonalité</b> pour y transporter tout le site.</p><p>Armure de ${tn} majeur : ${(() => { const al = T.scaleDegs('major').map(d => T.spell(tonic, d)).filter(n => n.length > 1); return al.length ? al.map(n => T.fmt(n)).join(', ') : 'aucune altération'; })()}.</p><p>Relatif mineur : ${T.fmt(T.MINKEYS[(kpc + 9) % 12])} mineur (mêmes notes, tonique sur le 6).</p><p>Une bonne façon de travailler : chaque semaine, la tonalité suivante du cercle. Une seule note change, la main s'adapte sans s'en rendre compte.</p>`)));

      /* hors gamme */
      el.append(P.prose(`<h2>Quand un accord sort de la gamme</h2><p>Tôt ou tard une chanson contient un accord qui n'est pas dans les sept. Il vient presque toujours de l'une de ces deux familles : un accord <b>emprunté au mineur</b> (iv, ♭VI, ♭VII), ou une <b>dominante secondaire</b>, c'est-à-dire un accord majeur 7 placé une quinte au-dessus de l'accord qu'il annonce. Les connaître, c'est ne plus jamais être surpris par une grille.</p>`));
      const ol = h('div', { class: 'plist' });
      OUT.forEach(([r, name, ctx, txt]) => {
        const chs = P.romChords(ctx, tonic), c = rom(r.replace('♭', 'b').replace('♯', '#'), tonic);
        ol.append(h('div', { class: 'prow' }, h('div', { class: 'prow-h' }, h('strong', {}, r + '  ' + T.chordName(c)), h('span', {}, name + '. ' + txt)),
          h('div', { class: 'prow-c' }, chs.map(x => h('span', { class: 'pc' }, h('b', {}, T.roman(x, kpc)), h('i', {}, T.chordName(x))))),
          P.btn('Écouter en contexte', () => P.playProg(chs, { bpm: 88, on: x => { curChord = x; draw(); } }))));
      });
      el.append(ol);
      el.append(P.prose(`<h2>Comment travailler ce chapitre</h2><ol><li>Prends une chanson que tu joues déjà. Écris sa grille en chiffres (le <a href="#/transposeur">Transposeur</a> le fait pour toi).</li><li>Joue-la dans la tonalité du jour sans regarder les noms d'accords : seulement les chiffres.</li><li>Chante la basse en disant les numéros. C'est ce qui grave le système dans l'oreille.</li><li>Fais de même avec la mélodie : trouve sur quel degré elle commence, puis laisse la main suivre.</li></ol>`));
    },
  };

  /* ============ TRANSPOSEUR ============ */
  const EX = 'Am  F  C  G\nAm  F  C  E7\n\nDm7  G7  Cmaj7  A7';
  P.views.transposeur = {
    key: 'Ré♯', t: 'Transposeur', d: "Colle une grille : elle ressort en degrés et dans la tonalité de ton choix.",
    lead: "Colle les accords d'une chanson tels que tu les trouves sur un site de grilles, avec ou sans paroles. Tu obtiens son squelette en chiffres romains, et la même grille dans la tonalité choisie en haut de page.",
    render(el) {
      const ta = h('textarea', { rows: 7, spellcheck: 'false', 'aria-label': 'Grille à transposer' }); ta.value = P.S.tx || EX;
      const out = h('div', { class: 'tx-out' }), info = h('p', { class: 'hint' });
      let src = 'auto', flat = [], playing = null;
      const kbHost = h('div'), kb = new P.Keyboard(kbHost, { from: 36, to: 84 });
      const show = c => kb.mark(P.marksChord(c, [T.lowIn(c.bass ? c.bpc : c.rpc, 36), ...T.closeVoicing(c, 64)], P.S.lab));
      const srcSel = h('span');
      function run() {
        P.S.tx = ta.value; P.save(); out.innerHTML = ''; flat = [];
        const lines = ta.value.split('\n').map(l => {
          const items = l.split(/(\s+|\|)/).filter(x => x !== '').map(t => ({ t, sp: /^\s+$/.test(t), bar: t === '|', ch: null }));
          items.forEach(i => { if (!i.sp && !i.bar) i.ch = T.parseChord(i.t); });
          const words = items.filter(i => !i.sp && !i.bar);
          return { items, isCh: words.length > 0 && words.filter(i => i.ch).length / words.length >= 0.6, raw: l };
        });
        const all = lines.filter(l => l.isCh).flatMap(l => l.items.filter(i => i.ch).map(i => i.ch));
        if (!all.length) { info.textContent = "Aucun accord reconnu. Écris-les en lettres (C, Am7, F#m, Bb/D…) ou en Do-Ré-Mi, séparés par des espaces."; return; }
        const det = T.detectKey(all), from = src === 'auto' ? det.pc : +src, to = P.tonic();
        info.textContent = `Tonalité d'origine ${src === 'auto' ? 'détectée' : 'choisie'} : ${T.fmt(T.KEYS[from])} majeur` + (det.minor && src === 'auto' ? ` (la chanson est en ${T.fmt(T.MINKEYS[(from + 9) % 12])} mineur, son relatif : les degrés sont comptés depuis le majeur, comme le font les musiciens de studio)` : '') + `. Écart : ${T.mod(P.S.key - from)} demi-ton(s) vers le haut.`;
        lines.forEach(l => {
          if (!l.isCh) { out.append(h('div', { class: 'tx-lyr' }, l.raw || ' ')); return; }
          const row = h('div', { class: 'tx-line' });
          l.items.forEach(i => {
            if (i.bar) return row.append(h('span', { class: 'tx-bar' }));
            if (i.sp) return row.append(h('span', { class: 'tx-sp', style: `width:${Math.min(i.t.length, 12) * 0.35}em` }));
            if (!i.ch) return row.append(h('span', { class: 'tx-w' }, i.t));
            const n = T.transpose(i.ch, from, to); flat.push(n);
            const b = h('button', { class: 'tx-ch', type: 'button', onclick: () => { show(n); A.piano(T.lowIn(n.bass ? n.bpc : n.rpc, 36), 0, 1.5, 0.6); A.chord(T.closeVoicing(n, 64), 0, 1.5, 0.5, 0.012); } },
              h('small', {}, T.chordName(i.ch)), h('em', {}, T.roman(i.ch, from)), h('b', {}, T.chordName(n)));
            n._el = b; row.append(b);
          });
          out.append(row);
        });
      }
      const mkSel = () => { srcSel.innerHTML = ''; srcSel.append(P.sel([['auto', 'Détection automatique'], ...T.KEYS.map((k, i) => [i, T.fmt(k) + ' majeur / ' + T.fmt(T.MINKEYS[(i + 9) % 12]) + ' mineur'])], src, v => { src = v; run(); })); };
      mkSel(); ta.addEventListener('input', run);
      el.append(P.tool('La grille',
        ta,
        P.row(P.field("Tonalité d'origine", srcSel),
          P.btn('− ½ ton', () => P.setKey((P.S.key + 11) % 12)), P.btn('+ ½ ton', () => P.setKey((P.S.key + 1) % 12)),
          P.btn('Écouter', () => { if (playing && playing.on) return playing.stop(); playing = P.playProg(flat, { bpm: 96, on: c => { out.querySelectorAll('.on').forEach(x => x.classList.remove('on')); c._el.classList.add('on'); show(c); }, onStop: () => out.querySelectorAll('.on').forEach(x => x.classList.remove('on')) }); }, 'solid'),
          P.btn('Effacer', () => { ta.value = ''; run(); ta.focus(); })),
        info, h('p', { class: 'legend' }, 'Pour chaque accord : en petit l\'original, en couleur le degré, en gras la version en ' + T.fmt(P.tonic()) + '. Clique un accord pour le voir.'),
        out, kbHost));
      run();
      el.append(P.prose(`
<h2>Ce que la ligne du milieu t'apprend</h2>
<p>Les chiffres romains sont la vraie identité de la chanson. Prends l'habitude de les lire <em>avant</em> les noms d'accords : au bout de quelques dizaines de grilles tu verras revenir les mêmes mots (I–V–vi–IV, ii–V–I, vi–IV–I–V) et tu commenceras à les reconnaître à l'oreille.</p>
<h2>Transposer de tête, la méthode</h2>
<ol><li>Trouve le I : c'est l'accord sur lequel la chanson « rentre à la maison », souvent le dernier.</li><li>Récite la gamme de la nouvelle tonalité en posant un doigt par degré. Les accords tombent dessus : majeur sur 1, 4, 5 ; mineur sur 2, 3, 6.</li><li>Traite à part les accords hors gamme : la plupart sont des dominantes secondaires, donc « le V de quelque chose ».</li><li>Garde la mélodie pour la fin : si tu connais son degré de départ, la main droite suit.</li></ol>
<p>Pour choisir une tonalité qui convient à une voix : descends de 2 ou 3 demi-tons pour une voix grave, monte d'autant pour une voix aiguë, puis ajuste.</p>`));
    },
  };

  /* ============ MODES ============ */
  P.views.modes = {
    key: 'Mi', t: 'Modes et gammes', d: "Sept couleurs tirées d'une seule gamme, plus les gammes du blues et du jazz.",
    lead: "Un mode n'est pas une gamme de plus à apprendre : c'est la gamme majeure avec une ou deux notes déplacées, et c'est cette note-là qui fait toute la couleur. Écoute chaque mode sur le même tapis d'accords, depuis la même tonique.",
    render(el) {
      const tonic = P.tonic(), kpc = P.S.key, tn = T.fmt(tonic);
      let id = P.S.mode && T.SCALES[P.S.mode] ? P.S.mode : 'dorian', lab = P.S.lab, bpm = 92;
      const kbHost = h('div'), kb = new P.Keyboard(kbHost, { from: 48, to: 84 }), info = h('div', { class: 'mode-info' });
      const band = new P.Band({ bars: [], get bpm() { return bpm; }, feel: 'pop' });
      const groups = {}; Object.entries(T.SCALES).forEach(([k, s]) => (groups[s.g] = groups[s.g] || []).push([k, s.n]));
      const selHost = h('span');
      const draw = () => {
        const s = T.SCALES[id], degs = T.scaleDegs(id);
        kb.mark(P.marksScale(tonic, id, 48, 84, lab).map(x => { const d = degs.find(q => T.mod(kpc + q.semi) === x.m % 12); return d.t === s.ch ? { ...x, c: 'b' } : x; }));
        const maj = T.scaleSemis('major');
        info.innerHTML = '';
        info.append(h('h3', {}, tn + ' ' + s.n.toLowerCase()),
          h('div', { class: 'formula' }, degs.map(d => h('span', { class: d.t === s.ch ? 'ch' : d.a || !maj.includes(d.semi) ? 'alt' : '' }, h('b', {}, T.fmtDeg(d.t)), h('i', {}, T.fmt(T.spell(tonic, d)))))),
          h('p', {}, s.d),
          h('p', { class: 'hint' }, `Note caractéristique : ${T.fmtDeg(s.ch)} (en rose sur le clavier). Insiste dessus quand tu improvises, sinon on n'entend qu'une gamme majeure ou mineure ordinaire.` + (s.par != null ? ` Mêmes notes que ${T.fmt(T.KEYS[(kpc + s.par) % 12])} majeur.` : '') + ` Tapis : ${T.parseGrid(s.vamp, tonic).map(b => b.map(T.chordName).join(' ')).join(' | ')}.`));
        band.bars = T.parseGrid(s.vamp, tonic);
        selHost.innerHTML = ''; selHost.append(P.sel(Object.entries(groups).map(([g, items]) => ({ group: g, items })), id, v => pick(v)));
        ladder.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
      };
      const pick = v => { id = v; P.S.mode = v; P.save(); draw(); };
      const listen = () => {
        const r = T.lowIn(kpc, 55), semis = T.scaleSemis(id), up = [...semis, 12], seq = [...up, ...up.slice(0, -1).reverse()];
        const t0 = A.seq(seq.map((s, i) => [r + s, i * 0.26, 0.36]));
        seq.forEach((s, i) => A.at(t0 + i * 0.26, () => kb.live([r + s]))); A.at(t0 + seq.length * 0.26, () => kb.live([]));
      };
      const ladder = h('div', { class: 'ladder' });
      ['lydian', 'major', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian'].forEach(k => {
        const maj = T.scaleSemis('major');
        ladder.append(h('button', { type: 'button', 'data-id': k, onclick: () => pick(k) }, h('strong', {}, T.SCALES[k].n.replace(/ \(.*/, '')),
          h('span', { class: 'formula mini' }, T.scaleDegs(k).map(d => h('span', { class: maj.includes(d.semi) ? '' : 'alt' }, T.fmtDeg(d.t))))));
      });
      const pb = P.playToggle(band.loop, ['Lancer le tapis et improviser', 'Arrêter le tapis']);
      el.append(P.tool('Explorer une gamme en ' + tn,
        P.row(P.field('Gamme', selHost), P.labSeg(v => { lab = v; draw(); })),
        info, kbHost,
        P.row(P.btn('Écouter la gamme', listen), pb, P.tempo('modes', 92, v => (bpm = v)))));
      el.append(P.prose(`<h2>Du plus clair au plus sombre</h2><p>Voici les sept modes rangés par luminosité, tous depuis la même tonique. De l'un au suivant, <em>une seule note</em> baisse d'un demi-ton. C'est la manière utile de les retenir : pas « le mode de Ré », mais « mineur avec une sixte majeure ».</p>`), ladder);
      draw();
      el.append(P.prose(`
<h2>À quoi ça sert vraiment</h2>
<p><b>Pour la pop et la chanson</b> : savoir qu'un morceau est en éolien, en dorien ou en mixolydien t'explique d'un coup pourquoi il contient un ♭VII ou un IV majeur en mineur, et te dit quelles notes jouer à la main droite.</p>
<p><b>Pour le jazz</b> : chaque type d'accord a sa gamme. m7 → dorien ; 7 → mixolydien (ou altérée s'il résout sur du mineur) ; maj7 → majeur ou lydien ; m7♭5 → locrien. Sur un ii–V–I majeur, ces trois gammes sont les mêmes sept notes : on pense une seule tonalité, et on vise les notes de l'accord du moment. La page <a href="#/grilles">Grilles</a> affiche la gamme de chaque accord en temps réel.</p>
<p><b>Pour improviser tout de suite</b> : lance le tapis, joue la gamme lentement, puis des groupes de trois notes, puis laisse des silences. Reviens souvent sur la note caractéristique et sur la tonique.</p>
<h2>Deux raccourcis de pianiste</h2>
<p><b>La pentatonique décalée.</b> Sur un accord maj7, joue la pentatonique majeure de la quinte (sur Cmaj7 : penta de Sol) pour un son lydien moderne. Sur un m7, la pentatonique mineure de la quinte donne la neuvième et la onzième.</p>
<p><b>Le mineur mélodique partout.</b> Sur un accord 7 altéré, joue le mineur mélodique un demi-ton au-dessus. Sur un 7♯11, celui de la quinte. Sur un m7♭5, celui de la tierce mineure. Une seule gamme sous les doigts, trois couleurs.</p>`));
    },
  };
})();
