import { DEFAULT_TASKS, GLASSES } from '../data/content.js'
import { normalizeState } from '../lib/storage.js'

/**
 * Actions : toggleDone{key,id} · saveTask{task} · deleteTask{id} · setName · setTheme ·
 * setWater{key,count} · setMood{key,mood} · resetTasks · importState{data}
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
    default: return state
  }
}
