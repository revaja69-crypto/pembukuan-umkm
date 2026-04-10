/**
 * NiagaPintar PRO - Service Worker v6.0
 * Sinkronisasi dengan sistem Responsive Dashboard (Desktop & Mobile).
 */

const CACHE_NAME = 'niagapintar-v6.0';

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
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Proses Instalasi: Menyimpan aset ke cache
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Memperbarui Cache ke v6.0');
      return Promise.all(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => console.warn(`Gagal menyimpan cache: ${url}`, err))
        )
      );
    })
  );
});

// Proses Aktivasi: Membersihkan cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Strategi Fetch: Cache First, fallback to Network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        // Jika offline dan aset tidak ada di cache
        return new Response("Koneksi internet diperlukan untuk akses pertama kali.");
      });
    })
  );
});
