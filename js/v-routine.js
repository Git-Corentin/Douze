/* Douze — séance du jour, repères */
(function () {
  const P = window.P, T = P.T, A = P.A, h = P.h;
  const CH = [
    k => `Joue « Joyeux anniversaire » en ${k}, mélodie et trois accords (I, IV, V), sans tâtonner plus de deux fois.`,
    k => `Harmonise la gamme de ${k} majeur descendante, un accord par note, en n'utilisant que I, IV et V.`,
    k => `Prends le refrain d'une chanson que tu joues en Do et joue-le en ${k}, en pensant en chiffres.`,
    k => `ii–V–I en ${k} : main gauche en coquilles, main droite qui ne joue que les tierces de chaque accord.`,
    k => `Improvise deux minutes en ${k} avec trois notes seulement : 1, 3 et 5. Tout est dans le rythme.`,
    k => `La vague 1-5-8-9-10 sur I–V–vi–IV en ${k}, les yeux fermés sur le dernier tour.`,
    k => `Trouve à l'oreille les accords du refrain d'une chanson entendue aujourd'hui, puis écris-les en degrés.`,
    k => `Blues en ${k} : douze mesures de main gauche en coquilles, puis ajoute la gamme blues.`,
    k => `Joue « Au clair de la lune » en ${k} dans trois modes : majeur, mineur, puis dorien.`,
    k => `Chante une phrase de quatre notes, puis joue-la en ${k}. Dix fois, dix phrases différentes.`,
    k => `Une ballade que tu connais, en ${k}, avec des dixièmes à la main gauche et une septième ajoutée à chaque accord.`,
    k => `Sur I–vi–ii–V en ${k}, joue un arpège 3-5-7-9 montant sur chaque accord, en croches swinguées.`,
    k => `Passe une chanson simple au Jazzifieur niveau 3 et joue le résultat en ${k}, lentement, en comprenant chaque accord ajouté.`,
    k => `Trois chansons différentes sur les mêmes quatre accords (I–V–vi–IV) en ${k}, enchaînées sans t'arrêter.`,
  ];
  P.challenge = () => CH[P.dayNum() % CH.length](T.fmt(T.KEYS[P.keyOfDay()]) + ' majeur');
  const BLOCKS = [
    ['Mettre la tonalité dans les doigts', 'arpeges', 0.15, k => `Gamme de ${k} lentement, puis la formule de main gauche du moment sur I–V–vi–IV. Ensuite « Le tour des 12 » à tempo lent.`],
    ['Penser en degrés', 'transposeur', 0.2, k => `Une chanson de ton répertoire, en ${k}. Dis les chiffres à voix haute en changeant d'accord.`],
    ['Oreille', 'oreille', 0.15, () => `Degrés, puis suites d'accords. Arrête-toi sur une réussite.`],
    ['Accords jazz', 'accords', 0.2, k => `ii–V–I en ${k} et dans les deux tonalités suivantes du cycle : coquilles, puis sans fondamentale.`],
    ['Phrasé', 'phrase', 0.15, k => `Une seule phrase, en question et réponse, en ${k}. Chante-la avant de la jouer.`],
    ['Jouer', 'grilles', 0.15, () => `Une grille, la rythmique, et aucune consigne. C'est la récompense, et c'est là que tout se mélange.`],
  ];

  /* ----- chrono de séance : vit en dehors des pages, survit aux changements de page et au rechargement ----- */
  const fmtT = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const pill = h('div', { class: 'pill', hidden: true });
  document.body.append(pill);
  const Se = (P.session = {
    onTick: null,
    secs: i => Math.round(((P.S.dur || 20) * 60 * BLOCKS[i][2]) / 30) * 30,
    done() { const d = P.today(); Object.keys(P.S.done).forEach(k => { if (k !== d) delete P.S.done[k]; }); return (P.S.done[d] = P.S.done[d] || {}); },
    left() { const t = P.S.timer; return !t ? 0 : t.on ? Math.max(0, Math.ceil((t.end - Date.now()) / 1000)) : t.left; },
    start(i) { A.ctx(); P.S.timer = { i, on: true, end: Date.now() + Se.secs(i) * 1000, left: Se.secs(i), day: P.today() }; P.save(); Se.draw(); },
    pause() { const t = P.S.timer; if (!t || !t.on) return; t.left = Se.left(); t.on = false; P.save(); Se.draw(); },
    resume() { const t = P.S.timer; if (!t || t.on) return; A.ctx(); t.end = Date.now() + t.left * 1000; t.on = true; P.save(); Se.draw(); },
    stop() { P.S.timer = null; P.save(); Se.draw(); },
    check(i, v) {
      const done = Se.done(), day = P.today(); done[i] = v;
      if (BLOCKS.every((_, k) => done[k]) && P.S.streak.last !== day) {
        const y = new Date(Date.now() - 864e5), ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
        P.S.streak = { n: P.S.streak.last === ys ? P.S.streak.n + 1 : 1, last: day };
      }
      P.save();
    },
    tick() {
      const t = P.S.timer;
      if (t && t.day !== P.today()) { P.S.timer = null; P.save(); }
      else if (t && t.on && Se.left() <= 0) {
        P.S.timer = null; Se.check(t.i, true);
        try { A.seq([[72, 0, 0.5], [76, 0.18, 0.5], [79, 0.36, 0.9]]); } catch (e) { /* pas de son sans geste */ }
        if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
        Se.draw(true);
      }
      const b = pill.querySelector('b'); if (b && P.S.timer) b.textContent = fmtT(Se.left());
      if (Se.onTick) Se.onTick();
    },
    draw(finished) {
      const t = P.S.timer; pill.hidden = !t; pill.innerHTML = '';
      if (t) pill.append(h('a', { href: '#/routine', title: 'Revenir à la séance' }, (t.i + 1) + '. ' + BLOCKS[t.i][0]), h('b', {}, fmtT(Se.left())),
        P.btn(t.on ? 'Pause' : 'Reprendre', () => (t.on ? Se.pause() : Se.resume())), h('button', { type: 'button', class: 'pill-x', 'aria-label': 'Arrêter le chrono', onclick: Se.stop }, '×'));
      if (Se.onDraw) Se.onDraw(finished);
    },
  });
  setInterval(Se.tick, 500); Se.draw();

  P.views.routine = {
    key: 'Do♯', t: 'Séance du jour', d: "Un plan de travail minuté, dans la tonalité du jour, avec ta série en cours.",
    lead: "Vingt minutes structurées valent mieux que deux heures à rejouer ce qu'on sait déjà. La séance suit toujours le même ordre : les doigts, la tête, l'oreille, puis la musique.",
    render(el) {
      const kd = P.keyOfDay(), kn = T.fmt(T.KEYS[kd]), day = P.today();
      const list = h('div', { class: 'blocks' }), head = h('div', { class: 'today' });
      const drawHead = () => {
        head.innerHTML = '';
        head.append(h('div', { class: 'today-k' }, h('span', { class: 'today-l' }, 'Tonalité du jour'), h('strong', {}, kn), h('span', { class: 'today-s' }, 'majeur')),
          h('div', { class: 'today-b' }, h('p', { class: 'today-c' }, h('b', {}, 'Défi du jour. '), P.challenge()),
            P.row(P.S.key === kd ? h('span', { class: 'hint' }, 'Le site est déjà réglé sur cette tonalité.') : P.btn('Passer le site en ' + kn, () => P.setKey(kd), 'solid'),
              P.field('Durée', P.seg([[10, '10 min'], [20, '20 min'], [30, '30 min'], [45, '45 min']], P.S.dur || 20, v => { P.S.dur = v; P.save(); Se.stop(); }))),
            h('p', { class: 'hint' }, P.S.streak.n ? `Série : ${P.S.streak.n} jour${P.S.streak.n > 1 ? 's' : ''}` + (P.S.streak.last === day ? ', séance du jour terminée.' : '.') : 'Coche les six étapes pour démarrer une série.')));
      };
      const draw = () => {
        const done = Se.done(), t = P.S.timer; list.innerHTML = '';
        BLOCKS.forEach(([name, link, , txt], i) => {
          const mine = t && t.i === i;
          const b = P.btn(mine ? (t.on ? 'Pause' : 'Reprendre') : 'Démarrer', () => (mine ? (t.on ? Se.pause() : Se.resume()) : Se.start(i)), mine && t.on ? 'on' : '');
          list.append(h('div', { class: 'block' + (mine ? ' run' : '') + (done[i] ? ' done' : '') },
            h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!done[i], onchange: e => { Se.check(i, e.target.checked); drawHead(); draw(); } }), h('span', {}, name)),
            h('p', {}, txt(kn + ' majeur')), h('div', { class: 'block-a' }, h('span', { class: 'clock' }, fmtT(mine ? Se.left() : Se.secs(i))), b,
              mine ? P.btn('Remettre à zéro', Se.stop) : null, h('a', { class: 'btn', href: '#/' + link }, 'Ouvrir ' + P.views[link].t.toLowerCase()))));
        });
      };
      Se.onDraw = () => { drawHead(); draw(); };
      Se.onTick = () => { const c = list.querySelector('.block.run .clock'); if (c && P.S.timer) c.textContent = fmtT(Se.left()); };
      drawHead(); draw();
      el.append(head, h('p', { class: 'hint' }, 'Le chrono te suit : démarre une étape, ouvre la page correspondante, il reste affiché en bas de l\'écran et sonne à la fin.'), h('h2', { class: 'h2' }, 'Les six étapes'), list);
      el.append(P.prose(`
<h2>Un programme sur douze semaines</h2>
<p>Si tu veux un fil conducteur, voici un ordre qui fonctionne. Chaque semaine, la séance quotidienne reste la même ; seul le contenu de chaque étape avance.</p>
<ol>
<li><b>Semaines 1 et 2.</b> Degrés : numéroter mélodies et accords de dix chansons que tu joues déjà. Oreille : 1, 3, 5, puis harmoniser des mélodies avec I, IV, V. Main gauche : 1-5-8 et dixièmes sur le cycle des quartes.</li>
<li><b>Semaines 3 et 4.</b> Les mêmes chansons dans trois tonalités chacune. Oreille : 1 à 5, harmoniser avec le vi, suites I–IV–V–vi. Main gauche : la vague, par familles de formes.</li>
<li><b>Semaines 5 et 6.</b> Accords de septième et coquilles dans les douze tonalités. Premier blues. Oreille : gamme entière, accords à trois sons, airs connus à harmoniser en tonalité aléatoire.</li>
<li><b>Semaines 7 et 8.</b> ii–V–I en coquilles puis sans fondamentale. Premier standard (thème et coquilles). Phrasé : swing, notes cibles, approche chromatique.</li>
<li><b>Semaines 9 et 10.</b> Modes : dorien, mixolydien, lydien sur tapis. Deuxième standard. Encerclements, arpèges 3-5-7-9. Oreille : septièmes, suites avec emprunts.</li>
<li><b>Semaines 11 et 12.</b> Extensions et altérations, substitution tritonique, Jazzifieur à la main. Relever quatre mesures d'un solo et les transposer. Troisième standard.</li>
</ol>
<h2>Trois règles pour que ça tienne</h2>
<p><b>Lent.</b> Si tu te trompes deux fois de suite, le tempo est trop haut. La fluidité dans les tonalités difficiles ne vient que de répétitions justes.</p>
<p><b>Court et quotidien.</b> La mémoire des mains se construit pendant le sommeil. Dix minutes sept fois valent mieux que soixante-dix minutes une fois.</p>
<p><b>Toujours finir par jouer.</b> La dernière étape n'est pas facultative : c'est elle qui transforme l'exercice en vocabulaire.</p>`));
    },
  };

  P.views.reperes = {
    key: 'Fa♯', t: 'Repères', d: "Lexique, standards à apprendre dans l'ordre, pianistes à écouter, livres.",
    lead: "Ce qu'il faut savoir nommer, quoi écouter, quoi jouer en premier, et où aller plus loin.",
    render(el) {
      el.append(P.prose(`
<h2>Lexique</h2>
<dl class="gloss">
<dt>Degré</dt><dd>Position d'une note ou d'un accord dans la gamme, de 1 à 7. Les accords s'écrivent en chiffres romains.</dd>
<dt>Tonique, sous-dominante, dominante</dt><dd>Les trois fonctions : repos (I, vi, iii), départ (IV, ii), tension (V, vii°).</dd>
<dt>Relatif mineur</dt><dd>La gamme mineure qui partage les notes d'une gamme majeure ; sa tonique est le degré 6.</dd>
<dt>Renversement</dt><dd>Le même accord avec une autre note que la fondamentale à la basse. Sert à enchaîner sans sauter.</dd>
<dt>Voicing</dt><dd>La disposition choisie pour un accord : quelles notes, dans quel ordre, à quelle hauteur, dans quelle main.</dd>
<dt>Notes guides</dt><dd>La tierce et la septième. Elles suffisent à faire entendre un accord.</dd>
<dt>Coquille (shell)</dt><dd>Fondamentale, tierce et septième, sans la quinte.</dd>
<dt>Sans fondamentale (rootless)</dt><dd>Voicing à quatre notes où 9 et 13 remplacent 1 et 5.</dd>
<dt>ii–V–I</dt><dd>Mineur 7, dominante 7, majeur 7, à la quinte les uns des autres. La cadence du jazz.</dd>
<dt>Turnaround (anatole)</dt><dd>Formule de deux mesures qui ramène au début : I–vi–ii–V.</dd>
<dt>Dominante secondaire</dt><dd>Accord 7 hors gamme qui se résout une quinte plus bas sur un accord de la gamme : « le V du ii ».</dd>
<dt>Substitution tritonique</dt><dd>Remplacer un V7 par l'accord 7 situé à trois tons : mêmes notes guides, basse chromatique.</dd>
<dt>Extension, altération</dt><dd>Notes ajoutées au-dessus de la septième (9, 11, 13) ; altérées quand on les hausse ou les baisse (♭9, ♯9, ♯11, ♭13).</dd>
<dt>Mode</dt><dd>Une gamme entendue depuis une autre de ses notes ; mieux : une gamme majeure ou mineure avec une note caractéristique déplacée.</dd>
<dt>Encerclement (enclosure)</dt><dd>Jouer la note du dessus puis celle du dessous avant la note visée.</dd>
<dt>Comping</dt><dd>L'art d'accompagner : plaquer des voicings sur des rythmes syncopés, en laissant de l'air.</dd>
<dt>Charleston</dt><dd>Le rythme d'accompagnement de base : un accord sur le premier temps, un autre sur le « et » du deuxième.</dd>
<dt>Walking bass</dt><dd>Ligne de basse en noires qui relie les fondamentales par des notes de l'accord et des approches chromatiques.</dd>
<dt>Chorus</dt><dd>Un tour complet de la grille. « Prendre un chorus » : improviser pendant un tour.</dd>
<dt>Relevé</dt><dd>Retrouver à l'oreille, note à note, ce que joue un musicien sur un enregistrement.</dd>
</dl>
<h2>Douze standards, dans un ordre qui a du sens</h2>
<ol>
<li><b>C Jam Blues</b> (Ellington). Deux notes de thème : toute l'attention va à la grille du blues.</li>
<li><b>Now's the Time</b> ou <b>Billie's Bounce</b> (Parker). Le blues jazz avec ses ii–V.</li>
<li><b>Les Feuilles mortes</b> (Kosma). ii–V–I majeur puis mineur, en boucle : le standard-école.</li>
<li><b>Blue Bossa</b> (Dorham). Seize mesures, une cadence mineure et une modulation.</li>
<li><b>Summertime</b> (Gershwin). Mineur, lent, idéal pour les voicings.</li>
<li><b>So What</b> (Davis). Deux accords : dorien et quartes.</li>
<li><b>Fly Me to the Moon</b> (Howard). Le cycle des quartes dans toute sa longueur.</li>
<li><b>Satin Doll</b> (Ellington). Des ii–V qui se déplacent par tons.</li>
<li><b>All of Me</b> (Marks/Simons). Dominantes secondaires à chaque ligne.</li>
<li><b>Take the A Train</b> (Strayhorn). Le II7♯11 et le lydien dominant.</li>
<li><b>There Will Never Be Another You</b> (Warren). Une grille complète et logique.</li>
<li><b>All the Things You Are</b> (Kern). Cinq tonalités enchaînées par ii–V–I : l'examen de passage.</li>
</ol>
<p>Pour chacun : apprends la mélodie d'oreille sur un enregistrement chanté, écris la grille en degrés, joue thème et coquilles, puis improvise avec la page <a href="#/grilles">Grilles</a> en y collant la grille.</p>
<h2>Qui écouter pour le piano</h2>
<p><b>Pour le swing et la clarté</b> : Wynton Kelly, Red Garland, Oscar Peterson, Erroll Garner. <b>Pour le bebop</b> : Bud Powell, Barry Harris, Tommy Flanagan. <b>Pour l'harmonie</b> : Bill Evans, Herbie Hancock, Keith Jarrett. <b>Pour le modal et les quartes</b> : McCoy Tyner, Chick Corea. <b>Pour la singularité</b> : Thelonious Monk, Ahmad Jamal. <b>Pour le blues et le gospel</b> : Gene Harris, Bobby Timmons, Ray Charles. <b>En France</b> : Michel Petrucciani, Martial Solal, Jacky Terrasson.</p>
<p>Un disque pour commencer : « Kind of Blue » (Miles Davis, 1959), avec Bill Evans et Wynton Kelly. Tout ce site s'y entend.</p>
<h2>Livres et méthodes</h2>
<ul>
<li><b>Mark Levine, <i>Le Livre du piano jazz</i></b>. La référence : voicings, gammes, exemples tirés des disques.</li>
<li><b>Mark Levine, <i>Le Livre de la théorie du jazz</i></b>. L'harmonie accord-gamme en détail.</li>
<li><b>Phil DeGreg, <i>Jazz Keyboard Harmony</i></b>. Les voicings, pas à pas, dans les douze tonalités.</li>
<li><b>Jamey Aebersold, vol. 1, 3 et 54</b>. Play-along historiques : improvisation, ii–V–I, standards faciles.</li>
<li><b>Bert Ligon, <i>Connecting Chords with Linear Harmony</i></b>. Comment les lignes bebop relient les accords par les notes guides.</li>
<li><b>Hal Crook, <i>How to Improvise</i></b>. Le rythme, les silences, la construction d'un solo.</li>
<li><b>Les ateliers de Barry Harris</b> (nombreuses vidéos). La gamme de sixte diminuée et le bebop transmis oralement.</li>
<li><b>Philippe Baudoin, <i>Jazz mode d'emploi</i></b>. En français, très complet sur l'harmonie.</li>
</ul>
<h2>Relever un solo, mode d'emploi</h2>
<ol><li>Choisis quatre à huit mesures qui te font envie, pas plus.</li><li>Écoute-les vingt fois. Chante-les avec le disque, puis sans.</li><li>Trouve la première note au clavier, puis avance phrase par phrase. Ralentis l'enregistrement si besoin.</li><li>Écris la phrase en degrés de chaque accord.</li><li>Joue-la avec le disque, puis dans trois autres tonalités, puis glisse-la dans tes propres improvisations.</li></ol>`));
    },
  };
})();
