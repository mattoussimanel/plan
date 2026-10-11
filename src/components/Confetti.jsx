import { useMemo } from 'react'

const GLYPHS = ['💖', '🌸', '✨', '🎀', '💗']

export default function Confetti({ burst }) {
  const parts = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    x: (Math.random() - 0.5) * 320, y: -80 - Math.random() * 260, r: Math.random() * 720 - 360,
    delay: Math.random() * 0.15, glyph: GLYPHS[i % GLYPHS.length],
  })), [burst?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!burst) return null
  return (
    <div className="confetti" aria-hidden="true">
      {parts.map((p, i) => (
        <span key={i} style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--r': `${p.r}deg`, animationDelay: `${p.delay}s`, left: burst.x, top: burst.y }}>{p.glyph}</span>
      ))}
    </div>
  )
}
