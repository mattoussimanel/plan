import { addDaysKey, diffDays, isValidKey, isValidTime, pad, parseKey, dateKey } from './dates.js'
import { channelFor, hashId } from './schedule.js'

export const EVENTS = {
  period: { label: 'Mes règles', emoji: '🌙' },
  periodEnd: { label: 'Fin de mes règles', emoji: '✨' },
  fertile: { label: 'Début de la fenêtre fertile', emoji: '🌿' },
  ovulation: { label: 'Ovulation', emoji: '🌸' },
}
export const FLOWS = [['spotting', 'Spotting', '·'], ['light', 'Léger', '💧'], ['medium', 'Moyen', '💧💧'], ['heavy', 'Abondant', '💧💧💧']]
export const SYMPTOMS = [
  ['cramps', 'Crampes', '😣'], ['headache', 'Maux de tête', '🤕'], ['fatigue', 'Fatigue', '😴'], ['bloating', 'Ballonnements', '🎈'],
  ['mood', 'Humeur changeante', '🎭'], ['acne', 'Acné', '🔴'], ['backache', 'Mal de dos', '🦴'], ['cravings', 'Envies sucrées', '🍫'],
  ['nausea', 'Nausées', '🤢'], ['tender', 'Seins sensibles', '💗'],
]
export const PHASES = {
  period: 'Règles', follicular: 'Phase folliculaire', fertile: 'Fenêtre fertile', ovulation: 'Ovulation', luteal: 'Phase lutéale',
}
const PHASE_TIPS = {
  period: 'Repose-toi, bois chaud et ménage-toi 🫖',
  follicular: 'Ton énergie remonte : bon moment pour de nouveaux projets 🌱',
  fertile: 'Fenêtre fertile : ton énergie est au plus haut ✨',
  ovulation: 'Jour d’ovulation estimé 🌸',
  luteal: 'Écoute ton corps, le SPM peut arriver : douceur et sommeil 💤',
}
export const phaseTip = (phase) => PHASE_TIPS[phase] || ''

export const LIMITS = { cycleLength: [21, 45], periodLength: [1, 10], lutealLength: [10, 16], daysBefore: [0, 14] }
const FLOW_IDS = FLOWS.map((f) => f[0])
const SYMPTOM_IDS = SYMPTOMS.map((s) => s[0])

export const defaultCycle = () => ({
  cycleLength: 28, periodLength: 5, lutealLength: 14, periods: [], days: {},
  reminders: [
    { id: 'r1', event: 'period', daysBefore: 2, time: '09:00', enabled: true },
    { id: 'r2', event: 'ovulation', daysBefore: 1, time: '09:00', enabled: true },
  ],
})

const clampInt = (v, [min, max], fallback) => (Number.isInteger(v) ? Math.min(max, Math.max(min, v)) : fallback)

export function sanitizeReminder(r) {
  if (!r || typeof r !== 'object' || !EVENTS[r.event] || typeof r.id !== 'string' || !r.id || !isValidTime(r.time)) return null
  return { id: r.id, event: r.event, daysBefore: clampInt(r.daysBefore, LIMITS.daysBefore, 0), time: r.time, enabled: r.enabled !== false }
}

