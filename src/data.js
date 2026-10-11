export const QUOTES = [
  ['La vie est belle, il suffit de savoir la regarder avec des yeux de lumière.', 'Proverbe'],
  ['Le secret pour avancer, c’est de commencer.', 'Mark Twain'],
  ['Ce n’est pas la destination qui compte, mais le chemin parcouru.', 'Proverbe'],
  ['Crois en toi et tout devient possible.', 'Proverbe'],
  ['Chaque jour est une nouvelle page blanche : écris-y quelque chose de beau.', 'Anonyme'],
  ['On ne voit bien qu’avec le cœur. L’essentiel est invisible pour les yeux.', 'Antoine de Saint-Exupéry'],
  ['Petit à petit, l’oiseau fait son nid.', 'Proverbe'],
  ['Le bonheur n’est pas d’avoir ce que l’on désire, mais d’aimer ce que l’on a.', 'Proverbe'],
  ['Sois la douceur que tu aimerais recevoir du monde.', 'Anonyme'],
  ['Il faut toujours viser la lune, car même en cas d’échec, on atterrit dans les étoiles.', 'Oscar Wilde'],
  ['Fais de ta vie un rêve, et d’un rêve, une réalité.', 'Antoine de Saint-Exupéry'],
  ['La persévérance est la mère de toutes les réussites.', 'Proverbe'],
  ['Là où il y a de l’amour, il y a de la vie.', 'Gandhi'],
  ['Apprendre, c’est découvrir ce que tu sais déjà. Agir, c’est le démontrer.', 'Richard Bach'],
  ['Chaque petit pas compte, même les plus lents.', 'Anonyme'],
]

export const MOTIVATIONS = [
  'Aujourd’hui, tu as le droit d’être fière de toi, quoi qu’il arrive. 🌸',
  'Tu es plus forte que tu ne le crois et plus capable que tu ne l’imagines. 💪',
  'Une tâche à la fois, un sourire à la fois. Tu vas y arriver ! ✨',
  'Ta douceur est une force. Avance à ton rythme, mais avance. 🦋',
  'Chaque effort d’aujourd’hui prépare la fierté de demain. 🌷',
  'Tu mérites une journée belle et douce. Fais-toi confiance. 💖',
  'Respire, souris, et fais de ton mieux : c’est déjà énorme. 🌈',
  'Tu brilles, même les jours où tu en doutes. ⭐',
  'Aujourd’hui est une belle occasion de grandir un peu. 🌱',
  'Ne te compare pas : ta route est unique et magnifique. 🌺',
]

export const EMOJIS = ['🌅','🌸','💪','📖','🗣️','🍽️','💆‍♀️','💧','🧘‍♀️','🏃‍♀️','💊','🧹','📞','🛍️','🎨','🎵','💻','🛏️','🚿','☕','🌙','🐱','🧴','✨']

export const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
export const MOODS = ['😍', '😊', '😐', '😔', '😭']

// kind : contenu spécial affiché dans la carte de la tâche
export const DEFAULT_TASKS = [
  { id: 'd1', emoji: '🌅', title: 'Réveil & message de bienvenue', time: '07:00', repeat: 'daily', days: [], date: '', notify: true, kind: 'welcome' },
  { id: 'd2', emoji: '💪', title: 'Motivation du jour', time: '07:15', repeat: 'daily', days: [], date: '', notify: true, kind: 'motivation' },
  { id: 'd3', emoji: '💬', title: 'Citation du jour', time: '07:30', repeat: 'daily', days: [], date: '', notify: true, kind: 'quote' },
  { id: 'd4', emoji: '🍽️', title: 'Manger', time: '08:00', repeat: 'daily', days: [], date: '', notify: true },
  { id: 'd5', emoji: '📖', title: 'Lire en français', time: '10:00', repeat: 'daily', days: [], date: '', notify: true },
  { id: 'd6', emoji: '🗣️', title: 'Parler (pratique orale)', time: '15:00', repeat: 'daily', days: [], date: '', notify: true },
  { id: 'd7', emoji: '💆‍♀️', title: 'Faire mes soins', time: '21:00', repeat: 'daily', days: [], date: '', notify: true },
]

