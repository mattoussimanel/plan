import { bodyFor } from '../lib/messages.js'

export default function Banner({ task, onClose }) {
  if (!task) return null
  return (
    <div className="banner" role="alert" onClick={onClose}>
      <span className="bell" aria-hidden="true">🔔</span>
      <div><b>{task.emoji} {task.title}</b><br /><small>{bodyFor(task)}</small></div>
    </div>
  )
}
