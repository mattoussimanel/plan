import { useCallback, useEffect, useRef, useState } from 'react'

/** Déclenche une pluie de cœurs depuis un élément (ex. la case cochée) */
export function useConfetti(duration = 1800) {
  const [burst, setBurst] = useState(null)
  const timer = useRef()
  useEffect(() => () => clearTimeout(timer.current), [])
  const fire = useCallback((el) => {
    const r = el?.getBoundingClientRect?.()
    setBurst({ id: Date.now(), x: r ? r.left + r.width / 2 : '50%', y: r ? r.top + r.height / 2 : '50%' })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setBurst(null), duration)
  }, [duration])
  return [burst, fire]
}
