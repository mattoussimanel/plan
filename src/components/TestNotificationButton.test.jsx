import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TestNotificationButton from './TestNotificationButton.jsx'
import * as native from '../lib/native.js'

const setup = (props = {}) => {
  vi.spyOn(native, 'isNative').mockReturnValue(true)
  render(<TestNotificationButton {...props} />)
  return userEvent.setup()
}
const click = (user) => user.click(screen.getByRole('button', { name: /Tester les notifications/ }))

describe('TestNotificationButton', () => {
  it('invisible sur le web', () => {
    vi.spyOn(native, 'isNative').mockReturnValue(false)
    const { container } = render(<TestNotificationButton />)
    expect(container).toBeEmptyDOMElement()
  })
  it('autorisation déjà accordée : envoie directement la notification de test', async () => {
    vi.spyOn(native, 'nativePermission').mockResolvedValue('granted')
    const ask = vi.spyOn(native, 'requestNativePermission')
    const test = vi.spyOn(native, 'testNow').mockResolvedValue()
    const onPermission = vi.fn()
    const user = setup({ onPermission })
    await click(user)
    expect(await screen.findByText(/Notification de test envoyée/)).toBeInTheDocument()
    expect(ask).not.toHaveBeenCalled()
    expect(test).toHaveBeenCalled()
    expect(onPermission).toHaveBeenCalledWith('granted')
  })
  it('demande l’autorisation si besoin, puis envoie le test', async () => {
    vi.spyOn(native, 'nativePermission').mockResolvedValue('default')
    vi.spyOn(native, 'requestNativePermission').mockResolvedValue('granted')
    const test = vi.spyOn(native, 'testNow').mockResolvedValue()
    const user = setup()
    await click(user)
    expect(await screen.findByText(/Notification de test envoyée/)).toBeInTheDocument()
    expect(test).toHaveBeenCalled()
  })
  it('autorisation refusée : explique où l’activer et n’envoie rien', async () => {
    vi.spyOn(native, 'nativePermission').mockResolvedValue('denied')
    vi.spyOn(native, 'requestNativePermission').mockResolvedValue('denied')
    const test = vi.spyOn(native, 'testNow').mockResolvedValue()
    const onPermission = vi.fn()
    const user = setup({ onPermission })
    await click(user)
    expect(await screen.findByText(/non autorisées/)).toBeInTheDocument()
    expect(test).not.toHaveBeenCalled()
    expect(onPermission).toHaveBeenCalledWith('denied')
  })
  it('affiche l’erreur du plugin', async () => {
    vi.spyOn(native, 'nativePermission').mockResolvedValue('granted')
    vi.spyOn(native, 'testNow').mockRejectedValue(new Error('canal absent'))
    const user = setup()
    await click(user)
    expect(await screen.findByText(/Erreur : canal absent/)).toBeInTheDocument()
  })
})
