import { DEFAULT_TASKS } from '../data/content.js'

export const task = (over = {}) => ({
  id: 'x1', emoji: '🌸', title: 'Test', time: '09:00', repeat: 'daily', days: [], date: '', notify: true, ...over,
})

export const makeState = (over = {}) => ({ name: '', theme: 'rose', tasks: DEFAULT_TASKS, done: {}, water: {}, mood: {}, ...over })

// Dimanche 11 octobre 2026, 08:30 (heure locale)
export const SUNDAY = new Date(2026, 9, 11, 8, 30, 0)
export const SUNDAY_KEY = '2026-10-11'

export const memoryStorage = (initial = {}) => {
  const m = { ...initial }
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v) },
    removeItem: (k) => { delete m[k] },
    dump: () => m,
  }
}
