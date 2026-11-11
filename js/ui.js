/* Douze — état, petits composants, clavier, MIDI */
(function () {
  const P = window.P, T = P.T;
  const DEF = { key: 0, fr: true, vol: 0.8, samples: true, midiSound: false, lab: 'deg', stats: {}, done: {}, streak: { n: 0, last: '' }, tx: '', bpm: {} };
  try { P.S = Object.assign({}, DEF, JSON.parse(localStorage.getItem('douze') || '{}')); } catch (e) { P.S = Object.assign({}, DEF); }
  P.save = () => { try { localStorage.setItem('douze', JSON.stringify(P.S)); } catch (e) { /* stockage indisponible */ } };
  P.views = {};
  Object.defineProperty(P, 'mob', { get: () => window.matchMedia('(max-width: 700px)').matches });
  P.kbs = new Set();
  P.tonic = () => T.KEYS[P.S.key];

  const h = (P.h = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(9).forEach(k => { if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k)); });
    return e;
  });
  P.prose = html => h('div', { class: 'prose', html });
  P.btn = (label, fn, cls) => h('button', { class: 'btn ' + (cls || ''), type: 'button', onclick: fn }, label);
  P.tool = (title, ...kids) => h('section', { class: 'tool' }, title ? h('h3', { class: 'tool-t' }, title) : null, kids);
  P.row = (...kids) => h('div', { class: 'row' }, kids);
  P.field = (label, ctl) => h('label', { class: 'field' }, h('span', { class: 'field-l' }, label), ctl);
  P.seg = (items, cur, cb) => {
    const el = h('div', { class: 'seg', role: 'group' });
    items.forEach(([v, l]) => el.append(h('button', { type: 'button', class: v === cur ? 'on' : '', 'aria-pressed': v === cur ? 'true' : 'false', onclick: e => {
      el.querySelectorAll('button').forEach(b => { b.className = ''; b.setAttribute('aria-pressed', 'false'); });
      e.currentTarget.className = 'on'; e.currentTarget.setAttribute('aria-pressed', 'true'); cb(v);
    } }, l)));
    return el;
  };
  P.sel = (items, cur, cb) => {
    const s = h('select', { onchange: e => cb(e.target.value) });
    items.forEach(it => {
      if (it.group) { const g = h('optgroup', { label: it.group }); it.items.forEach(([v, l]) => g.append(h('option', { value: v, selected: String(v) === String(cur) }, l))); s.append(g); }
      else s.append(h('option', { value: it[0], selected: String(it[0]) === String(cur) }, it[1]));
    });
    return s;
  };
  P.range = (label, min, max, val, cb, unit = '', step = 1) => {
    const out = h('output', {}, val + unit);
    const r = h('input', { type: 'range', min, max, step, value: val, oninput: e => { out.textContent = e.target.value + unit; cb(+e.target.value); } });
    return h('label', { class: 'field range' }, h('span', { class: 'field-l' }, label), r, out);
  };
  /* tempo mémorisé par outil */
  P.tempo = (id, def, cb) => { const v = P.S.bpm[id] || def; cb(v); return P.range('Tempo', 40, 240, v, x => { P.S.bpm[id] = x; P.save(); cb(x); }, ' bpm'); };
  P.playToggle = (loop, labels = ['Lancer', 'Arrêter']) => {
    const b = P.btn(labels[0], () => { loop.toggle(); sync(); }, 'play');
    const sync = () => { b.textContent = labels[loop.on ? 1 : 0]; b.classList.toggle('on', !!loop.on); };
    b.sync = sync; loop._sync = sync; return b;
  };

  /* ---------- clavier ---------- */
  const isB = m => [1, 3, 6, 8, 10].includes(m % 12);
  P.Keyboard = function (host, o = {}) {
    const mob = P.mob, fit = mob && !o.mob;
    let keys = {}, from, to;
    const inner = h('div', { class: 'kb-in' });
    const wrap = h('div', { class: 'kb' + (o.small ? ' kb-s' : '') + (o.onNote ? ' kb-play' : '') }, inner);
    const build = (f, t) => {
      from = f; to = t; keys = {}; inner.innerHTML = '';
      const whites = []; for (let m = f; m <= t; m++) if (!isB(m)) whites.push(m);
      const W = 100 / whites.length;
      inner.style.setProperty('--n', whites.length);
      inner.style.minWidth = mob ? '0' : whites.length * (o.minKey || 20) + 'px';
      for (let m = f; m <= t; m++) {
        const b = isB(m), wi = whites.filter(w => w < m).length;
        const k = h('div', { class: 'k ' + (b ? 'kbk' : 'kw'), style: b ? `left:${wi * W - W * 0.3}%;width:${W * 0.6}%` : `left:${wi * W}%;width:${W}%` }, h('i'));
        k.addEventListener('pointerdown', e => { e.preventDefault(); P.A.piano(m, 0, 1.4, 0.75); P.noteIn(m, 'click', this); });
        keys[m] = k; inner.append(k);
      }
      this.from = f; this.to = t;
    };
    const init = mob && o.mob ? o.mob : fit ? [48, 72] : [o.from || 48, o.to || 84];
    build(init[0], init[1]);
    host.append(wrap);
    this.o = o;
    this.setRange = (f, t) => { if (f !== from || t !== to) build(f, t); };
    this.clear = () => { for (const m in keys) { keys[m].className = keys[m].className.replace(/ mk\S*/g, '').replace(' live', ''); keys[m].firstChild.textContent = ''; } };
    this.mark = list => {
      if (fit && list.length) {
        /* sur téléphone, le clavier se recadre sur les notes à montrer */
        const mn = Math.min(...list.map(x => x.m)), mx = Math.max(...list.map(x => x.m));
        let lo = Math.floor(mn / 12) * 12; if (mn % 12 >= 5) lo += 5;
        let hi = mx; while (!(hi % 12 === 4 || hi % 12 === 11) || hi - lo < 16) hi++;
        this.setRange(lo, hi);
      }
      this.clear(); const mp = new Map(); list.forEach(x => mp.set(x.m, x));
      mp.forEach(x => { const k = keys[x.m]; if (!k) return; k.className += ' mk mk-' + (x.c || 'a'); k.firstChild.textContent = x.t == null ? '' : x.t; });
    };
    this.live = ms => { for (const m in keys) keys[m].classList.toggle('live', ms.includes(+m)); };
    this.flash = (m, cls = 'hit', ms = 260) => { const k = keys[m]; if (!k) return; k.classList.add(cls); setTimeout(() => k.classList.remove(cls), ms); };
    P.kbs.add(this);
  };
  /* toute note jouée (clic, MIDI ou micro) passe ici */
  P.noteIn = (m, src, kb) => {
    if (src === 'click') { kb.flash(m); if (kb.o.onNote) kb.o.onNote(m, src); else if (P.noteCb) P.noteCb(m, src); return; }
    if (src === 'midi' && P.S.midiSound) P.A.piano(m, 0, 1.2, 0.75);
    P.kbs.forEach(k => { k.flash(m); if (k.o.onNote) k.o.onNote(m, src); });
    if (P.noteCb) P.noteCb(m, src);
  };
  P.midiInit = () => {
    if (!navigator.requestMIDIAccess) { P.midiState = 'non pris en charge par ce navigateur'; return; }
    navigator.requestMIDIAccess().then(acc => {
      const hook = () => {
        let n = 0; acc.inputs.forEach(i => { n++; i.onmidimessage = e => { const [st, m, v] = e.data; if ((st & 0xf0) === 0x90 && v > 0) P.noteIn(m, 'midi'); }; });
        P.midiState = n ? n + ' clavier' + (n > 1 ? 's' : '') + ' branché' + (n > 1 ? 's' : '') : 'aucun clavier détecté'; P.onSound && P.onSound();
      };
      hook(); acc.onstatechange = hook;
    }, () => { P.midiState = 'accès refusé'; P.onSound && P.onSound(); });
  };

  /* marques d'une gamme sur le clavier ; tones = demi-tons mis en avant (notes d'accord) */
  P.marksScale = (tonic, scaleId, lo, hi, mode, strongPcs) => {
    const tp = T.parseNote(tonic).pc, out = [];
    const degs = T.scaleDegs(scaleId);
    for (let m = lo; m <= hi; m++) {
      const d = degs.find(x => T.mod(tp + x.semi) === m % 12); if (!d) continue;
      const strong = strongPcs ? strongPcs.includes(m % 12) : d.semi % 12 === 0;
      out.push({ m, c: d.semi % 12 === 0 && !strongPcs ? 'c' : strong ? 'a' : 'g', t: mode === 'note' ? T.fmt(T.spell(tonic, d)) : mode === 'none' ? '' : T.fmtDeg(d.t) });
    }
    return out;
  };
  P.marksChord = (c, ms, mode, cls) => ms.map(m => {
    const semi = T.mod(m - c.rpc), d = T.chordDegs(c.q).find(x => x.semi % 12 === semi);
    return { m, c: cls || (semi === 0 ? 'c' : 'a'), t: mode === 'note' ? T.fmt(d ? T.spell(c.root, d) : T.SIMPLE[m % 12]) : d ? T.fmtDeg(d.t) : T.DEGNAMES[semi] };
  });
  P.labSeg = cb => P.seg([['deg', 'Degrés'], ['note', 'Noms des notes']], P.S.lab, v => { P.S.lab = v; P.save(); cb(v); });

  /* statistiques des exercices d'oreille */
  P.stat = (id, k, ok) => { const s = (P.S.stats[id] = P.S.stats[id] || {}); const e = (s[k] = s[k] || [0, 0]); e[1]++; if (ok) e[0]++; P.save(); };
  P.today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  P.dayNum = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
  P.FOURTHS = [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7];
  P.keyOfDay = () => P.FOURTHS[P.dayNum() % 12];
  /* transpose les accords écrits en lettres dans un texte (les degrés et le reste ne bougent pas) */
  P.shiftText = (text, delta) => {
    const parts = text.split(/(\s+|\|)/), chs = parts.map(t => (/^\s*$|^\|$/.test(t) ? null : T.parseChord(t)));
    const all = chs.filter(Boolean); if (!all.length) return text;
    const from = T.detectKey(all).pc, to = T.KEYS[T.mod(from + delta)];
    return parts.map((t, i) => (chs[i] ? T.chordName(T.transpose(chs[i], from, to)) : t)).join('');
  };
  P.pick = a => a[Math.floor(Math.random() * a.length)];
})();
