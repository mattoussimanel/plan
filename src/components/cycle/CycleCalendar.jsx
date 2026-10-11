import { useState } from 'react'
import { monthGrid, phaseOn } from '../../lib/cycle.js'

const HEADS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function dayClass(cycle, key, today) {
  const p = phaseOn(cycle, key)
  const log = cycle.days[key]
  return [
    'cal-day',
    p?.phase === 'period' && (p.predicted ? 'period-pred' : 'period'),
    p?.phase === 'fertile' && 'fertile',
    p?.phase === 'ovulation' && 'ovulation',
    key === today && 'today',
    log && (log.flow || log.symptoms?.length || log.note) && 'logged',
  ].filter(Boolean).join(' ')
}

export default function CycleCalendar({ cycle, today, onSelect }) {
  const base = new Date(today.slice(0, 7) + '-01T00:00:00')
  const [offset, setOffset] = useState(0)
  const shown = new Date(base.getFullYear(), base.getMonth() + offset, 1)
  const title = shown.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const weeks = monthGrid(shown.getFullYear(), shown.getMonth())
  return (
    <section className="card">
      <div className="cal-head">
        <button className="icon-btn" aria-label="Mois précédent" onClick={() => setOffset(offset - 1)}>‹</button>
        <h3>{title}</h3>
        <button className="icon-btn" aria-label="Mois suivant" onClick={() => setOffset(offset + 1)}>›</button>
      </div>
      <div className="cal-grid" role="grid" aria-label={title}>
        {HEADS.map((h, i) => <b key={i} className="cal-h">{h}</b>)}
        {weeks.flat().map((key, i) => key
          ? <button key={key} className={dayClass(cycle, key, today)} aria-label={parseLabel(key)} onClick={() => onSelect(key)}>{Number(key.slice(8))}</button>
          : <span key={`e${i}`} />)}
      </div>
      <p className="legend">
        <span className="dot period" /> Règles <span className="dot period-pred" /> Prévues <span className="dot fertile" /> Fertile <span className="dot ovulation" /> Ovulation
      </p>
    </section>
  )
}

function parseLabel(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

