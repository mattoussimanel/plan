import { nextPeriodText } from './CycleSummaryCard.jsx'
import { PHASES } from '../../lib/cycle.js'

/** Petite carte de l'écran « Aujourd'hui » */
export default function CycleToday({ summary, onOpen }) {
  if (!summary) return null
  const phase = summary.phase?.phase
  return (
    <button className="card cycle-today" onClick={onOpen}>
      <span aria-hidden="true">🌙</span>
      <div><b>Jour {summary.cycleDay}{phase ? ` · ${PHASES[phase]}` : ''}</b><small>Règles {nextPeriodText(summary)}</small></div>
    </button>
  )
}
