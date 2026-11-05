// オフライン用：一度開いたら、ネットにつながっていなくても開けるようにする。
// ネットにつながっているときは毎回最新版を使い（3秒以内に届かなければ保存してある版）、
// つながっていないときは保存してある版を使う。
const CACHE = 'comm-card-mw458ekd';
const FILES = ['./', 'taiwa.html', 'manifest.webmanifest', 'taiwa.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // ページごとに保存する（index と 対話カード）
  const key = req.mode === 'navigate' ? new URL(req.url).pathname.replace(/\/index\.html$/, '/') : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const net = fetch(req, { cache: 'no-store' }).then(r => { if (r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
    const slow = new Promise(res => setTimeout(() => res(null), 3000));
    const first = await Promise.race([net, slow]);
    if (first) return first;
    const hit = (await c.match(key, { ignoreSearch: true })) || (req.mode === 'navigate' && /taiwa/.test(String(key)) ? await c.match('taiwa.html') : await c.match('./'));
    return hit || (await net) || new Response('オフラインです。ネットにつながる場所で一度開いてください。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
