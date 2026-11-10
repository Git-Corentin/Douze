/* Douze — théorie musicale : notes, gammes, accords, degrés, voicings */
(function () {
  const P = (window.P = window.P || {});
  const LET = 'CDEFGAB', LPC = [0, 2, 4, 5, 7, 9, 11];
  const mod = (n, m = 12) => ((n % m) + m) % m;

  function parseNote(n) {
    const l = LET.indexOf(n[0]); let a = 0;
    for (const c of n.slice(1)) a += c === '#' ? 1 : c === 'b' ? -1 : 0;
    return { l, a, pc: mod(LPC[l] + a) };
  }
  function parseDeg(t) {
    const m = /^([b#]*)(\d+)$/.exec(t); const n = +m[2]; let a = 0;
    for (const c of m[1]) a += c === '#' ? 1 : -1;
    const i = (n - 1) % 7;
    return { n, i, a, semi: LPC[i] + 12 * Math.floor((n - 1) / 7) + a, t };
  }
  function spell(tonic, deg) {
    const T = parseNote(tonic), d = typeof deg === 'string' ? parseDeg(deg) : deg;
    const l = (T.l + d.i) % 7; let a = mod(T.pc + d.semi) - LPC[l];
    if (a > 6) a -= 12; if (a < -6) a += 12;
    return LET[l] + (a > 0 ? '#'.repeat(a) : 'b'.repeat(-a));
  }
  const SIMPLE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  function simplify(n) {
    const p = parseNote(n);
    return Math.abs(p.a) > 1 || ['Cb', 'Fb', 'E#', 'B#'].includes(n) ? SIMPLE[p.pc] : n;
  }
  const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const MINKEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const FR = { C: 'Do', D: 'Ré', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
  const acc = s => s.replace(/#/g, '♯').replace(/b/g, '♭');
  function fmt(n, letters) {
    return (P.S && P.S.fr && !letters ? FR[n[0]] : n[0]) + acc(n.slice(1));
  }
  const fmtDeg = t => acc(String(t));

  /* ---------- gammes ---------- */
  const SCALES = {
    major: { n: 'Majeur (ionien)', g: 'Modes de la gamme majeure', f: '1 2 3 4 5 6 7', ch: '4', vamp: 'Imaj7 | IVmaj7', par: 0,
      d: "La référence. Tous les autres modes se décrivent par leurs différences avec elle. Stable, lumineuse ; la quarte (4) est la note à ne pas tenir sur l'accord de tonique." },
    dorian: { n: 'Dorien', g: 'Modes de la gamme majeure', f: '1 2 b3 4 5 6 b7', ch: '6', vamp: 'im7 | IV7', par: 10,
      d: "Mineur avec une sixte majeure : mineur mais pas triste. C'est LE mode du m7 en jazz (accord ii), du funk et de la musique modale. La sixte majeure est sa signature." },
    phrygian: { n: 'Phrygien', g: 'Modes de la gamme majeure', f: '1 b2 b3 4 5 b6 b7', ch: 'b2', vamp: 'im | bIImaj7', par: 8,
      d: "Mineur avec une seconde mineure : couleur espagnole, sombre, tendue. Le demi-ton juste au-dessus de la tonique fait tout." },
    lydian: { n: 'Lydien', g: 'Modes de la gamme majeure', f: '1 2 3 #4 5 6 7', ch: '#4', vamp: 'Imaj7 | II', par: 7,
      d: "Majeur avec une quarte augmentée : flottant, rêveur, « musique de film ». En jazz on le joue volontiers sur tout accord maj7, parce que la ♯4 ne frotte pas avec la tierce." },
    mixolydian: { n: 'Mixolydien', g: 'Modes de la gamme majeure', f: '1 2 3 4 5 6 b7', ch: 'b7', vamp: 'I7 | bVII', par: 5,
      d: "Majeur avec une septième mineure : blues, rock, gospel. C'est la gamme de l'accord de dominante (V7)." },
    aeolian: { n: 'Éolien (mineur naturel)', g: 'Modes de la gamme majeure', f: '1 2 b3 4 5 b6 b7', ch: 'b6', vamp: 'im7 | bVImaj7', par: 3,
      d: "Le mineur de la pop. La sixte mineure lui donne sa mélancolie ; c'est le relatif mineur de la gamme majeure." },
    locrian: { n: 'Locrien', g: 'Modes de la gamme majeure', f: '1 b2 b3 4 b5 b6 b7', ch: 'b5', vamp: 'im7b5 | bIImaj7', par: 1,
      d: "Le plus instable : la quinte est diminuée, la tonique ne tient pas en place. Sert presque uniquement sur l'accord m7♭5 (le ii d'une cadence mineure)." },
    harmMin: { n: 'Mineur harmonique', g: 'Mineurs', f: '1 2 b3 4 5 b6 7', ch: '7', vamp: 'im | V7b9',
      d: "Mineur naturel dont on remonte la septième pour obtenir un vrai V7. L'écart ♭6–7 (un ton et demi) lui donne sa couleur orientale et classique." },
    melMin: { n: 'Mineur mélodique (jazz)', g: 'Mineurs', f: '1 2 b3 4 5 6 7', ch: '6', vamp: 'im6',
      d: "Une gamme majeure dont seule la tierce est mineure. C'est la mine d'or du jazz moderne : ses modes donnent la gamme altérée et le lydien dominant. Sonne sur m6 et m(maj7)." },
    pentMaj: { n: 'Pentatonique majeure', g: 'Pentatoniques et blues', f: '1 2 3 5 6', ch: '6', vamp: 'I6 | vi7',
      d: "La gamme majeure sans ses deux notes à risque (4 et 7). Impossible de jouer faux : idéale pour improviser tout de suite dans une tonalité inconnue." },
    pentMin: { n: 'Pentatonique mineure', g: 'Pentatoniques et blues', f: '1 b3 4 5 b7', ch: 'b7', vamp: 'im7',
      d: "Les mêmes notes que la pentatonique majeure du relatif. La base du blues et du rock ; en jazz on la décale (jouer la penta mineure de la quinte sur un m7, par exemple)." },
    blues: { n: 'Blues', g: 'Pentatoniques et blues', f: '1 b3 4 b5 5 b7', ch: 'b5', vamp: 'I7',
      d: "Pentatonique mineure plus la « blue note » (♭5). Jouée sur un accord majeur ou septième, le frottement ♭3 contre 3 est précisément le son recherché." },
    bluesMaj: { n: 'Blues majeure', g: 'Pentatoniques et blues', f: '1 2 b3 3 5 6', ch: 'b3', vamp: 'I6 | IV7',
      d: "Pentatonique majeure plus la ♭3 de passage. Le glissé ♭3→3 est la marque du gospel, du boogie et de beaucoup de phrases d'Oscar Peterson." },
    bebopDom: { n: 'Bebop dominante', g: 'Couleurs jazz', f: '1 2 3 4 5 6 b7 7', ch: '7', vamp: 'I7',
      d: "Mixolydien avec une note de passage entre ♭7 et 1. Huit notes : en croches, les notes de l'accord tombent toujours sur les temps. C'est le secret mécanique des lignes bebop." },
    bebopMaj: { n: 'Bebop majeure', g: 'Couleurs jazz', f: '1 2 3 4 5 b6 6 7', ch: 'b6', vamp: 'I6',
      d: "Gamme majeure avec une note de passage entre 5 et 6. Les temps forts dessinent un accord de sixte (1 3 5 6) : la « gamme de sixte diminuée » de Barry Harris." },
    altered: { n: 'Altérée (super-locrien)', g: 'Couleurs jazz', f: '1 b2 b3 b4 b5 b6 b7', ch: 'b4', vamp: 'I7alt',
      d: "7e mode du mineur mélodique. Sur un V7 qui résout : contient ♭9, ♯9, ♯11, ♭13, toutes les tensions possibles. Astuce : c'est le mineur mélodique un demi-ton au-dessus de la fondamentale." },
    lydDom: { n: 'Lydien dominant', g: 'Couleurs jazz', f: '1 2 3 #4 5 6 b7', ch: '#4', vamp: 'I7#11',
      d: "Mixolydien avec ♯4 (4e mode du mineur mélodique). Pour les accords 7 qui ne résolvent pas d'une quinte : ♭VII7, IV7, substitutions tritoniques." },
    phrygDom: { n: 'Phrygien dominant', g: 'Couleurs jazz', f: '1 b2 3 4 5 b6 b7', ch: 'b2', vamp: 'I | bII',
      d: "5e mode du mineur harmonique. La gamme naturelle d'un V7♭9 qui résout sur un accord mineur ; couleur flamenco et klezmer." },
    hwDim: { n: 'Diminuée demi-ton / ton', g: 'Couleurs jazz', f: '1 b2 b3 3 #4 5 6 b7', ch: 'b2', vamp: 'I7b9',
      d: "Gamme symétrique à huit notes. Sur un 13♭9 : garde la treizième naturelle tout en altérant la neuvième. Il n'en existe que trois différentes." },
    whDim: { n: 'Diminuée ton / demi-ton', g: 'Couleurs jazz', f: '1 2 b3 4 b5 b6 6 7', ch: 'b5', vamp: 'idim7',
      d: "La gamme des accords diminués 7. Même réservoir de notes que la précédente, commencé un cran plus loin." },
    wholeTone: { n: 'Par tons', g: 'Couleurs jazz', f: '1 2 3 #4 #5 b7', ch: '#5', vamp: 'I7#5',
      d: "Six notes séparées d'un ton : aucune attraction, effet de rêve (Debussy, Monk). Sur un accord 7♯5." },
  };
  const scaleDegs = id => SCALES[id].f.split(' ').map(parseDeg);
  const scaleSemis = id => scaleDegs(id).map(d => d.semi);

  /* ---------- accords ---------- */
  const CH = {
    '': { f: '1 3 5' }, m: { f: '1 b3 5' }, dim: { f: '1 b3 b5' }, aug: { f: '1 3 #5' },
    sus4: { f: '1 4 5' }, sus2: { f: '1 2 5' }, '5': { f: '1 5' },
    '6': { f: '1 3 5 6' }, m6: { f: '1 b3 5 6' }, '69': { f: '1 3 5 6 9' }, add9: { f: '1 3 5 9' },
    '7': { f: '1 3 5 b7' }, maj7: { f: '1 3 5 7' }, m7: { f: '1 b3 5 b7' }, m7b5: { f: '1 b3 b5 b7' },
    dim7: { f: '1 b3 b5 bb7' }, mMaj7: { f: '1 b3 5 7' }, '7sus4': { f: '1 4 5 b7' },
    '9': { f: '1 3 5 b7 9' }, maj9: { f: '1 3 5 7 9' }, m9: { f: '1 b3 5 b7 9' }, m11: { f: '1 b3 5 b7 9 11' },
    '11': { f: '1 5 b7 9 11' }, '13': { f: '1 3 5 b7 9 13' }, maj13: { f: '1 3 5 7 9 13' },
    '7b9': { f: '1 3 5 b7 b9' }, '7#9': { f: '1 3 5 b7 #9' }, '7#11': { f: '1 3 5 b7 9 #11' },
    '7#5': { f: '1 3 #5 b7' }, '7b13': { f: '1 3 5 b7 b13' }, '7alt': { f: '1 3 b7 b9 b13' }, maj7s11: { f: '1 3 5 7 #11' },
  };
  const ALIAS = {
    M: '', maj: '', Maj: '', min: 'm', mi: 'm', '-': 'm', M7: 'maj7', Maj7: 'maj7', ma7: 'maj7', 'Δ': 'maj7', 'Δ7': 'maj7', '7M': 'maj7',
    'maj7#11': 'maj7s11', '-7': 'm7', min7: 'm7', mi7: 'm7', '°': 'dim', o: 'dim', '°7': 'dim7', o7: 'dim7', 'ø': 'm7b5', 'ø7': 'm7b5',
    'm7-5': 'm7b5', '-7b5': 'm7b5', '+': 'aug', '5+': 'aug', sus: 'sus4', '4': 'sus4', '2': 'sus2', '7sus': '7sus4', '9sus4': '7sus4',
    '6/9': '69', M9: 'maj9', mM7: 'mMaj7', 'mmaj7': 'mMaj7', alt: '7alt', '7+': '7#5', '7+5': '7#5', 'm7b5': 'm7b5', madd9: 'm', '7b5': '7#11',
    '9#11': '7#11', '13b9': '7b9', '7b9b13': '7alt', '7#9b13': '7alt', '7#9#5': '7alt', min6: 'm6', '-6': 'm6', m69: 'm6', min9: 'm9', '-9': 'm9',
    maj11: 'maj9', M13: 'maj13', m13: 'm9', '7b9#11': '7b9', maj6: '6', M6: '6', mmaj9: 'mMaj7', 'm(maj7)': 'mMaj7',
  };
  function normQ(q) {
    if (q in CH) return q;
    if (q in ALIAS) return ALIAS[q];
    if (!/^(maj|min|dim|aug|sus|add|alt|[mM0-9#b+\-°øΔ/])*$/.test(q)) return null;
    if (/^(maj|M|Δ)/.test(q)) return 'maj7';
    if (/^(m|min|-)(?!aj)/.test(q)) return /7|9|11|13/.test(q) ? 'm7' : 'm';
    if (/dim|°/.test(q)) return 'dim7';
    if (/sus/.test(q)) return /7|9|13/.test(q) ? '7sus4' : 'sus4';
    if (/alt|b9|#9|b13|#5/.test(q)) return '7alt';
    if (/7|9|11|13/.test(q)) return '7';
    if (/add|6/.test(q)) return /6/.test(q) ? '6' : 'add9';
    return null;
  }
  function mk(root, q, bass) {
    const c = { root, rpc: parseNote(root).pc, q };
    if (bass) { c.bass = bass; c.bpc = parseNote(bass).pc; }
    return c;
  }
  function parseChord(s) {
    s = s.trim().replace(/♯/g, '#').replace(/♭/g, 'b')
      .replace(/^(Do|Ré|Re|Mi|Fa|Sol|La|Si)/, m => ({ Do: 'C', 'Ré': 'D', Re: 'D', Mi: 'E', Fa: 'F', Sol: 'G', La: 'A', Si: 'B' })[m]);
    const m = /^([A-G][#b]?)([^/\s]*)(?:\/([A-G][#b]?))?$/.exec(s);
    if (!m) return null;
    const q = normQ(m[2].replace(/[()]/g, ''));
    return q == null ? null : mk(m[1], q, m[3]);
  }
  const qDisp = q => (q === '69' ? '6/9' : q === 'maj7s11' ? 'maj7♯11' : q.replace(/b(\d)/g, '♭$1').replace(/#/g, '♯'));
  const chordName = c => fmt(c.root, true) + qDisp(c.q) + (c.bass ? '/' + fmt(c.bass, true) : '');
  const chordDegs = q => CH[q].f.split(' ').map(parseDeg);
  const chordSemis = q => chordDegs(q).map(d => d.semi);
  function family(q) {
    const f = ' ' + CH[q].f + ' ', has = t => f.includes(' ' + t + ' ');
    if (has('b3') && has('b5')) return has('b7') ? 'hdim' : 'dim';
    if (has('b3')) return 'min';
    if (has('b7')) return has('3') ? 'dom' : 'sus';
    if (has('#5') && !has('7')) return 'aug';
    if (!has('3')) return 'sus';
    return 'maj';
  }

  /* ---------- degrés (chiffres romains) ---------- */
  const ROM = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
  const ROMDEG = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
  const RN = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };
  function roman(c, kpc) {
    const iv = mod(c.rpc - kpc), fam = family(c.q); let r = ROM[iv];
    if (['min', 'hdim', 'dim'].includes(fam)) r = r.toLowerCase();
    const suf = { '': '', m: '', dim: '°', dim7: '°7', m7b5: 'ø', m7: '7', mMaj7: 'maj7', m6: '6', m9: '9', m11: '11' }[c.q];
    return r + (suf != null ? suf : qDisp(c.q));
  }
  const rootIn = (tonic, iv) => simplify(spell(tonic, ROMDEG[mod(iv)]));
  function romanToChord(tok, tonic) {
    const m = /^([b#♭♯]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/.exec(tok);
    if (!m) return null;
    const a = m[1] === 'b' || m[1] === '♭' ? -1 : m[1] ? 1 : 0;
    const up = m[2] === m[2].toUpperCase();
    const s = m[3].replace(/♭/g, 'b').replace(/♯/g, '#');
    const q = up ? normQ(s) : ({ '': 'm', '7': 'm7', 'ø': 'm7b5', 'ø7': 'm7b5', '°': 'dim', '°7': 'dim7', dim7: 'dim7', '6': 'm6', '9': 'm9', '11': 'm11', maj7: 'mMaj7', m: 'm', m7: 'm7', m6: 'm6', m9: 'm9', m7b5: 'm7b5' })[s];
    if (q == null || !(q in CH)) return null;
    return mk(rootIn(tonic, RN[m[2].toUpperCase()] + a), q);
  }
  /* "I vi | ii V" → [[ch,ch],[ch,ch]] ; sans barre : un accord par mesure */
  function parseGrid(str, tonic) {
    const one = t => romanToChord(t, tonic) || parseChord(t);
    if (!str.includes('|')) return str.trim().split(/\s+/).map(one).filter(Boolean).map(c => [c]);
    return str.split('|').map(b => b.trim()).filter(Boolean).map(b => b.split(/\s+/).map(one).filter(Boolean)).filter(b => b.length);
  }
  function detectKey(chs) {
    const dia = { 0: 'maj', 2: 'min', 4: 'min', 5: 'maj', 7: 'maj', 9: 'min', 11: 'dim' };
    let best = -1, pc = 0;
    for (let k = 0; k < 12; k++) {
      let s = 0;
      chs.forEach(c => {
        const iv = mod(c.rpc - k), d = dia[iv]; if (!d) return;
        let f = family(c.q); if (f === 'hdim') f = 'dim'; if (f === 'sus') f = 'maj';
        const domOk = f === 'dom' && iv === 7;
        if (f === 'dom' && !domOk) { s += 0.3; return; }
        s += f === d || domOk ? 2 : 0.4;
        if (domOk) s += 1;
        if (c.q === 'maj7' && (iv === 0 || iv === 5)) s += 0.5;
        if (c.q === 'maj7' && iv === 7) s -= 1.5;
      });
      const f0 = mod(chs[0].rpc - k), l0 = mod(chs[chs.length - 1].rpc - k);
      if (f0 === 0) s += 1.5; else if (f0 === 9) s += 1.2;
      if (l0 === 0) s += 1; else if (l0 === 9) s += 0.6;
      if (s > best) { best = s; pc = k; }
    }
    const minor = mod(chs[0].rpc - pc) === 9 && family(chs[0].q) === 'min';
    return { pc, minor };
  }
  function transpose(c, fromPc, toTonic) {
    return mk(rootIn(toTonic, c.rpc - fromPc), c.q, c.bass ? rootIn(toTonic, c.bpc - fromPc) : undefined);
  }

  /* ---------- voicings ---------- */
  const TOK = { '1': 0, b9: 1, '9': 2, '#9': 3, b3: 3, '3': 4, '4': 5, '#11': 6, b5: 6, '5': 7, '#5': 8, b13: 8, '6': 9, '13': 9, b7: 10, '7': 11 };
  function vTokens(c) {
    const q = c.q, fam = family(q), f = ' ' + CH[q].f + ' ', has = t => f.includes(' ' + t + ' ');
    const minor = fam === 'min' || fam === 'hdim' || fam === 'dim';
    const third = minor ? 'b3' : fam === 'sus' ? '4' : '3';
    let sev;
    if (fam === 'maj') sev = has('6') && !has('7') ? '6' : '7';
    else if (fam === 'min') sev = has('7') ? '7' : has('6') && !has('b7') ? '6' : 'b7';
    else if (fam === 'dim') sev = '6';
    else sev = 'b7';
    const fifth = has('b5') ? 'b5' : has('#5') ? '#5' : '5';
    const dom = fam === 'dom' || fam === 'sus' || fam === 'aug';
    const alt = ['7alt', '7#5', '7b13', '7b9', '7#9'].includes(q) || fam === 'aug';
    const ninth = q === '7#9' ? '#9' : has('b9') ? 'b9' : fam === 'hdim' || fam === 'dim' ? '1' : '9';
    const col = dom ? (alt ? 'b13' : '13') : fifth;
    return { third, sev, fifth, ninth, col, dom, fam, minor };
  }
  function stack(rpc, toks, min) {
    let prev = min - 1;
    return toks.map(t => { let m = prev + 1; while (mod(m) !== mod(rpc + TOK[t])) m++; prev = m; return { m, deg: t }; });
  }
  const lowIn = (pc, lo) => lo + mod(pc - lo);
  const hand = (a, hd) => a.map(x => ({ ...x, hand: hd }));
  function voicing(c, style, prev) {
    const v = vTokens(c), r = c.rpc;
    const A = [v.third, v.col, v.sev, v.ninth], B = [v.sev, v.ninth, v.third, v.col];
    const rootless = t => hand(stack(r, t, 45), 'L');
    switch (style) {
      case 'shellA': { const root = lowIn(r, 36); return [{ m: root, deg: '1', hand: 'L' }, ...hand(stack(r, [v.sev, v.third], root + 1), 'L')]; }
      case 'shellB': { const root = lowIn(r, 43); return [{ m: root, deg: '1', hand: 'L' }, ...hand(stack(r, [v.third, v.sev], root + 1), 'L')]; }
      case 'rootA': return rootless(A);
      case 'rootB': return rootless(B);
      case 'two': { const root = lowIn(r, 36); return [{ m: root, deg: '1', hand: 'L' }, ...hand(stack(r, [v.sev], root + 1), 'L'), ...hand(stack(r, [v.third, v.col, v.ninth], 55), 'R')]; }
      case 'quartal': {
        const t = v.minor ? ['1', '4', 'b7', 'b3', v.fifth] : v.dom ? ['b7', '3', '13', '9', '5'] : ['3', '6', '9', '5', '1'];
        return stack(r, t, 45).map((x, i) => ({ ...x, hand: i < 2 ? 'L' : 'R' }));
      }
      default: {
        const cen = n => n.reduce((s, x) => s + x.m, 0) / n.length, target = prev && prev.length ? cen(prev) : 57;
        let best = null, bd = 1e9;
        [rootless(A), rootless(B)].forEach(n => [0, -12].forEach(o => {
          if (n[0].m + o < 43) return;
          const d = Math.abs(cen(n) + o - target); if (d < bd) { bd = d; best = n.map(x => ({ ...x, m: x.m + o })); }
        }));
        return best;
      }
    }
  }
  function closeVoicing(c, center = 60) {
    const lo = center - 6;
    return chordSemis(c.q).slice(0, 4).map(s => lo + mod(c.rpc + s - lo)).sort((a, b) => a - b);
  }
  function chordScale(c, kpc) {
    const fam = family(c.q), iv = kpc == null ? -1 : mod(c.rpc - kpc), q = c.q;
    if (fam === 'maj') return q === 'maj7s11' || iv === 5 ? 'lydian' : 'major';
    if (fam === 'min') return q === 'm6' || q === 'mMaj7' ? 'melMin' : iv === 4 ? 'phrygian' : iv === 9 ? 'aeolian' : 'dorian';
    if (fam === 'hdim') return 'locrian';
    if (fam === 'dim') return 'whDim';
    if (fam === 'aug') return 'wholeTone';
    if (['7alt', '7#9', '7b13'].includes(q)) return 'altered';
    if (q === '7#5') return 'wholeTone';
    if (q === '7b9') return 'phrygDom';
    if (q === '7#11' || [1, 10, 8].includes(iv)) return 'lydDom';
    return 'mixolydian';
  }
  const DEGNAMES = ['1', '♭9', '9', '♭3', '3', '11', '♯11', '5', '♭13', '13', '♭7', '7'];

  P.T = { mod, parseNote, parseDeg, spell, simplify, KEYS, MINKEYS, SIMPLE, fmt, fmtDeg, SCALES, scaleDegs, scaleSemis, CH, mk, parseChord, qDisp, chordName,
    chordDegs, chordSemis, family, ROM, ROMDEG, roman, rootIn, romanToChord, parseGrid, detectKey, transpose, TOK, vTokens, voicing, closeVoicing, chordScale, DEGNAMES, lowIn, stack };
})();
