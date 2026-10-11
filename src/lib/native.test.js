import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Share } from '@capacitor/share'
import { exactAlarmStatus, isNative, nativePermission, onBackButton, onResume, requestExactAlarm, requestNativePermission, shareText, syncNative, testNative } from './native.js'
import { task } from '../test/helpers.js'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: vi.fn(() => false) } }))
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: vi.fn(), requestPermissions: vi.fn(), checkExactNotificationSetting: vi.fn(), changeExactNotificationSetting: vi.fn(),
    getPending: vi.fn(), cancel: vi.fn(), schedule: vi.fn(), createChannel: vi.fn(),
  },
}))
vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(), exitApp: vi.fn() } }))
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }))

const NOW = new Date(2026, 9, 11, 8, 30)

describe('native', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    LocalNotifications.getPending.mockResolvedValue({ notifications: [] })
  })

  it('isNative suit Capacitor', () => {
    expect(isNative()).toBe(false)
    Capacitor.isNativePlatform.mockReturnValueOnce(true)
    expect(isNative()).toBe(true)
  })
  it.each([['granted', 'granted'], ['denied', 'denied'], ['prompt', 'default'], ['prompt-with-rationale', 'default']])('permission %s → %s', async (display, expected) => {
    LocalNotifications.checkPermissions.mockResolvedValue({ display })
    LocalNotifications.requestPermissions.mockResolvedValue({ display })
    expect(await nativePermission()).toBe(expected)
    expect(await requestNativePermission()).toBe(expected)
  })
  it('permission : erreur du plugin → unsupported', async () => {
    LocalNotifications.checkPermissions.mockRejectedValue(new Error('x'))
    LocalNotifications.requestPermissions.mockRejectedValue(new Error('x'))
    expect(await nativePermission()).toBe('unsupported')
    expect(await requestNativePermission()).toBe('unsupported')
  })
  it('alarmes exactes', async () => {
    LocalNotifications.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'denied' })
    LocalNotifications.changeExactNotificationSetting.mockResolvedValue({ exact_alarm: 'granted' })
    expect(await exactAlarmStatus()).toBe('denied')
    expect(await requestExactAlarm()).toBe('granted')
    LocalNotifications.checkExactNotificationSetting.mockRejectedValue(new Error('x'))
    LocalNotifications.changeExactNotificationSetting.mockRejectedValue(new Error('x'))
    expect(await exactAlarmStatus()).toBe('granted')
    expect(await requestExactAlarm()).toBe('granted')
  })

  it('syncNative annule l’existant, crée le canal puis programme', async () => {
    LocalNotifications.getPending.mockResolvedValue({ notifications: [{ id: 1, title: 'old' }, { id: 2 }] })
    const n = await syncNative([task({ id: 'a' })], NOW)
    expect(n).toBe(1)
    expect(LocalNotifications.cancel).toHaveBeenCalledWith({ notifications: [{ id: 1 }, { id: 2 }] })
    expect(LocalNotifications.createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: 'rappels', importance: 5, vibration: true }))
    expect(LocalNotifications.schedule).toHaveBeenCalledWith({ notifications: [expect.objectContaining({ channelId: 'rappels', schedule: expect.objectContaining({ on: { hour: 9, minute: 0 } }) })] })
  })
  it('syncNative sans rien à programmer : n’appelle pas schedule ni cancel', async () => {
    expect(await syncNative([], NOW)).toBe(0)
    expect(LocalNotifications.cancel).not.toHaveBeenCalled()
    expect(LocalNotifications.schedule).not.toHaveBeenCalled()
  })
  it('syncNative sérialise les appels concurrents et survit à une erreur', async () => {
    const order = []
    LocalNotifications.schedule.mockImplementationOnce(async () => { order.push('1-start'); await new Promise((r) => setTimeout(r, 20)); order.push('1-end'); throw new Error('boom') })
    LocalNotifications.schedule.mockImplementationOnce(async () => { order.push('2') })
    const p1 = syncNative([task()], NOW)
    const p2 = syncNative([task()], NOW)
    await expect(p1).rejects.toThrow('boom')
    await p2
    expect(order).toEqual(['1-start', '1-end', '2'])
  })
  it('testNative programme une notification dans 5 secondes', async () => {
    const before = Date.now()
    await testNative()
    const [{ notifications: [n] }] = LocalNotifications.schedule.mock.calls[0]
    expect(n.schedule.at.getTime() - before).toBeGreaterThanOrEqual(4900)
  })

  it('bouton retour : quitte seulement si non géré, et se désabonne', async () => {
    const remove = vi.fn()
    let cb
    App.addListener.mockImplementation((_, f) => { cb = f; return Promise.resolve({ remove }) })
    const handler = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false)
    const off = onBackButton(handler)
    cb(); expect(App.exitApp).not.toHaveBeenCalled()
    cb(); expect(App.exitApp).toHaveBeenCalledTimes(1)
    off(); await Promise.resolve()
    expect(remove).toHaveBeenCalled()
  })
  it('onResume : seulement au retour au premier plan', async () => {
    const remove = vi.fn()
    let cb
    App.addListener.mockImplementation((_, f) => { cb = f; return Promise.resolve({ remove }) })
    const fn = vi.fn()
    const off = onResume(fn)
    cb({ isActive: false }); expect(fn).not.toHaveBeenCalled()
    cb({ isActive: true }); expect(fn).toHaveBeenCalledTimes(1)
    off(); await Promise.resolve()
    expect(remove).toHaveBeenCalled()
  })
  it('shareText', async () => {
    await shareText('Titre', 'contenu')
    expect(Share.share).toHaveBeenCalledWith({ title: 'Titre', text: 'contenu', dialogTitle: 'Titre' })
  })
})
