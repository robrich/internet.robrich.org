// thanks pwabuilder.com

var CACHE = 'pwa-cache';
var precacheFiles = [
  '/',
  '/manifest.json',
  '/js/app.js',
  '/favicon.ico',
  '/favicon.png',
  '/img/browser.svg',
  '/img/wifi.svg'
];

//Install stage sets up the cache-array to configure pre-cache content
self.addEventListener('install', function(event) {
  console.log('[sw] installing...');
  event.waitUntil(precache().then(function() {
    return self.skipWaiting();
  }));
});

function precache() {
  return caches.open(CACHE).then(function (cache) {
    console.log('[sw] Precaching:', precacheFiles);
    return cache.addAll(precacheFiles);
  });
}

//allow sw to control of current page
self.addEventListener('activate', function(/*event*/) {
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  const request = event.request;
  if (request.url && request.url.indexOf('/check') > -1) {
    console.log('[sw] ignoring: '+ request.url);
    return fromServer(request); // don't cache
  }
  //console.log('[sw] starting: '+ event.request.url);
  event.respondWith(fromCache(request).catch(fromServer(request))); // serve local copy, fall-back to server
  event.waitUntil(update(request)); // and update the cache
});

function fromCache(request) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (matching) {
        console.log('[sw] from cache: '+request.url);
      }
      return matching || Promise.reject('no-match');
    });
  });
}

function fromServer(request){
  console.log('[sw] from server: '+request.url);
  return fetch(request).then(function(response){return response;});
}

function update(request) {
  return caches.open(CACHE).then(function (cache) {
    return fetch(request).then(function (response) {
      console.log('[sw] caching: '+response.url);
      return cache.put(request, response);
    });
  });
}
