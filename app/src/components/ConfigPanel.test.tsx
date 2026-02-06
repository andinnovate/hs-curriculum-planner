import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigPanel } from './ConfigPanel'

describe('ConfigPanel', () => {
  it('toggles open and calls change handlers', () => {
    const onHours = vi.fn()
    const onMinCredits = vi.fn()

    render(
      <ConfigPanel
        hoursPerCredit={120}
        minCreditsForGraduation={25}
        onHoursPerCreditChange={onHours}
        onMinCreditsChange={onMinCredits}
      />
    )

    expect(screen.queryByLabelText('Hours per credit')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /show settings/i }))
    const hoursInput = screen.getByLabelText('Hours per credit') as HTMLInputElement
    const minCreditsInput = screen.getByLabelText('Minimum credits for graduation') as HTMLInputElement

    fireEvent.change(hoursInput, { target: { value: '130' } })
    fireEvent.change(minCreditsInput, { target: { value: '30' } })

    expect(onHours).toHaveBeenCalledWith(130)
    expect(onMinCredits).toHaveBeenCalledWith(30)

    fireEvent.click(screen.getByRole('button', { name: /hide settings/i }))
    expect(screen.queryByLabelText('Hours per credit')).toBeNull()
  })
})
