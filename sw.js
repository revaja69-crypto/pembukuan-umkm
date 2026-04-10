// Nama cache untuk versi aplikasi ini
const CACHE_NAME = 'niagapintar-v3.0';

// Aset yang akan disimpan secara luring (offline)
const assets = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/lucide@latest'
];

// Tahap Instalasi: Menyimpan aset ke cache
self.addEventListener('install', (event) => {
  // Langsung aktifkan SW tanpa menunggu tab ditutup
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Menyimpan aset ke cache...');
      return cache.addAll(assets);
    })
  );
});

// Tahap Aktivasi: Menghapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
    ])
  );
});

// Strategi Fetch: Mencoba ambil dari cache, jika tidak ada baru ke jaringan
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((fetchResponse) => {
        // Simpan salinan respon baru ke cache jika itu adalah permintaan yang valid
        if (fetchResponse.status === 200) {
          const responseClone = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return fetchResponse;
      }).catch(() => {
        // Jika luring dan file tidak ada di cache
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
