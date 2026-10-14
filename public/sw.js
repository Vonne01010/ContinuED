/* Service worker: precache the student shell, stale-while-revalidate for everything else. */
const VERSION = "v3";
const CACHE = "app-" + VERSION;
const ROUTES = ["/student", "/student/quiz", "/student/offline", "/student/my-learning", "/student/achievements", "/student/profile"];
const PRECACHE = [...ROUTES, "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const assets = new Set();
      for (const url of PRECACHE) {
        try {
          const res = await fetch(url, { cache: "reload" });
          if (!res.ok) continue;
          await cache.put(url, res.clone());
          if (res.headers.get("content-type")?.includes("text/html")) {
            const html = await res.text();
            for (const m of html.matchAll(/\/_next\/static\/[^"'\s\)<>]+/g)) assets.add(m[0]);
          }
        } catch (e) {}
      }
      // Fetch the JS/CSS the pages reference; pull fonts/images referenced from CSS too.
      for (const url of assets) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          await cache.put(url, res.clone());
          if (url.endsWith(".css")) {
            const css = await res.text();
            for (const m of css.matchAll(/url\((\/_next\/static\/[^)"']+)\)/g)) {
              try { const r = await fetch(m[1]); if (r.ok) await cache.put(m[1], r); } catch (e) {}
            }
          }
        } catch (e) {}
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("app-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;
  // Only the student app is offline-capable; never serve stale teacher pages.
  if (req.mode === "navigate" && !url.pathname.startsWith("/student")) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // Page navigations: ignore query strings so /student?x still resolves offline.
      const cached = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        event.waitUntil(network); // revalidate in the background
        return cached;
      }
      const res = await network;
      if (res) return res;
      if (req.mode === "navigate") {
        const shell = await cache.match("/student");
        if (shell) return shell;
      }
      return new Response("Offline", { status: 503, statusText: "Offline" });
    })()
  );
});
