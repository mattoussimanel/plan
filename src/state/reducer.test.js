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

describe('reducer : cycle', () => {
  const st = () => makeState()
  it('startPeriod ajoute (triée, sans doublon)', () => {
    let s = reducer(st(), { type: 'startPeriod', date: '2026-10-18' })
    s = reducer(s, { type: 'startPeriod', date: '2026-09-20' })
    expect(s.cycle.periods.map((p) => p.start)).toEqual(['2026-09-20', '2026-10-18'])
    expect(reducer(s, { type: 'startPeriod', date: '2026-10-18' })).toBe(s)
  })
  it('endPeriod termine la dernière période commencée avant la date', () => {
    let s = reducer(st(), { type: 'startPeriod', date: '2026-10-18' })
    s = reducer(s, { type: 'endPeriod', date: '2026-10-22' })
    expect(s.cycle.periods[0]).toEqual({ start: '2026-10-18', end: '2026-10-22' })
  })
  it('endPeriod ignoré sans période, avant le début ou si trop long', () => {
    const base = st()
    expect(reducer(base, { type: 'endPeriod', date: '2026-10-22' })).toBe(base)
    const s = reducer(base, { type: 'startPeriod', date: '2026-10-18' })
    expect(reducer(s, { type: 'endPeriod', date: '2026-10-10' })).toBe(s)
    expect(reducer(s, { type: 'endPeriod', date: '2026-11-30' })).toBe(s)
  })
  it('deletePeriod', () => {
    let s = reducer(st(), { type: 'startPeriod', date: '2026-10-18' })
    s = reducer(s, { type: 'deletePeriod', start: '2026-10-18' })
    expect(s.cycle.periods).toEqual([])
  })
  it('setCycleDay fusionne, nettoie et supprime l’entrée vide', () => {
    let s = reducer(st(), { type: 'setCycleDay', key: K, patch: { flow: 'heavy' } })
    s = reducer(s, { type: 'setCycleDay', key: K, patch: { symptoms: ['cramps', 'bidon'], note: 'dur' } })
    expect(s.cycle.days[K]).toEqual({ flow: 'heavy', symptoms: ['cramps'], note: 'dur' })
    s = reducer(s, { type: 'setCycleDay', key: K, patch: { flow: undefined, symptoms: [], note: '' } })
    expect(s.cycle.days[K]).toBeUndefined()
  })
  it('cycleSettings borne les valeurs', () => {
    const s = reducer(st(), { type: 'cycleSettings', patch: { cycleLength: 31, periodLength: 99 } })
    expect(s.cycle).toMatchObject({ cycleLength: 31, periodLength: 10, lutealLength: 14 })
  })
  it('saveReminder ajoute / modifie, deleteReminder supprime, rappel invalide ignoré', () => {
    const r = { id: 'n1', event: 'fertile', daysBefore: 3, time: '08:15', enabled: true }
    let s = reducer(st(), { type: 'saveReminder', reminder: r })
    expect(s.cycle.reminders.at(-1)).toEqual(r)
    s = reducer(s, { type: 'saveReminder', reminder: { ...r, daysBefore: 5 } })
    expect(s.cycle.reminders.filter((x) => x.id === 'n1')).toEqual([{ ...r, daysBefore: 5 }])
    expect(reducer(s, { type: 'saveReminder', reminder: { id: 'x', event: 'zzz', time: '08:00' } })).toBe(s)
    s = reducer(s, { type: 'deleteReminder', id: 'n1' })
    expect(s.cycle.reminders.some((x) => x.id === 'n1')).toBe(false)
  })
})
