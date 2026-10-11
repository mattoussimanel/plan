export const notifSupported = () => typeof Notification !== 'undefined'
export const notifPermission = () => (notifSupported() ? Notification.permission : 'unsupported')

export async function askPermission() {
  if (!notifSupported()) return 'unsupported'
  return Notification.requestPermission()
}

/** Affiche une notification système (via le service worker si possible). Renvoie true si affichée. */
export async function showNotification(title, body, tag) {
  if (notifPermission() !== 'granted') return false
  const opts = { body, tag, icon: './icon-192.png', badge: './icon-192.png', vibrate: [200, 100, 200, 100, 300], renotify: true }
  try {
    const reg = navigator.serviceWorker ? await navigator.serviceWorker.ready : null
    if (reg) await reg.showNotification(title, opts)
    else new Notification(title, opts)
    return true
  } catch { return false }
}
