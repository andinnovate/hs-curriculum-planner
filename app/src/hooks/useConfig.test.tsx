import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_HOURS_PER_CREDIT, DEFAULT_MIN_CREDITS } from '../types'
import { getPlanStorageKey } from '../planStorage'
import { useConfig } from './useConfig'

describe('useConfig', () => {
  it('loads config per plan and persists updates', () => {
    const planA = 'plan-a'
    const planB = 'plan-b'
    localStorage.setItem(
      getPlanStorageKey(planA, 'config'),
      JSON.stringify({ hoursPerCredit: 90, minCreditsForGraduation: 20 })
    )

    const { result, rerender } = renderHook(
      ({ planId }) => useConfig(planId),
      { initialProps: { planId: planA } }
    )

    expect(result.current.config).toEqual({ hoursPerCredit: 90, minCreditsForGraduation: 20 })

    rerender({ planId: planB })

    expect(result.current.config).toEqual({
      hoursPerCredit: DEFAULT_HOURS_PER_CREDIT,
      minCreditsForGraduation: DEFAULT_MIN_CREDITS,
    })

    act(() => {
      result.current.setHoursPerCredit(110)
    })

    expect(localStorage.getItem(getPlanStorageKey(planB, 'config'))).toBe(
      JSON.stringify({ hoursPerCredit: 110, minCreditsForGraduation: DEFAULT_MIN_CREDITS })
    )
  })
})
