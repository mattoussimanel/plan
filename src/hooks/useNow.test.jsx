import { renderHook, act } from '@testing-library/react'
import { useNow } from './useNow.js'

describe('useNow', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 11, 8, 30, 10)) })

  it('appelle onTick au montage puis à chaque intervalle', () => {
    const onTick = vi.fn()
    renderHook(() => useNow(onTick, 15000))
    expect(onTick).toHaveBeenCalledTimes(1)
    act(() => { vi.advanceTimersByTime(30000) })
    expect(onTick).toHaveBeenCalledTimes(3)
  })
  it('ne change l’objet Date que lorsque la minute change', () => {
    const { result } = renderHook(() => useNow(undefined, 15000))
    const first = result.current
    act(() => { vi.advanceTimersByTime(15000) }) // 08:30:25 → même minute
    expect(result.current).toBe(first)
    act(() => { vi.advanceTimersByTime(60000) }) // 08:31:25 → minute suivante
    expect(result.current).not.toBe(first)
    expect(result.current.getMinutes()).toBe(31)
  })
  it('revérifie au retour sur l’onglet', () => {
    const onTick = vi.fn()
    renderHook(() => useNow(onTick))
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(onTick).toHaveBeenCalledTimes(2)
  })
  it('nettoie timers et écouteurs au démontage', () => {
    const onTick = vi.fn()
    const { unmount } = renderHook(() => useNow(onTick))
    unmount()
    act(() => { vi.advanceTimersByTime(60000); document.dispatchEvent(new Event('visibilitychange')) })
    expect(onTick).toHaveBeenCalledTimes(1)
  })
})
