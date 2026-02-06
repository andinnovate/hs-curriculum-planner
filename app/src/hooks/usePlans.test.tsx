import { renderHook, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { PlanData } from '../types'
import { usePlans } from './usePlans'

const emptyData: PlanData = {
  assignments: {},
  optionChoices: {},
  includedOptionalItems: {},
  optionGroupHoursOverride: {},
  lockedYears: [],
  config: {
    hoursPerCredit: 120,
    minCreditsForGraduation: 25,
  },
}

describe('usePlans', () => {
  it('initializes with a default plan and can rename it', () => {
    const { result } = renderHook(() => usePlans())

    expect(result.current.activePlans.length).toBe(1)
    const id = result.current.currentPlanId

    act(() => {
      result.current.renamePlan(id, 'Renamed Plan')
    })

    expect(result.current.currentPlan?.name).toBe('Renamed Plan')
  })

  it('creates a new plan from data and switches to it', () => {
    const { result } = renderHook(() => usePlans())

    act(() => {
      result.current.createPlanFromData('Copy Plan', emptyData)
    })

    expect(result.current.activePlans.length).toBe(2)
    expect(result.current.currentPlan?.name).toBe('Copy Plan')
  })

  it('marks plans deleted and prevents deleting the final plan', () => {
    const { result } = renderHook(() => usePlans())

    act(() => {
      result.current.createPlanFromData('Plan B', emptyData)
    })

    const planIds = result.current.activePlans.map((plan) => plan.id)

    act(() => {
      result.current.deletePlan(planIds[0])
    })

    expect(result.current.activePlans.length).toBe(1)

    act(() => {
      result.current.deletePlan(result.current.activePlans[0].id)
    })

    expect(result.current.activePlans.length).toBe(1)
  })
})
