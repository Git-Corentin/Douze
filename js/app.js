/* Douze — navigation, barre de tonalité, réglages */
(function () {
  const P = window.P, T = P.T, A = P.A, h = P.h;
  const ORDER = [['accueil', 'w'], ['routine', 'b'], ['degres', 'w'], ['transposeur', 'b'], ['modes', 'w'], ['arpeges', 'w'], ['reperes', 'b'], ['accords', 'w'], ['jazzifieur', 'b'], ['phrase', 'w'], ['grilles', 'b'], ['oreille', 'w']];
  const SHORT = { routine: 'Séance', degres: 'Degrés', modes: 'Modes', arpeges: 'Arpèges', phrase: 'Phrasé', oreille: 'Oreille' };
  const nav = document.getElementById('nav'), main = document.getElementById('main');

  function buildNav() {
    const piano = h('div', { class: 'piano' }); let wi = -1;
    ORDER.forEach(([id, col]) => {
      const v = P.views[id]; if (col === 'w') wi++;
      piano.append(h('a', { href: '#/' + (id === 'accueil' ? '' : id), class: 'pk pk-' + col, 'data-id': id, style: col === 'b' ? `--i:${wi}` : null }, h('span', { class: 'pk-n' }, v.key), h('span', { class: 'pk-t' }, SHORT[id] || v.t)));
    });
    nav.append(h('a', { class: 'wordmark', href: '#/', 'aria-label': 'Douze, accueil' }, 'Douze'), h('p', { class: 'nav-s' }, 'Le piano d\'oreille, dans toutes les tonalités'), piano);
  }
  /* titre « swingué » : lettres alternativement larges et étroites, comme des croches longues et courtes */
  function swing(text) {
    const el = h('h1', { 'aria-label': text }); let i = 0;
    text.split(' ').forEach((w, wi, arr) => {
      const word = h('span', { class: 'w', 'aria-hidden': 'true' });
      [...w].forEach(ch => word.append(h('span', { class: i++ % 2 ? 's' : 'l' }, ch)));
      el.append(word, wi < arr.length - 1 ? ' ' : '');
    });
    return el;
  }
  function keybar() {
    const bar = h('div', { class: 'keybar' }), keys = h('div', { class: 'keys', role: 'group', 'aria-label': 'Tonalité du site' });
    T.KEYS.forEach((k, i) => keys.append(h('button', { type: 'button', class: (i === P.S.key ? 'on' : '') + ([1, 3, 6, 8, 10].includes(i) ? ' bk' : ''), 'aria-pressed': i === P.S.key ? 'true' : 'false', onclick: () => P.setKey(i) }, T.fmt(k))));
    const snd = h('span', { class: 'hint' }), midi = h('span', { class: 'hint' });
    P.onSound = () => { snd.textContent = 'Son actuel : ' + (P.S.samples ? A.sampleState : 'synthé') + '.'; midi.textContent = 'MIDI : ' + (P.midiState || 'en attente') + '.'; };
    P.onSound();
    const set = h('details', { class: 'settings' }, h('summary', {}, 'Réglages'),
      h('div', { class: 'settings-b' },
        P.field('Noms des notes', P.seg([[true, 'Do Ré Mi'], [false, 'C D E']], P.S.fr, v => { P.S.fr = v; P.save(); route(true); })),
        P.range('Volume', 0, 100, Math.round(P.S.vol * 100), v => { P.S.vol = v / 100; P.save(); A.setVol(P.S.vol); }, ' %'),
        P.field('Son du piano', P.seg([[true, 'Piano à queue'], [false, 'Synthé']], P.S.samples, v => { P.S.samples = v; P.save(); if (v) A.loadSamples(); P.onSound(); })), snd,
        P.field('Clavier MIDI : faire sonner ses notes ici', P.seg([[false, 'Non'], [true, 'Oui']], P.S.midiSound, v => { P.S.midiSound = v; P.save(); })), midi,
        P.btn('Effacer mes scores et ma série', () => { P.S.stats = {}; P.S.streak = { n: 0, last: '' }; P.S.done = {}; P.save(); route(true); })));
    bar.append(h('span', { class: 'keybar-l' }, 'Tonalité'), keys, set);
    return bar;
  }
  function route(keep) {
    const y = window.scrollY, open = !!document.querySelector('.settings[open]');
    A.stopAll(); P.noteCb = null; P.kbs.clear();
    const id = location.hash.replace(/^#\/?/, '') || 'accueil', v = P.views[id] || P.views.accueil, vid = P.views[id] ? id : 'accueil';
    main.innerHTML = '';
    const kb = keybar(); if (open && keep) kb.querySelector('details').open = true;
    const body = h('div', { class: 'page page-' + vid });
    main.append(kb, h('header', { class: 'head' }, swing(v.h1 || v.t), h('p', { class: 'lead' }, v.lead)), body,
      h('footer', { class: 'foot' }, 'Douze fonctionne entièrement dans ton navigateur. Piano : échantillons Salamander Grand Piano (Alexander Holm, CC BY 3.0), servis par le projet Tone.js.'));
    v.render(body);
    nav.querySelectorAll('.pk').forEach(a => a.classList.toggle('on', a.dataset.id === vid));
    document.title = (vid === 'accueil' ? '' : v.t + ' · ') + 'Douze';
    window.scrollTo(0, keep ? y : 0);
    if (!keep) { const cur = nav.querySelector('.pk.on'); if (cur && cur.scrollIntoView && window.innerWidth < 900) cur.scrollIntoView({ inline: 'center', block: 'nearest' }); }
  }
  P.setKey = pc => { P.S.key = pc; P.save(); route(true); };
  P.rerender = () => route(true);
  buildNav(); P.midiInit();
  window.addEventListener('hashchange', () => route(false));
  route(false);
})();
