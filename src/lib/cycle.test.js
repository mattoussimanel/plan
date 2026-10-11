import {
  averageCycle, averagePeriod, buildCycleSchedule, cycleLengths, defaultCycle, eventDates, monthGrid, normalizeCycle,
  phaseOn, reminderText, sanitizeReminder, summary, upcomingReminders, upcomingStarts,
} from './cycle.js'

const cyc = (over = {}) => ({
  ...defaultCycle(),
  periods: [{ start: '2026-08-23', end: '2026-08-27' }, { start: '2026-09-20', end: '2026-09-24' }, { start: '2026-10-18', end: null }],
  ...over,
})
const NOW = new Date(2026, 9, 30, 10, 0) // 30 octobre 2026, 10:00

describe('normalizeCycle', () => {
  it('valeurs par défaut pour une entrée invalide', () => {
    for (const bad of [null, undefined, 3, 'x']) expect(normalizeCycle(bad)).toEqual(defaultCycle())
  })
  it('borne les durées', () => {
    expect(normalizeCycle({ cycleLength: 5, periodLength: 99, lutealLength: 'x' })).toMatchObject({ cycleLength: 21, periodLength: 10, lutealLength: 14 })
    expect(normalizeCycle({ cycleLength: 60 }).cycleLength).toBe(45)
  })
  it('périodes : triées, dédupliquées, fin invalide ignorée', () => {
    const c = normalizeCycle({ periods: [
      { start: '2026-10-18', end: '2026-10-20' }, { start: '2026-09-20', end: '2026-09-01' }, { start: '2026-10-18' }, { start: 'nope' }, null,
      { start: '2026-08-01', end: '2026-12-01' },
    ] })
    expect(c.periods).toEqual([
      { start: '2026-08-01', end: null }, { start: '2026-09-20', end: null }, { start: '2026-10-18', end: '2026-10-20' },
    ])
  })
  it('jours : nettoie flux, symptômes, notes et supprime les entrées vides', () => {
    const c = normalizeCycle({ days: {
      '2026-10-18': { flow: 'heavy', symptoms: ['cramps', 'cramps', 'inconnu'], note: '  dur  ' },
      '2026-10-19': { flow: 'bizarre' }, 'pas-une-date': { flow: 'light' }, '2026-10-20': 'x',
    } })
    expect(c.days).toEqual({ '2026-10-18': { flow: 'heavy', symptoms: ['cramps'], note: 'dur' } })
  })
  it('rappels : filtre les invalides, borne daysBefore, garde une liste vide', () => {
    const c = normalizeCycle({ reminders: [
      { id: 'a', event: 'period', daysBefore: 99, time: '08:30', enabled: false },
      { id: 'a', event: 'ovulation', daysBefore: 1, time: '09:00' }, { id: 'b', event: 'nope', time: '09:00' }, { id: 'c', event: 'fertile', time: '25:00' },
    ] })
    expect(c.reminders).toEqual([{ id: 'a', event: 'period', daysBefore: 14, time: '08:30', enabled: false }])
    expect(normalizeCycle({ reminders: [] }).reminders).toEqual([])
    expect(normalizeCycle({}).reminders).toHaveLength(2)
  })
  it('sanitizeReminder', () => {
    expect(sanitizeReminder(null)).toBeNull()
    expect(sanitizeReminder({ id: 'x', event: 'period', daysBefore: -3, time: '07:00' })).toEqual({ id: 'x', event: 'period', daysBefore: 0, time: '07:00', enabled: true })
  })
})

