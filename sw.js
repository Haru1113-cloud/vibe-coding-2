const CACHE_NAME = "expense-pwa-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./week.html",
  "./styles.css",
  "./storage.js",
  "./app.js",
  "./week.js",
  "./manifest.webmanifest"
  // アイコンを置いたら追加推奨：
  // "./icons/icon-192.png",
  // "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// 基本はキャッシュ優先（オフライン強い）
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // GitHub Pagesでも安定しやすい：GETのみ
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // 取れたらキャッシュして次回オフラインに備える
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
