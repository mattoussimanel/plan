export const TABS = [['today', '🌸', 'Aujourd’hui'], ['tasks', '🎀', 'Tâches'], ['cycle', '🌙', 'Cycle'], ['me', '💕', 'Moi']]

export default function TabBar({ tab, onChange }) {
  return (
    <nav className="tabs" aria-label="Navigation">
      {TABS.map(([k, e, l]) => (
        <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => onChange(k)}>
          <span aria-hidden="true">{e}</span>{l}
        </button>
      ))}
    </nav>
  )
}