export const pad = (n) => String(n).padStart(2, '0')
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const minutesOf = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

export function dayOfYear(d = new Date()) {
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
}
export const quoteOfDay = (d = new Date()) => QUOTES[dayOfYear(d) % QUOTES.length]
export const motivationOfDay = (d = new Date()) => MOTIVATIONS[dayOfYear(d) % MOTIVATIONS.length]

export function occursOn(task, key) {
  if (task.repeat === 'once') return task.date === key
  if (task.repeat === 'daily') return true
  const [y, m, d] = key.split('-').map(Number)
  return (task.days || []).includes(new Date(y, m - 1, d).getDay())
}

export function greeting(name, d = new Date()) {
  const h = d.getHours()
  const hello = h < 5 ? 'Bonne nuit' : h < 18 ? 'Bonjour' : 'Bonsoir'
  return `${hello}${name ? ` ${name}` : ''} 💕`
}

export function repeatLabel(t) {
  if (t.repeat === 'daily') return 'Tous les jours'
  if (t.repeat === 'weekly') return (t.days || []).length ? (t.days || []).map((i) => DAYS[i]).join(' · ') : 'Chaque semaine'
  const [y, m, d] = (t.date || '').split('-')
  return t.date ? `Une fois · ${d}/${m}/${y}` : 'Une fois'
}

export function tasksFor(tasks, key) {
  return tasks.filter((t) => occursOn(t, key)).sort((a, b) => minutesOf(a.time) - minutesOf(b.time))
}

export function dayProgress(state, key) {
  const list = tasksFor(state.tasks, key)
  const done = (state.done[key] || []).filter((id) => list.some((t) => t.id === id)).length
  return { total: list.length, done, pct: list.length ? Math.round((done / list.length) * 100) : 0 }
}

export function streak(state) {
  let count = 0
  const d = new Date()
  const today = dayProgress(state, dateKey(d))
  if (!(today.total && today.done === today.total)) d.setDate(d.getDate() - 1)
  for (let i = 0; i < 400; i++) {
    const p = dayProgress(state, dateKey(d))
    if (p.total && p.done === p.total) { count++; d.setDate(d.getDate() - 1) } else break
  }
  return count
}

const KEY = 'ma-journee-state-v1'
export function loadState() {
  const base = { name: '', theme: 'rose', tasks: DEFAULT_TASKS, done: {}, water: {}, mood: {}, welcomed: false }
  try {
    const raw = JSON.parse(localStorage.getItem(KEY))
    return raw ? { ...base, ...raw } : base
  } catch { return base }
}
export function saveState(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* stockage indisponible */ }
}

export function buildICS(tasks) {
  const stamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const esc = (s) => s.replace(/([,;])/g, '\\$1')
  const now = new Date()
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ma Journee Rosee//FR', 'CALSCALE:GREGORIAN']
  for (const t of tasks) {
    const [h, m] = t.time.split(':')
    let start = new Date()
    if (t.repeat === 'once' && t.date) { const [y, mo, d] = t.date.split('-').map(Number); start = new Date(y, mo - 1, d) }
    const s0 = new Date(start); s0.setHours(+h, +m, 0, 0)
    const e0 = new Date(s0.getTime() + 15 * 60000)
    const ts = (d) => `${stamp(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`
    lines.push('BEGIN:VEVENT', `UID:${t.id}@ma-journee-rosee`, `DTSTAMP:${stamp(now)}T000000Z`,
      `DTSTART:${ts(s0)}`, `DTEND:${ts(e0)}`,
      `SUMMARY:${esc(`${t.emoji} ${t.title}`)}`)
    if (t.repeat === 'daily') lines.push('RRULE:FREQ=DAILY')
    if (t.repeat === 'weekly' && (t.days || []).length) lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${t.days.map((i) => ['SU','MO','TU','WE','TH','FR','SA'][i]).join(',')}`)
    if (t.notify) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(t.title)}`, 'TRIGGER:PT0M', 'END:VALARM')
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
