import { dayProgress, nextTask, streak, totalDone, weekStats } from './progress.js'
import { makeState, task, SUNDAY, SUNDAY_KEY } from '../test/helpers.js'

const tasks = [task({ id: 'a', time: '07:00' }), task({ id: 'b', time: '12:00' })]

describe('dayProgress', () => {
  it('compte les tâches faites du jour', () => {
    const s = makeState({ tasks, done: { [SUNDAY_KEY]: ['a'] } })
    expect(dayProgress(s, SUNDAY_KEY)).toEqual({ total: 2, done: 1, pct: 50 })
  })
  it('ignore les ids supprimés et jour vide = 0 %', () => {
    expect(dayProgress(makeState({ tasks, done: { [SUNDAY_KEY]: ['zzz'] } }), SUNDAY_KEY).done).toBe(0)
    expect(dayProgress(makeState({ tasks: [] }), SUNDAY_KEY)).toEqual({ total: 0, done: 0, pct: 0 })
  })
  it('arrondit le pourcentage', () => {
    const s = makeState({ tasks: [...tasks, task({ id: 'c' })], done: { [SUNDAY_KEY]: ['a'] } })
    expect(dayProgress(s, SUNDAY_KEY).pct).toBe(33)
  })
})

describe('streak', () => {
  const all = ['a', 'b']
  it('0 sans historique', () => expect(streak(makeState({ tasks }), SUNDAY)).toBe(0))
  it('compte aujourd’hui seulement s’il est terminé', () => {
    const s = makeState({ tasks, done: { '2026-10-11': all, '2026-10-10': all } })
    expect(streak(s, SUNDAY)).toBe(2)
    const partial = makeState({ tasks, done: { '2026-10-11': ['a'], '2026-10-10': all, '2026-10-09': all } })
    expect(streak(partial, SUNDAY)).toBe(2) // aujourd’hui en cours : on compte depuis hier
  })
  it('s’interrompt au premier jour incomplet', () => {
    const s = makeState({ tasks, done: { '2026-10-10': all, '2026-10-09': ['a'], '2026-10-08': all } })
    expect(streak(s, SUNDAY)).toBe(1)
  })
})

describe('weekStats / totalDone / nextTask', () => {
  it('weekStats : 7 jours se terminant aujourd’hui', () => {
    const w = weekStats(makeState({ tasks, done: { [SUNDAY_KEY]: ['a', 'b'] } }), SUNDAY)
    expect(w).toHaveLength(7)
    expect(w[6]).toMatchObject({ key: SUNDAY_KEY, label: 'Dim', pct: 100 })
    expect(w[0]).toMatchObject({ key: '2026-10-05', label: 'Lun', pct: 0 })
  })
  it('totalDone additionne tous les jours', () => expect(totalDone(makeState({ done: { x: ['a'], y: ['a', 'b'] } }))).toBe(3))
  it('nextTask : première non faite à venir', () => {
    const list = [task({ id: 'a', time: '07:00' }), task({ id: 'b', time: '09:00' }), task({ id: 'c', time: '12:00' })]
    expect(nextTask(list, [], 510).id).toBe('b')
    expect(nextTask(list, ['b'], 510).id).toBe('c')
    expect(nextTask(list, [], 540).id).toBe('b') // heure exacte incluse
    expect(nextTask(list, [], 1000)).toBeUndefined()
  })
})
