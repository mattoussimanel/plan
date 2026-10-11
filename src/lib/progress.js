import { addDays, dateKey, minutesOf } from './dates.js'
import { tasksFor } from './tasks.js'
import { DAYS } from '../data/content.js'

export function dayProgress(state, key) {
  const list = tasksFor(state.tasks, key)
  const doneSet = new Set(state.done[key] || [])
  const done = list.filter((t) => doneSet.has(t.id)).length
  return { total: list.length, done, pct: list.length ? Math.round((done / list.length) * 100) : 0 }
}

const complete = (p) => p.total > 0 && p.done === p.total

/** Nombre de jours consécutifs 100 % terminés (aujourd'hui compte seulement s'il est terminé) */
export function streak(state, now = new Date()) {
  let d = new Date(now)
  if (!complete(dayProgress(state, dateKey(d)))) d = addDays(d, -1)
  let count = 0
  while (count < 400 && complete(dayProgress(state, dateKey(d)))) { count++; d = addDays(d, -1) }
  return count
}

/** 7 derniers jours (le plus ancien d'abord) */
export function weekStats(state, now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(now, i - 6)
    return { key: dateKey(d), label: DAYS[d.getDay()], ...dayProgress(state, dateKey(d)) }
  })
}

export const totalDone = (state) => Object.values(state.done).reduce((n, a) => n + a.length, 0)

export function nextTask(list, doneIds, nowMin) {
  return list.find((t) => !doneIds.includes(t.id) && minutesOf(t.time) >= nowMin)
}
