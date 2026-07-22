/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from "workbox-precaching";

// Punto de inyección obligatorio: vite-plugin-pwa reemplaza esta línea
// con la lista de archivos a precachear durante el build.
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ------- Notificaciones Push -------
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Cero Miedo", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Cero Miedo";
  const options = {
    body: data.body || "",
    icon: "/icons/logo54.png",
    badge: "/icons/logorcs.png",
    data: { url: data.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Al hacer clic en la notificación, enfoca la app si ya está abierta,
// o abre una pestaña nueva si no lo está.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});