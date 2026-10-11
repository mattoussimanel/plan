import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TimeSelect from './TimeSelect.jsx'

describe('TimeSelect (24 h)', () => {
  it('propose 24 heures (00–23) et 60 minutes, sans AM/PM', () => {
    render(<TimeSelect value="07:05" onChange={() => {}} />)
    const hours = screen.getByLabelText('Heures')
    expect(hours.options).toHaveLength(24)
    expect(hours.options[0].value).toBe('00')
    expect(hours.options[23].value).toBe('23')
    expect(screen.getByLabelText('Minutes').options).toHaveLength(60)
    expect(screen.queryByText(/AM|PM/)).toBeNull()
    expect(hours).toHaveValue('07')
    expect(screen.getByLabelText('Minutes')).toHaveValue('05')
  })
  it('change heures et minutes indépendamment', async () => {
    const onChange = vi.fn()
    render(<TimeSelect value="07:05" onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Heures'), '21')
    expect(onChange).toHaveBeenLastCalledWith('21:05')
    await userEvent.selectOptions(screen.getByLabelText('Minutes'), '59')
    expect(onChange).toHaveBeenLastCalledWith('07:59')
  })
  it('valeur invalide : repli sur 09:00', () => {
    render(<TimeSelect value="" onChange={() => {}} />)
    expect(screen.getByLabelText('Heures')).toHaveValue('09')
    expect(screen.getByLabelText('Minutes')).toHaveValue('00')
  })
})
