import { DEFAULT_TASKS } from '../data/content.js'
import { STATE_KEY, initialState, loadState, normalizeState, pruneHistory, saveState } from './storage.js'
import { memoryStorage, task } from '../test/helpers.js'

describe('normalizeState', () => {
  it('renvoie l’état par défaut pour une entrée invalide', () => {
    for (const bad of [null, undefined, 42, 'x']) expect(normalizeState(bad)).toEqual(initialState())
  })
  it('rejette les valeurs invalides champ par champ', () => {
    const s = normalizeState({
      name: 'x'.repeat(50), theme: 'noir',
      tasks: [task({ id: 'a' }), task({ id: 'a' }), { bad: true }],
      done: { '2026-10-11': ['a'], nope: ['b'], '2026-10-12': 'str' },
      water: { '2026-10-11': 3, '2026-10-12': 'x' }, mood: { '2026-10-11': '😊', '2026-10-12': 5 },
    })
    expect(s.name).toHaveLength(30)
    expect(s.theme).toBe('rose')
    expect(s.tasks.map((t) => t.id)).toEqual(['a'])
    expect(s.done).toEqual({ '2026-10-11': ['a'] })
    expect(s.water).toEqual({ '2026-10-11': 3 })
    expect(s.mood).toEqual({ '2026-10-11': '😊' })
  })
  it('conserve les tâches par défaut si `tasks` absent mais accepte une liste vide', () => {
    expect(normalizeState({}).tasks).toEqual(DEFAULT_TASKS)
    expect(normalizeState({ tasks: [] }).tasks).toEqual([])
  })
})

describe('son des notifications', () => {
  it('carillon par défaut, valeur invalide ignorée', () => {
    expect(initialState().sound).toBe('carillon')
    expect(normalizeState({ sound: 'cloche' }).sound).toBe('cloche')
    expect(normalizeState({ sound: 'default' }).sound).toBe('default')
    expect(normalizeState({ sound: 'bidon' }).sound).toBe('carillon')
  })
})

describe('cycle dans l’état', () => {
  it('toujours présent et nettoyé', () => {
    expect(initialState().cycle.reminders).toHaveLength(2)
    const s = normalizeState({ cycle: { cycleLength: 99, periods: [{ start: '2026-10-18' }, { start: 'x' }] } })
    expect(s.cycle.cycleLength).toBe(45)
    expect(s.cycle.periods).toEqual([{ start: '2026-10-18', end: null }])
    expect(normalizeState({}).cycle).toEqual(initialState().cycle)
  })
})

describe('loadState / saveState', () => {
  it('charge l’état par défaut si rien n’est stocké', () => expect(loadState(memoryStorage())).toEqual(initialState()))
  it('ne plante pas sur du JSON corrompu', () => expect(loadState(memoryStorage({ [STATE_KEY]: '{oops' }))).toEqual(initialState()))
  it('ne plante pas si le stockage lève une erreur', () => {
    expect(loadState({ getItem: () => { throw new Error('denied') } })).toEqual(initialState())
    expect(saveState(initialState(), { setItem: () => { throw new Error('quota') } })).toBe(false)
  })
  it('aller-retour', () => {
    const st = memoryStorage()
    const s = { ...initialState(), name: 'Lina', tasks: [task({ id: 'a' })] }
    expect(saveState(s, st)).toBe(true)
    expect(loadState(st)).toMatchObject({ name: 'Lina', tasks: [task({ id: 'a' })] })
  })
})

describe('pruneHistory', () => {
  it('supprime l’historique de plus de 120 jours', () => {
    const now = new Date(2026, 9, 11)
    const s = { ...initialState(), done: { '2025-01-01': ['a'], '2026-10-10': ['a'] }, water: { '2025-01-01': 2 }, mood: { '2026-10-10': '😊' } }
    const p = pruneHistory(s, now)
    expect(p.done).toEqual({ '2026-10-10': ['a'] })
    expect(p.water).toEqual({})
    expect(p.mood).toEqual({ '2026-10-10': '😊' })
  })
})
