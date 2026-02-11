import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getPlanStorageKey } from '../planStorage'
import { useOptionChoices } from './useOptionChoices'

describe('useOptionChoices', () => {
  it('loads choices per plan and persists updates', () => {
    const planA = 'plan-a'
    const planB = 'plan-b'
    localStorage.setItem(
      getPlanStorageKey(planA, 'option-choices'),
      JSON.stringify({ Algebra: { group1: 'Track A' } })
    )
    localStorage.setItem(
      getPlanStorageKey(planA, 'included-optional-items'),
      JSON.stringify({ Algebra: { lab: true } })
    )
    localStorage.setItem(
      getPlanStorageKey(planA, 'option-group-hours'),
      JSON.stringify({ Algebra: { group1: 10 } })
    )
    localStorage.setItem(
      getPlanStorageKey(planA, 'optional-item-hours'),
      JSON.stringify({ Algebra: { lab: 6 } })
    )

    const { result, rerender } = renderHook(
      ({ planId }) => useOptionChoices(planId),
      { initialProps: { planId: planA } }
    )

    expect(result.current.getChoice('Algebra', 'group1')).toBe('Track A')
    expect(result.current.isOptionalItemIncluded('Algebra', 'lab')).toBe(true)
    expect(result.current.getOptionGroupHours('Algebra', 'group1', 5)).toBe(10)
    expect(result.current.getOptionalItemHours('Algebra', 'lab', 4)).toBe(6)

    rerender({ planId: planB })

    act(() => {
      result.current.setChoice('Biology', 'group2', 'Track B')
      result.current.setOptionalItemIncluded('Biology', 'lab', true)
      result.current.setOptionGroupHours('Biology', 'group2', 8)
      result.current.setOptionalItemHours('Biology', 'lab', 12)
    })

    expect(localStorage.getItem(getPlanStorageKey(planB, 'option-choices'))).toBe(
      JSON.stringify({ Biology: { group2: 'Track B' } })
    )
    expect(localStorage.getItem(getPlanStorageKey(planB, 'included-optional-items'))).toBe(
      JSON.stringify({ Biology: { lab: true } })
    )
    expect(localStorage.getItem(getPlanStorageKey(planB, 'option-group-hours'))).toBe(
      JSON.stringify({ Biology: { group2: 8 } })
    )
    expect(localStorage.getItem(getPlanStorageKey(planB, 'optional-item-hours'))).toBe(
      JSON.stringify({ Biology: { lab: 12 } })
    )
  })
})
