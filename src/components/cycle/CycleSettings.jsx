import { LIMITS, cycleLengths } from '../../lib/cycle.js'

const range = ([min, max]) => Array.from({ length: max - min + 1 }, (_, i) => min + i)

export default function CycleSettings({ cycle, dispatch }) {
  const set = (patch) => dispatch({ type: 'cycleSettings', patch })
  const observed = cycleLengths(cycle)
  const field = (label, key, unit) => (
    <label>{label}
      <select value={cycle[key]} onChange={(e) => set({ [key]: Number(e.target.value) })}>
        {range(LIMITS[key]).map((n) => <option key={n} value={n}>{n} {unit}</option>)}
      </select>
    </label>
  )
  return (
    <section className="card">
      <h3>⚙️ Réglages du cycle</h3>
      {field('Durée habituelle du cycle', 'cycleLength', 'jours')}
      {field('Durée des règles', 'periodLength', 'jours')}
      {field('Durée de la phase lutéale (ovulation → règles)', 'lutealLength', 'jours')}
      <p className="hint">{observed.length ? `Calculé automatiquement sur tes ${observed.length} derniers cycles saisis.` : 'Ces valeurs servent tant que tu n’as pas saisi au moins deux débuts de règles.'}</p>
    </section>
  )
}
