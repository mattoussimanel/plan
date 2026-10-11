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
  it('expose le nombre de rappels programmés', async () => {
    asNative()
    vi.spyOn(native, 'syncNative').mockResolvedValue(12)
    vi.spyOn(native, 'onResume').mockReturnValue(() => {})
    const tasks = [task()]
    const { result } = renderHook(() => useNativeSync(tasks, true))
    await act(async () => {})
    expect(result.current).toEqual({ count: 12, error: '' })
  })
  it('expose l’erreur de programmation au lieu de l’avaler', async () => {
    asNative()
    vi.spyOn(native, 'syncNative').mockRejectedValue(new Error('exact alarm refused'))
    vi.spyOn(native, 'onResume').mockReturnValue(() => {})
    const tasks = [task()]
    const { result } = renderHook(() => useNativeSync(tasks, true))
    await act(async () => {})
    expect(result.current).toEqual({ count: null, error: 'exact alarm refused' })
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
  const setup = (perm, exact = 'granted', nativeStatus = { count: 7, error: '' }) => {
    asNative()
    vi.spyOn(native, 'exactAlarmStatus').mockResolvedValue(exact)
    const props = { state: makeState({ name: 'Lina' }), dispatch: vi.fn(), now: SUNDAY, perm, onEnableNotifs: vi.fn(), nativeStatus }
    render(<SettingsView {...props} />)
    return { user: userEvent.setup(), ...props }
  }
  it('affiche le diagnostic : autorisation, alarmes exactes, rappels programmés', async () => {
    setup('granted')
    expect(await screen.findByText(/Autorisation des notifications : accordée/)).toBeInTheDocument()
    expect(screen.getByText(/Alarmes exactes : autorisées/)).toBeInTheDocument()
    expect(screen.getByText(/Rappels programmés : 7/)).toBeInTheDocument()
    expect(screen.queryByText(/Exporter vers mon agenda/)).toBeNull()
  })
  it('affiche l’erreur de programmation', async () => {
    setup('granted', 'granted', { count: null, error: 'boom' })
    expect(await screen.findByText(/Rappels programmés : boom/)).toBeInTheDocument()
  })
  it('test immédiat et test dans 5 secondes', async () => {
    const now = vi.spyOn(native, 'testNow').mockResolvedValue()
    const later = vi.spyOn(native, 'testNative').mockResolvedValue()
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { user } = setup('granted')
    await user.click(await screen.findByRole('button', { name: 'Tester maintenant' }))
    expect(now).toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Tester dans 5 s' }))
    expect(later).toHaveBeenCalled()
    await vi.waitFor(() => expect(alert).toHaveBeenCalled())
  })
  it('une erreur de test est affichée', async () => {
    vi.spyOn(native, 'testNow').mockRejectedValue(new Error('canal absent'))
    const { user } = setup('granted')
    await user.click(await screen.findByRole('button', { name: 'Tester maintenant' }))
    expect(await screen.findByText(/canal absent/)).toBeInTheDocument()
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
    expect(await screen.findByText(/Alarmes exactes : autorisées/)).toBeInTheDocument()
  })
  it('exporter la sauvegarde ouvre le partage Android', async () => {
    const share = vi.spyOn(native, 'shareText').mockResolvedValue()
    const { user } = setup('granted')
    await user.click(screen.getByRole('button', { name: 'Exporter' }))
    expect(share).toHaveBeenCalledWith('Sauvegarde Ma Journée', expect.stringContaining('"name":"Lina"'))
  })
})