/** Nettoie un cycle venant du stockage / d'un import : toujours un cycle valide */
export function normalizeCycle(raw) {
  const base = defaultCycle()
  if (!raw || typeof raw !== 'object') return base
  const seen = new Set()
  const periods = (Array.isArray(raw.periods) ? raw.periods : [])
    .filter((p) => p && isValidKey(p.start) && !seen.has(p.start) && seen.add(p.start))
    .map((p) => ({ start: p.start, end: isValidKey(p.end) && diffDays(p.end, p.start) >= 0 && diffDays(p.end, p.start) < 15 ? p.end : null }))
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(-60)
  const days = {}
  for (const [k, v] of Object.entries(raw.days && typeof raw.days === 'object' ? raw.days : {})) {
    if (!isValidKey(k) || !v || typeof v !== 'object') continue
    const d = {
      ...(FLOW_IDS.includes(v.flow) && { flow: v.flow }),
      ...(Array.isArray(v.symptoms) && v.symptoms.some((x) => SYMPTOM_IDS.includes(x)) && { symptoms: [...new Set(v.symptoms.filter((x) => SYMPTOM_IDS.includes(x)))] }),
      ...(typeof v.note === 'string' && v.note.trim() && { note: v.note.trim().slice(0, 200) }),
    }
    if (Object.keys(d).length) days[k] = d
  }
  const ids = new Set()
  const reminders = Array.isArray(raw.reminders)
    ? raw.reminders.map(sanitizeReminder).filter((r) => r && !ids.has(r.id) && ids.add(r.id)).slice(0, 20)
    : base.reminders
  return {
    cycleLength: clampInt(raw.cycleLength, LIMITS.cycleLength, 28),
    periodLength: clampInt(raw.periodLength, LIMITS.periodLength, 5),
    lutealLength: clampInt(raw.lutealLength, LIMITS.lutealLength, 14),
    periods, days, reminders,
  }
}

const average = (a) => a.reduce((s, x) => s + x, 0) / a.length

/** Longueurs des cycles observés (jours entre deux débuts de règles) */
export function cycleLengths(cycle) {
  const starts = cycle.periods.map((p) => p.start)
  return starts.slice(1).map((s, i) => diffDays(s, starts[i])).filter((n) => n >= 15 && n <= 60)
}

/** Durée moyenne du cycle : moyenne des 6 derniers, sinon la valeur réglée */
export function averageCycle(cycle) {
  const l = cycleLengths(cycle).slice(-6)
  return l.length ? Math.round(average(l)) : cycle.cycleLength
}

/** Durée moyenne des règles : moyenne des 6 dernières terminées, sinon la valeur réglée */
export function averagePeriod(cycle) {
  const l = cycle.periods.filter((p) => p.end).map((p) => diffDays(p.end, p.start) + 1).filter((n) => n >= 1 && n <= 10).slice(-6)
  return l.length ? Math.round(average(l)) : cycle.periodLength
}

const periodEnd = (cycle, p) => p.end || addDaysKey(p.start, averagePeriod(cycle) - 1)

/** Prochains débuts de règles prévus (à partir du dernier début saisi) */
export function upcomingStarts(cycle, count = 4) {
  const last = cycle.periods.at(-1)
  if (!last) return []
  const avg = averageCycle(cycle)
  return Array.from({ length: count }, (_, i) => addDaysKey(last.start, avg * (i + 1)))
}

/** Résumé pour aujourd'hui (null tant qu'aucune règle n'est saisie) */
export function summary(cycle, todayKey) {
  const last = cycle.periods.at(-1)
  if (!last) return null
  const avg = averageCycle(cycle)
  const nextStart = addDaysKey(last.start, avg)
  const ovulation = addDaysKey(nextStart, -cycle.lutealLength)
  const daysToNext = diffDays(nextStart, todayKey)
  return {
    lastStart: last.start, avg, plen: averagePeriod(cycle), cycleDay: diffDays(todayKey, last.start) + 1,
    nextStart, daysToNext, late: Math.max(0, -daysToNext),
    ovulation, fertileStart: addDaysKey(ovulation, -5), fertileEnd: addDaysKey(ovulation, 1),
    phase: phaseOn(cycle, todayKey),
  }
}

