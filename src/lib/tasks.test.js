import { byTime, isValidTask, newTaskDraft, occursOn, repeatLabel, sanitizeTask, tasksFor } from './tasks.js'
import { task, SUNDAY_KEY } from '../test/helpers.js'

describe('occursOn', () => {
  it('daily : tous les jours', () => { expect(occursOn(task(), SUNDAY_KEY)).toBe(true) })
  it('once : seulement à la date', () => {
    const t = task({ repeat: 'once', date: SUNDAY_KEY })
    expect(occursOn(t, SUNDAY_KEY)).toBe(true)
    expect(occursOn(t, '2026-10-12')).toBe(false)
  })
  it('weekly : seulement les jours choisis (0 = dimanche)', () => {
    const t = task({ repeat: 'weekly', days: [0, 3] })
    expect(occursOn(t, '2026-10-11')).toBe(true)  // dimanche
    expect(occursOn(t, '2026-10-14')).toBe(true)  // mercredi
    expect(occursOn(t, '2026-10-12')).toBe(false) // lundi
  })
  it('weekly sans jours : jamais', () => { expect(occursOn(task({ repeat: 'weekly' }), SUNDAY_KEY)).toBe(false) })
})

describe('tri et filtrage', () => {
  it('tasksFor filtre et trie par heure', () => {
    const list = [task({ id: 'b', time: '12:00' }), task({ id: 'a', time: '07:00' }), task({ id: 'c', repeat: 'once', date: '2000-01-01' })]
    expect(tasksFor(list, SUNDAY_KEY).map((t) => t.id)).toEqual(['a', 'b'])
  })
  it('byTime', () => { expect(byTime(task({ time: '08:00' }), task({ time: '09:30' }))).toBeLessThan(0) })
})

describe('repeatLabel', () => {
  it('daily', () => expect(repeatLabel(task())).toBe('Tous les jours'))
  it('once avec date formatée en français', () => expect(repeatLabel(task({ repeat: 'once', date: '2026-10-11' }))).toBe('Une fois · 11/10/2026'))
  it('once sans date', () => expect(repeatLabel(task({ repeat: 'once' }))).toBe('Une fois'))
  it('weekly : jours triés lundi → dimanche', () => expect(repeatLabel(task({ repeat: 'weekly', days: [0, 3, 1] }))).toBe('Lun · Mer · Dim'))
  it('weekly vide', () => expect(repeatLabel(task({ repeat: 'weekly', days: [] }))).toBe('Chaque semaine'))
})

describe('validation', () => {
  it('accepte des tâches valides', () => {
    expect(isValidTask(task())).toBe(true)
    expect(isValidTask(task({ repeat: 'once', date: '2026-10-11' }))).toBe(true)
    expect(isValidTask(task({ repeat: 'weekly', days: [1] }))).toBe(true)
  })
  it.each([
    ['titre vide', { title: '   ' }], ['heure invalide', { time: '25:00' }], ['répétition inconnue', { repeat: 'monthly' }],
    ['once sans date', { repeat: 'once', date: '' }], ['weekly sans jour', { repeat: 'weekly', days: [] }], ['id vide', { id: '' }],
  ])('refuse : %s', (_, over) => expect(isValidTask(task(over))).toBe(false))
  it('refuse null / non-objet', () => { expect(isValidTask(null)).toBe(false); expect(isValidTask(undefined)).toBe(false) })

  it('sanitizeTask nettoie les champs', () => {
    const t = sanitizeTask({ id: 5, title: `  ${'a'.repeat(100)} `, time: '08:00', repeat: 'weekly', days: [1, 9, 'x', 2.5, 6], notify: undefined, kind: 'hack' })
    expect(t.id).toBe('5')
    expect(t.title).toHaveLength(60)
    expect(t.days).toEqual([1, 6])
    expect(t.notify).toBe(true)
    expect(t.emoji).toBe('🌸')
    expect(t).not.toHaveProperty('kind')
  })
  it('sanitizeTask garde un kind valide et rejette l’invalide', () => {
    expect(sanitizeTask(task({ kind: 'quote' })).kind).toBe('quote')
    expect(sanitizeTask({ id: 'a', title: '', time: '08:00', repeat: 'daily' })).toBeNull()
    expect(sanitizeTask('nope')).toBeNull()
    expect(sanitizeTask(null)).toBeNull()
  })
  it('newTaskDraft', () => {
    const d = newTaskDraft('2026-10-11', 123)
    expect(d).toMatchObject({ id: 't123', isNew: true, repeat: 'daily', date: '2026-10-11', notify: true, title: '' })
  })
})
