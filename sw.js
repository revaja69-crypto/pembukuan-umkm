/**
 * NiagaPintar PRO - Service Worker v7.3
 * Sinkronisasi dengan sistem Hybrid Cloud & NiagaID 10-Digit.
 */

const CACHE_NAME = 'niagapintar-v7.3';

// Daftar aset yang akan disimpan secara offline
const ASSETS_TO_CACHE = [
  './',
  './pembukuan_umkm.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/lucide@latest',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
];

// Proses Instalasi: Membuat cache baru
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Memperbarui Cache ke v7.3 (Hybrid Sync Mode)');
      return Promise.all(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => console.warn(`Gagal cache aset: ${url}`, err))
        )
      );
    })
  );
});

// Proses Aktivasi: Menghapus cache versi lama untuk menghindari konflik
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Strategi Fetch: Cache First, Network Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika ada di cache, gunakan itu. Jika tidak, ambil dari jaringan.
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        // Fallback jika offline total dan mencoba navigasi
        if (event.request.mode === 'navigate') {
          return caches.match('./pembukuan_umkm.html');
        }
      });
    })
  );
});
