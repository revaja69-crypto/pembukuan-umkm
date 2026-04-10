/**
 * NiagaPintar PRO - Service Worker v3.2
 * Menangani caching aset agar aplikasi bisa berjalan 100% offline,
 * termasuk dukungan untuk pustaka eksternal (CDN).
 */

const CACHE_NAME = 'niagapintar-v3.2';

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
      console.log('[SW] Menyiapkan penyimpanan luring untuk aset inti...');
      // Menggunakan pendekatan per-item agar jika satu gagal, yang lain tetap tersimpan
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => console.warn(`Gagal menyimpan: ${url}`, err));
        })
      );
    })
  );
});

// Tahap Aktivasi: Hapus cache versi lama
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

// Tahap Fetch: Strategi Cache-First untuk aset, Network-First untuk navigasi
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika ada di cache, segera gunakan (sangat cepat untuk offline)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Jika tidak ada di cache, ambil dari jaringan
      return fetch(event.request).then((networkResponse) => {
        // Cek apakah respon valid (status 200 atau 0 untuk opaque/CDN)
        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
          return networkResponse;
        }

        // Simpan ke cache untuk penggunaan berikutnya (termasuk aset CDN)
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // JIKA OFFLINE TOTAL dan meminta halaman utama
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
