import { DEFAULT_TASKS } from '../data/content.js'
import { addDays, dateKey, isValidKey } from './dates.js'
import { sanitizeTask } from './tasks.js'
import { defaultCycle, normalizeCycle } from './cycle.js'

export const STATE_KEY = 'ma-journee-state-v1'
const KEEP_DAYS = 120

export const initialState = () => ({ name: '', theme: 'rose', tasks: DEFAULT_TASKS, done: {}, water: {}, mood: {}, cycle: defaultCycle() })

const pickByDay = (obj, keep) => Object.fromEntries(Object.entries(obj && typeof obj === 'object' ? obj : {}).filter(([k, v]) => isValidKey(k) && keep(v)))

/** Nettoie un état venant du stockage ou d'un import : jamais d'exception, toujours un état valide */
export function normalizeState(raw) {
  const base = initialState()
  if (!raw || typeof raw !== 'object') return base
  const tasks = Array.isArray(raw.tasks) ? raw.tasks.map(sanitizeTask).filter(Boolean) : base.tasks
  const ids = new Set()
  return {
    name: typeof raw.name === 'string' ? raw.name.slice(0, 30) : '',
    theme: ['rose', 'peche', 'lilas'].includes(raw.theme) ? raw.theme : 'rose',
    tasks: tasks.filter((t) => !ids.has(t.id) && ids.add(t.id)),
    done: pickByDay(raw.done, Array.isArray),
    water: pickByDay(raw.water, Number.isInteger),
    mood: pickByDay(raw.mood, (v) => typeof v === 'string'),
    cycle: normalizeCycle(raw.cycle),
  }
}

/** Supprime l'historique plus vieux que KEEP_DAYS jours */
export function pruneHistory(state, now = new Date()) {
  const limit = dateKey(addDays(now, -KEEP_DAYS))
  const prune = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => k >= limit))
  return { ...state, done: prune(state.done), water: prune(state.water), mood: prune(state.mood) }
}

export function loadState(storage = globalThis.localStorage) {
  try { return pruneHistory(normalizeState(JSON.parse(storage.getItem(STATE_KEY)))) } catch { return initialState() }
}

export function saveState(state, storage = globalThis.localStorage) {
  try { storage.setItem(STATE_KEY, JSON.stringify(state)); return true } catch { return false }
}
