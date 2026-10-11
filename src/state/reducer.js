import { DEFAULT_TASKS, GLASSES } from '../data/content.js'
import { normalizeState } from '../lib/storage.js'
import { normalizeCycle, sanitizeReminder } from '../lib/cycle.js'
import { diffDays } from '../lib/dates.js'

/**
 * Actions : toggleDone{key,id} · saveTask{task} · deleteTask{id} · setName · setTheme ·
 * setWater{key,count} · setMood{key,mood} · resetTasks · importState{data} ·
 * cycle : startPeriod{date} · endPeriod{date} · deletePeriod{start} · setCycleDay{key,patch} · cycleSettings{patch} · saveReminder{reminder} · deleteReminder{id}
 */
export function reducer(state, action) {
  switch (action.type) {
    case 'toggleDone': {
      const cur = state.done[action.key] || []
      const next = cur.includes(action.id) ? cur.filter((x) => x !== action.id) : [...cur, action.id]
      return { ...state, done: { ...state.done, [action.key]: next } }
    }
    case 'saveTask': {
      const { isNew, ...task } = action.task
      const exists = state.tasks.some((t) => t.id === task.id)
      return { ...state, tasks: exists ? state.tasks.map((t) => (t.id === task.id ? task : t)) : [...state.tasks, task] }
    }
    case 'deleteTask': {
      const done = Object.fromEntries(Object.entries(state.done).map(([k, ids]) => [k, ids.filter((id) => id !== action.id)]))
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id), done }
    }
    case 'setName': return { ...state, name: action.name.slice(0, 30) }
    case 'setTheme': return { ...state, theme: action.theme }
    case 'setWater': return { ...state, water: { ...state.water, [action.key]: Math.max(0, Math.min(GLASSES, action.count)) } }
    case 'setMood': return { ...state, mood: { ...state.mood, [action.key]: action.mood } }
    case 'resetTasks': return { ...state, tasks: DEFAULT_TASKS }
    case 'importState': return normalizeState(action.data)
    case 'startPeriod': {
      if (state.cycle.periods.some((p) => p.start === action.date)) return state
      const periods = [...state.cycle.periods, { start: action.date, end: null }].sort((a, b) => a.start.localeCompare(b.start))
      return { ...state, cycle: { ...state.cycle, periods } }
    }
    case 'endPeriod': {
      // termine la dernière période commencée avant (ou le jour de) `date`, si elle dure ≤ 14 jours
      const periods = state.cycle.periods.map((p) => ({ ...p }))
      const open = [...periods].reverse().find((p) => p.start <= action.date)
      if (!open || diffDays(action.date, open.start) > 14) return state
      open.end = action.date
      return { ...state, cycle: { ...state.cycle, periods } }
    }
    case 'deletePeriod': return { ...state, cycle: { ...state.cycle, periods: state.cycle.periods.filter((p) => p.start !== action.start) } }
    case 'setCycleDay': {
      const merged = { ...(state.cycle.days[action.key] || {}), ...action.patch }
      const { days } = normalizeCycle({ ...state.cycle, days: { [action.key]: merged } })
      const rest = { ...state.cycle.days }
      if (days[action.key]) rest[action.key] = days[action.key]
      else delete rest[action.key]
      return { ...state, cycle: { ...state.cycle, days: rest } }
    }
    case 'cycleSettings': {
      const { cycleLength, periodLength, lutealLength } = normalizeCycle({ ...state.cycle, ...action.patch })
      return { ...state, cycle: { ...state.cycle, cycleLength, periodLength, lutealLength } }
    }
    case 'saveReminder': {
      const r = sanitizeReminder(action.reminder)
      if (!r) return state
      const exists = state.cycle.reminders.some((x) => x.id === r.id)
      const reminders = exists ? state.cycle.reminders.map((x) => (x.id === r.id ? r : x)) : [...state.cycle.reminders, r]
      return { ...state, cycle: { ...state.cycle, reminders } }
    }
    case 'deleteReminder': return { ...state, cycle: { ...state.cycle, reminders: state.cycle.reminders.filter((r) => r.id !== action.id) } }
    default: return state
  }
}