describe('moyennes', () => {
  it('sans historique : valeurs réglées', () => {
    const c = { ...defaultCycle(), cycleLength: 30, periodLength: 6 }
    expect(averageCycle(c)).toBe(30)
    expect(averagePeriod(c)).toBe(6)
    expect(cycleLengths(c)).toEqual([])
  })
  it('moyenne des cycles observés, ignore les écarts aberrants', () => {
    const c = cyc({ periods: [{ start: '2026-07-01', end: null }, { start: '2026-07-29', end: null }, { start: '2026-08-28', end: null }, { start: '2026-09-04', end: null }] })
    expect(cycleLengths(c)).toEqual([28, 30])
    expect(averageCycle(c)).toBe(29)
  })
  it('durée moyenne des règles terminées', () => {
    expect(averagePeriod(cyc())).toBe(5)
    expect(averagePeriod(cyc({ periods: [{ start: '2026-09-01', end: '2026-09-04' }, { start: '2026-10-01', end: '2026-10-07' }] }))).toBe(6) // (4+7)/2 = 5.5 → 6
  })
})

describe('summary et prévisions', () => {
  it('null sans règles saisies', () => expect(summary(defaultCycle(), '2026-10-30')).toBeNull())
  it('dates prévues à partir du dernier début', () => {
    const s = summary(cyc(), '2026-10-30')
    expect(s).toMatchObject({
      lastStart: '2026-10-18', avg: 28, cycleDay: 13, nextStart: '2026-11-15', daysToNext: 16, late: 0,
      ovulation: '2026-11-01', fertileStart: '2026-10-27', fertileEnd: '2026-11-02',
    })
    expect(s.phase.phase).toBe('fertile')
  })
  it('retard', () => expect(summary(cyc(), '2026-11-20')).toMatchObject({ daysToNext: -5, late: 5 }))
  it('upcomingStarts', () => {
    expect(upcomingStarts(cyc(), 3)).toEqual(['2026-11-15', '2026-12-13', '2027-01-10'])
    expect(upcomingStarts(defaultCycle())).toEqual([])
  })
})

describe('phaseOn', () => {
  const c = cyc()
  it('avant la première saisie : null ; sans données : null', () => {
    expect(phaseOn(c, '2026-08-01')).toBeNull()
    expect(phaseOn(defaultCycle(), '2026-10-30')).toBeNull()
  })
  it('règles saisies (avec fin) et règles en cours (durée moyenne)', () => {
    expect(phaseOn(c, '2026-09-22')).toEqual({ phase: 'period', predicted: false, cycleDay: 3 })
    expect(phaseOn(c, '2026-10-22')).toMatchObject({ phase: 'period', predicted: false })
    expect(phaseOn(c, '2026-09-25').phase).not.toBe('period') // le lendemain de la fin saisie
  })
  it('phases du cycle en cours', () => {
    expect(phaseOn(c, '2026-10-24').phase).toBe('follicular')
    expect(phaseOn(c, '2026-10-27').phase).toBe('fertile')
    expect(phaseOn(c, '2026-10-31').phase).toBe('fertile')
    expect(phaseOn(c, '2026-11-01').phase).toBe('ovulation')
    expect(phaseOn(c, '2026-11-02').phase).toBe('fertile')
    expect(phaseOn(c, '2026-11-03').phase).toBe('luteal')
    expect(phaseOn(c, '2026-11-14').phase).toBe('luteal')
  })
  it('règles prévues et cycles suivants prolongés', () => {
    expect(phaseOn(c, '2026-11-15')).toEqual({ phase: 'period', predicted: true, cycleDay: 1 })
    expect(phaseOn(c, '2026-11-19')).toMatchObject({ phase: 'period', predicted: true })
    expect(phaseOn(c, '2026-11-20')).toMatchObject({ phase: 'follicular', predicted: true })
    expect(phaseOn(c, '2026-11-29').phase).toBe('ovulation') // règles prévues le 11-15 + 28 − 14 jours
  })
  it('cycle passé : la longueur réelle est utilisée, pas l’estimation', () => {
    const past = phaseOn(c, '2026-10-10')
    expect(past).toMatchObject({ phase: 'luteal', predicted: false })
  })
})

