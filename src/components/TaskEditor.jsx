import { useState } from 'react'
import { DAYS, EMOJIS, WEEK_ORDER } from '../data/content.js'
import { isValidTask } from '../lib/tasks.js'
import TimeSelect from './TimeSelect.jsx'

const REPEAT_LABELS = [['once', 'Une fois'], ['daily', 'Chaque jour'], ['weekly', 'Certains jours']]

export default function TaskEditor({ task, onSave, onDelete, onClose }) {
  const [t, setT] = useState(task)
  const set = (patch) => setT((x) => ({ ...x, ...patch }))
  const toggleDay = (d) => set({ days: t.days.includes(d) ? t.days.filter((x) => x !== d) : [...t.days, d] })
  const valid = isValidTask({ ...t, title: t.title })

  return (
    <div className="overlay" onClick={onClose}>
      <form className="sheet" role="dialog" aria-label={task.isNew ? 'Nouvelle tâche' : 'Modifier la tâche'}
        onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ ...t, title: t.title.trim() }) }}>
        <div className="grab" />
        <h2>{task.isNew ? 'Nouvelle tâche ✨' : 'Modifier la tâche'}</h2>
        <label>Nom
          <input value={t.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex : Boire de l’eau" autoFocus={task.isNew} maxLength={60} />
        </label>
        <div className="emojis" role="group" aria-label="Icône">
          {EMOJIS.map((e) => <button type="button" key={e} aria-pressed={t.emoji === e} className={t.emoji === e ? 'sel' : ''} onClick={() => set({ emoji: e })}>{e}</button>)}
        </div>
        <div className="field">
          <span className="field-label">Heure exacte (24 h)</span>
          <TimeSelect value={t.time} onChange={(time) => set({ time })} />
        </div>
        <div className="seg" role="group" aria-label="Répétition">
          {REPEAT_LABELS.map(([v, l]) => <button type="button" key={v} aria-pressed={t.repeat === v} className={t.repeat === v ? 'sel' : ''} onClick={() => set({ repeat: v })}>{l}</button>)}
        </div>
        {t.repeat === 'once' && <label>Date<input type="date" value={t.date} onChange={(e) => set({ date: e.target.value })} /></label>}
        {t.repeat === 'weekly' && (
          <div className="days" role="group" aria-label="Jours">
            {WEEK_ORDER.map((d) => <button type="button" key={d} aria-pressed={t.days.includes(d)} className={t.days.includes(d) ? 'sel' : ''} onClick={() => toggleDay(d)}>{DAYS[d]}</button>)}
          </div>
        )}
        <label className="switch">
          <input type="checkbox" checked={t.notify} onChange={(e) => set({ notify: e.target.checked })} />
          <span className="slider" /> Me notifier à l’heure exacte 🔔
        </label>
        <div className="actions">
          {!task.isNew && <button type="button" className="btn danger" onClick={() => onDelete(t.id)}>Supprimer</button>}
          <button type="button" className="btn ghost" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn" disabled={!valid}>Enregistrer</button>
        </div>
      </form>
    </div>
  )
}
