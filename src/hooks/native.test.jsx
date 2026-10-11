import { renderHook, act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useNativeSync, useBackButton } from './useNativeReminders.js'
import { useReminders } from './useReminders.js'
import SettingsView from '../components/SettingsView.jsx'
import * as native from '../lib/native.js'
import * as notif from '../lib/notifications.js'
import { makeState, task, SUNDAY } from '../test/helpers.js'

const asNative = (on = true) => vi.spyOn(native, 'isNative').mockReturnValue(on)

describe('useNativeSync', () => {
  it('programme au montage, à chaque changement de tâches et au retour au premier plan', () => {
    asNative()
    const sync = vi.spyOn(native, 'syncNative').mockResolvedValue(1)
    let resume
    vi.spyOn(native, 'onResume').mockImplementation((fn) => { resume = fn; return () => {} })
    const t1 = [task({ id: 'a' })]
    const { rerender } = renderHook(({ tasks }) => useNativeSync(tasks, true), { initialProps: { tasks: t1 } })
    expect(sync).toHaveBeenCalledTimes(1)
    rerender({ tasks: [...t1, task({ id: 'b' })] })
    expect(sync).toHaveBeenCalledTimes(2)
    resume()
    expect(sync).toHaveBeenCalledTimes(3)
  })
  it('ne fait rien sur le web ou sans autorisation', () => {
    const sync = vi.spyOn(native, 'syncNative').mockResolvedValue(1)
    asNative(false)
    renderHook(() => useNativeSync([task()], true))
    asNative(true)
    renderHook(() => useNativeSync([task()], false))
    expect(sync).not.toHaveBeenCalled()
  })
  it('une erreur de programmation n’est pas propagée', async () => {
    asNative()
    vi.spyOn(native, 'syncNative').mockRejectedValue(new Error('x'))
    vi.spyOn(native, 'onResume').mockReturnValue(() => {})
    expect(() => renderHook(() => useNativeSync([task()], true))).not.toThrow()
  })
})

describe('useBackButton', () => {
  it('s’abonne seulement sur Android et se désabonne', () => {
    const off = vi.fn()
    const sub = vi.spyOn(native, 'onBackButton').mockReturnValue(off)
    asNative(false)
    renderHook(() => useBackButton(() => true))
    expect(sub).not.toHaveBeenCalled()
    asNative(true)
    const { unmount } = renderHook(() => useBackButton(() => true))
    expect(sub).toHaveBeenCalledTimes(1)
    unmount()
    expect(off).toHaveBeenCalled()
  })
})

describe('useReminders sur Android', () => {
  const ref = { current: makeState({ tasks: [task({ time: '09:00' })] }) }
  it('lit la permission native, ne notifie pas côté web, et demande l’autorisation via le plugin', async () => {
    asNative()
    vi.spyOn(native, 'nativePermission').mockResolvedValue('default')
    vi.spyOn(native, 'requestNativePermission').mockResolvedValue('granted')
    const show = vi.spyOn(notif, 'showNotification').mockResolvedValue(true)
    const { result } = renderHook(() => useReminders(ref))
    await act(async () => {})
    expect(result.current.perm).toBe('default')
    act(() => result.current.check(new Date(2026, 9, 11, 9, 0)))
    expect(show).not.toHaveBeenCalled()
    expect(result.current.banner).toBeNull()
    await act(async () => { await result.current.enable() })
    expect(result.current.perm).toBe('granted')
    expect(show).not.toHaveBeenCalled()
  })
})

describe('SettingsView sur Android', () => {
  const setup = (perm, exact = 'granted') => {
    asNative()
    vi.spyOn(native, 'exactAlarmStatus').mockResolvedValue(exact)
    const props = { state: makeState({ name: 'Lina' }), dispatch: vi.fn(), now: SUNDAY, perm, onEnableNotifs: vi.fn() }
    render(<SettingsView {...props} />)
    return { user: userEvent.setup(), ...props }
  }
  it('affiche l’état « activées » et propose un test programmé dans 5 secondes', async () => {
    const test = vi.spyOn(native, 'testNative').mockResolvedValue()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { user } = setup('granted')
    expect(await screen.findByText(/même appli fermée/)).toBeInTheDocument()
    expect(screen.queryByText(/Exporter vers mon agenda/)).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Tester' }))
    expect(test).toHaveBeenCalled()
  })
  it('permission refusée / à demander', async () => {
    const { user, onEnableNotifs } = setup('default')
    await user.click(await screen.findByRole('button', { name: 'Autoriser' }))
    expect(onEnableNotifs).toHaveBeenCalled()
  })
  it('permission bloquée', async () => {
    setup('denied')
    expect(await screen.findByText(/Notifications bloquées/)).toBeInTheDocument()
  })
  it('alarmes exactes refusées : bouton pour les autoriser', async () => {
    const req = vi.spyOn(native, 'requestExactAlarm').mockResolvedValue('granted')
    const { user } = setup('granted', 'denied')
    await user.click(await screen.findByRole('button', { name: 'Alarmes exactes' }))
    expect(req).toHaveBeenCalled()
    expect(await screen.findByText(/même appli fermée/)).toBeInTheDocument()
  })
  it('exporter la sauvegarde ouvre le partage Android', async () => {
    const share = vi.spyOn(native, 'shareText').mockResolvedValue()
    const { user } = setup('granted')
    await user.click(screen.getByRole('button', { name: 'Exporter' }))
    expect(share).toHaveBeenCalledWith('Sauvegarde Ma Journée', expect.stringContaining('"name":"Lina"'))
  })
})
