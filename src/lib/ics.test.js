import { buildICS } from './ics.js'
import { task, SUNDAY } from '../test/helpers.js'

const lines = (tasks) => buildICS(tasks, SUNDAY).split('\r\n')

describe('buildICS', () => {
  it('structure du calendrier avec fins de ligne CRLF', () => {
    const out = buildICS([task()], SUNDAY)
    expect(out.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0')).toBe(true)
    expect(out.endsWith('END:VCALENDAR')).toBe(true)
    expect(out).toContain('BEGIN:VEVENT')
  })
  it('tâche quotidienne : RRULE DAILY, heure exacte et alarme', () => {
    const l = lines([task({ time: '07:05' })])
    expect(l).toContain('DTSTART:20261011T070500')
    expect(l).toContain('DTEND:20261011T072000')
    expect(l).toContain('RRULE:FREQ=DAILY')
    expect(l).toContain('TRIGGER:PT0M')
    expect(l).toContain('SUMMARY:🌸 Test')
  })
  it('sans notification : pas d’alarme', () => expect(lines([task({ notify: false })])).not.toContain('BEGIN:VALARM'))
  it('une fois : date exacte, pas de RRULE', () => {
    const l = lines([task({ repeat: 'once', date: '2026-12-24', time: '18:00' })])
    expect(l).toContain('DTSTART:20261224T180000')
    expect(l.some((x) => x.startsWith('RRULE'))).toBe(false)
  })
  it('hebdomadaire : BYDAY et premier jour correspondant', () => {
    const l = lines([task({ repeat: 'weekly', days: [3, 1] })]) // dimanche 11 → lundi 12 le plus proche
    expect(l).toContain('RRULE:FREQ=WEEKLY;BYDAY=WE,MO')
    expect(l).toContain('DTSTART:20261012T090000')
  })
  it('échappe virgules, points-virgules et retours à la ligne', () => {
    expect(lines([task({ title: 'a,b;c' })])).toContain('SUMMARY:🌸 a\\,b\\;c')
  })
  it('UID uniques par tâche', () => {
    const uids = lines([task({ id: 'a' }), task({ id: 'b' })]).filter((x) => x.startsWith('UID'))
    expect(new Set(uids).size).toBe(2)
  })
})