describe('monthGrid', () => {
  it('octobre 2026 : commence un jeudi, semaines lundi → dimanche', () => {
    const w = monthGrid(2026, 9)
    expect(w).toHaveLength(5)
    expect(w[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
    expect(w.flat().filter(Boolean)).toHaveLength(31)
    expect(w.every((x) => x.length === 7)).toBe(true)
  })
  it('février 2027 : 28 jours, commence un lundi', () => {
    const w = monthGrid(2027, 1)
    expect(w[0][0]).toBe('2027-02-01')
    expect(w).toHaveLength(4)
  })
})

describe('rappels « X jours avant »', () => {
  it('texte selon le nombre de jours', () => {
    expect(reminderText('period', 0, '2026-11-15')).toBe('Tes règles sont prévues aujourd’hui')
    expect(reminderText('period', 1, '2026-11-15')).toMatch(/^Tes règles sont prévues dans 1 jour \(dimanche 15 novembre\)$/)
    expect(reminderText('ovulation', 3, '2026-11-01')).toMatch(/^Ton ovulation est estimée dans 3 jours/)
    expect(reminderText('fertile', 2, '2026-10-27')).toMatch(/fenêtre fertile commence/)
    expect(reminderText('periodEnd', 2, '2026-11-19')).toMatch(/fin de tes règles/)
  })
  it('eventDates : 4 évènements par cycle prévu', () => {
    const d = eventDates(cyc(), 1)
    expect(d).toEqual(expect.arrayContaining([
      { event: 'period', date: '2026-11-15' }, { event: 'periodEnd', date: '2026-11-19' },
      { event: 'ovulation', date: '2026-11-01' }, { event: 'fertile', date: '2026-10-27' },
    ]))
  })
  it('rappels par défaut : ovulation la veille à 9h, règles 2 jours avant', () => {
    const list = upcomingReminders(cyc(), NOW)
    expect(list[0]).toMatchObject({ id: 'r2', event: 'ovulation', atKey: '2026-10-31', targetKey: '2026-11-01' })
    expect(list[0].at).toEqual(new Date(2026, 9, 31, 9, 0))
    expect(list[1]).toMatchObject({ id: 'r1', event: 'period', atKey: '2026-11-13' })
    expect(list[0].title).toBe('🌸 Ovulation')
    expect(list[0].body).toMatch(/dans 1 jour/)
  })
  it('ignore les rappels désactivés, passés ou lointains', () => {
    const off = cyc({ reminders: [{ id: 'a', event: 'period', daysBefore: 2, time: '09:00', enabled: false }] })
    expect(upcomingReminders(off, NOW)).toEqual([])
    const past = cyc({ reminders: [{ id: 'a', event: 'fertile', daysBefore: 0, time: '09:00', enabled: true }] }) // 27 oct : passé
    expect(upcomingReminders(past, NOW).every((n) => n.at > NOW)).toBe(true)
    expect(upcomingReminders(cyc(), NOW, 5).map((n) => n.id)).toEqual(['r2'])
  })
  it('« jours choisis » : plusieurs rappels sur un même évènement', () => {
    const c = cyc({ reminders: [
      { id: 'a', event: 'period', daysBefore: 7, time: '08:00', enabled: true },
      { id: 'b', event: 'period', daysBefore: 1, time: '20:30', enabled: true },
    ] })
    const l = upcomingReminders(c, NOW).filter((n) => n.targetKey === '2026-11-15')
    expect(l.map((n) => [n.id, n.atKey])).toEqual([['a', '2026-11-08'], ['b', '2026-11-14']])
    expect(l[1].at).toEqual(new Date(2026, 10, 14, 20, 30))
  })
  it('aucune règle saisie : aucun rappel', () => expect(upcomingReminders(defaultCycle(), NOW)).toEqual([]))
  it('notifications Android : une alarme exacte par rappel avec id entier unique', () => {
    const list = buildCycleSchedule(cyc(), NOW)
    expect(list.length).toBeGreaterThan(2)
    expect(new Set(list.map((n) => n.id)).size).toBe(list.length)
    for (const n of list) {
      expect(Number.isInteger(n.id) && n.id > 0 && n.id < 2 ** 31).toBe(true)
      expect(n).toMatchObject({ channelId: 'rappels', schedule: { allowWhileIdle: true } })
      expect(n.schedule.at).toBeInstanceOf(Date)
    }
  })
})
