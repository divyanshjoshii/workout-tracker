// Service worker for the installed app.
//
// Without one, opening the app waited on the network for everything: the page
// from a function in Seoul, then its scripts. This keeps the build's static
// files on the phone, and shows the last copy of the home screen at once while
// a fresh copy loads behind it. The page then asks for current data, see
// src/components/service-worker.tsx. Every other request goes to the network
// as before, and nothing from Supabase is ever cached here.

const STATIC = "static-v1"
const PAGES = "pages-v1"
const STATIC_LIMIT = 300

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // The cached home screen belongs to whoever was signed in. Drop it on sign
  // out, and on any request for the login page, including the client-side
  // navigation Next makes once a session has lapsed.
  if (url.pathname === "/auth/signout" || url.pathname === "/login") {
    event.waitUntil(caches.delete(PAGES))
    return
  }

  if (request.method !== "GET") return

  // Build files are content-hashed, so a cached copy is always the right one.
  // Keeping them also lets a home screen cached before a deploy still load.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event, request))
    return
  }

  // Only full loads of the home screen, which is where the app opens. Page data
  // requests during in-app navigation are not navigations and pass straight by.
  if (request.mode === "navigate" && url.pathname === "/") {
    event.respondWith(staleWhileRevalidate(event, request))
  }
})

async function cacheFirst(event, request) {
  const cache = await caches.open(STATIC)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok) {
    event.waitUntil(
      cache.put(request, response.clone()).then(async () => {
        const keys = await cache.keys()
        await Promise.all(keys.slice(0, Math.max(0, keys.length - STATIC_LIMIT)).map((key) => cache.delete(key)))
      })
    )
  }
  return response
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(PAGES)
  const cached = await cache.match(request)
  const fresh = fetch(request).then((response) => {
    // A redirect means the session has lapsed. Only a real page is worth keeping.
    if (response.ok && response.type === "basic") event.waitUntil(cache.put(request, response.clone()))
    return response
  })
  if (!cached) return fresh
  event.waitUntil(fresh.catch(() => {}))
  return cached
}
