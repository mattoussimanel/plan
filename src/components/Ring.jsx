const R = 46
const C = 2 * Math.PI * R

export default function Ring({ pct }) {
  return (
    <div className="ring" role="img" aria-label={`${pct}% accompli`}>
      <svg viewBox="0 0 110 110" aria-hidden="true">
        <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff9ec9" /><stop offset="1" stopColor="#ff4f9a" /></linearGradient></defs>
        <circle cx="55" cy="55" r={R} className="ring-bg" />
        <circle cx="55" cy="55" r={R} className="ring-fg" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
      </svg>
      <b>{pct}%</b>
    </div>
  )
}
