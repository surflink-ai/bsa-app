// BSA Service Worker for push notifications
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {}
  const title = data.title || "BSA Update"
  const options = {
    body: data.body || "New update from Barbados Surfing Association",
    icon: data.icon || "https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp",
    badge: "https://liveheats.com/images/dbb2a21b-7566-4629-8ea5-4c08a0b2877b.webp",
    data: { url: data.url || "/" },
    actions: data.actions || [],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
