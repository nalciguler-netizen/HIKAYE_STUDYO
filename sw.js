/* Sahnely service worker
   Sayfanın kendisi (HTML) her zaman önce internetten alınır: GitHub'a yeni sürüm
   yüklenince telefon onu hemen görür. İnternet yoksa saklanan kopya açılır.
   Diğer dosyalar (ikon, manifest) önce telefondan gelir. */
const SURUM = 'sahnely-v4';

self.addEventListener('install', e => {
  self.skipWaiting();   // yeni sürüm beklemeden devreye girsin
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const adlar = await caches.keys();
    await Promise.all(adlar.filter(a => a !== SURUM).map(a => caches.delete(a)));   // eski kopyaları sil
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;          // yazı tipleri, modeller vb. tarayıcıya kalsın
  if(!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;   // YolHava'ya karışma

  const sayfa = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if(sayfa){
    e.respondWith((async () => {
      try{
        const yanit = await fetch(req, { cache:'no-store' });
        if(yanit.ok){ const c = await caches.open(SURUM); c.put(url.pathname, yanit.clone()); }
        return yanit;
      }catch(err){
        const c = await caches.open(SURUM);
        return (await c.match(url.pathname)) || (await c.match(req)) || Response.error();
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const c = await caches.open(SURUM), eski = await c.match(req);
    if(eski) return eski;
    const yanit = await fetch(req);
    if(yanit.ok) c.put(req, yanit.clone());
    return yanit;
  })());
});
