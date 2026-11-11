/* Douze — navigation, barre de tonalité, réglages */
(function () {
  const P = window.P, T = P.T, A = P.A, h = P.h;
  /* une octave : sept touches blanches (les chapitres et le carnet), cinq noires (les outils). L'accueil est sous le mot « Douze ». */
  const ORDER = [['degres', 'w'], ['transposeur', 'b'], ['modes', 'w'], ['reperes', 'b'], ['arpeges', 'w'], ['accords', 'w'], ['jazzifieur', 'b'], ['phrase', 'w'], ['grilles', 'b'], ['oreille', 'w'], ['routine', 'b'], ['chansons', 'w']];
  const NOTES = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  const SHORT = { routine: 'Séance', degres: 'Degrés', modes: 'Modes', arpeges: 'Arpèges', transposeur: 'Transposeur', phrase: 'Phrasé', oreille: 'Oreille' };
  const nav = document.getElementById('nav'), main = document.getElementById('main');

  function buildNav() {
    const piano = h('div', { class: 'piano' }); let wi = -1;
    ORDER.forEach(([id, col], n) => {
      const v = P.views[id]; if (col === 'w') wi++;
      piano.append(h('a', { href: '#/' + id, class: 'pk pk-' + col, 'data-id': id, style: col === 'b' ? `--i:${wi}` : null }, h('span', { class: 'pk-n' }, NOTES[n]), h('span', { class: 'pk-t' }, SHORT[id] || v.t)));
    });
    const menu = h('button', { type: 'button', class: 'menu-b', 'aria-expanded': 'false', onclick: e => { e.stopPropagation(); const o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', o ? 'true' : 'false'); } }, h('span', { class: 'menu-t' }, 'Menu'));
    nav.append(h('a', { class: 'wordmark', href: '#/', 'aria-label': 'Douze, accueil' }, 'Douze'), h('p', { class: 'nav-s' }, 'Le piano d\'oreille, dans toutes les tonalités'), menu, piano);
    document.addEventListener('click', e => { if (nav.classList.contains('open') && !e.target.closest('.menu-b')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); } });
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
    const dice = P.btn('Tonalité au hasard', () => { let k; do k = Math.floor(Math.random() * 12); while (k === P.S.key); P.setKey(k); }, 'mic');
    const micB = P.btn(P.mic.label(), () => P.mic.toggle(), 'mic' + (P.mic.on ? ' on' : ''));
    P.onMic = () => { micB.textContent = P.mic.label(); micB.classList.toggle('on', P.mic.on); micS.textContent = 'Micro : ' + P.mic.state + '.'; };
    const micS = h('span', { class: 'hint' }, 'Micro : ' + P.mic.state + '.');
    set.querySelector('.settings-b').append(h('p', { class: 'hint' }, "Le micro reconnaît une note à la fois (pas les accords) et se met en pause pendant que le site joue. Pose le téléphone sur le piano, loin d'un bruit de fond."), micS);
    bar.append(h('span', { class: 'keybar-l' }, 'Tonalité'), keys, h('div', { class: 'keybar-r' }, dice, micB, set));
    return bar;
  }
  const stick = () => { const kb = main.querySelector('.keybar'); document.documentElement.style.setProperty('--stick', (window.innerWidth <= 900 ? 56 : kb ? kb.offsetHeight : 62) + 'px'); };
  window.addEventListener('resize', stick);
  function route(keep) {
    const y = window.scrollY, open = !!document.querySelector('.settings[open]');
    stale = false; P.onKey = null; if (P.onLeave) { P.onLeave(); P.onLeave = null; } A.stopAll(); P.noteCb = null; P.kbs.clear(); if (P.session) P.session.onTick = P.session.onDraw = null;
    const [rid, ...rest] = (location.hash.replace(/^#\/?/, '') || 'accueil').split('/'), id = rid || 'accueil', v = P.views[id] || P.views.accueil, vid = P.views[id] ? id : 'accueil';
    P.arg = decodeURIComponent(rest.join('/')); const hd = v.head ? v.head(P.arg) : {};
    main.innerHTML = '';
    const kb = keybar(); if (open && keep) kb.querySelector('details').open = true;
    const body = h('div', { class: 'page page-' + vid });
    main.append(kb, h('header', { class: 'head' + (hd.h1 ? ' head-s' : '') }, swing(hd.h1 || v.h1 || v.t), h('p', { class: 'lead' }, hd.lead != null ? hd.lead : v.lead)), body,
      h('footer', { class: 'foot' }, 'Douze fonctionne entièrement dans ton navigateur. Piano : échantillons Salamander Grand Piano (Alexander Holm, CC BY 3.0), servis par le projet Tone.js.'));
    v.render(body);
    stick();
    nav.querySelectorAll('.pk').forEach(a => a.classList.toggle('on', a.dataset.id === vid));
    nav.querySelector('.menu-t').textContent = vid === 'accueil' ? 'Menu' : SHORT[vid] || v.t; nav.classList.remove('open');
    document.title = (vid === 'accueil' ? '' : (hd.h1 || v.t) + ' · ') + 'Douze';
    window.scrollTo(0, keep ? y : 0);
  }
  /* Changer de tonalité pendant qu'une musique joue : elle continue dans la nouvelle tonalité.
     La page est entièrement redessinée dès que la lecture s'arrête. */
  let stale = false;
  P.setKey = pc => {
    const old = P.S.key; if (pc === old) return;
    P.S.key = pc;
    if (P.S.jz) P.S.jz = P.shiftText(P.S.jz, pc - old);
    if (P.S.gcustom) P.S.gcustom = P.shiftText(P.S.gcustom, pc - old);
    P.save();
    if (P.onKey && (A.loops.size || P.onKey.always)) {
      main.querySelectorAll('.keys button').forEach((b, i) => { b.classList.toggle('on', i === pc); b.setAttribute('aria-pressed', i === pc ? 'true' : 'false'); });
      P.onKey(pc, old); stale = !P.onKey.always;
    } else route(true);
  };
  A.onIdle = () => setTimeout(() => { if (stale && !A.loops.size) route(true); }, 120);
  P.rerender = () => route(true);
  buildNav(); P.midiInit();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  let wasMob = P.mob; window.addEventListener('resize', () => { if (P.mob !== wasMob) { wasMob = P.mob; route(true); } });
  window.addEventListener('hashchange', () => route(false));
  route(false);
})();
