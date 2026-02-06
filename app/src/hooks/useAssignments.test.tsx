import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getPlanStorageKey } from '../planStorage'
import { useAssignments } from './useAssignments'

describe('useAssignments', () => {
  it('switches plans and persists to the active plan', () => {
    const planA = 'plan-a'
    const planB = 'plan-b'
    localStorage.setItem(
      getPlanStorageKey(planA, 'assignments'),
      JSON.stringify({ Algebra: 1 })
    )
    localStorage.setItem(
      getPlanStorageKey(planB, 'assignments'),
      JSON.stringify({ Biology: 2 })
    )

    const { result, rerender } = renderHook(
      ({ planId }) => useAssignments(planId),
      { initialProps: { planId: planA } }
    )

    expect(result.current.assignments).toEqual({ Algebra: 1 })

    rerender({ planId: planB })

    expect(result.current.assignments).toEqual({ Biology: 2 })

    act(() => {
      result.current.setAssignment('Chemistry', 3)
    })

    expect(
      localStorage.getItem(getPlanStorageKey(planB, 'assignments'))
    ).toBe(JSON.stringify({ Biology: 2, Chemistry: 3 }))
    expect(
      localStorage.getItem(getPlanStorageKey(planA, 'assignments'))
    ).toBe(JSON.stringify({ Algebra: 1 }))
  })
})
