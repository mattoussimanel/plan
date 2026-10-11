import { minutesNow, minutesOf } from '../lib/dates.js'
import { nextTask } from '../lib/progress.js'
import TimelineItem from './TimelineItem.jsx'

export default function Timeline({ list, doneIds, name, now, onToggle, onEdit }) {
  if (!list.length) return <p className="empty">Rien de prévu aujourd’hui 🌷<br />Ajoute une tâche avec le bouton ＋.</p>
  const nowMin = minutesNow(now)
  const next = nextTask(list, doneIds, nowMin)
  return (
    <ol className="timeline" aria-label="Timeline de ma journée">
      {list.map((t, i) => (
        <TimelineItem key={t.id} task={t} index={i} done={doneIds.includes(t.id)} late={minutesOf(t.time) < nowMin}
          next={t.id === next?.id} name={name} now={now} onToggle={onToggle} onEdit={onEdit} />
      ))}
    </ol>
  )
}
