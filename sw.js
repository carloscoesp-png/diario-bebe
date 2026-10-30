// Guarda o app no celular para abrir sem internet.
// Ao mudar qualquer arquivo do app, aumente a versão abaixo para o celular baixar a nova.
const VERSAO = 'diario-v2';
const ARQUIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // página: tenta a versão nova da internet, senão abre a guardada
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then(r => { const c = r.clone(); caches.open(VERSAO).then(x => x.put('index.html', c)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }

  // arquivos do app e fontes: usa o guardado e atualiza por trás
  if (url.origin === location.origin || url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.open(VERSAO).then(async c => {
      const salvo = await c.match(req);
      const rede = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => salvo);
      return salvo || rede;
    }));
  }
});
