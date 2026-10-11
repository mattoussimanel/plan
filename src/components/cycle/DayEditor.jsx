import { FLOWS, PHASES, SYMPTOMS, phaseOn } from '../../lib/cycle.js'
import { parseKey } from '../../lib/dates.js'

export default function DayEditor({ cycle, dayKey, today, dispatch, onClose }) {
  const log = cycle.days[dayKey] || {}
  const p = phaseOn(cycle, dayKey)
  const set = (patch) => dispatch({ type: 'setCycleDay', key: dayKey, patch })
  const symptoms = log.symptoms || []
  const future = dayKey > today
  const label = parseKey(dayKey).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={`Journée du ${label}`} onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2 style={{ textTransform: 'capitalize' }}>{label}</h2>
        {p && <p className="phase-chip">{PHASES[p.phase]}{p.predicted ? ' (estimée)' : ''} · jour {p.cycleDay}</p>}
        {!future && (
          <div className="actions left">
            <button className="btn" onClick={() => dispatch({ type: 'startPeriod', date: dayKey })}>🌙 Règles commencées</button>
            <button className="btn ghost" onClick={() => dispatch({ type: 'endPeriod', date: dayKey })}>✨ Règles terminées</button>
          </div>
        )}
        <h3 className="mt">Flux</h3>
        <div className="chips" role="group" aria-label="Flux">
          {FLOWS.map(([id, name, icon]) => (
            <button key={id} type="button" aria-pressed={log.flow === id} className={log.flow === id ? 'sel' : ''}
              onClick={() => set({ flow: log.flow === id ? undefined : id })}>{icon} {name}</button>
          ))}
        </div>
        <h3 className="mt">Symptômes</h3>
        <div className="chips" role="group" aria-label="Symptômes">
          {SYMPTOMS.map(([id, name, icon]) => (
            <button key={id} type="button" aria-pressed={symptoms.includes(id)} className={symptoms.includes(id) ? 'sel' : ''}
              onClick={() => set({ symptoms: symptoms.includes(id) ? symptoms.filter((x) => x !== id) : [...symptoms, id] })}>{icon} {name}</button>
          ))}
        </div>
        <label>Note
          <input value={log.note || ''} onChange={(e) => set({ note: e.target.value })} placeholder="Comment je me sens…" maxLength={200} />
        </label>
        <div className="actions"><button className="btn" onClick={onClose}>Fermer</button></div>
      </div>
    </div>
  )
}
