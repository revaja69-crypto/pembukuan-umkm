/**
 * NiagaPintar PRO - Service Worker v7.3.1
 * Optimalisasi untuk Hybrid Cloud Sync & Akses Offline Instan.
 */

const CACHE_NAME = 'niagapintar-v7.3.1';

// Daftar aset inti untuk performa offline maksimal
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

// Tahap Install: Memasukkan aset ke cache
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Memperbarui Cache ke v7.3.1 (Hybrid Mode)');
      return Promise.all(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => console.warn(`Gagal cache: ${url}`, err))
        )
      );
    })
  );
});

// Tahap Aktivasi: Menghapus cache lama untuk mengosongkan ruang
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
  // Hanya proses metode GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Gunakan cache jika ada, jika tidak ambil dari internet
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        // Jika offline total dan mencoba navigasi halaman utama
        if (event.request.mode === 'navigate') {
          return caches.match('./pembukuan_umkm.html');
        }
      });
    })
  );
});
