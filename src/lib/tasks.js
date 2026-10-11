import { DAYS } from '../data/content.js'
import { isValidKey, isValidTime, minutesOf, parseKey } from './dates.js'

export const REPEATS = ['once', 'daily', 'weekly']

/** La tâche a-t-elle lieu le jour `key` ? */
export function occursOn(task, key) {
  if (task.repeat === 'once') return task.date === key
  if (task.repeat === 'daily') return true
  return (task.days || []).includes(parseKey(key).getDay())
}

export const byTime = (a, b) => minutesOf(a.time) - minutesOf(b.time)

export const tasksFor = (tasks, key) => tasks.filter((t) => occursOn(t, key)).sort(byTime)

export function repeatLabel(t) {
  if (t.repeat === 'daily') return 'Tous les jours'
  if (t.repeat === 'weekly') {
    const days = t.days || []
    return days.length ? [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((i) => DAYS[i]).join(' · ') : 'Chaque semaine'
  }
  if (!t.date) return 'Une fois'
  const [y, m, d] = t.date.split('-')
  return `Une fois · ${d}/${m}/${y}`
}

export function isValidTask(t) {
  return Boolean(
    t && typeof t.id === 'string' && t.id && typeof t.title === 'string' && t.title.trim() &&
    isValidTime(t.time) && REPEATS.includes(t.repeat) &&
    (t.repeat !== 'once' || isValidKey(t.date)) &&
    (t.repeat !== 'weekly' || (Array.isArray(t.days) && t.days.length > 0)),
  )
}

/** Normalise une tâche venant du stockage / d'un import (ou renvoie null) */
export function sanitizeTask(t) {
  if (!t || typeof t !== 'object') return null
  const clean = {
    id: String(t.id ?? ''), emoji: typeof t.emoji === 'string' && t.emoji ? t.emoji : '🌸',
    title: String(t.title ?? '').trim().slice(0, 60), time: t.time,
    repeat: t.repeat, days: Array.isArray(t.days) ? t.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [],
    date: t.date || '', notify: t.notify !== false,
    ...(['welcome', 'motivation', 'quote'].includes(t.kind) && { kind: t.kind }),
  }
  return isValidTask(clean) ? clean : null
}

export const newTaskDraft = (todayKey, now = Date.now()) => ({
  id: `t${now}`, isNew: true, emoji: '🌸', title: '', time: '09:00', repeat: 'daily', days: [], date: todayKey, notify: true,
})
