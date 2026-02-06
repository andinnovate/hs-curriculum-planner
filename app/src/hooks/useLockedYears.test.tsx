import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getPlanStorageKey } from '../planStorage'
import { useLockedYears } from './useLockedYears'

describe('useLockedYears', () => {
  it('loads and persists locked years per plan', () => {
    const planA = 'plan-a'
    const planB = 'plan-b'
    localStorage.setItem(getPlanStorageKey(planA, 'locked-years'), JSON.stringify([1, 3]))

    const { result, rerender } = renderHook(
      ({ planId }) => useLockedYears(planId),
      { initialProps: { planId: planA } }
    )

    expect(Array.from(result.current.lockedYears).sort()).toEqual([1, 3])

    rerender({ planId: planB })

    expect(Array.from(result.current.lockedYears)).toEqual([])

    act(() => {
      result.current.toggleLock(2)
    })

    expect(localStorage.getItem(getPlanStorageKey(planB, 'locked-years'))).toBe(
      JSON.stringify([2])
    )
  })
})
