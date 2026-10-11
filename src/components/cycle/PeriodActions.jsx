import { useState } from 'react'

export default function PeriodActions({ today, hasPeriods, onStart, onEnd }) {
  const [date, setDate] = useState(today)
  return (
    <section className="card">
      <h3>Mes règles</h3>
      <label>Date
        <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="actions left">
        <button className="btn" disabled={!date || date > today} onClick={() => onStart(date)}>🌙 Elles commencent</button>
        <button className="btn ghost" disabled={!date || date > today || !hasPeriods} onClick={() => onEnd(date)}>✨ Elles se terminent</button>
      </div>
    </section>
  )
}
