// Service worker: permite instalar el sistema en el celular y abrirlo sin internet.
// Estrategia: primero intenta la red (así siempre ves la versión más nueva) y,
// si no hay internet, usa la copia guardada. Los DATOS no pasan por aquí:
// viven en la base de datos del navegador (js/bd.js).
var CACHE = "sc-lsa-v2";
var ARCHIVOS = [
  "./", "index.html", "manifest.json", "css/estilos.css",
  "js/datos.js", "js/iconos.js", "js/bd.js", "js/seguridad.js", "js/app.js",
  "js/modulos/configuracion.js", "js/modulos/usuario.js", "js/modulos/salva.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () { return caches.match(e.request); })
  );
});
