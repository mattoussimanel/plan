import { addDays, dateKey, minutesOf } from './dates.js'
import { bodyFor } from './messages.js'
import { occursOn } from './tasks.js'

export const CHANNEL_ID = 'rappels'
export const CONTENT_DAYS = 45 // jours programmés à l'avance pour les messages qui changent chaque jour
const CONTENT_KINDS = ['welcome', 'motivation', 'quote']

/** Hash stable de l'id de tâche (20 bits) : les ids Android sont des entiers 32 bits */
export function hashId(str) {
  let h = 5381
  for (const c of String(str)) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0
  return h % (1 << 20)
}
/** id = hash(tâche) × 2048 + slot (0 = quotidien/unique, 1-7 = jour de semaine, 8+ = jours à venir) */
export const notifId = (taskId, slot) => hashId(taskId) * 2048 + slot

/**
 * Convertit les tâches en notifications locales Android programmées à l'heure exacte :
 * quotidiennes / hebdomadaires = répétées par le système ; « une fois » = date précise ;
 * messages du jour (bienvenue, motivation, citation) = un par jour pendant CONTENT_DAYS jours avec le texte du jour.
 */
export function buildSchedule(tasks, now = new Date()) {
  const out = []
  for (const t of tasks) {
    if (!t.notify) continue
    const base = { title: `${t.emoji} ${t.title}`, channelId: CHANNEL_ID, extra: { taskId: t.id } }
    const minutes = minutesOf(t.time)
    const [hour, minute] = [Math.floor(minutes / 60), minutes % 60]
    const sched = (schedule) => ({ ...base, schedule: { allowWhileIdle: true, ...schedule } })
    const at = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, 0)

    if (CONTENT_KINDS.includes(t.kind)) {
      for (let i = 0; i < CONTENT_DAYS; i++) {
        const day = addDays(now, i)
        const when = at(day)
        if (when <= now || !occursOn(t, dateKey(day))) continue
        out.push({ ...sched({ at: when }), id: notifId(t.id, 8 + i), body: bodyFor(t, day) })
      }
    } else if (t.repeat === 'daily') {
      out.push({ ...sched({ on: { hour, minute, second: 0 } }), id: notifId(t.id, 0), body: bodyFor(t) })
    } else if (t.repeat === 'weekly') {
      for (const d of t.days) out.push({ ...sched({ on: { weekday: d + 1, hour, minute, second: 0 } }), id: notifId(t.id, 1 + d), body: bodyFor(t) })
    } else {
      const when = at(new Date(`${t.date}T00:00:00`))
      if (when > now) out.push({ ...sched({ at: when }), id: notifId(t.id, 0), body: bodyFor(t) })
    }
  }
  return out
}
