import { useEffect, useState } from 'react'

/** Date courante, rafraîchie quand la minute change (évite des rendus inutiles) ; `onTick` est appelé à chaque vérification. */
export function useNow(onTick, intervalMs = 15000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setNow((prev) => (prev.getMinutes() === d.getMinutes() && prev.getHours() === d.getHours() && prev.getDate() === d.getDate() ? prev : d))
      onTick?.(d)
    }
    tick()
    const id = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [onTick, intervalMs])
  return now
}
