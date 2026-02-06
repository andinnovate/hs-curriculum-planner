import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TallyBar } from './TallyBar'
import type { UnitWithHours } from '../types'

const units: UnitWithHours[] = [
  { unit: 'Algebra', totalHours: 120 },
  { unit: 'Biology', totalHours: 100 },
  { unit: 'Chemistry', totalHours: 80 },
]

describe('TallyBar', () => {
  it('computes totals and shows remaining credits', () => {
    render(
      <TallyBar
        unitsWithHours={units}
        assignments={{ Algebra: 1, Biology: 2 }}
        hoursPerCredit={100}
        minCreditsForGraduation={5}
      />
    )

    expect(screen.getByText(/Year 1:/i)).toHaveTextContent('120.0 hrs (1.20 cr)')
    expect(screen.getByText(/Year 2:/i)).toHaveTextContent('100.0 hrs (1.00 cr)')
    expect(screen.getByText(/Total:/i)).toHaveTextContent('220.0 hrs (2.20 credits)')
    expect(screen.getByText(/need 2.80 more/i)).toBeTruthy()
  })

  it('invokes year breakdown callbacks', () => {
    const onShowYearDetails = vi.fn()
    render(
      <TallyBar
        unitsWithHours={units}
        assignments={{ Chemistry: 4 }}
        hoursPerCredit={80}
        minCreditsForGraduation={1}
        onShowYearDetails={onShowYearDetails}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /show year 4 breakdown/i }))
    expect(onShowYearDetails).toHaveBeenCalledWith(4)
  })
})
