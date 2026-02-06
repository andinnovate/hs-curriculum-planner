import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { YearColumn } from './YearColumn'
import type { UnitWithHours } from '../types'

const units: UnitWithHours[] = [
  { unit: 'Algebra', totalHours: 120 },
  { unit: 'Biology', totalHours: 100 },
]

describe('YearColumn', () => {
  it('shows remove buttons when unlocked', () => {
    const onRemove = vi.fn()
    render(
      <YearColumn
        year={1}
        unitsWithHours={units}
        unitBreakdown={{}}
        maxUnitHours={120}
        assignments={{ Algebra: 1 }}
        isLocked={false}
        onToggleLock={() => {}}
        onRemove={onRemove}
        onShowUnitDetails={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /remove Algebra/i }))
    expect(onRemove).toHaveBeenCalledWith('Algebra')
  })

  it('hides remove buttons when locked and exposes assign here for selection', () => {
    const onAssignSelectionToYear = vi.fn()
    const { rerender } = render(
      <YearColumn
        year={2}
        unitsWithHours={units}
        unitBreakdown={{}}
        maxUnitHours={120}
        assignments={{ Biology: 2 }}
        isLocked={true}
        onToggleLock={() => {}}
        onRemove={() => {}}
        onShowUnitDetails={() => {}}
        selectedUnitCount={2}
        onAssignSelectionToYear={onAssignSelectionToYear}
      />
    )

    expect(screen.queryByRole('button', { name: /remove Biology/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /assign 2 selected/i })).toBeNull()

    rerender(
      <YearColumn
        year={2}
        unitsWithHours={units}
        unitBreakdown={{}}
        maxUnitHours={120}
        assignments={{ Biology: 2 }}
        isLocked={false}
        onToggleLock={() => {}}
        onRemove={() => {}}
        onShowUnitDetails={() => {}}
        selectedUnitCount={2}
        onAssignSelectionToYear={onAssignSelectionToYear}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /assign 2 selected units to year 2/i }))
    expect(onAssignSelectionToYear).toHaveBeenCalledWith(2)
  })
})
