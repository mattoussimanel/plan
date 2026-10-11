import { askPermission, notifPermission, notifSupported, showNotification } from './notifications.js'

const stubNotification = (permission, extra = {}) => {
  const ctor = vi.fn()
  ctor.permission = permission
  Object.assign(ctor, extra)
  vi.stubGlobal('Notification', ctor)
  return ctor
}

describe('notifications', () => {
  it('détecte l’absence de support', () => {
    vi.stubGlobal('Notification', undefined)
    expect(notifSupported()).toBe(false)
    expect(notifPermission()).toBe('unsupported')
  })
  it('askPermission', async () => {
    vi.stubGlobal('Notification', undefined)
    expect(await askPermission()).toBe('unsupported')
    stubNotification('default', { requestPermission: vi.fn().mockResolvedValue('granted') })
    expect(await askPermission()).toBe('granted')
  })
  it('n’affiche rien sans permission', async () => {
    stubNotification('denied')
    expect(await showNotification('t', 'b', 'tag')).toBe(false)
  })
  it('passe par le service worker quand il est disponible', async () => {
    stubNotification('granted')
    const show = vi.fn().mockResolvedValue()
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve({ showNotification: show }) } })
    expect(await showNotification('Titre', 'Corps', 'tag')).toBe(true)
    expect(show).toHaveBeenCalledWith('Titre', expect.objectContaining({ body: 'Corps', tag: 'tag', renotify: true }))
  })
  it('retombe sur new Notification sans service worker', async () => {
    const ctor = stubNotification('granted')
    vi.stubGlobal('navigator', {})
    expect(await showNotification('Titre', 'Corps', 'tag')).toBe(true)
    expect(ctor).toHaveBeenCalledWith('Titre', expect.objectContaining({ body: 'Corps' }))
  })
  it('renvoie false si l’affichage échoue', async () => {
    stubNotification('granted')
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.reject(new Error('x')) } })
    expect(await showNotification('t', 'b', 'tag')).toBe(false)
  })
})
