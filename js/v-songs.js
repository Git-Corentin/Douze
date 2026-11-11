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
  const fold = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const decode = t => t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  const ytId = u => { if (!u) return null; const m = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/.exec(u) || /^([\w-]{11})$/.exec(u.trim()); return m ? m[1] : null; };

  /* ---------- lecture du format {{C}} / {{%C}} / >>>> / [Section] ---------- */
  function parse(text) {
    const chords = [], lines = decode(text || '').replace(/\r/g, '').split('\n').map(l => {
      if (/^\s*\[[^\]]+\]\s*$/.test(l)) return { type: 'sec', t: l.trim().slice(1, -1) };
      if (l.startsWith('>>>>')) return { type: 'tab', t: l.slice(4) };
      if (!l.trim()) return { type: 'blank' };
      const parts = [], re = /\{\{(%?)([^}]*)\}\}/g; let last = 0, m, cur = { text: '' };
      while ((m = re.exec(l))) {
        cur.text += l.slice(last, m.index); if (cur.text || cur.raw) parts.push(cur);
        const c = T.parseChord(m[2].trim()); if (c) chords.push(c);
        cur = { raw: m[2].trim(), c, free: !!m[1], text: '' }; last = re.lastIndex;
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

  /* ============ liste ============ */
  function list(el) {
    let q = '', filt = P.S.sgFilt || 'all', sort = P.S.sgSort || 'title';
    const rows = h('div', { class: 'songs' }), chips = h('div', { class: 'fchips' }), count = h('p', { class: 'hint' });
    const draw = () => {
      const songs = all(), folders = [...new Set(songs.map(s => s.folder || 'Sans dossier'))].sort((a, b) => a.localeCompare(b, 'fr'));
      if (filt !== 'all' && filt !== 'fav' && !folders.includes(filt)) filt = 'all';
      chips.innerHTML = '';
      [['all', 'Toutes'], ['fav', 'Favoris'], ...folders.map(f => [f, f])].forEach(([k, l]) => {
        const n = k === 'all' ? songs.length : k === 'fav' ? songs.filter(s => meta(s.id).fav).length : songs.filter(s => (s.folder || 'Sans dossier') === k).length;
        chips.append(h('button', { type: 'button', class: k === filt ? 'on' : '', onclick: () => { filt = k; P.S.sgFilt = k; P.save(); draw(); } }, l, h('small', {}, String(n))));
      });
      const words = fold(q).split(/\s+/).filter(Boolean);
      let res = songs.filter(s => (filt === 'all' || (filt === 'fav' ? meta(s.id).fav : (s.folder || 'Sans dossier') === filt)));
      if (words.length) res = res.filter(s => { const hay = fold(s.title + ' ' + (s.artist || '') + ' ' + (s.folder || '')), deep = fold(plain(s.text)); return words.every(w => hay.includes(w) || deep.includes(w)); });
      res.sort(sort === 'recent' ? (a, b) => (b.updated || 0) - (a.updated || 0) : sort === 'artist' ? (a, b) => (a.artist || '').localeCompare(b.artist || '', 'fr') || a.title.localeCompare(b.title, 'fr') : (a, b) => a.title.localeCompare(b.title, 'fr'));
      rows.innerHTML = ''; count.textContent = res.length + ' chanson' + (res.length > 1 ? 's' : '') + (words.length ? ' pour « ' + q + ' » (titres, artistes et paroles)' : '') + '.';
      const row = s => { const k = keyOf(s), m = meta(s.id);
        return h('a', { class: 'srow', href: '#/chansons/' + s.id }, h('span', { class: 'srow-t' }, h('strong', {}, s.title), h('span', {}, s.artist || '')),
          h('span', { class: 'srow-m' }, k.none ? '' : keyName(k.pc, k.minor), h('i', {}, [ytId(s.yt) ? 'vidéo' : '', s.local ? 'sur cet appareil' : ''].filter(Boolean).join(', '))),
          h('button', { type: 'button', class: 'star' + (m.fav ? ' on' : ''), 'aria-label': m.fav ? 'Retirer des favoris' : 'Ajouter aux favoris', 'aria-pressed': m.fav ? 'true' : 'false', onclick: e => { e.preventDefault(); m.fav = !m.fav; saveDB(); draw(); } }, m.fav ? '★' : '☆')); };
      if (!res.length) rows.append(h('p', { class: 'empty' }, words.length ? 'Aucune chanson ne correspond. Essaie un autre mot, ou change de dossier.' : 'Ce dossier est vide. Ajoute une chanson pour commencer.'));
      else if (filt === 'all' && !words.length && sort !== 'recent') folders.forEach(f => { const g = res.filter(s => (s.folder || 'Sans dossier') === f); if (g.length) rows.append(h('h3', { class: 'sfold' }, f), ...g.map(row)); });
      else rows.append(...res.map(row));
    };
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
      h('div', { class: 'sfind' }, h('input', { type: 'search', placeholder: 'Chercher un titre, un artiste, des paroles', 'aria-label': 'Chercher une chanson', oninput: e => { q = e.target.value; draw(); } }),
        P.sel([['title', 'Par titre'], ['artist', 'Par artiste'], ['recent', 'Les plus récentes']], sort, v => { sort = v; P.S.sgSort = v; P.save(); draw(); })),
      chips, count, rows);
    draw();
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
    const M = meta(s.id), parsed = parse(s.text), det = keyOf(s);
    M.opened = Date.now(); saveDB();
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
      const b = h('button', { type: 'button', class: 'sc' + (p.free ? ' free' : '') + (mode === 'hide' ? ' hid' : ''), onclick: () => { if (b.classList.contains('hid')) { b.classList.remove('hid'); b.textContent = name; } showCard(c, true); } },
        mode === 'hide' ? '?' : mode === 'deg' ? rom : name, mode === 'both' ? h('small', {}, rom) : null);
      if (hover) b.addEventListener('mouseenter', () => { if (!b.classList.contains('hid')) showCard(c, false); });
      return b;
    };
    const pane = () => h('div', { class: 'pane' }, parsed.lines.map(l => {
      if (l.type === 'sec') return h('h3', { class: 'ssec' }, l.t);
      if (l.type === 'tab') return h('pre', { class: 'stab' }, l.t);
      if (l.type === 'blank') return h('div', { class: 'sblank' });
      return h('div', { class: 'sl' + (l.has ? ' has' : '') }, l.parts.map(p => (!p.raw ? h('span', { class: 'sg' }, h('span', { class: 'sx' }, p.text))
        : p.free ? [chordBtn(p), p.text ? h('span', { class: 'sg' }, h('span', { class: 'sx' }, p.text)) : null]
          : h('span', { class: 'sg' }, chordBtn(p), h('span', { class: 'sx' }, p.text || ' ')))));
    }));
    const redraw = () => {
      const y = panes.firstChild ? panes.firstChild.scrollTop : 0;
      panes.innerHTML = ''; panes.append(pane()); if (split) panes.append(pane());
      panes.classList.toggle('split', split); panes.style.setProperty('--fs', size); if (split) panes.firstChild.scrollTop = y;
      const pc = T.mod(det.pc + tr);
      keyLab.innerHTML = ''; keyLab.append(h('b', {}, det.none ? 'Sans accords' : keyName(pc, det.minor)), h('small', {}, tr ? 'originale : ' + keyName(det.pc, det.minor) : 'tonalité originale'));
    };
    const setTr = v => { tr = T.mod(v); M.tr = tr; saveDB(); redraw(); if (cc && !card.hidden) card.hidden = true; };
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
    const stopScroll = () => { if (raf) cancelAnimationFrame(raf); raf = null; scrollB.textContent = 'Défiler'; scrollB.classList.remove('on'); A.wake(false); };
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
    const id = ytId(s.yt), yt = h('div', { class: 'yt' });
    const drawVid = () => {
      yt.innerHTML = ''; yt.classList.toggle('pin', pin && vid);
      if (!id) { yt.append(h('a', { class: 'btn', target: '_blank', rel: 'noopener', href: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(s.title + ' ' + (s.artist || '')) }, 'Chercher cette chanson sur YouTube'), h('p', { class: 'hint' }, 'Pour intégrer la vidéo ici, colle son lien dans « Options », puis « Modifier la chanson ».')); return; }
      if (vid) yt.append(h('div', { class: 'yt-f' }, h('iframe', { src: 'https://www.youtube-nocookie.com/embed/' + id + '?playsinline=1&rel=0', title: 'Vidéo : ' + s.title, allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture', allowfullscreen: true, loading: 'lazy' })));
      yt.append(P.row(P.btn(vid ? 'Masquer la vidéo' : 'Afficher la vidéo', () => { vid = !vid; drawVid(); }), vid ? P.btn(pin ? 'Détacher la vidéo' : 'Garder la vidéo visible', () => { pin = !pin; drawVid(); }) : null));
    };
    drawVid();

    const opts = h('div', { class: 'sopts', hidden: true },
      P.row(P.btn('Tonalité originale', () => setTr(0)), P.btn('Tonalité recommandée', () => setTr(best())), P.btn('Affiner : ½ ton plus bas', () => setTr(tr - 1)), P.btn('½ ton plus haut', () => setTr(tr + 1))),
      h('p', { class: 'hint' }, 'La tonalité recommandée est celle où les accords passent le plus par les touches blanches. Tu peux aussi toucher une tonalité dans la barre du haut.'),
      P.row(P.field('Accords affichés', P.seg([['ch', 'Noms'], ['deg', 'Degrés'], ['both', 'Les deux'], ['hide', 'Masqués']], mode, v => { mode = v; P.S.sgMode = v; P.save(); redraw(); })),
        P.field('Écran', P.seg([[false, 'Entier'], [true, 'Coupé en deux']], split, v => { split = v; redraw(); if (v) panes.scrollIntoView({ block: 'start' }); })),
        P.field('Taille du texte', P.row(P.btn('A−', () => { size = Math.max(0.7, +(size - 0.1).toFixed(2)); P.S.sgSize = size; P.save(); redraw(); }), P.btn('A+', () => { size = Math.min(1.8, +(size + 0.1).toFixed(2)); P.S.sgSize = size; P.save(); redraw(); }))),
        P.range('Vitesse de défilement', 4, 90, speed, v => { speed = v; P.S.sgSpeed = v; P.save(); }, ' px/s')),
      h('p', { class: 'hint' }, '« Masqués » remplace chaque accord par un point d\'interrogation : cherche-le à l\'oreille, puis touche-le pour vérifier. « Coupé en deux » affiche la chanson dans deux zones qui défilent séparément, par exemple le refrain en haut et les couplets en bas.'),
      P.row(h('a', { class: 'btn', href: '#/chansons/' + s.id + '/edit' }, 'Modifier la chanson'), s.src ? h('a', { class: 'btn', href: s.src, target: '_blank', rel: 'noopener' }, 'Page d\'origine') : null,
        P.btn('Envoyer la grille au Jazzifieur', () => { const cs = parsed.chords.slice(0, 16).map(c => T.chordName(tx(c))); if (!cs.length) return; P.S.key = T.mod(det.pc + tr); P.S.jz = cs.join(' '); P.save(); location.hash = '#/jazzifieur'; }),
        cloudOn && sess && s.local ? P.btn('Publier en ligne pour tout le monde', async e => { const b = e.currentTarget; b.disabled = true; b.textContent = 'Envoi…'; try { const { local, ...rec } = s; await Cloud.save(rec); delete DB.songs[s.id]; saveDB(); P.rerender(); } catch (err) { b.disabled = false; b.textContent = err.message; } }) : null,
        P.btn(M.fav ? 'Retirer des favoris' : 'Mettre en favori', e => { M.fav = !M.fav; saveDB(); e.currentTarget.textContent = M.fav ? 'Retirer des favoris' : 'Mettre en favori'; })));
    const optB = P.btn('Options', () => { opts.hidden = !opts.hidden; optB.classList.toggle('on', !opts.hidden); });
    el.append(h('p', { class: 'sback' }, h('a', { href: '#/chansons' }, 'Toutes les chansons'), s.folder ? ' / ' + s.folder : ''), yt,
      h('div', { class: 'sbar' }, P.btn('−', () => setTr(tr - 1), 'sq'), keyLab, P.btn('+', () => setTr(tr + 1), 'sq'), scrollB, optB), opts, panes, card);
    redraw();
  }

  /* ============ édition ============ */
  function edit(el, s) {
    const d = s || P.draft || {}; P.draft = null;
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
    const admin = cloudOn && !!sess; let dest = admin && (!s || !s.local) ? 'cloud' : 'local';
    const save = async () => {
      if (!title.value.trim()) { msg.textContent = 'Donne un titre à la chanson.'; msg.className = 'fb ko'; title.focus(); return; }
      let text = ta.value; if (!text.includes('{{')) text = convert(text);
      const id = s ? s.id : 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const rec = { id, title: title.value.trim(), artist: artist.value.trim(), folder: folderVal(), yt: yt.value.trim(), src: src.value.trim(), key, minor, text, updated: Date.now() };
      if (dest === 'cloud') {
        msg.textContent = 'Envoi en ligne…'; msg.className = 'fb';
        try { await Cloud.save(rec); delete DB.songs[id]; DB.hidden = DB.hidden.filter(x => x !== id); } catch (err) { msg.textContent = err.message + ' La chanson n\'a pas été enregistrée.'; msg.className = 'fb ko'; return; }
      } else DB.songs[id] = rec;
      saveDB(); location.hash = '#/chansons/' + id;
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
    el.append(h('p', { class: 'sback' }, h('a', { href: s ? '#/chansons/' + s.id : '#/chansons' }, s ? 'Revenir à la chanson' : 'Toutes les chansons')),
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
        P.row(P.btn('Enregistrer', save, 'solid'), P.btn('Convertir les accords écrits au-dessus des paroles', () => { const c = convert(ta.value); msg.textContent = c === ta.value ? 'Rien à convertir : aucune ligne d\'accords isolée n\'a été trouvée.' : 'Converti. Vérifie le placement des accords, puis enregistre.'; msg.className = 'fb'; ta.value = c; }), s ? P.btn('Supprimer', del) : null),
        msg,
        P.prose(`<h4>Depuis un site de grilles</h4>
<p>Colle l'adresse de la page dans « Page d'origine », touche « Ouvrir cette page », puis sur le site ouvre le mode édition de la chanson (celui où les accords apparaissent entre accolades). Sélectionne tout le texte, copie-le, reviens ici et touche « Coller le texte copié ». L'artiste et le titre sont déjà remplis d'après l'adresse.</p>
<h4>Mode d'emploi du format</h4>
<ul>
<li>Un accord entre doubles accolades, <code>{{A}}</code>, se place juste avant le mot (ou la syllabe) où il doit être joué. Il s'affichera au-dessus.</li>
<li>Avec un signe %, <code>{{%Em}}</code>, l'accord s'affiche dans le texte, sans être lié à une parole : pour les intros, les ponts instrumentaux, les fins.</li>
<li>Une ligne entre crochets, <code>[Refrain]</code>, devient un titre de partie.</li>
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
      const [id, sub] = (arg || '').split('/'); if (!id) return {};
      if (id === 'new') return { h1: 'Nouvelle chanson', lead: 'Colle les paroles et les accords, donne un titre, enregistre.' };
      const s = all().find(x => x.id === id); if (!s && (cloudState === 'idle' || cloudState === 'loading')) return { h1: 'Chargement', lead: 'Récupération des chansons partagées.' };
      if (!s) return { h1: 'Chanson introuvable', lead: 'Elle a peut-être été supprimée, ou elle se trouve sur un autre appareil.' };
      return { h1: s.title, lead: sub === 'edit' ? 'Modification' : s.artist || '' };
    },
    render(el) {
      const [id, sub] = (P.arg || '').split('/');
      if (!id) return list(el);
      if (id === 'new') return edit(el, null);
      const s = all().find(x => x.id === id);
      if (!s && (cloudState === 'idle' || cloudState === 'loading')) return;
      if (!s) return el.append(h('p', {}, h('a', { class: 'btn', href: '#/chansons' }, 'Revenir à la liste des chansons')));
      return sub === 'edit' ? edit(el, s) : song(el, s);
    },
  };
})();
