import { renderHook, act } from '@testing-library/react'
import { useReminders } from './useReminders.js'
import * as notif from '../lib/notifications.js'
import { makeState, task } from '../test/helpers.js'

const ref = (tasks) => ({ current: makeState({ tasks }) })
const at = (h, m) => new Date(2026, 9, 11, h, m)

describe('useReminders', () => {
  beforeEach(() => {
    vi.spyOn(notif, 'showNotification').mockResolvedValue(true)
    vi.stubGlobal('Notification', Object.assign(vi.fn(), { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') }))
  })

  it('notifie et affiche la bannière quand une tâche est due', () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { vibrate })
    const { result } = renderHook(() => useReminders(ref([task({ id: 'a', title: 'Manger', time: '09:00' })])))
    act(() => result.current.check(at(9, 0)))
    expect(notif.showNotification).toHaveBeenCalledWith('🌸 Manger', expect.any(String), 'task-a')
    expect(result.current.banner.id).toBe('a')
    expect(vibrate).toHaveBeenCalled()
  })
  it('ne fait rien si rien n’est dû', () => {
    const { result } = renderHook(() => useReminders(ref([task({ time: '09:00' })])))
    act(() => result.current.check(at(8, 0)))
    expect(notif.showNotification).not.toHaveBeenCalled()
    expect(result.current.banner).toBeNull()
  })
  it('la bannière disparaît seule après 15 s ou à la fermeture', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useReminders(ref([task({ time: '09:00' })])))
    act(() => result.current.check(at(9, 0)))
    expect(result.current.banner).not.toBeNull()
    act(() => { vi.advanceTimersByTime(15001) })
    expect(result.current.banner).toBeNull()
    localStorage.clear()
    act(() => result.current.check(at(9, 0)))
    act(() => result.current.dismiss())
    expect(result.current.banner).toBeNull()
  })
  it('enable demande la permission puis confirme', async () => {
    const { result } = renderHook(() => useReminders(ref([])))
    expect(result.current.perm).toBe('default')
    await act(async () => { await result.current.enable() })
    expect(result.current.perm).toBe('granted')
    expect(notif.showNotification).toHaveBeenCalledWith(expect.stringContaining('activées'), expect.any(String), 'welcome')
  })
  it('enable refusé : pas de notification de confirmation', async () => {
    Notification.requestPermission.mockResolvedValue('denied')
    const { result } = renderHook(() => useReminders(ref([])))
    await act(async () => { await result.current.enable() })
    expect(result.current.perm).toBe('denied')
    expect(notif.showNotification).not.toHaveBeenCalled()
  })
})
