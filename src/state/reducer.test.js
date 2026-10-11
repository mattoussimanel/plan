import { reducer } from './reducer.js'
import { DEFAULT_TASKS, GLASSES } from '../data/content.js'
import { makeState, task } from '../test/helpers.js'

const K = '2026-10-11'

describe('reducer', () => {
  it('toggleDone coche puis décoche', () => {
    const s1 = reducer(makeState(), { type: 'toggleDone', key: K, id: 'd1' })
    expect(s1.done[K]).toEqual(['d1'])
    const s2 = reducer(s1, { type: 'toggleDone', key: K, id: 'd2' })
    expect(s2.done[K]).toEqual(['d1', 'd2'])
    expect(reducer(s2, { type: 'toggleDone', key: K, id: 'd1' }).done[K]).toEqual(['d2'])
  })
  it('saveTask ajoute une nouvelle tâche (sans le drapeau isNew)', () => {
    const s = reducer(makeState({ tasks: [] }), { type: 'saveTask', task: task({ id: 'n', isNew: true }) })
    expect(s.tasks).toEqual([task({ id: 'n' })])
    expect(s.tasks[0]).not.toHaveProperty('isNew')
  })
  it('saveTask met à jour une tâche existante', () => {
    const s = reducer(makeState({ tasks: [task({ id: 'a', title: 'Avant' })] }), { type: 'saveTask', task: task({ id: 'a', title: 'Après' }) })
    expect(s.tasks).toHaveLength(1)
    expect(s.tasks[0].title).toBe('Après')
  })
  it('deleteTask retire aussi l’historique de la tâche', () => {
    const s = reducer(makeState({ tasks: [task({ id: 'a' }), task({ id: 'b' })], done: { [K]: ['a', 'b'] } }), { type: 'deleteTask', id: 'a' })
    expect(s.tasks.map((t) => t.id)).toEqual(['b'])
    expect(s.done[K]).toEqual(['b'])
  })
  it('setName limite à 30 caractères', () => expect(reducer(makeState(), { type: 'setName', name: 'x'.repeat(40) }).name).toHaveLength(30))
  it('setTheme', () => expect(reducer(makeState(), { type: 'setTheme', theme: 'lilas' }).theme).toBe('lilas'))
  it('setWater borne entre 0 et GLASSES', () => {
    expect(reducer(makeState(), { type: 'setWater', key: K, count: 3 }).water[K]).toBe(3)
    expect(reducer(makeState(), { type: 'setWater', key: K, count: -2 }).water[K]).toBe(0)
    expect(reducer(makeState(), { type: 'setWater', key: K, count: 99 }).water[K]).toBe(GLASSES)
  })
  it('setMood', () => expect(reducer(makeState(), { type: 'setMood', key: K, mood: '😊' }).mood[K]).toBe('😊'))
  it('resetTasks restaure les tâches par défaut sans toucher à l’historique', () => {
    const s = reducer(makeState({ tasks: [], done: { [K]: ['d1'] } }), { type: 'resetTasks' })
    expect(s.tasks).toEqual(DEFAULT_TASKS)
    expect(s.done[K]).toEqual(['d1'])
  })
  it('importState normalise les données importées', () => {
    const s = reducer(makeState(), { type: 'importState', data: { name: 'Lina', tasks: [task({ id: 'z' }), { junk: 1 }], theme: '??' } })
    expect(s).toMatchObject({ name: 'Lina', theme: 'rose' })
    expect(s.tasks.map((t) => t.id)).toEqual(['z'])
  })
  it('action inconnue : état inchangé, et pas de mutation', () => {
    const st = makeState()
    expect(reducer(st, { type: 'nope' })).toBe(st)
    const frozen = Object.freeze({ ...st, done: Object.freeze({}) })
    expect(() => reducer(frozen, { type: 'toggleDone', key: K, id: 'a' })).not.toThrow()
  })
})
