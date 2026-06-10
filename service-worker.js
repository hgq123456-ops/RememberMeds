const CACHE_NAME = 'remember-meds-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install: cache all assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; }).map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: stale-while-revalidate strategy
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  // Navigation: network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(function(response) {
        var cloned = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { return cache.put(event.request, cloned); });
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Other: cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        var cloned = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { return cache.put(event.request, cloned); });
        return response;
      });
    })
  );
});

// Periodic background sync
self.addEventListener('periodicsync', function(event) {
  if (event.tag === 'check-meds') {
    event.waitUntil(checkAndNotify());
  }
});

async function checkAndNotify() {
  try {
    var clients = await self.clients.matchAll({ type: 'window' });
    if (clients.length > 0) {
      clients.forEach(function(client) {
        client.postMessage({ type: 'check-meds' });
      });
    }
  } catch (e) {
    // Ignore errors
  }
}

// Listen for messages from main thread
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'skip-waiting') {
    self.skipWaiting();
  }
});
