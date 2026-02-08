import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HOURS_PER_CREDIT,
  DEFAULT_MIN_CREDITS,
  type PlanData,
} from './types'
import {
  getPlanStorageKey,
  migrateLegacyPlan,
  normalizePlanData,
  readPlanDataFromStorage,
  writePlanDataToStorage,
} from './planStorage'

describe('planStorage', () => {
  it('round-trips plan data to localStorage', () => {
    const planId = 'plan-1'
    const data: PlanData = {
      assignments: { Algebra: 1 },
      optionChoices: { Algebra: { choiceA: 'Track 1' } },
      includedOptionalItems: { Algebra: { lab: true } },
      optionGroupHoursOverride: { Algebra: { choiceA: 12 } },
      curriculumUnits: [{ curriculumId: 'gatherround', unit: 'Algebra' }],
      lockedYears: [2, 4],
      config: { hoursPerCredit: 100, minCreditsForGraduation: 30 },
    }

    writePlanDataToStorage(planId, data)

    const read = readPlanDataFromStorage(planId)
    expect(read.assignments).toEqual(data.assignments)
    expect(read.optionChoices).toEqual(data.optionChoices)
    expect(read.includedOptionalItems).toEqual(data.includedOptionalItems)
    expect(read.optionGroupHoursOverride).toEqual(data.optionGroupHoursOverride)
    expect(read.curriculumUnits).toEqual(data.curriculumUnits)
    expect([...read.lockedYears].sort()).toEqual([...data.lockedYears].sort())
    expect(read.config).toEqual(data.config)
  })

  it('normalizes invalid data and fills defaults', () => {
    const normalized = normalizePlanData({
      assignments: { Algebra: 5, Biology: 2 } as unknown as PlanData['assignments'],
      lockedYears: [0, 2, 7] as unknown as PlanData['lockedYears'],
      curriculumUnits: [
        { curriculumId: 'gatherround', unit: 'Biology' },
        { curriculumId: '', unit: 'Bad' },
        { curriculumId: 'gatherround', unit: 'Biology' },
      ] as PlanData['curriculumUnits'],
      config: { hoursPerCredit: Number.NaN, minCreditsForGraduation: 0 },
    })

    expect(normalized.assignments).toEqual({ Biology: 2 })
    expect(normalized.curriculumUnits).toEqual([{ curriculumId: 'gatherround', unit: 'Biology' }])
    expect(normalized.lockedYears).toEqual([2])
    expect(normalized.config).toEqual({
      hoursPerCredit: DEFAULT_HOURS_PER_CREDIT,
      minCreditsForGraduation: DEFAULT_MIN_CREDITS,
    })
  })

  it('migrates legacy storage into a new plan', () => {
    const planId = 'plan-legacy'
    localStorage.setItem('curric-planner-assignments', JSON.stringify({ Algebra: 1 }))
    localStorage.setItem('curric-planner-config', JSON.stringify({ hoursPerCredit: 90 }))

    migrateLegacyPlan(planId)

    const assignmentsKey = getPlanStorageKey(planId, 'assignments')
    const configKey = getPlanStorageKey(planId, 'config')

    expect(localStorage.getItem(assignmentsKey)).toBe(JSON.stringify({ Algebra: 1 }))
    expect(localStorage.getItem(configKey)).toBe(JSON.stringify({ hoursPerCredit: 90 }))
  })

  it('does not overwrite plan storage during migration', () => {
    const planId = 'plan-existing'
    const assignmentsKey = getPlanStorageKey(planId, 'assignments')
    localStorage.setItem(assignmentsKey, JSON.stringify({ Biology: 2 }))
    localStorage.setItem('curric-planner-assignments', JSON.stringify({ Algebra: 1 }))

    migrateLegacyPlan(planId)

    expect(localStorage.getItem(assignmentsKey)).toBe(JSON.stringify({ Biology: 2 }))
  })
})
