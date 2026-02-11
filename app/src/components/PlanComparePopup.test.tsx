import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { PlanData } from '../types'
import { PlanComparePopup } from './PlanComparePopup'

const baseData: PlanData = {
  assignments: {},
  optionChoices: {},
  includedOptionalItems: {},
  optionGroupHoursOverride: {},
  optionalItemHoursOverride: {},
  curriculumUnits: [],
  lockedYears: [],
  config: {
    hoursPerCredit: 120,
    minCreditsForGraduation: 25,
  },
}

describe('PlanComparePopup', () => {
  it('summarizes differences between plans', () => {
    const currentData: PlanData = {
      ...baseData,
      assignments: { Algebra: 1 },
      lockedYears: [1],
      config: { hoursPerCredit: 120, minCreditsForGraduation: 25 },
    }
    const otherData: PlanData = {
      ...baseData,
      assignments: { Algebra: 2, Biology: 3 },
      lockedYears: [2],
      config: { hoursPerCredit: 100, minCreditsForGraduation: 25 },
    }

    render(
      <PlanComparePopup
        currentPlanName="Plan A"
        otherPlanName="Plan B"
        currentData={currentData}
        otherData={otherData}
        onClose={() => {}}
      />
    )

    expect(screen.getByText(/Assignment differences: 2/i)).toBeTruthy()
    expect(screen.getByText(/Option choice differences: 0/i)).toBeTruthy()
    expect(screen.getByText(/Locked year differences: 2/i)).toBeTruthy()
    expect(screen.getByText(/Optional item hours differences: 0/i)).toBeTruthy()
    expect(screen.getByText(/Config differences: 1/i)).toBeTruthy()
    expect(screen.getByText('Algebra')).toBeTruthy()
    expect(screen.getByText('Biology')).toBeTruthy()
  })
})
