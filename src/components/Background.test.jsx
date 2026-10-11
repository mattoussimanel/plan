import { render } from '@testing-library/react'
import Background from './Background.jsx'

describe('Background', () => {
  it('rend le nombre demandé d’éléments flottants, masqués aux lecteurs d’écran', () => {
    const { container } = render(<Background count={5} />)
    expect(container.querySelectorAll('.float')).toHaveLength(5)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
