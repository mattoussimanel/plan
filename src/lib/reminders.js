import { dateKey, minutesNow, minutesOf } from './dates.js'
import { occursOn } from './tasks.js'

export const NOTIFIED_KEY = 'ma-journee-notified'
export const CATCH_UP_MIN = 10 // minutes de rattrapage si l'appli était en veille

/**
 * Tâches à notifier maintenant (heure atteinte depuis moins de CATCH_UP_MIN, non faites, pas déjà notifiées).
 * Les tâches renvoyées sont mémorisées comme notifiées pour la journée.
 */
export function dueTasks(state, now = new Date(), storage = globalThis.localStorage) {
  const key = dateKey(now)
  const nowMin = minutesNow(now)
  let sent
  try { sent = JSON.parse(storage.getItem(NOTIFIED_KEY)) } catch { sent = null }
  if (!sent || sent.day !== key || !Array.isArray(sent.ids)) sent = { day: key, ids: [] }
  const doneIds = state.done[key] || []
  const due = state.tasks.filter((t) => {
    if (!t.notify || sent.ids.includes(t.id) || doneIds.includes(t.id) || !occursOn(t, key)) return false
    const diff = nowMin - minutesOf(t.time)
    return diff >= 0 && diff <= CATCH_UP_MIN
  })
  if (due.length) {
    sent.ids.push(...due.map((t) => t.id))
    try { storage.setItem(NOTIFIED_KEY, JSON.stringify(sent)) } catch { /* ignore */ }
  }
  return due
}
