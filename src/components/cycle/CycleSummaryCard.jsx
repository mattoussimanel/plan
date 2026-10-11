import { useState } from 'react'
import { PHASES, phaseTip } from '../../lib/cycle.js'
import { parseKey } from '../../lib/dates.js'

const long = (key) => parseKey(key).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export function nextPeriodText(s) {
  if (s.late > 0) return `en retard de ${s.late} jour${s.late > 1 ? 's' : ''}`
  if (s.daysToNext === 0) return 'prévues aujourd’hui'
  return `dans ${s.daysToNext} jour${s.daysToNext > 1 ? 's' : ''}`
}

export default function CycleSummaryCard({ summary, today, onStart }) {
  const [date, setDate] = useState(today)
  if (!summary) {
    return (
      <section className="card cycle-hero">
        <h2>🌙 Mon cycle</h2>
        <p className="sub">Pour commencer, indique le premier jour de tes dernières règles. Je calcule ensuite tes prochaines règles, ton ovulation et ta fenêtre fertile.</p>
        <label>Premier jour de mes dernières règles
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="actions left"><button className="btn" disabled={!date || date > today} onClick={() => onStart(date)}>Enregistrer</button></div>
      </section>
    )
  }
  const { phase } = summary.phase || {}
  return (
    <section className="card cycle-hero">
      <h2>🌙 Jour {summary.cycleDay} du cycle</h2>
      {phase && <p className="phase-chip">{PHASES[phase]}{summary.phase.predicted ? ' (estimée)' : ''}</p>}
      <ul className="cycle-facts">
        <li>🌙 Prochaines règles : <b>{nextPeriodText(summary)}</b> <small>({long(summary.nextStart)})</small></li>
        <li>🌿 Fenêtre fertile : <b>{long(summary.fertileStart)}</b> → <b>{long(summary.fertileEnd)}</b></li>
        <li>🌸 Ovulation estimée : <b>{long(summary.ovulation)}</b></li>
        <li>📏 Cycle moyen : <b>{summary.avg} jours</b></li>
      </ul>
      {phase && <p className="msg">{phaseTip(phase)}</p>}
    </section>
  )
}
