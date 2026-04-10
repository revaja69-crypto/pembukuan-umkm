/**
 * NiagaPintar PRO - Service Worker v7.3.3
 * Strategi: Network First untuk index.html (Memastikan UI tidak terkunci cache lama).
 * Strategi: Cache First untuk aset statis (Kecepatan).
 */

const CACHE_NAME = 'niagapintar-v7.3.3';

// Daftar aset statis yang jarang berubah
const ASSETS_TO_CACHE = [
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

// Tahap Install: Simpan aset ke cache
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Memasang Cache v7.3.3');
      return Promise.all(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => console.warn(`Gagal cache aset: ${url}`, err))
        )
      );
    })
  );
});

// Tahap Aktivasi: Klaim kontrol segera & hapus cache usang
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

// Strategi Fetch Pintar
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // STRATEGI 1: Network First untuk index.html & Navigasi
  // Ini memastikan jika internet jalan, user dapat versi TERBARU (Fix Bug UI)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Simpan salinan terbaru ke cache
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html')) // Fallback ke cache jika offline
    );
    return;
  }

  // STRATEGI 2: Cache First untuk library eksternal (CDN)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Jangan cache Firebase dynamic calls, hanya library-nya
        if (url.hostname.includes('gstatic.com') || url.hostname.includes('cdnjs.cloudflare.com')) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      });
    })
  );
});
