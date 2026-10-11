import { CATCH_UP_MIN, NOTIFIED_KEY, dueTasks } from './reminders.js'
import { makeState, memoryStorage, task } from '../test/helpers.js'

const at = (h, m) => new Date(2026, 9, 11, h, m, 0)
const base = makeState({ tasks: [task({ id: 'a', time: '09:00' })] })

describe('dueTasks', () => {
  it('rien avant l’heure', () => expect(dueTasks(base, at(8, 59), memoryStorage())).toEqual([]))
  it('notifie à l’heure exacte', () => expect(dueTasks(base, at(9, 0), memoryStorage()).map((t) => t.id)).toEqual(['a']))
  it('rattrape jusqu’à CATCH_UP_MIN minutes de retard, pas plus', () => {
    expect(dueTasks(base, at(9, CATCH_UP_MIN), memoryStorage())).toHaveLength(1)
    expect(dueTasks(base, at(9, CATCH_UP_MIN + 1), memoryStorage())).toHaveLength(0)
  })
  it('ne notifie qu’une fois par jour', () => {
    const st = memoryStorage()
    expect(dueTasks(base, at(9, 0), st)).toHaveLength(1)
    expect(dueTasks(base, at(9, 1), st)).toHaveLength(0)
  })
  it('repart de zéro le lendemain', () => {
    const st = memoryStorage()
    dueTasks(base, at(9, 0), st)
    expect(dueTasks(base, new Date(2026, 9, 12, 9, 0), st)).toHaveLength(1)
  })
  it('ignore les tâches faites, sans notif ou absentes ce jour', () => {
    expect(dueTasks(makeState({ tasks: base.tasks, done: { '2026-10-11': ['a'] } }), at(9, 0), memoryStorage())).toEqual([])
    expect(dueTasks(makeState({ tasks: [task({ time: '09:00', notify: false })] }), at(9, 0), memoryStorage())).toEqual([])
    expect(dueTasks(makeState({ tasks: [task({ time: '09:00', repeat: 'once', date: '2026-10-12' })] }), at(9, 0), memoryStorage())).toEqual([])
  })
  it('plusieurs tâches à la même minute', () => {
    const s = makeState({ tasks: [task({ id: 'a' }), task({ id: 'b' })] })
    expect(dueTasks(s, at(9, 0), memoryStorage())).toHaveLength(2)
  })
  it('mémorise les ids notifiés', () => {
    const st = memoryStorage()
    dueTasks(base, at(9, 0), st)
    expect(JSON.parse(st.dump()[NOTIFIED_KEY])).toEqual({ day: '2026-10-11', ids: ['a'] })
  })
  it('tolère un stockage corrompu ou en échec', () => {
    expect(dueTasks(base, at(9, 0), memoryStorage({ [NOTIFIED_KEY]: '{bad' }))).toHaveLength(1)
    expect(dueTasks(base, at(9, 0), { getItem: () => null, setItem: () => { throw new Error('quota') } })).toHaveLength(1)
    expect(dueTasks(base, at(9, 0), memoryStorage({ [NOTIFIED_KEY]: JSON.stringify({ day: '2026-10-11', ids: 'oops' }) }))).toHaveLength(1)
  })
})
