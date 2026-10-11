import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Share } from '@capacitor/share'
import { appVersion, exactAlarmStatus, isNative, nativePermission, onBackButton, onResume, requestExactAlarm, requestNativePermission, shareText, syncNative, testNative, testNow } from './native.js'
import { task } from '../test/helpers.js'
import { defaultCycle } from './cycle.js'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: vi.fn(() => false) } }))
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: vi.fn(), requestPermissions: vi.fn(), checkExactNotificationSetting: vi.fn(), changeExactNotificationSetting: vi.fn(),
    getPending: vi.fn(), cancel: vi.fn(), schedule: vi.fn(), createChannel: vi.fn(),
  },
}))
vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(), exitApp: vi.fn(), getInfo: vi.fn() } }))
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
    LocalNotifications.getPending
      .mockResolvedValueOnce({ notifications: [{ id: 1, title: 'old' }, { id: 2 }] })
      .mockResolvedValueOnce({ notifications: [{ id: 9 }] })
    const n = await syncNative([task({ id: 'a' })], NOW)
    expect(n).toEqual({ count: 1, inexact: false }) // nombre réellement en attente côté système
    expect(LocalNotifications.cancel).toHaveBeenCalledWith({ notifications: [{ id: 1 }, { id: 2 }] })
    expect(LocalNotifications.createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: 'rappels', importance: 5, vibration: true }))
    expect(LocalNotifications.schedule).toHaveBeenCalledWith({ notifications: [expect.objectContaining({ channelId: 'rappels', schedule: expect.objectContaining({ on: { hour: 9, minute: 0, second: 0 } }) })] })
  })
  it('syncNative programme aussi les rappels du cycle (X jours avant)', async () => {
    LocalNotifications.getPending.mockResolvedValue({ notifications: [] })
    const cycle = { ...defaultCycle(), periods: [{ start: '2026-10-01', end: null }] }
    await syncNative([], NOW, cycle)
    const [{ notifications }] = LocalNotifications.schedule.mock.calls[0]
    expect(notifications.length).toBeGreaterThan(0)
    expect(notifications.every((n) => n.extra.cycleReminder && n.schedule.at instanceof Date)).toBe(true)
    expect(notifications[0].title).toMatch(/Ovulation|Mes règles/)
  })
  it('syncNative sans rien à programmer : n’appelle pas schedule ni cancel', async () => {
    expect(await syncNative([], NOW)).toEqual({ count: 0, inexact: false })
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
  it('testNow affiche tout de suite (sans planification)', async () => {
    await testNow()
    const [{ notifications: [n] }] = LocalNotifications.schedule.mock.calls[0]
    expect(n.schedule).toBeUndefined()
    expect(n.channelId).toBe('rappels')
  })
  it('syncNative signale une programmation non exacte', async () => {
    LocalNotifications.getPending.mockResolvedValue({ notifications: [{ id: 1 }] })
    LocalNotifications.schedule.mockResolvedValueOnce({ warning: { code: 'OS-PLUG-LNOT-0001' } })
    expect(await syncNative([task()], NOW)).toEqual({ count: 1, inexact: true })
  })
  it('testNative programme une alarme dans 1 minute et signale l’inexactitude', async () => {
    const before = Date.now()
    LocalNotifications.schedule.mockResolvedValueOnce({ warning: {} })
    const { inexact, at } = await testNative()
    const [{ notifications: [n] }] = LocalNotifications.schedule.mock.calls[0]
    expect(n.schedule.at.getTime() - before).toBeGreaterThanOrEqual(59900)
    expect(at).toBe(n.schedule.at)
    expect(inexact).toBe(true)
    LocalNotifications.schedule.mockResolvedValueOnce({})
    expect((await testNative(1000)).inexact).toBe(false)
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
  it('appVersion', async () => {
    App.getInfo.mockResolvedValueOnce({ version: '1.0.5', build: '5' })
    expect(await appVersion()).toBe('1.0.5 (build 5)')
    App.getInfo.mockRejectedValueOnce(new Error('x'))
    expect(await appVersion()).toBe('?')
  })
  it('shareText', async () => {
    await shareText('Titre', 'contenu')
    expect(Share.share).toHaveBeenCalledWith({ title: 'Titre', text: 'contenu', dialogTitle: 'Titre' })
  })
})
