import { addDays, dateKey, dayOfYear, isValidKey, isValidTime, minutesNow, minutesOf, pad, parseKey } from './dates.js'

describe('dates', () => {
  it('pad complète à 2 chiffres', () => { expect(pad(5)).toBe('05'); expect(pad(12)).toBe('12') })
  it('dateKey formate en heure locale', () => {
    expect(dateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(dateKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31')
  })
  it('parseKey est l’inverse de dateKey', () => {
    const d = parseKey('2026-03-09')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 2, 9, 0])
    expect(dateKey(parseKey('2026-10-11'))).toBe('2026-10-11')
  })
  it('minutesOf / minutesNow', () => {
    expect(minutesOf('00:00')).toBe(0)
    expect(minutesOf('07:15')).toBe(435)
    expect(minutesOf('23:59')).toBe(1439)
    expect(minutesNow(new Date(2026, 0, 1, 8, 30))).toBe(510)
  })
  it('dayOfYear', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(1)
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(365)
    expect(dayOfYear(new Date(2028, 11, 31))).toBe(366)
  })
  it('addDays gère les changements de mois/année sans muter', () => {
    const d = new Date(2026, 11, 31)
    expect(dateKey(addDays(d, 1))).toBe('2027-01-01')
    expect(dateKey(addDays(d, -31))).toBe('2026-11-30')
    expect(dateKey(d)).toBe('2026-12-31')
  })
  it('valide clés et heures', () => {
    expect(isValidKey('2026-10-11')).toBe(true)
    for (const bad of ['', null, '2026-1-1', '11/10/2026', 'abcd-ef-gh']) expect(isValidKey(bad)).toBe(false)
    expect(isValidTime('07:05')).toBe(true)
    for (const bad of ['7:05', '24:00', '12:60', '', null, 'ab:cd']) expect(isValidTime(bad)).toBe(false)
  })
})
