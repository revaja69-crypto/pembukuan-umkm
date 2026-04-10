/**
 * NiagaPintar PRO - Service Worker v3.1
 * Menangani caching aset agar aplikasi bisa berjalan 100% offline.
 */

const CACHE_NAME = 'niagapintar-v3.1';

// Daftar aset yang WAJIB ada agar aplikasi tampil sempurna saat offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/lucide@latest'
];

// Tahap Instalasi: Simpan semua aset ke dalam Cache Storage
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Paksa SW baru langsung aktif
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Menyiapkan penyimpanan luring...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Tahap Aktivasi: Hapus cache versi lama agar hemat ruang
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

// Tahap Fetch: Ambil data dari cache jika luring
self.addEventListener('fetch', (event) => {
  // Hanya tangani permintaan GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika ada di cache, kembalikan data cache
      if (cachedResponse) {
        return cachedResponse;
      }

      // Jika tidak ada, ambil dari internet
      return fetch(event.request).then((networkResponse) => {
        // Jangan simpan respon yang tidak valid
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Simpan salinan respon baru ke cache untuk penggunaan berikutnya
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // JIKA OFFLINE TOTAL dan meminta halaman navigasi
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
