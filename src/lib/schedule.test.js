import { CONTENT_DAYS, buildSchedule, channelFor, hashId, notifId } from './schedule.js'
import { quoteOfDay } from './messages.js'
import { DEFAULT_TASKS } from '../data/content.js'
import { task } from '../test/helpers.js'

const NOW = new Date(2026, 9, 11, 8, 30) // dimanche
const only = (t) => buildSchedule([t], NOW)

describe('hashId / notifId', () => {
  it('est stable, borné et tient dans un entier 32 bits signé', () => {
    expect(hashId('abc')).toBe(hashId('abc'))
    expect(hashId('abc')).not.toBe(hashId('abd'))
    for (const id of ['d1', 't1760000000000', 'x'.repeat(200)]) {
      expect(hashId(id)).toBeLessThan(1 << 20)
      expect(notifId(id, 2047)).toBeLessThan(2 ** 31)
      expect(notifId(id, 0)).toBeGreaterThanOrEqual(0)
    }
  })
  it('slots différents = ids différents', () => expect(notifId('a', 0)).not.toBe(notifId('a', 1)))
})

describe('canal par son', () => {
  it('channelFor : un canal par son', () => {
    expect(channelFor()).toBe('rappels_carillon')
    expect(channelFor('cloche')).toBe('rappels_cloche')
  })
  it('buildSchedule utilise le canal demandé', () => {
    expect(buildSchedule([task()], NOW, 'rappels_cloche')[0].channelId).toBe('rappels_cloche')
  })
})

describe('buildSchedule', () => {
  it('quotidienne : une notification répétée par le système à l’heure exacte', () => {
    const [n, ...rest] = only(task({ id: 'a', time: '07:05', title: 'Manger', emoji: '🍽️' }))
    expect(rest).toEqual([])
    expect(n).toMatchObject({ title: '🍽️ Manger', body: 'C’est l’heure ! 07:05', channelId: 'rappels_carillon', schedule: { on: { hour: 7, minute: 5, second: 0 }, allowWhileIdle: true } })
    expect(n.extra).toEqual({ taskId: 'a' })
  })
  it('hebdomadaire : une par jour choisi, jours Android (dimanche = 1)', () => {
    const list = only(task({ repeat: 'weekly', days: [0, 3, 6], time: '18:45' }))
    expect(list.map((n) => n.schedule.on)).toEqual([
      { weekday: 1, hour: 18, minute: 45, second: 0 }, { weekday: 4, hour: 18, minute: 45, second: 0 }, { weekday: 7, hour: 18, minute: 45, second: 0 },
    ])
    expect(new Set(list.map((n) => n.id)).size).toBe(3)
  })
  it('une fois : date précise, ignorée si passée', () => {
    const [n] = only(task({ repeat: 'once', date: '2026-12-24', time: '18:00' }))
    expect(n.schedule.at).toEqual(new Date(2026, 11, 24, 18, 0))
    expect(only(task({ repeat: 'once', date: '2026-10-11', time: '08:00' }))).toEqual([])
    expect(only(task({ repeat: 'once', date: '2020-01-01' }))).toEqual([])
  })
  it('tâche sans notification : ignorée', () => expect(only(task({ notify: false }))).toEqual([]))
  it('messages du jour : un par jour avec le texte du jour, sans les heures déjà passées', () => {
    const list = only(task({ id: 'q', kind: 'quote', time: '07:30' })) // 07:30 déjà passé aujourd’hui
    expect(list).toHaveLength(CONTENT_DAYS - 1)
    expect(list[0].schedule.at).toEqual(new Date(2026, 9, 12, 7, 30))
    expect(list[0].body).toContain(quoteOfDay(new Date(2026, 9, 12))[0])
    expect(list[0].body).not.toBe(list[1].body)
    expect(new Set(list.map((n) => n.id)).size).toBe(list.length)
  })
  it('messages du jour à venir : inclut aujourd’hui', () => {
    expect(only(task({ kind: 'motivation', time: '09:00' }))).toHaveLength(CONTENT_DAYS)
  })
  it('messages du jour hebdomadaires : seulement les jours concernés', () => {
    const list = only(task({ kind: 'quote', repeat: 'weekly', days: [1], time: '09:00' }))
    expect(list.every((n) => n.schedule.at.getDay() === 1)).toBe(true)
  })
  it('tâches par défaut : tous les ids sont uniques', () => {
    const list = buildSchedule(DEFAULT_TASKS, NOW)
    expect(new Set(list.map((n) => n.id)).size).toBe(list.length)
    expect(list.every((n) => Number.isInteger(n.id) && n.id > 0)).toBe(true)
  })
})
