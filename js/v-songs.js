/* Douze — carnet de chansons : paroles et accords, transposition, vidéo, défilement */
(function () {
  const P = window.P, T = P.T, A = P.A, h = P.h;
  const KEY = 'douze-songs';
  let DB = { songs: {}, hidden: [], meta: {} };
  try { DB = Object.assign(DB, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* carnet vide */ }
  const saveDB = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { alert('Enregistrement impossible : le stockage du navigateur est plein ou désactivé.'); } };
  let repo = [], repoTried = false;

  /* ---------- chansons partagées (Supabase) : lecture pour tous, écriture pour le compte administrateur ---------- */
  const CFG = window.DOUZE_CONFIG || {}, SB = (CFG.supabaseUrl || '').replace(/\/+$/, ''), SK = CFG.supabaseKey || '', cloudOn = !!(SB && SK);
  let cloud = [], sess = null, cloudState = cloudOn ? 'idle' : 'off';
  try { cloud = JSON.parse(localStorage.getItem('douze-cloud') || '[]'); sess = JSON.parse(localStorage.getItem('douze-auth') || 'null'); } catch (e) { /* rien en cache */ }
  /* les nouvelles clés « publishable » ne vont que dans l'en-tête apikey ; seul un jeton JWT va dans Authorization */
  const hdr = tok => { const o = { apikey: SK, 'Content-Type': 'application/json' }, t = tok || (SK.startsWith('eyJ') ? SK : null); if (t) o.Authorization = 'Bearer ' + t; return o; };
  const fromRow = r => ({ id: r.id, title: r.title, artist: r.artist || '', folder: r.folder || '', yt: r.yt || '', key: r.song_key == null ? '' : r.song_key, minor: !!r.minor, text: r.body || '', updated: r.updated_at ? Date.parse(r.updated_at) : 0, cloud: true });
  const toRow = s => ({ id: s.id, title: s.title, artist: s.artist || '', folder: s.folder || '', yt: s.yt || '', song_key: s.key === '' || s.key == null ? null : +s.key, minor: !!s.minor, body: s.text, updated_at: new Date().toISOString() });
  const cacheCloud = () => { try { localStorage.setItem('douze-cloud', JSON.stringify(cloud)); } catch (e) { /* cache plein */ } };
  const setSess = v => { sess = v; try { if (v) localStorage.setItem('douze-auth', JSON.stringify(v)); else localStorage.removeItem('douze-auth'); } catch (e) { /* session non mémorisée */ } };
  const authCall = async (grant, body) => {
    const r = await fetch(SB + '/auth/v1/token?grant_type=' + grant, { method: 'POST', headers: hdr(), body: JSON.stringify(body) }), d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(/invalid login|invalid_credentials|invalid_grant/i.test((d.error_description || '') + (d.msg || '') + (d.error_code || '') + (d.error || '')) ? 'Adresse ou mot de passe incorrect.' : d.error_description || d.msg || d.message || 'Connexion refusée.');
    setSess({ access_token: d.access_token, refresh_token: d.refresh_token, exp: Date.now() + (d.expires_in || 3600) * 1000, email: (d.user && d.user.email) || body.email || (sess && sess.email) });
  };
  const token = async () => {
    if (!sess) throw new Error('Tu n\'es pas connecté.');
    if (Date.now() > sess.exp - 60000) { try { await authCall('refresh_token', { refresh_token: sess.refresh_token }); } catch (e) { setSess(null); throw new Error('Session expirée : reconnecte-toi.'); } }
    return sess.access_token;
  };
  const fail = async r => { const d = await r.json().catch(() => ({})); return new Error(r.status === 401 || r.status === 403 || /row-level security/.test(d.message || '') ? 'Ce compte n\'a pas le droit de modifier les chansons en ligne.' : d.message || 'Le serveur a refusé (' + r.status + ').'); };
  const Cloud = {
    async load() {
      if (!cloudOn) return; cloudState = 'loading';
      try { const r = await fetch(SB + '/rest/v1/songs?select=*&order=title', { headers: hdr() }); if (!r.ok) throw 0; cloud = (await r.json()).map(fromRow); cloudState = 'ok'; cacheCloud(); } catch (e) { cloudState = 'error'; }
    },
    login: (email, password) => authCall('password', { email, password }),
    logout() { setSess(null); },
    async save(s) {
      const t = await token(), r = await fetch(SB + '/rest/v1/songs?on_conflict=id', { method: 'POST', headers: { ...hdr(t), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(toRow(s)) });
      if (!r.ok) throw await fail(r);
      cloud = cloud.filter(x => x.id !== s.id).concat({ ...s, cloud: true, updated: Date.now() }); cacheCloud();
    },
    async del(id) {
      const t = await token(), r = await fetch(SB + '/rest/v1/songs?id=eq.' + encodeURIComponent(id), { method: 'DELETE', headers: hdr(t) });
      if (!r.ok) throw await fail(r);
      cloud = cloud.filter(x => x.id !== id); cacheCloud();
    },
  };
  if (cloudOn) Cloud.load().then(() => { if (/^#\/chansons(?!.*(\/edit|\/new)$)/.test(location.hash) && P.rerender) P.rerender(); });
  const under = id => cloud.find(x => x.id === id) || P.BUILTIN.find(x => x.id === id) || repo.find(x => x.id === id);

  const all = () => {
    const m = new Map();
    [...P.BUILTIN.map(s => ({ ...s, builtin: true })), ...repo.map(s => ({ ...s, repo: true })), ...cloud].forEach(s => { if (!DB.hidden.includes(s.id)) m.set(s.id, s); });
    Object.values(DB.songs).forEach(s => m.set(s.id, { ...s, local: true }));
    return [...m.values()];
  };
  const meta = id => (DB.meta[id] = DB.meta[id] || {});
  const plain = t => t.replace(/\{\{[^}]*\}\}/g, '');
  const tok = s => fold(s).split(/[^a-z0-9]+/).filter(Boolean);
  const fold = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const decode = t => t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  const ytId = u => { if (!u) return null; const m = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/.exec(u) || /^([\w-]{11})$/.exec(u.trim()); return m ? m[1] : null; };

  /* ---------- lecture du format {{C}} / {{%C}} / >>>> / [Section] ---------- */
  /* titres de partie : [Refrain], « Refrain : », « Refrain x2 », « (Refrain) »… */
  const SECW = 'refrain|chorus|couplet|verse|pont|bridge|intro|outro|pr[ée][- ]?refrain|pre[- ]?chorus|solo|instrumental|interlude|final|coda';
  const SECRE = new RegExp('^\\s*\\(?\\s*((?:' + SECW + ')(?:\\s*\\d+)?(?:\\s*(?:x\\s*\\d+|\\(x\\s*\\d+\\)|bis))?)\\s*\\)?\\s*:?\\s*$', 'i');
  const isEnd = l => /^\s*\[\/[^\]]*\]\s*$/.test(l);
  const headerOf = l => { if (isEnd(l)) return null; let m = /^\s*\[([^\]]+)\]\s*$/.exec(l); if (m) return m[1].trim(); m = SECRE.exec(l); return m ? m[1].trim() : null; };
  const normName = t => fold(t).replace(/\(?x\s*\d+\)?|bis|[():]/g, '').replace(/chorus/, 'refrain').replace(/verse/, 'couplet').replace(/bridge/, 'pont').replace(/\s+/g, ' ').trim();
  const kindOf = t => normName(t).replace(/\s*\d+/g, '');
  const hasBody = b => b.some(x => x.type === 'line' || x.type === 'tab');
  /* une partie écrite une fois, puis rappelée par son seul titre, est recopiée à l'endroit du rappel */
  function expand(lines) {
    const secs = []; lines.forEach((l, i) => { if (l.type === 'sec') secs.push(i); });
    /* Le contenu d'une partie commence juste sous son titre. Il s'arrête à la balise de fin [/Refrain] si elle existe,
       sinon à la première ligne vide (un paragraphe), et de toute façon au titre suivant. */
    const body = i => {
      const k = secs.indexOf(i), stop = k + 1 < secs.length ? secs[k + 1] : lines.length, b = [];
      const end = lines.findIndex((l, j) => j > i && j < stop && l.type === 'end');
      for (let j = i + 1; j < (end < 0 ? stop : end); j++) { if (end < 0 && lines[j].type === 'blank') break; b.push(lines[j]); }
      while (b.length && b[b.length - 1].type === 'blank') b.pop(); while (b.length && b[0].type === 'blank') b.shift();
      return b;
    };
    const defs = {};
    secs.forEach(i => { const b = body(i); if (!hasBody(b)) return; const n = normName(lines[i].t), k = kindOf(lines[i].t); if (!defs[n]) defs[n] = b; if (!defs[k]) defs[k] = b; });
    const out = [];
    lines.forEach((l, i) => {
      if (l.type !== 'sec' || hasBody(body(i))) return out.push(l);
      const d = defs[normName(l.t)] || defs[kindOf(l.t)];
      if (!d) return out.push(l);
      out.push({ ...l, rep: true }); d.forEach(x => out.push({ ...x, rep: true }));
    });
    return out;
  }
  /* ---------- mise en forme automatique : « Intro : la la » → [Intro] puis « la la » à la ligne ---------- */
  const HEADRE = new RegExp('^\\s*[\\[(]?\\s*((?:' + SECW + ')(?:\\s*\\d+)?(?:\\s*(?:x\\s*\\d+|\\(x\\s*\\d+\\)|bis))?)\\s*[\\])]?\\s*[:\\-–—]\\s*(\\S.*)$', 'i');
  const cap = t => { const u = t === t.toUpperCase() ? t.toLowerCase() : t; return u.charAt(0).toUpperCase() + u.slice(1); };
  function tidy(text) {
    return decode(text || '').replace(/\r/g, '').replace(/\t/g, '    ').split('\n').flatMap(l => {
      const r = l.replace(/\s+$/, ''); if (isEnd(r)) return [r.trim()];
      const m = HEADRE.exec(r);
      if (m) return /^\(?x\s*\d+\)?$/i.test(m[2].trim()) ? ['[' + cap(m[1]) + ' ' + m[2].trim().replace(/[()]/g, '') + ']'] : ['[' + cap(m[1]) + ']', m[2]];
      const hd = headerOf(r); return hd != null ? ['[' + cap(hd) + ']'] : [r];
    }).join('\n').replace(/\n{4,}/g, '\n\n\n');
  }

  /* ---------- accords proposés pour les passages qui n'en ont pas ----------
     1. Une ligne presque identique à une ligne qui a des accords (un refrain répété, même sans titre) reprend exactement ses accords.
     2. Sinon, le paragraphe cherche son modèle : d'abord un paragraphe aux paroles proches, à défaut celui qui a la même
        découpe (nombre de lignes, nombre de syllabes par ligne, même partie).
     3. Dans la ligne, l'accord est placé à la même proportion de syllabes que dans le modèle, au début d'un mot.
     Les accords proposés s'écrivent {{?C}} ; ceux qui existent déjà sont retirés puis recalculés. */
  const VOW = /[aeiouyàâäéèêëîïôöùûüœæ]+/gi;
  const syl = w => { const f = w.toLowerCase(); let n = (f.match(VOW) || []).length; if (n > 1 && /(?:[^aeiouyàâäéèêëîïôöùûüœæ]e|[^aeiouyàâäéèêëîïôöùûüœæ]es|ent)$/.test(f)) n--; return Math.max(1, n); };
  const lineInfo = l => {
    const ch = []; let out = '', last = 0, m; const re = /\{\{([%?]?)([^}]*)\}\}/g;
    while ((m = re.exec(l))) { out += l.slice(last, m.index); if (!m[1]) ch.push({ pos: out.length, c: m[2].trim() }); last = re.lastIndex; }
    out += l.slice(last);
    const w = [...out.matchAll(/[\p{L}\p{N}'’]+/gu)].map(x => ({ i: x.index, e: x.index + x[0].length, k: fold(x[0]).replace(/['’]/g, ''), s: syl(x[0]) }));
    let acc = 0; w.forEach(x => { x.cs = acc; acc += x.s; });
    const endAt = out.trimEnd().length;
    ch.forEach(c => { c.end = c.pos >= endAt || !w.some(x => x.e > c.pos); c.wi = c.end ? w.length : w.findIndex(x => x.e > c.pos); });
    return { out, w, ch, S: acc };
  };
  /* plus longue suite commune de mots : sert à mesurer la ressemblance et à aligner deux lignes */
  const lcs = (a, b) => {
    const n = a.length, m = b.length, d = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) d[i][j] = a[i - 1].k === b[j - 1].k ? d[i - 1][j - 1] + 1 : Math.max(d[i - 1][j], d[i][j - 1]);
    const pairs = []; let i = n, j = m;
    while (i > 0 && j > 0) { if (a[i - 1].k === b[j - 1].k) { pairs.unshift([i - 1, j - 1]); i--; j--; } else if (d[i - 1][j] >= d[i][j - 1]) i--; else j--; }
    return { sim: n + m ? (2 * pairs.length) / (n + m) : 0, pairs };
  };
  function fillLine(dst, src) {
    if (!src.ch.length || !dst.w.length) return null;
    const al = lcs(src.w, dst.w), close = al.sim >= 0.6; let lastW = -1; const ins = [];
    src.ch.forEach(c => {
      let ti;
      if (c.end) ti = dst.w.length;
      else {
        const pr = close ? al.pairs.filter(p => p[0] <= c.wi).pop() : null;
        if (pr) ti = pr[1] + (c.wi - pr[0]);
        else { const target = (src.w[c.wi].cs * dst.S) / Math.max(src.S, 1); ti = 0; dst.w.forEach((x, k) => { if (Math.abs(x.cs - target) < Math.abs(dst.w[ti].cs - target)) ti = k; }); }
      }
      if (ti <= lastW) ti = lastW + 1; lastW = ti;
      ins.push({ pos: ti >= dst.w.length ? null : dst.w[ti].i, c: c.c });
    });
    let line = dst.out.replace(/\s+$/, '');
    ins.filter(x => x.pos == null).forEach(x => { line += ' {{?' + x.c + '}}'; });
    ins.filter(x => x.pos != null).reverse().forEach(x => { line = line.slice(0, x.pos) + '{{?' + x.c + '}}' + line.slice(x.pos); });
    return { line, n: ins.length };
  }
  function autofill(text) {
    const L = text.replace(/\r/g, '').split('\n').map(l => l.replace(/\{\{\?[^}]*\}\}/g, '').replace(/\s+$/, '')), blocks = []; let cur = null, kind = '', closed = false;
    L.forEach((l, i) => {
      const hd = headerOf(l);
      if (hd != null) { kind = kindOf(hd); cur = null; closed = L.slice(i + 1).findIndex(x => isEnd(x) || headerOf(x) != null); closed = closed >= 0 && isEnd(L[i + 1 + closed]); return; }
      if (isEnd(l)) { kind = ''; cur = null; closed = false; return; }
      if (!l.trim() || l.startsWith('>>>>')) { cur = null; if (!l.trim() && !closed) kind = ''; return; }
      if (!cur) { cur = { kind, idx: [], at: i }; blocks.push(cur); }
      cur.idx.push(i);
    });
    const info = {}; blocks.forEach(b => { b.idx.forEach(i => (info[i] = lineInfo(L[i]))); b.inline = b.idx.reduce((a, i) => a + info[i].ch.length, 0); });
    const models = blocks.filter(b => b.inline > 0), chorded = models.flatMap(b => b.idx.filter(i => info[i].ch.length)); let n = 0;
    if (!models.length) return { text: L.join('\n'), n: 0 };
    const twin = i => { let best = -1, bs = 0; chorded.forEach(j => { const s = lcs(info[j].w, info[i].w).sim; if (s > bs) { bs = s; best = j; } }); return bs >= 0.8 ? best : -1; };
    const put = (i, src) => { const r = fillLine(info[i], src); if (r) { L[i] = r.line; n += r.n; } };
    blocks.forEach(b => {
      const empty = b.idx.filter(i => !info[i].ch.length && !L[i].includes('{{') && info[i].w.some(x => x.k.length > 1));
      if (!empty.length) return;
      if (b.inline > 0) { empty.forEach(i => { const t = twin(i); if (t >= 0) put(i, info[t]); }); return; }   /* paragraphe en partie annoté : seules les lignes jumelles */
      /* modèle du paragraphe */
      const psim = M => { const k = Math.min(M.idx.length, b.idx.length); let s = 0; for (let x = 0; x < k; x++) s += lcs(info[M.idx[x]].w, info[b.idx[x]].w).sim; return (s / k) * (k / Math.max(M.idx.length, b.idx.length)); };
      const shape = M => { let d = 0, t = 0; b.idx.forEach((i, x) => { const a = info[i].S, c = info[M.idx[x % M.idx.length]].S; d += Math.abs(a - c); t += Math.max(a, c, 1); }); return d / t; };
      const others = models.filter(M => M !== b);
      let M = others.slice().sort((x, y) => psim(y) - psim(x))[0];
      if (!M || psim(M) < 0.5) M = others.slice().sort((x, y) => { const sc = z => Math.abs(z.idx.length - b.idx.length) * 2 + shape(z) * 4 + (z.kind === b.kind ? 0 : 1.5) + (z.at < b.at ? 0 : 0.5); return sc(x) - sc(y); })[0];
      b.idx.forEach((i, k) => {
        if (!empty.includes(i)) return;
        const t = twin(i); if (t >= 0) return put(i, info[t]);
        if (M) put(i, info[M.idx[k % M.idx.length]]);
      });
    });
    return { text: L.join('\n'), n };
  }
  function parse(text) {
    const chords = [], lines = tidy(text).split('\n').map(l => {
      if (isEnd(l)) return { type: 'end' };
      const hd = headerOf(l); if (hd != null) return { type: 'sec', t: hd };
      if (l.startsWith('>>>>')) return { type: 'tab', t: l.slice(4) };
      if (!l.trim()) return { type: 'blank' };
      const parts = [], re = /\{\{([%?]?)([^}]*)\}\}/g; let last = 0, m, cur = { text: '' };
      while ((m = re.exec(l))) {
        cur.text += l.slice(last, m.index); if (cur.text || cur.raw) parts.push(cur);
        const c = T.parseChord(m[2].trim()); if (c) chords.push(c);
        cur = { raw: m[2].trim(), c, free: m[1] === '%', sug: m[1] === '?', text: '' }; last = re.lastIndex;
      }
      cur.text += l.slice(last); if (cur.text || cur.raw) parts.push(cur);
      return { type: 'line', parts, has: parts.some(p => p.raw && !p.free) };
    });
    return { lines, chords };
  }
  /* « accords au-dessus des paroles » → accords entre accolades */
  const isChordLine = l => { const w = l.trim().split(/\s+/).filter(Boolean); if (!w.length) return false; const n = w.filter(x => T.parseChord(x) || /^(\||x\d+|\(x\d+\)|N\.?C\.?|-)$/i.test(x)).length; return w.some(x => T.parseChord(x)) && n / w.length >= 0.7; };
  function convert(text) {
    const L = text.replace(/\r/g, '').replace(/\t/g, '    ').split('\n'), out = [];
    for (let i = 0; i < L.length; i++) {
      const l = L[i]; if (l.includes('{{') || !isChordLine(l)) { out.push(l); continue; }
      const toks = [...l.matchAll(/\S+/g)], nx = L[i + 1];
      if (nx != null && nx.trim() && !isChordLine(nx) && !/^\s*\[.*\]\s*$/.test(nx) && !nx.includes('{{')) {
        let ly = nx.padEnd(Math.max(...toks.map(t => t.index)), ' ');
        toks.reverse().forEach(t => { if (T.parseChord(t[0])) ly = ly.slice(0, t.index) + '{{' + t[0] + '}}' + ly.slice(t.index); });
        out.push(ly.replace(/\s+$/, '')); i++;
      } else out.push(l.replace(/\S+/g, t => (T.parseChord(t) ? '{{%' + t + '}}' : t)));
    }
    return out.join('\n');
  }
  P.songRecent = () => all().filter(s => meta(s.id).opened).sort((a, b) => meta(b.id).opened - meta(a.id).opened).slice(0, 4);
  const keyOf = s => { if (s.key != null && s.key !== '') return { pc: +s.key, minor: !!s.minor, set: true }; const c = parse(s.text).chords; return c.length ? T.detectKey(c) : { pc: 0, none: true }; };
  const keyName = (pc, minor) => (minor ? T.fmt(T.MINKEYS[(pc + 9) % 12]) + ' mineur' : T.fmt(T.KEYS[pc]) + ' majeur');

  const artistsOf = songs => { const m = new Map(); songs.forEach(s => { const a = (s.artist || '').trim(); if (!a) return; const k = fold(a); if (!m.has(k)) m.set(k, { name: a, n: 0 }); m.get(k).n++; }); return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr')); };
  const artistHref = a => '#/chansons/artiste/' + encodeURIComponent(a);
  const songRow = (s, onChange) => {
    const k = keyOf(s), m = meta(s.id);
    return h('a', { class: 'srow', href: '#/chansons/' + s.id }, h('span', { class: 'srow-t' }, h('strong', {}, s.title), h('span', {}, s.artist || '')),
      h('span', { class: 'srow-m' }, k.none ? '' : keyName(k.pc, k.minor), h('i', {}, [ytId(s.yt) ? 'vidéo' : '', s.local ? 'sur cet appareil' : ''].filter(Boolean).join(', '))),
      h('button', { type: 'button', class: 'star' + (m.fav ? ' on' : ''), 'aria-label': m.fav ? 'Retirer des favoris' : 'Ajouter aux favoris', 'aria-pressed': m.fav ? 'true' : 'false', onclick: e => { e.preventDefault(); m.fav = !m.fav; saveDB(); onChange(); } }, m.fav ? '★' : '☆'));
  };
  /* ============ page d'un artiste ============ */
  function artist(el, name) {
    const rows = h('div', { class: 'songs' });
    const draw = () => { rows.innerHTML = ''; const res = all().filter(s => fold(s.artist) === fold(name)).sort((a, b) => a.title.localeCompare(b.title, 'fr')); if (res.length) rows.append(...res.map(s => songRow(s, draw))); else rows.append(h('p', { class: 'empty' }, 'Aucune chanson de cet artiste dans le carnet.')); };
    draw();
    el.append(h('p', { class: 'sback' }, h('a', { href: '#/chansons' }, 'Toutes les chansons')), rows,
      P.row(h('a', { class: 'btn', href: '#/chansons/new' }, 'Ajouter une chanson'), h('a', { class: 'btn', target: '_blank', rel: 'noopener', href: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name) }, 'Chercher ' + name + ' sur YouTube')));
  }

  let lastQ = '', listY = 0;
  /* ============ liste ============ */
  function list(el) {
    let q = lastQ, filt = P.S.sgFilt || 'all', sort = P.S.sgSort || 'title';
    P.onLeave = () => { lastQ = q; listY = window.scrollY; };
    const rows = h('div', { class: 'songs' }), chips = h('div', { class: 'fchips' }), count = h('p', { class: 'hint' }), sugg = h('div', { class: 'fchips sugg' });
    const draw = () => {
      const songs = all(), folders = [...new Set(songs.map(s => s.folder || 'Sans dossier'))].sort((a, b) => a.localeCompare(b, 'fr'));
      if (filt !== 'all' && filt !== 'fav' && !folders.includes(filt)) filt = 'all';
      chips.innerHTML = '';
      [['all', 'Toutes'], ['fav', 'Favoris'], ...folders.map(f => [f, f])].forEach(([k, l]) => {
        const n = k === 'all' ? songs.length : k === 'fav' ? songs.filter(s => meta(s.id).fav).length : songs.filter(s => (s.folder || 'Sans dossier') === k).length;
        chips.append(h('button', { type: 'button', class: k === filt ? 'on' : '', onclick: () => { filt = k; P.S.sgFilt = k; P.save(); draw(); } }, l, h('small', {}, String(n))));
      });
      /* La recherche ignore dossiers et tri : elle classe par pertinence. Un mot de la recherche doit commencer un mot
         du titre ou de l'artiste ; dans les paroles, seule la suite exacte des mots compte. */
      const words = tok(q), fq = words.join(' ');
      chips.hidden = sortSel.hidden = !!words.length;
      let res;
      if (words.length) {
        const score = s => {
          const tt = tok(s.title), ta = tok(s.artist), ft = tt.join(' '), fa = ta.join(' '), inW = t => words.every(w => t.some(x => x.startsWith(w)));
          if (ft === fq) return 1000; if (ft.startsWith(fq)) return 700; if ((' ' + ft).includes(' ' + fq)) return 500; if (inW(tt)) return 400;
          if (fa === fq) return 450; if ((' ' + fa).includes(' ' + fq)) return 350; if (inW(ta)) return 300; if (inW([...tt, ...ta])) return 250;
          if (fq.length >= 4 && (ft.includes(fq) || fa.includes(fq))) return 100;
          if (fq.length >= 4 && (' ' + tok(plain(s.text)).join(' ')).includes(' ' + fq)) return 50;
          return 0;
        };
        res = songs.map(s => [score(s), s]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0] || a[1].title.localeCompare(b[1].title, 'fr')).map(x => x[1]);
      } else {
        res = songs.filter(s => (filt === 'all' || (filt === 'fav' ? meta(s.id).fav : (s.folder || 'Sans dossier') === filt)));
        res.sort(sort === 'recent' ? (a, b) => (b.updated || 0) - (a.updated || 0) : sort === 'artist' ? (a, b) => (a.artist || '').localeCompare(b.artist || '', 'fr') || a.title.localeCompare(b.title, 'fr') : (a, b) => a.title.localeCompare(b.title, 'fr'));
      }
      rows.innerHTML = ''; count.textContent = words.length ? (res.length ? res.length + ' résultat' + (res.length > 1 ? 's' : '') + ' pour « ' + q.trim() + ' », du plus proche au plus lointain.' : '') : res.length + ' chanson' + (res.length > 1 ? 's' : '') + '.';
      const row = s => songRow(s, draw);
      /* dès les premières lettres d'un artiste, on propose sa page */
      sugg.innerHTML = '';
      if (words.length) {
        const hit = artistsOf(songs).filter(a => { const fa = fold(a.name); return fa.startsWith(fq) || fa.split(/\s+/).some(w => w.startsWith(fq)) || (fq.length > 2 && fa.includes(fq)); }).slice(0, 6);
        if (hit.length) sugg.append(h('span', { class: 'hint' }, hit.length > 1 ? 'Artistes :' : 'Artiste :'), ...hit.map(a => h('a', { href: artistHref(a.name) }, a.name, h('small', {}, String(a.n)))));
      }
      if (!res.length) rows.append(h('p', { class: 'empty' }, words.length ? 'Aucune chanson ne correspond à « ' + q.trim() + ' ». La recherche porte sur les titres, les artistes, et les suites de mots exactes dans les paroles.' : 'Ce dossier est vide. Ajoute une chanson pour commencer.'));
      else if (words.length) rows.append(...res.map(row));
      else if (sort === 'artist') { artistsOf(res).forEach(a => rows.append(h('h3', { class: 'sfold' }, h('a', { href: artistHref(a.name) }, a.name)), ...res.filter(s => fold(s.artist) === fold(a.name)).map(row))); const rest = res.filter(s => !(s.artist || '').trim()); if (rest.length) rows.append(h('h3', { class: 'sfold' }, 'Sans artiste'), ...rest.map(row)); }
      else if (filt === 'all' && sort !== 'recent') folders.forEach(f => { const g = res.filter(s => (s.folder || 'Sans dossier') === f); if (g.length) rows.append(h('h3', { class: 'sfold' }, f), ...g.map(row)); });
      else rows.append(...res.map(row));
    };
    const sortSel = P.sel([['title', 'Par titre'], ['artist', 'Par artiste'], ['recent', 'Les plus récentes']], sort, v => { sort = v; P.S.sgSort = v; P.save(); draw(); });
    const file = h('input', { type: 'file', accept: '.json,.txt,application/json,text/plain', hidden: true, onchange: e => {
      const f = e.target.files[0]; if (!f) return; const rd = new FileReader();
      rd.onload = () => {
        let data = null; try { data = JSON.parse(rd.result); } catch (err) { /* texte brut */ }
        const arr = Array.isArray(data) ? data : data && Array.isArray(data.songs) ? data.songs : null;
        if (arr) { let n = 0; arr.forEach(s => { if (!s || !s.title || typeof s.text !== 'string') return; const id = s.id || 's' + Date.now().toString(36) + n; DB.songs[id] = { id, title: s.title, artist: s.artist || '', folder: s.folder || '', yt: s.yt || '', key: s.key == null ? '' : s.key, minor: !!s.minor, text: s.text, updated: s.updated || Date.now() }; n++; }); saveDB(); draw(); alert(n + ' chanson' + (n > 1 ? 's importées.' : ' importée.')); }
        else { P.draft = { title: f.name.replace(/\.\w+$/, ''), text: String(rd.result) }; location.hash = '#/chansons/new'; }
      };
      rd.readAsText(f); e.target.value = '';
    } });
    const exp = () => {
      const mine = Object.values(DB.songs); if (!mine.length) return alert('Tu n\'as pas encore ajouté de chanson : il n\'y a rien à exporter.');
      const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(mine, null, 1)], { type: 'application/json' })), download: 'songs.json' }); document.body.append(a); a.click(); a.remove();
    };
    el.append(P.row(h('a', { class: 'btn solid', href: '#/chansons/new' }, 'Ajouter une chanson'), P.btn('Une chanson au hasard', () => { const a = all(); if (a.length) location.hash = '#/chansons/' + P.pick(a).id; }), P.btn('Importer un fichier', () => file.click()), P.btn('Exporter mes chansons', exp), file),
      h('div', { class: 'sfind' }, h('input', { type: 'search', value: lastQ, placeholder: 'Chercher un titre, un artiste, des paroles', 'aria-label': 'Chercher une chanson', oninput: e => { q = e.target.value; draw(); } }),
        sortSel),
      sugg, chips, count, rows);
    draw();
    if (listY) { const y = listY; listY = 0; requestAnimationFrame(() => window.scrollTo(0, y)); }
    /* espace administrateur */
    const cl = h('div', { class: 'cloud' });
    const drawCloud = () => {
      cl.innerHTML = ''; if (!cloudOn) return;
      const st = cloudState === 'loading' ? 'Chargement des chansons partagées…' : cloudState === 'error' ? 'Chansons partagées : serveur injoignable, affichage de la dernière copie connue (' + cloud.length + ').' : cloud.length + ' chanson' + (cloud.length > 1 ? 's partagées' : ' partagée') + ' en ligne.';
      if (sess) {
        const mine = Object.values(DB.songs), msg = h('span', { class: 'hint' });
        cl.append(h('p', {}, h('b', {}, 'Connecté : ' + (sess.email || 'administrateur') + '. '), st),
          P.row(mine.length ? P.btn(mine.length > 1 ? 'Publier en ligne mes ' + mine.length + ' chansons de cet appareil' : 'Publier en ligne ma chanson de cet appareil', async e => {
            e.currentTarget.disabled = true; let n = 0;
            try { for (const s of mine) { await Cloud.save(s); delete DB.songs[s.id]; n++; } msg.textContent = n + ' publiée' + (n > 1 ? 's.' : '.'); } catch (err) { msg.textContent = n + ' publiée(s), puis : ' + err.message; }
            saveDB(); draw(); drawCloud();
          }) : null, P.btn('Actualiser', async () => { await Cloud.load(); draw(); drawCloud(); }), P.btn('Se déconnecter', () => { Cloud.logout(); drawCloud(); }), msg));
      } else {
        const em = h('input', { type: 'text', placeholder: 'Adresse e-mail', autocomplete: 'username', 'aria-label': 'Adresse e-mail' }), pw = h('input', { type: 'password', placeholder: 'Mot de passe', autocomplete: 'current-password', 'aria-label': 'Mot de passe' }), msg = h('p', { class: 'fb ko' });
        const go = async () => { msg.textContent = ''; try { await Cloud.login(em.value.trim(), pw.value); drawCloud(); draw(); } catch (err) { msg.textContent = err.message; } };
        pw.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        cl.append(h('p', { class: 'hint' }, st), h('details', {}, h('summary', {}, 'Espace administrateur'), h('div', { class: 'sform' }, em, pw), P.row(P.btn('Se connecter', go, 'solid')), msg));
      }
    };
    drawCloud(); el.append(cl);
    if (!repoTried && location.protocol.startsWith('http')) { repoTried = true; fetch('songs.json').then(r => (r.ok ? r.json() : null)).then(d => { if (Array.isArray(d)) { repo = d.filter(s => s && s.id && s.title && typeof s.text === 'string'); if (rows.isConnected) draw(); } }).catch(() => {}); }
    el.append(P.prose(`
<h2>Comment ça marche</h2>
<p><b>Ajouter une chanson.</b> Colle les paroles et les accords dans le format des sites de grilles : un accord entre doubles accolades se place au-dessus du mot qui le suit, par exemple <code>Won't {{C}}you sing {{G}}me a song</code>. Si ta source présente les accords sur une ligne au-dessus des paroles, colle-la telle quelle : le site la convertit.</p>
<p><b>Où sont rangées tes chansons.</b> Celles que tu ajoutes : dans ce navigateur, sur cet appareil (elles portent la mention « sur cet appareil »). Les chansons partagées par l'administrateur du site, elles, sont visibles par tout le monde ; tu peux en faire une copie personnelle en les modifiant. Pour les retrouver sur ton téléphone et ton ordinateur, utilise « Exporter mes chansons » puis « Importer un fichier » sur l'autre appareil. Tu peux aussi déposer le fichier exporté, nommé <code>songs.json</code>, à la racine du dépôt GitHub : elles apparaîtront alors partout. Attention, un dépôt GitHub Pages gratuit est public : n'y publie que des textes que tu as le droit de diffuser.</p>
<p><b>Les chansons fournies</b> sont toutes du domaine public, avec une harmonisation simple proposée par le site. Tu peux les modifier ou les supprimer.</p>`));
  }

  /* ============ une chanson ============ */
  function song(el, s) {
    const M = meta(s.id), det = keyOf(s);
    M.opened = Date.now(); saveDB();
    let parsed, sugN = 0, repN = 0;
    const build = () => {
      /* les accords marqués « ? » ne sont jamais figés : ils sont recalculés à chaque affichage */
      let t = tidy(s.text).replace(/\{\{\?[^}]*\}\}/g, ''); sugN = 0;
      if (P.S.sgSug !== false) { const r = autofill(t); t = r.text; sugN = r.n; }
      parsed = parse(t);
      if (P.S.sgExp !== false) parsed.lines = expand(parsed.lines);
      repN = parsed.lines.filter(l => l.type === 'sec' && l.rep).length;
    };
    build();
    let tr = M.tr || 0, mode = P.S.sgMode || 'ch', size = P.S.sgSize || 1, speed = P.S.sgSpeed || 22, split = false, raf = null, vid = true, pin = false;
    const toTonic = () => T.KEYS[T.mod(det.pc + tr)], tx = c => T.transpose(c, det.pc, toTonic());
    const panes = h('div', { class: 'panes' }), keyLab = h('button', { type: 'button', class: 'skey', title: 'Revenir à la tonalité originale', onclick: () => setTr(0) });
    const hover = window.matchMedia('(hover: hover)').matches;

    /* fiche d'accord */
    const cardKb = h('div'), cardT = h('strong'), cardN = h('span'); let cc = null, ck = 0;
    const card = h('div', { class: 'chcard', hidden: true }, h('div', { class: 'chcard-h' }, cardT, cardN, h('button', { type: 'button', class: 'pill-x', 'aria-label': 'Fermer', onclick: () => (card.hidden = true) }, '×')), cardKb,
      P.row(P.btn('Écouter', () => showCard(cc, true)), P.btn('Autre position', () => { ck++; showCard(cc, true); })));
    const kb = new P.Keyboard(cardKb, { from: 48, to: 76, small: true, mob: [48, 76], minKey: 14 });
    function showCard(c, play) {
      if (!c) return; if (!cc || T.chordName(cc) !== T.chordName(c)) ck = 0; cc = c;
      const t = T.chordSemis(c.q).slice(0, 4), n = t.length;
      if (c.bass && ck === 0) { const i = t.findIndex(x => T.mod(c.rpc + x) === c.bpc); if (i > 0) ck = i; }
      const k = ck % n, bass = T.lowIn(c.rpc + t[k], 48), ms = t.map((_, i) => bass + t[(k + i) % n] + (k + i >= n ? 12 : 0) - t[k]);
      card.hidden = false; cardT.textContent = T.chordName(c); kb.mark(P.marksChord(c, ms, 'note'));
      cardN.textContent = ms.map(m => { const d = T.chordDegs(c.q).find(x => x.semi % 12 === T.mod(m - c.rpc)); return T.fmt(d ? T.simplify(T.spell(c.root, d)) : T.SIMPLE[m % 12]); }).join(' – ') + (k ? ' (renversement ' + k + ')' : '');
      if (play) { A.piano(T.lowIn(c.bass ? c.bpc : c.rpc, 36), 0, 1.5, 0.5); A.chord(ms, 0, 1.5, 0.5, 0.015); }
    }
    const chordBtn = p => {
      if (!p.c) return h('span', { class: 'sc raw' + (p.free ? ' free' : '') }, p.raw);
      const c = tx(p.c), name = T.chordName(c), rom = T.roman(p.c, det.pc);
      const b = h('button', { type: 'button', class: 'sc' + (p.free ? ' free' : '') + (p.sug ? ' sug' : '') + (mode === 'hide' ? ' hid' : ''), title: p.sug ? 'Accord proposé par le site, à vérifier' : null, onclick: () => { if (b.classList.contains('hid')) { b.classList.remove('hid'); b.textContent = name; } showCard(c, true); } },
        mode === 'hide' ? '?' : mode === 'deg' ? rom : name, mode === 'both' ? h('small', {}, rom) : null);
      if (hover) b.addEventListener('mouseenter', () => { if (!b.classList.contains('hid')) showCard(c, false); });
      return b;
    };
    /* Une ligne est découpée en mots insécables. Un accord placé au milieu d'un mot ne crée donc jamais de point de coupure :
       le retour à la ligne ne peut se faire qu'entre deux mots. */
    const pieces = t => t.match(/\s*\S+\s*|\s+/g) || [];
    const lineEl = l => {
      const cls = 'sl' + (l.has ? ' has' : '') + (l.rep ? ' rep' : '');
      if (!l.has) return h('div', { class: cls }, l.parts.map(p => [p.raw ? chordBtn(p) : null, p.text]));
      const atoms = [];
      l.parts.forEach(p => {
        const ts = pieces(p.text || '');
        if (p.raw && p.free) atoms.push({ p, free: true, t: '' });
        else if (p.raw) atoms.push({ p, t: ts.length ? ts.shift() : '' });
        ts.forEach(t => atoms.push({ t }));
      });
      const units = []; let prev = null;
      atoms.forEach(a => {
        if (!prev || prev.free || a.free || /\s$/.test(prev.t) || /^\s/.test(a.t) || (!a.t && !a.p)) units.push([]);
        units[units.length - 1].push(a); prev = a;
      });
      return h('div', { class: cls }, units.map(u => h('span', { class: 'sw' }, u.map(a => (a.free ? chordBtn(a.p) : h('span', { class: 'sg' }, a.p ? chordBtn(a.p) : null, h('span', { class: 'sx' }, a.t || ' ')))))));
    };
    const pane = () => h('div', { class: 'pane' }, parsed.lines.map(l => {
      if (l.type === 'sec') return h('h3', { class: 'ssec' + (l.rep ? ' rep' : '') }, l.t, l.rep ? h('small', {}, ' repris') : null);
      if (l.type === 'tab') return h('pre', { class: 'stab' }, l.t);
      if (l.type === 'blank') return h('div', { class: 'sblank' });
      if (l.type === 'end') return null;
      return lineEl(l);
    }));
    /* réduit le texte juste assez pour que la ligne la plus longue tienne sur la largeur de l'écran */
    const fit = () => {
      const p = panes.firstChild; panes.classList.add('nowrap'); let mx = 0; p.querySelectorAll('.sl').forEach(e => { mx = Math.max(mx, e.scrollWidth); });
      const w = p.clientWidth; panes.classList.remove('nowrap');
      if (mx > w + 1) { size = Math.max(0.55, Math.floor(((size * w) / mx) * 100) / 100); P.S.sgSize = size; P.save(); redraw(); }
    };
    const redraw = () => {
      const y = panes.firstChild ? panes.firstChild.scrollTop : 0;
      panes.innerHTML = ''; panes.append(pane()); if (split) panes.append(pane());
      panes.classList.toggle('duo', split); panes.style.setProperty('--fs', size); if (split) panes.firstChild.scrollTop = y;
      const pc = T.mod(det.pc + tr);
      note.textContent = [sugN ? 'En orange : ' + sugN + ' accord' + (sugN > 1 ? 's proposés' : ' proposé') + ' par le site pour les passages sans accords, d\'après un passage semblable. À vérifier à l\'oreille.' : '', repN ? 'Les parties rappelées par leur seul titre (refrain) sont recopiées à leur place.' : ''].filter(Boolean).join(' ');
      note.hidden = !note.textContent;
      keyLab.innerHTML = ''; keyLab.append(h('b', {}, det.none ? 'Sans accords' : keyName(pc, det.minor)), h('small', {}, tr ? 'orig. ' + keyName(det.pc, det.minor) : 'originale'));
    };
    const note = h('p', { class: 'hint snote', hidden: true });
    /* la tonalité du site suit celle de la chanson */
    const sync = () => { if (det.none) return; const pc = T.mod(det.pc + tr); if (P.S.key !== pc) { P.S.key = pc; P.save(); } if (P.syncKeys) P.syncKeys(); };
    const setTr = v => { tr = T.mod(v); M.tr = tr; saveDB(); redraw(); sync(); if (cc && !card.hidden) card.hidden = true; };
    /* tonalité recommandée : celle qui met le moins de touches noires sous les doigts */
    const best = () => {
      let bs = 0, bc = 1e9;
      for (let sh = 0; sh < 12; sh++) {
        const cost = parsed.chords.reduce((a, c) => a + T.chordSemis(c.q).slice(0, 3).filter(x => [1, 3, 6, 8, 10].includes(T.mod(c.rpc + x + sh))).length + ([1, 3, 6, 8, 10].includes(T.mod(c.rpc + sh)) ? 1 : 0), 0) + Math.min(sh, 12 - sh) * 0.01;
        if (cost < bc) { bc = cost; bs = sh; }
      }
      return bs;
    };
    /* défilement automatique */
    const scrollB = P.btn('Défiler', () => (raf ? stopScroll() : startScroll()), 'play');
    const stopScroll = () => { if (raf) cancelAnimationFrame(raf); raf = null; scrollB.textContent = 'Défiler'; scrollB.classList.remove('on'); if (!A.loops.size) A.wake(false); };
    const startScroll = () => {
      let last = 0, acc = 0; scrollB.textContent = 'Arrêter'; scrollB.classList.add('on'); A.wake(true);
      const step = ts => {
        if (last) acc += ((ts - last) / 1000) * speed; last = ts;
        const px = Math.floor(acc);
        if (px >= 1) {
          acc -= px;
          if (split) { const p = panes.firstChild, b = p.scrollTop; p.scrollTop += px; if (p.scrollTop === b && b > 0) return stopScroll(); }
          else { const b = window.scrollY; window.scrollBy(0, px); if (window.scrollY === b && b > 0) return stopScroll(); }
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    P.onLeave = stopScroll;
    P.onKey = pc => setTr(pc - det.pc); P.onKey.always = true;

    /* vidéo */
    const id = ytId(s.yt), yt = h('div', { class: 'yt' }), frame = h('div', { class: 'yt-f' }), vctl = h('div', { class: 'row' });
    /* épingler ne fait que changer le style : le lecteur n'est jamais recréé, la lecture continue */
    const drawVid = () => {
      yt.classList.toggle('pin', pin && vid); frame.hidden = !vid;
      if (vid && !frame.firstChild) frame.append(h('iframe', { src: 'https://www.youtube-nocookie.com/embed/' + id + '?playsinline=1&rel=0', title: 'Vidéo : ' + s.title, allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture', allowfullscreen: true }));
      if (!vid) frame.innerHTML = '';
      vctl.innerHTML = ''; vctl.append(P.btn(vid ? 'Fermer la vidéo' : 'Afficher la vidéo', () => { vid = !vid; drawVid(); }));
      if (vid) vctl.append(P.btn(pin ? 'Détacher la vidéo' : 'Garder la vidéo visible', () => { pin = !pin; drawVid(); }));
    };
    if (id) yt.append(frame, vctl);
    else yt.append(h('a', { class: 'btn', target: '_blank', rel: 'noopener', href: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(s.title + ' ' + (s.artist || '')) }, 'Chercher cette chanson sur YouTube'), h('p', { class: 'hint' }, 'Pour intégrer la vidéo ici, colle son lien dans « Options », puis « Modifier la chanson ».'));
    if (id) drawVid();

    const opts = h('div', { class: 'sopts', hidden: true },
      h('p', { class: 'hint' }, 'Tonalité : − et + transposent d\'un demi-ton, « Facile » choisit la tonalité où les accords passent le plus par les touches blanches, et toucher le nom de la tonalité revient à l\'originale. La tonalité du site suit celle de la chanson.'),
      P.row(P.field('Refrains rappelés par leur titre', P.seg([[true, 'Recopiés'], [false, 'Tels quels']], P.S.sgExp !== false, v => { P.S.sgExp = v; P.save(); build(); redraw(); })),
        P.field('Accords proposés là où il en manque', P.seg([[true, 'Affichés'], [false, 'Masqués']], P.S.sgSug !== false, v => { P.S.sgSug = v; P.save(); build(); redraw(); }))),
      P.row(P.field('Accords affichés', P.seg([['ch', 'Noms'], ['deg', 'Degrés'], ['both', 'Les deux'], ['hide', 'Masqués']], mode, v => { mode = v; P.S.sgMode = v; P.save(); redraw(); })),
        P.field('Écran', P.seg([[false, 'Entier'], [true, 'Coupé en deux']], split, v => { split = v; redraw(); if (v) panes.scrollIntoView({ block: 'start' }); })),
        P.field('Taille du texte', P.row(P.btn('A−', () => { size = Math.max(0.7, +(size - 0.1).toFixed(2)); P.S.sgSize = size; P.save(); redraw(); }), P.btn('A+', () => { size = Math.min(1.8, +(size + 0.1).toFixed(2)); P.S.sgSize = size; P.save(); redraw(); }), P.btn('Ajuster à l\'écran', fit), P.btn('Normale', () => { size = 1; P.S.sgSize = 1; P.save(); redraw(); }))),
        P.range('Vitesse de défilement', 4, 90, speed, v => { speed = v; P.S.sgSpeed = v; P.save(); }, ' px/s')),
      h('p', { class: 'hint' }, '« Masqués » remplace chaque accord par un point d\'interrogation : cherche-le à l\'oreille, puis touche-le pour vérifier. « Coupé en deux » affiche la chanson dans deux zones qui défilent séparément, par exemple le refrain en haut et les couplets en bas.'),
      P.row(h('a', { class: 'btn', href: '#/chansons/' + s.id + '/edit' }, 'Modifier la chanson'), s.src ? h('a', { class: 'btn', href: s.src, target: '_blank', rel: 'noopener' }, 'Page d\'origine') : null,
        P.btn('Envoyer la grille au Jazzifieur', () => { const cs = parsed.chords.slice(0, 16).map(c => T.chordName(tx(c))); if (!cs.length) return; P.S.key = T.mod(det.pc + tr); P.S.jz = cs.join(' '); P.save(); location.hash = '#/jazzifieur'; }),
        cloudOn && sess && s.local ? P.btn('Publier en ligne pour tout le monde', async e => { const b = e.currentTarget; b.disabled = true; b.textContent = 'Envoi…'; try { const { local, ...rec } = s; await Cloud.save(rec); delete DB.songs[s.id]; saveDB(); P.rerender(); } catch (err) { b.disabled = false; b.textContent = err.message; } }) : null,
        P.btn(M.fav ? 'Retirer des favoris' : 'Mettre en favori', e => { M.fav = !M.fav; saveDB(); e.currentTarget.textContent = M.fav ? 'Retirer des favoris' : 'Mettre en favori'; })));
    const recoB = P.btn('Facile', () => setTr(best()), 'reco'); recoB.title = 'Tonalité recommandée : la plus facile à jouer'; recoB.setAttribute('aria-label', 'Tonalité recommandée, la plus facile à jouer');
    const optB = P.btn('Options', () => { opts.hidden = !opts.hidden; optB.classList.toggle('on', !opts.hidden); if (split && opts.hidden) panes.scrollIntoView({ block: 'start' }); });
    el.append(h('p', { class: 'sback' }, h('a', { href: '#/chansons' }, 'Toutes les chansons'), s.folder ? ' / ' + s.folder : '', (s.artist || '').trim() ? [' / ', h('a', { href: artistHref(s.artist.trim()) }, 'Tout ' + s.artist.trim())] : ''), yt,
      h('div', { class: 'sbar' }, P.btn('−', () => setTr(tr - 1), 'sq'), keyLab, recoB, P.btn('+', () => setTr(tr + 1), 'sq'), scrollB, optB), opts, note, panes, card);
    redraw(); sync();
  }

  /* ============ édition ============ */
  function edit(el, s) {
    /* brouillon : ce qui est saisi est gardé tant que ce n'est pas enregistré (retour arrière involontaire, page rechargée) */
    const DK = 'douze-draft', did = s ? s.id : 'new'; let dr = null; try { dr = JSON.parse(localStorage.getItem(DK) || 'null'); } catch (e) { /* pas de brouillon */ }
    const restored = !!(dr && dr.id === did && !P.draft);
    const d = restored ? { ...(s || {}), ...dr.f } : s || P.draft || {}; P.draft = null;
    const folders = [...new Set(all().map(x => x.folder).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
    const inp = (v, ph) => h('input', { type: 'text', value: v || '', placeholder: ph || '' });
    const title = inp(d.title, 'Titre'), artist = inp(d.artist, 'Artiste'), yt = inp(d.yt, 'https://www.youtube.com/watch?v=…'), src = inp(d.src, 'Adresse de la page où tu as trouvé la chanson');
    /* dossier : les dossiers existants en un geste, ou un nouveau */
    let fold = d.folder || ''; if (fold && !folders.includes(fold)) folders.push(fold);
    const newF = inp('', 'Nom du nouveau dossier'), fpick = h('div', { class: 'fchips' }); newF.hidden = true;
    const drawF = () => {
      fpick.innerHTML = '';
      [['', 'Sans dossier'], ...folders.map(f => [f, f])].forEach(([v, l]) => fpick.append(h('button', { type: 'button', class: newF.hidden && v === fold ? 'on' : '', 'aria-pressed': newF.hidden && v === fold ? 'true' : 'false', onclick: () => { fold = v; newF.hidden = true; drawF(); } }, l)));
      fpick.append(h('button', { type: 'button', class: newF.hidden ? '' : 'on', onclick: () => { newF.hidden = false; drawF(); newF.focus(); } }, 'Nouveau dossier'));
    };
    drawF();
    const folderVal = () => (newF.hidden ? fold : newF.value.trim());
    /* un lien de site de grilles contient souvent l'artiste et le titre : on les en déduit */
    const nice = t => decodeURIComponent(t).replace(/[-_+]+/g, ' ').replace(/\b\p{L}/gu, c => c.toUpperCase()).trim();
    src.addEventListener('input', () => {
      const m = /^https?:\/\/[^/]+\/(?:custom\/|tab\/|partition\/)?([^/?#]+)\/([^/?#]+)/.exec(src.value.trim()); srcA.hidden = !/^https?:\/\//.test(src.value.trim()); srcA.href = src.value.trim();
      if (!m || /^\d+$/.test(m[2])) return;
      if (!artist.value.trim()) artist.value = nice(m[1]); if (!title.value.trim()) title.value = nice(m[2]);
    });
    const srcA = h('a', { class: 'btn', target: '_blank', rel: 'noopener', href: d.src || '#', hidden: !d.src }, 'Ouvrir cette page');
    const ta = h('textarea', { rows: 18, spellcheck: 'false', class: 'sedit', 'aria-label': 'Paroles et accords' }); ta.value = d.text || '';
    let key = d.key == null ? '' : String(d.key), minor = !!d.minor; const msg = h('p', { class: 'fb', 'aria-live': 'polite' });
    const keep = () => { try { localStorage.setItem(DK, JSON.stringify({ id: did, f: { title: title.value, artist: artist.value, yt: yt.value, src: src.value, text: ta.value, folder: folderVal() } })); } catch (e) { /* tant pis */ } };
    const drop = () => { try { localStorage.removeItem(DK); } catch (e) { /* rien */ } };
    [title, artist, yt, src, ta].forEach(x => x.addEventListener('input', keep));
    const admin = cloudOn && !!sess; let dest = admin && (!s || !s.local) ? 'cloud' : 'local';
    const save = async () => {
      if (!title.value.trim()) { msg.textContent = 'Donne un titre à la chanson.'; msg.className = 'fb ko'; title.focus(); return; }
      let text = ta.value; if (!text.includes('{{')) text = convert(text);
      text = tidy(text);
      const id = s ? s.id : 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const rec = { id, title: title.value.trim(), artist: artist.value.trim(), folder: folderVal(), yt: yt.value.trim(), src: src.value.trim(), key, minor, text, updated: Date.now() };
      if (dest === 'cloud') {
        msg.textContent = 'Envoi en ligne…'; msg.className = 'fb';
        try { await Cloud.save(rec); delete DB.songs[id]; DB.hidden = DB.hidden.filter(x => x !== id); } catch (err) { msg.textContent = err.message + ' La chanson n\'a pas été enregistrée.'; msg.className = 'fb ko'; return; }
      } else DB.songs[id] = rec;
      drop(); saveDB(); location.hash = '#/chansons/' + id;
    };
    const del = async () => {
      if (!s) return;
      const base = under(s.id), online = admin && !s.local && s.cloud;
      if (!confirm(s.local && base ? 'Supprimer ta copie personnelle de « ' + s.title + ' » et revenir à la version d\'origine ?' : online ? 'Supprimer « ' + s.title + ' » en ligne, pour tout le monde ?' : 'Supprimer « ' + s.title + ' » de ce carnet ?')) return;
      if (online) { try { await Cloud.del(s.id); } catch (err) { msg.textContent = err.message; msg.className = 'fb ko'; return; } }
      else if (s.local) delete DB.songs[s.id];
      else DB.hidden.push(s.id);
      if (!(s.local && base)) delete DB.meta[s.id];
      saveDB(); location.hash = s.local && base ? '#/chansons/' + s.id : '#/chansons';
    };
    el.append(h('p', { class: 'sback' }, h('a', { href: s ? '#/chansons/' + s.id : '#/chansons', onclick: drop }, s ? 'Revenir à la chanson sans enregistrer' : 'Toutes les chansons')),
      restored ? h('p', { class: 'fb' }, 'Brouillon retrouvé : ta saisie non enregistrée a été rétablie. ', P.btn('Repartir de zéro', () => { drop(); P.rerender(); })) : null,
      P.tool(s ? 'Modifier' : 'Nouvelle chanson',
        h('div', { class: 'sform' }, P.field('Titre', title), P.field('Artiste', artist), h('div', { class: 'field wide' }, h('span', { class: 'field-l' }, 'Dossier'), fpick, newF), P.field('Lien YouTube (facultatif)', yt),
          P.field('Tonalité d\'origine', P.sel([['', 'Détection automatique'], ...T.KEYS.flatMap((k, i) => [[i + 'M', T.fmt(k) + ' majeur'], [i + 'm', T.fmt(T.MINKEYS[(i + 9) % 12]) + ' mineur']])], key === '' ? '' : key + (minor ? 'm' : 'M'), v => { key = v === '' ? '' : String(parseInt(v, 10)); minor = v.endsWith('m'); }))),
        h('div', { class: 'field' }, h('span', { class: 'field-l' }, 'Page d\'origine (facultatif) : colle le lien, l\'artiste et le titre se remplissent'), src),
        P.row(srcA, P.btn('Coller le texte copié', async () => {
          try { const t = await navigator.clipboard.readText(); if (!t.trim()) throw 0; if (ta.value.trim() && !confirm('Remplacer le texte déjà saisi par le contenu du presse-papiers ?')) return; ta.value = t; msg.textContent = 'Texte collé. Vérifie, puis enregistre.'; msg.className = 'fb'; }
          catch (e) { msg.textContent = 'Le navigateur n\'a pas donné accès au presse-papiers : fais un appui long (ou Ctrl+V) dans la zone de texte.'; msg.className = 'fb ko'; ta.focus(); }
        })),
        P.field('Paroles et accords', ta),
        admin ? P.field('Où enregistrer', P.seg([['cloud', 'En ligne, pour tout le monde'], ['local', 'Sur cet appareil seulement']], dest, v => (dest = v))) : s && !s.local && under(s.id) ? h('p', { class: 'hint' }, 'Tu modifies une copie personnelle : elle sera enregistrée sur cet appareil et remplacera chez toi la version d\'origine. La supprimer rétablit l\'originale.') : null,
        P.row(P.btn('Enregistrer', save, 'solid'), P.btn('Convertir les accords écrits au-dessus des paroles', () => { const c = convert(ta.value); msg.textContent = c === ta.value ? 'Rien à convertir : aucune ligne d\'accords isolée n\'a été trouvée.' : 'Converti. Vérifie le placement des accords, puis enregistre.'; msg.className = 'fb'; ta.value = c; }), P.btn('Mettre en forme', () => { const t = tidy(ta.value.includes('{{') ? ta.value : convert(ta.value)); msg.textContent = t === ta.value ? 'Le texte est déjà en forme.' : 'Titres de parties et espaces remis en forme.'; msg.className = 'fb'; ta.value = t; }),
          P.btn('Proposer des accords pour les passages qui n\'en ont pas', () => { const r = autofill(tidy(ta.value)); ta.value = r.text; msg.textContent = r.n ? r.n + ' accord' + (r.n > 1 ? 's proposés' : ' proposé') + ', écrits avec un point d\'interrogation ({{?C}}). Les anciennes propositions ont été remplacées. Enlève le « ? » de ceux que tu veux figer : les autres sont recalculés à chaque affichage.' : 'Rien à proposer : soit tous les passages ont des accords, soit aucun n\'en a.'; msg.className = 'fb'; }), s ? P.btn('Supprimer', del) : null),
        msg,
        P.prose(`<h4>Depuis un site de grilles</h4>
<p>Colle l'adresse de la page dans « Page d'origine », touche « Ouvrir cette page », puis sur le site ouvre le mode édition de la chanson (celui où les accords apparaissent entre accolades). Sélectionne tout le texte, copie-le, reviens ici et touche « Coller le texte copié ». L'artiste et le titre sont déjà remplis d'après l'adresse.</p>
<h4>Mode d'emploi du format</h4>
<ul>
<li>Un accord entre doubles accolades, <code>{{A}}</code>, se place juste avant le mot (ou la syllabe) où il doit être joué. Il s'affichera au-dessus.</li>
<li>Avec un signe %, <code>{{%Em}}</code>, l'accord s'affiche dans le texte, sans être lié à une parole : pour les intros, les ponts instrumentaux, les fins.</li>
<li>Une ligne entre crochets, <code>[Refrain]</code>, devient un titre de partie (« Refrain : » est reconnu aussi).</li>
<li><b>Écris le refrain une seule fois</b> sous son titre. Ensuite, une ligne <code>[Refrain]</code> toute seule, suivie d'une ligne vide, le rappelle : il sera affiché en entier à cet endroit. Cela vaut pour n'importe quelle partie (<code>[Pont]</code>, <code>[Couplet 1]</code>…).</li>
<li><b>Où s'arrête une partie.</b> Par défaut à la première ligne vide : le refrain, c'est le paragraphe écrit juste sous son titre, et ce qui suit n'a pas besoin de titre. Si ton refrain contient lui-même des lignes vides, ferme-le avec <code>[/Refrain]</code> : tout ce qui est entre les deux balises en fait partie.</li>
<li>Avec un point d'interrogation, <code>{{?Am}}</code>, l'accord est marqué « proposé » et s'affiche en orange. Les lignes sans accord en reçoivent automatiquement à l'affichage : une ligne presque identique à une ligne déjà annotée reprend ses accords, les autres suivent le paragraphe qui leur ressemble le plus. Ces accords « ? » sont recalculés à chaque affichage ; pour en figer un, enlève son point d'interrogation.</li>
<li>La mise en forme est automatique à l'enregistrement : « Intro : la la la » devient <code>[Intro]</code> suivi de « la la la » à la ligne, « Refrain : » devient <code>[Refrain]</code>.</li>
<li>Pour une tablature, commence chaque ligne par quatre chevrons : <code>&gt;&gt;&gt;&gt;</code>.</li>
<li>Les accords s'écrivent en lettres (C D E F G A B), avec <code>#</code> ou <code>b</code>, et une basse éventuelle après une barre : <code>C/E</code>.</li>
<li>Tu peux aussi coller une grille où les accords sont sur une ligne au-dessus des paroles : elle est convertie à l'enregistrement.</li>
</ul>
<p>Exemple :</p>
<pre class="stab">[Intro]
{{%C}}  {{%G}}  {{%Am}}  {{%Em}}

Won't{{C}} you sing {{G}}me a song or t{{Am}}wo</pre>`)));
  }

  P.views.chansons = {
    key: 'Do', t: 'Chansons', d: "Ton carnet de paroles et d'accords : transposition, vidéo, défilement, recherche et dossiers.",
    lead: "Range ici les chansons que tu joues. Chacune se transpose d'un geste, affiche l'accord au clavier quand tu le touches, défile toute seule et peut se lire en degrés.",
    head(arg) {
      const [id, ...rs] = (arg || '').split('/'), sub = rs.join('/'); if (!id) return {};
      if (id === 'new') return { h1: 'Nouvelle chanson', lead: 'Colle les paroles et les accords, donne un titre, enregistre.' };
      if (id === 'artiste') { const n = all().filter(s => fold(s.artist) === fold(sub)).length, nm = (all().find(s => fold(s.artist) === fold(sub)) || {}).artist || sub; return { h1: nm, lead: n + ' chanson' + (n > 1 ? 's' : '') + ' dans le carnet.' }; }
      const s = all().find(x => x.id === id); if (!s && (cloudState === 'idle' || cloudState === 'loading')) return { h1: 'Chargement', lead: 'Récupération des chansons partagées.' };
      if (!s) return { h1: 'Chanson introuvable', lead: 'Elle a peut-être été supprimée, ou elle se trouve sur un autre appareil.' };
      return { h1: s.title, lead: sub === 'edit' ? 'Modification' : s.artist || '' };
    },
    render(el) {
      const [id, ...rs] = (P.arg || '').split('/'), sub = rs.join('/');
      if (!id) return list(el);
      if (id === 'new') return edit(el, null);
      if (id === 'artiste') return artist(el, sub || '');
      const s = all().find(x => x.id === id);
      if (!s && (cloudState === 'idle' || cloudState === 'loading')) return;
      if (!s) return el.append(h('p', {}, h('a', { class: 'btn', href: '#/chansons' }, 'Revenir à la liste des chansons')));
      return sub === 'edit' ? edit(el, s) : song(el, s);
    },
  };
})();
