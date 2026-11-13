/* Bei jedem neuen Upload die Zahl erhöhen, dann holen sich alle Geräte die neue Fassung. */
const CACHE = "torso-limbs-v1";

/* Eigene Dateien: werden beim Installieren fest abgelegt. */
const FILES = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"
];

/* React und die Schriften liegen auf fremden Servern. Sie werden beim ersten
   Online-Start mitgeschnitten, danach läuft die App auch ohne Netz. */
const EXTERN = ["cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const mitschneiden = url.origin === location.origin || EXTERN.indexOf(url.hostname) >= 0;

  e.respondWith(
    caches.match(e.request).then(treffer => {
      if (treffer) return treffer;
      return fetch(e.request).then(antwort => {
        if (mitschneiden && antwort && (antwort.ok || antwort.type === "opaque")) {
          const kopie = antwort.clone();
          caches.open(CACHE).then(c => c.put(e.request, kopie)).catch(() => {});
        }
        return antwort;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
