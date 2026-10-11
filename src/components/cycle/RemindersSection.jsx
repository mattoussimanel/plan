import { useState } from 'react'
import { EVENTS, upcomingReminders } from '../../lib/cycle.js'
import { isNative } from '../../lib/native.js'
import ReminderEditor, { beforeLabel } from './ReminderEditor.jsx'

const when = (d) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) + ' à ' +
  d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false })

export default function RemindersSection({ cycle, now, dispatch }) {
  const [editing, setEditing] = useState(null)
  const next = upcomingReminders(cycle, now).slice(0, 4)
  const add = () => setEditing({ reminder: { id: `r${Date.now()}`, event: 'period', daysBefore: 2, time: '09:00', enabled: true }, isNew: true })
  return (
    <section className="card">
      <h3>🔔 Mes rappels</h3>
      <p className="hint">Choisis un évènement, le nombre de jours avant et l’heure : je te préviens à l’heure exacte.</p>
      <div className="task-list">
        {cycle.reminders.map((r) => (
          <button key={r.id} className="card row" onClick={() => setEditing({ reminder: r, isNew: false })}>
            <span className="em" aria-hidden="true">{EVENTS[r.event].emoji}</span>
            <div><b>{EVENTS[r.event].label}</b><small>{beforeLabel(r.daysBefore)} · {r.time}</small></div>
            <span aria-label={r.enabled ? 'Activé' : 'Désactivé'}>{r.enabled ? '🔔' : '🔕'}</span>
          </button>
        ))}
        {!cycle.reminders.length && <p className="empty">Aucun rappel pour le moment 🌷</p>}
      </div>
      <div className="actions left"><button className="btn" onClick={add}>＋ Ajouter un rappel</button></div>
      {next.length > 0 && (
        <>
          <h3 className="mt">Prochains rappels</h3>
          <ul className="diag">{next.map((n) => <li key={`${n.id}-${n.atKey}`}>{n.title.split(' ')[0]} <b>{when(n.at)}</b><br /><small>{n.body}</small></li>)}</ul>
        </>
      )}
      {!cycle.periods.length && <p className="hint">Les rappels démarrent dès que tu as saisi tes dernières règles.</p>}
      {!isNative() && <p className="hint">Les notifications du cycle sont envoyées par l’application Android installée.</p>}
      {editing && (
        <ReminderEditor reminder={editing.reminder} isNew={editing.isNew} onClose={() => setEditing(null)}
          onSave={(reminder) => { dispatch({ type: 'saveReminder', reminder }); setEditing(null) }}
          onDelete={(id) => { dispatch({ type: 'deleteReminder', id }); setEditing(null) }} />
      )}
    </section>
  )
}
