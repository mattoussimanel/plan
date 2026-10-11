import { addDays, minutesOf, pad, parseKey } from './dates.js'

const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n')
const day = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
const stamp = (d) => `${day(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`

/** Premier jour ≥ `from` où la tâche a lieu (pour un DTSTART cohérent avec le RRULE) */
function firstDay(task, from) {
  if (task.repeat === 'once') return parseKey(task.date)
  if (task.repeat === 'weekly') {
    for (let i = 0; i < 7; i++) { const d = addDays(from, i); if (task.days.includes(d.getDay())) return d }
  }
  return from
}

/** Agenda .ics : événements récurrents avec alarme à l'heure exacte */
export function buildICS(tasks, now = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ma Journee Rosee//FR', 'CALSCALE:GREGORIAN']
  for (const t of tasks) {
    const start = firstDay(t, from)
    start.setHours(0, minutesOf(t.time), 0, 0)
    const end = new Date(start.getTime() + 15 * 60000)
    lines.push('BEGIN:VEVENT', `UID:${t.id}@ma-journee-rosee`, `DTSTAMP:${day(now)}T000000Z`,
      `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${esc(`${t.emoji} ${t.title}`)}`)
    if (t.repeat === 'daily') lines.push('RRULE:FREQ=DAILY')
    if (t.repeat === 'weekly') lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${t.days.map((i) => ICS_DAYS[i]).join(',')}`)
    if (t.notify) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(t.title)}`, 'TRIGGER:PT0M', 'END:VALARM')
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
