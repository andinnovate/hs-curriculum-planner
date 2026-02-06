import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlannerLayout } from './PlannerLayout'
import type { UnitWithHours } from '../types'

const units: UnitWithHours[] = [
  { unit: 'Algebra', totalHours: 120 },
  { unit: 'Biology', totalHours: 100 },
]

describe('PlannerLayout', () => {
  it('assigns selected units to a year via Assign here', () => {
    const onSetAssignment = vi.fn()
    render(
      <PlannerLayout
        unitsWithHours={units}
        assignments={{}}
        lockedYears={new Set()}
        onToggleLock={() => {}}
        onSetAssignment={onSetAssignment}
        onRemoveAssignment={() => {}}
        onShowUnitDetails={() => {}}
      />
    )

    fireEvent.click(screen.getByLabelText(/Select units to assign together/i))
    fireEvent.click(screen.getByLabelText('Select Algebra'))
    fireEvent.click(screen.getByLabelText('Select Biology'))

    const assignHere = screen.getByLabelText('Assign 2 selected units to Year 1')
    fireEvent.click(assignHere)

    expect(onSetAssignment).toHaveBeenCalledWith('Algebra', 1)
    expect(onSetAssignment).toHaveBeenCalledWith('Biology', 1)
  })
})
