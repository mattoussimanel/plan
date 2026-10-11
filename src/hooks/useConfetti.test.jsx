import { renderHook, act } from '@testing-library/react'
import { useConfetti } from './useConfetti.js'

describe('useConfetti', () => {
  beforeEach(() => vi.useFakeTimers())

  it('démarre depuis la position de l’élément puis s’éteint', () => {
    const { result } = renderHook(() => useConfetti(1000))
    expect(result.current[0]).toBeNull()
    act(() => result.current[1]({ getBoundingClientRect: () => ({ left: 10, top: 20, width: 40, height: 20 }) }))
    expect(result.current[0]).toMatchObject({ x: 30, y: 30 })
    act(() => { vi.advanceTimersByTime(1001) })
    expect(result.current[0]).toBeNull()
  })
  it('sans élément : centre de l’écran', () => {
    const { result } = renderHook(() => useConfetti())
    act(() => result.current[1](undefined))
    expect(result.current[0]).toMatchObject({ x: '50%', y: '50%' })
  })
  it('un second tir relance le délai', () => {
    const { result } = renderHook(() => useConfetti(1000))
    act(() => result.current[1]())
    act(() => { vi.advanceTimersByTime(800) })
    act(() => result.current[1]())
    act(() => { vi.advanceTimersByTime(800) })
    expect(result.current[0]).not.toBeNull()
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current[0]).toBeNull()
  })
})
