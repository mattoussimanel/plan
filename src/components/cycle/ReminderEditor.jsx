import { useState } from 'react'
import { EVENTS, LIMITS } from '../../lib/cycle.js'
import TimeSelect from '../TimeSelect.jsx'

const DAYS_BEFORE = Array.from({ length: LIMITS.daysBefore[1] + 1 }, (_, i) => i)
export const beforeLabel = (n) => (n === 0 ? 'Le jour même' : `${n} jour${n > 1 ? 's' : ''} avant`)

export default function ReminderEditor({ reminder, isNew, onSave, onDelete, onClose }) {
  const [r, setR] = useState(reminder)
  const set = (patch) => setR((x) => ({ ...x, ...patch }))
  return (
    <div className="overlay" onClick={onClose}>
      <form className="sheet" role="dialog" aria-label={isNew ? 'Nouveau rappel' : 'Modifier le rappel'}
        onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave(r) }}>
        <div className="grab" />
        <h2>{isNew ? 'Nouveau rappel ✨' : 'Modifier le rappel'}</h2>
        <label>Me prévenir pour
          <select value={r.event} onChange={(e) => set({ event: e.target.value })}>
            {Object.entries(EVENTS).map(([id, ev]) => <option key={id} value={id}>{ev.emoji} {ev.label}</option>)}
          </select>
        </label>
        <label>Combien de temps avant
          <select value={r.daysBefore} onChange={(e) => set({ daysBefore: Number(e.target.value) })}>
            {DAYS_BEFORE.map((n) => <option key={n} value={n}>{beforeLabel(n)}</option>)}
          </select>
        </label>
        <div className="field">
          <span className="field-label">À quelle heure (24 h)</span>
          <TimeSelect value={r.time} onChange={(time) => set({ time })} />
        </div>
        <label className="switch">
          <input type="checkbox" checked={r.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
          <span className="slider" /> Rappel activé 🔔
        </label>
        <div className="actions">
          {!isNew && <button type="button" className="btn danger" onClick={() => onDelete(r.id)}>Supprimer</button>}
          <button type="button" className="btn ghost" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn">Enregistrer</button>
        </div>
      </form>
    </div>
  )
}
