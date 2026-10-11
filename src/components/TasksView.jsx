import { byTime, repeatLabel } from '../lib/tasks.js'

export default function TasksView({ tasks, onEdit }) {
  return (
    <section className="narrow">
      <h1>Mes tâches 🎀</h1>
      <p className="sub">Touche une tâche pour la modifier.</p>
      <div className="task-list">
        {[...tasks].sort(byTime).map((t) => (
          <button key={t.id} className="card row" onClick={() => onEdit(t)}>
            <span className="em" aria-hidden="true">{t.emoji}</span>
            <div><b>{t.title}</b><small>{t.time} · {repeatLabel(t)}</small></div>
            <span aria-label={t.notify ? 'Notification activée' : 'Notification désactivée'}>{t.notify ? '🔔' : '🔕'}</span>
          </button>
        ))}
        {!tasks.length && <p className="empty">Aucune tâche pour le moment 🌷</p>}
      </div>
    </section>
  )
}
