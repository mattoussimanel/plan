import { GLASSES, MOODS } from '../data/content.js'
import { greeting } from '../lib/messages.js'
import { streak } from '../lib/progress.js'
import Ring from './Ring.jsx'
import Timeline from './Timeline.jsx'
import TestNotificationButton from './TestNotificationButton.jsx'

export default function TodayView({ state, dispatch, now, today, list, prog, next, perm, onEnableNotifs, onPermission, onToggle, onEdit }) {
  const water = state.water[today] || 0
  const allDone = prog.total > 0 && prog.done === prog.total
  const dateLabel = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="grid">
      <aside className="side">
        <header className="hero card">
          <div>
            <p className="date">{dateLabel}</p>
            <h1>{greeting(state.name, now)}</h1>
            <p className="sub">
              {allDone ? 'Bravo, tout est fait ! 🎉'
                : next ? <>Prochaine : <b>{next.emoji} {next.title}</b> à {next.time}</> : 'Plus de tâche prévue pour le moment 🌙'}
            </p>
          </div>
          <Ring pct={prog.pct} />
        </header>
        <div className="mini">
          <div className="card stat"><span>🔥</span><b>{streak(state, now)}</b><small>jours de suite</small></div>
          <div className="card stat"><span>✅</span><b>{prog.done}/{prog.total}</b><small>aujourd’hui</small></div>
        </div>
        <section className="card extra">
          <h3>💧 Eau <small>{water}/{GLASSES} verres</small></h3>
          <div className="glasses">
            {Array.from({ length: GLASSES }, (_, i) => (
              <button key={i} className={i < water ? 'on' : ''} aria-label={`Verre ${i + 1}`} aria-pressed={i < water}
                onClick={() => dispatch({ type: 'setWater', key: today, count: water === i + 1 ? i : i + 1 })}>💧</button>
            ))}
          </div>
        </section>
        <section className="card extra">
          <h3>Mon humeur du jour</h3>
          <div className="moods">
            {MOODS.map((m) => <button key={m} className={state.mood[today] === m ? 'on' : ''} aria-pressed={state.mood[today] === m} aria-label={`Humeur ${m}`} onClick={() => dispatch({ type: 'setMood', key: today, mood: m })}>{m}</button>)}
          </div>
        </section>
      </aside>
      <section className="main-col">
        {perm !== 'granted' && perm !== 'unsupported' && (
          <button className="card notif-cta" onClick={onEnableNotifs}>🔔 Active les notifications pour être rappelée à chaque tâche</button>
        )}
        <TestNotificationButton className="card notif-cta" onPermission={onPermission} />
        <Timeline list={list} doneIds={state.done[today] || []} name={state.name} now={now} onToggle={onToggle} onEdit={onEdit} />
      </section>
    </div>
  )
}
