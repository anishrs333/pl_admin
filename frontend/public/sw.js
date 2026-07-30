const CACHE_NAME = 'plhrms-v1'
const PRECACHE = ['/', '/index.html']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return

  const url = new URL(e.request.url)

  // Never cache API calls, authentication, or cross-origin requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('login') ||
    url.pathname.includes('token') ||
    url.origin !== self.location.origin
  ) {
    return
  }

  e.respondWith(
    fetch(e.request).then(r => {
      const clone = r.clone()
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone))
      return r
    }).catch(() => caches.match(e.request))
  )
})
