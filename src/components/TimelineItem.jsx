import { memo } from 'react'
import { greeting, motivationOfDay, quoteOfDay } from '../lib/messages.js'
import { repeatLabel } from '../lib/tasks.js'

function Special({ kind, name, now }) {
  if (kind === 'welcome') return <p className="msg">{greeting(name, now)} Je te souhaite une magnifique journée, remplie de douceur et de petites victoires.</p>
  if (kind === 'motivation') return <p className="msg">{motivationOfDay(now)}</p>
  if (kind === 'quote') {
    const [q, a] = quoteOfDay(now)
    return <p className="msg quote">« {q} »<span>— {a}</span></p>
  }
  return null
}

function TimelineItem({ task, index, done, late, next, name, now, onToggle, onEdit }) {
  const cls = ['tl-item', done && 'done', !done && late && 'late', next && 'next'].filter(Boolean).join(' ')
  return (
    <li className={cls} style={{ '--i': index }}>
      <div className="tl-time">{task.time}</div>
      <div className="tl-dot"><span>{done ? '✓' : task.emoji}</span></div>
      <div className="card tl-card" onClick={() => onEdit(task)}>
        <div className="tl-head">
          <div>
            <h3>{task.title}</h3>
            <small>{repeatLabel(task)}{task.notify ? ' · 🔔' : ''}</small>
          </div>
          <button
            className={`check ${done ? 'on' : ''}`} aria-pressed={done}
            aria-label={`${done ? 'Marquer non fait' : 'Marquer fait'} : ${task.title}`}
            onClick={(e) => { e.stopPropagation(); onToggle(task.id, e.currentTarget) }}
          >{done ? '✓' : ''}</button>
        </div>
        <Special kind={task.kind} name={name} now={now} />
      </div>
    </li>
  )
}
export default memo(TimelineItem)
