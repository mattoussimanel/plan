export const pad = (n) => String(n).padStart(2, '0')

/** Clé de jour locale « AAAA-MM-JJ » */
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Date locale (minuit) à partir d'une clé « AAAA-MM-JJ » */
export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** « HH:MM » -> minutes depuis minuit */
export function minutesOf(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export const minutesNow = (d = new Date()) => d.getHours() * 60 + d.getMinutes()

export function dayOfYear(d = new Date()) {
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
}

export function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export const isValidKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(parseKey(s).getTime())
export const isValidTime = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || '')

const keyToUTC = (key) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d) }
/** Nombre de jours entre deux clés « AAAA-MM-JJ » (a − b), insensible à l'heure d'été */
export const diffDays = (a, b) => Math.round((keyToUTC(a) - keyToUTC(b)) / 86400000)
/** Clé du jour décalée de n jours */
export function addDaysKey(key, n) {
  const t = new Date(keyToUTC(key) + n * 86400000)
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}