/** Phase d'un jour : { phase, predicted, cycleDay } ou null */
export function phaseOn(cycle, key) {
  const starts = cycle.periods.map((p) => p.start)
  if (!starts.length || key < starts[0]) return null
  const avg = averageCycle(cycle)
  const plen = averagePeriod(cycle)
  for (const p of cycle.periods) {
    if (key >= p.start && key <= periodEnd(cycle, p)) return { phase: 'period', predicted: false, cycleDay: diffDays(key, p.start) + 1 }
  }
  const idx = starts.filter((s) => s <= key).length - 1
  let base = starts[idx]
  let predicted = false
  const nextActual = starts[idx + 1]
  if (!nextActual) {
    const n = Math.floor(diffDays(key, base) / avg)
    if (n >= 1) { base = addDaysKey(base, n * avg); predicted = true }
  }
  const d = diffDays(key, base) + 1
  if (predicted && d <= plen) return { phase: 'period', predicted: true, cycleDay: d }
  const len = nextActual ? diffDays(nextActual, base) : avg
  const ov = len - cycle.lutealLength + 1 // jour du cycle de l'ovulation (même date que `summary`)
  const phase = d === ov ? 'ovulation' : d >= ov - 5 && d <= ov + 1 ? 'fertile' : d < ov ? 'follicular' : 'luteal'
  return { phase, predicted: predicted || !nextActual, cycleDay: d }
}

/** Grille d'un mois (semaines lundi → dimanche) ; les jours hors mois valent null */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => dateKey(new Date(year, month, i + 1)))]
  while (cells.length % 7) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7))
}

// ----- rappels « X jours avant » -----
const fmtDay = (key) => parseKey(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const SENTENCES = {
  period: (when) => `Tes règles sont prévues ${when}`,
  periodEnd: (when) => `La fin de tes règles est prévue ${when}`,
  fertile: (when) => `Ta fenêtre fertile commence ${when}`,
  ovulation: (when) => `Ton ovulation est estimée ${when}`,
}
export function reminderText(event, daysBefore, targetKey) {
  const when = daysBefore === 0 ? 'aujourd’hui' : `dans ${daysBefore} jour${daysBefore > 1 ? 's' : ''} (${fmtDay(targetKey)})`
  return SENTENCES[event](when)
}

/** Dates prévues de chaque évènement pour les prochains cycles */
export function eventDates(cycle, count = 4) {
  const plen = averagePeriod(cycle)
  return upcomingStarts(cycle, count).flatMap((start) => {
    const ov = addDaysKey(start, -cycle.lutealLength)
    return [
      { event: 'period', date: start }, { event: 'periodEnd', date: addDaysKey(start, plen - 1) },
      { event: 'ovulation', date: ov }, { event: 'fertile', date: addDaysKey(ov, -5) },
    ]
  })
}

/** Instances de rappels à venir : [{ id, event, targetKey, atKey, at, title, body }] triées par date */
export function upcomingReminders(cycle, now = new Date(), horizonDays = 90) {
  const limit = now.getTime() + horizonDays * 86400000
  const dates = eventDates(cycle)
  const out = []
  for (const r of cycle.reminders.filter((x) => x.enabled)) {
    for (const { event, date } of dates.filter((d) => d.event === r.event)) {
      const atKey = addDaysKey(date, -r.daysBefore)
      const [h, m] = r.time.split(':').map(Number)
      const d = parseKey(atKey)
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0)
      if (at.getTime() <= now.getTime() + 30000 || at.getTime() > limit) continue
      out.push({ id: r.id, event, targetKey: date, atKey, at, title: `${EVENTS[event].emoji} ${EVENTS[event].label}`, body: reminderText(event, r.daysBefore, date) })
    }
  }
  return out.sort((a, b) => a.at - b.at)
}

/** Notifications Android (une alarme exacte par rappel) pour les rappels du cycle */
export function buildCycleSchedule(cycle, now = new Date(), channelId = channelFor()) {
  return upcomingReminders(cycle, now).map((n) => ({
    id: hashId(`cy-${n.id}`) * 2048 + (diffDays(n.atKey, '2020-01-01') % 2048),
    title: n.title, body: n.body, channelId, extra: { cycleReminder: n.id },
    schedule: { at: n.at, allowWhileIdle: true },
  }))
}
