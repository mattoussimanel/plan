import { dateKey, minutesOf, occursOn, quoteOfDay, motivationOfDay } from './data.js'

export const notifSupported = () => typeof Notification !== 'undefined'

export async function askPermission() {
  if (!notifSupported()) return 'unsupported'
  return Notification.requestPermission()
}

export async function showNotification(title, body, tag) {
  if (!notifSupported() || Notification.permission !== 'granted') return false
  const opts = {
    body, tag,
    icon: './icon-192.png', badge: './icon-192.png',
    vibrate: [200, 100, 200, 100, 300], renotify: true,
  }
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready : null
    if (reg) await reg.showNotification(title, opts)
    else new Notification(title, opts)
    return true
  } catch { return false }
}

export function bodyFor(task) {
  if (task.kind === 'quote') { const [q, a] = quoteOfDay(); return `« ${q} » — ${a}` }
  if (task.kind === 'motivation') return motivationOfDay()
  if (task.kind === 'welcome') return 'Belle journée à toi ! Voici ton programme 🌸'
  return `C’est l’heure ! ${task.time}`
}

const NKEY = 'ma-journee-notified'
const WINDOW = 10 // minutes de rattrapage si l'app était en veille

// Renvoie les tâches à notifier maintenant et les marque comme notifiées
export function dueTasks(state, now = new Date()) {
  const key = dateKey(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  let sent = {}
  try { sent = JSON.parse(localStorage.getItem(NKEY)) || {} } catch { /* ignore */ }
  if (sent.day !== key) sent = { day: key, ids: [] }
  const due = state.tasks.filter((t) => {
    if (!t.notify || !occursOn(t, key) || sent.ids.includes(t.id)) return false
    if ((state.done[key] || []).includes(t.id)) return false
    const diff = nowMin - minutesOf(t.time)
    return diff >= 0 && diff <= WINDOW
  })
  if (due.length) {
    sent.ids.push(...due.map((t) => t.id))
    try { localStorage.setItem(NKEY, JSON.stringify(sent)) } catch { /* ignore */ }
  }
  return due
}
