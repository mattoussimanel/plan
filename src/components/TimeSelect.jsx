import { isValidTime, pad } from '../lib/dates.js'

const HOURS = Array.from({ length: 24 }, (_, i) => pad(i))
const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i))

/** Sélecteur d'heure 24 h (le champ <input type="time"> suit le format 12 h du téléphone) */
export default function TimeSelect({ value, onChange }) {
  const [h, m] = (isValidTime(value) ? value : '09:00').split(':')
  return (
    <div className="time24" role="group" aria-label="Heure exacte (24 h)">
      <select aria-label="Heures" value={h} onChange={(e) => onChange(`${e.target.value}:${m}`)}>
        {HOURS.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <b>:</b>
      <select aria-label="Minutes" value={m} onChange={(e) => onChange(`${h}:${e.target.value}`)}>
        {MINUTES.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
    </div>
  )
}
