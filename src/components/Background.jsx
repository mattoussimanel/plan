import { memo, useMemo } from 'react'

const GLYPHS = ['💗', '🌸', '✨', '🌷', '💖', '🎀']

function Background({ count = 18 }) {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100, size: 14 + Math.random() * 26, delay: -Math.random() * 20,
    dur: 12 + Math.random() * 14, glyph: GLYPHS[i % GLYPHS.length],
  })), [count])
  return (
    <div className="bg" aria-hidden="true">
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      {items.map((it, i) => (
        <span key={i} className="float" style={{ left: `${it.left}%`, fontSize: it.size, animationDelay: `${it.delay}s`, animationDuration: `${it.dur}s` }}>{it.glyph}</span>
      ))}
    </div>
  )
}
export default memo(Background)
