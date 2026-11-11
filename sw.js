/* Douze — fonctionnement hors connexion.
   Fichiers du site : réponse immédiate depuis le cache, mise à jour en arrière-plan (visible au chargement suivant).
   Sons de piano et polices : mis en cache à la première utilisation. */
const CACHE = 'douze-v6';
const CORE = ['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'icons/icon-192.png',
  'js/config.js', 'js/theory.js', 'js/ui.js', 'js/audio.js', 'js/band.js', 'js/mic.js', 'js/v-base.js', 'js/v-renv.js', 'js/v-mains.js', 'js/v-jazz.js', 'js/v-oreille.js', 'js/v-harmo.js', 'js/v-routine.js', 'js/songs.js', 'js/v-songs.js', 'js/app.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url), own = url.origin === location.origin;
  const ext = /tonejs\.github\.io|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url.host);
  if (!own && !ext) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; });
    if (hit) { if (own) net.catch(() => {}); return hit; }
    return net;
  }));
});
