import { QUOTES, MOTIVATIONS } from '../data/content.js'
import { dayOfYear } from './dates.js'

export const quoteOfDay = (d = new Date()) => QUOTES[dayOfYear(d) % QUOTES.length]
export const motivationOfDay = (d = new Date()) => MOTIVATIONS[dayOfYear(d) % MOTIVATIONS.length]

export function greeting(name, d = new Date()) {
  const h = d.getHours()
  const hello = h < 5 ? 'Bonne nuit' : h < 18 ? 'Bonjour' : 'Bonsoir'
  return `${hello}${name?.trim() ? ` ${name.trim()}` : ''} 💕`
}

/** Texte de notification d'une tâche */
export function bodyFor(task, date = new Date()) {
  if (task.kind === 'quote') { const [q, a] = quoteOfDay(date); return `« ${q} » — ${a}` }
  if (task.kind === 'motivation') return motivationOfDay(date)
  if (task.kind === 'welcome') return 'Belle journée à toi ! Voici ton programme 🌸'
  return `C’est l’heure ! ${task.time}`
}
