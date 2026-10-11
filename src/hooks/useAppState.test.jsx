import { renderHook, act } from '@testing-library/react'
import { useAppState } from './useAppState.js'
import { STATE_KEY } from '../lib/storage.js'
import { task } from '../test/helpers.js'

describe('useAppState', () => {
  it('démarre avec les tâches par défaut', () => {
    const { result } = renderHook(() => useAppState())
    expect(result.current[0].tasks.length).toBeGreaterThanOrEqual(7)
  })
  it('persiste chaque changement dans localStorage', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current[1]({ type: 'setName', name: 'Lina' }))
    expect(JSON.parse(localStorage.getItem(STATE_KEY)).name).toBe('Lina')
  })
  it('recharge l’état sauvegardé', () => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ name: 'Sara', tasks: [task()] }))
    const { result } = renderHook(() => useAppState())
    expect(result.current[0]).toMatchObject({ name: 'Sara' })
    expect(result.current[0].tasks).toHaveLength(1)
  })
  it('applique le thème sur <html> et expose une ref à jour', () => {
    const { result } = renderHook(() => useAppState())
    act(() => result.current[1]({ type: 'setTheme', theme: 'lilas' }))
    expect(document.documentElement.dataset.theme).toBe('lilas')
    expect(result.current[2].current.theme).toBe('lilas')
  })
})
