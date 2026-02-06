import { renderHook, waitFor } from '@testing-library/react'
import type { User } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { PlanMeta } from '../types'
import { usePlanSync } from './usePlanSync'

const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null })
const mockUpsert = vi.fn().mockResolvedValue({ error: null })

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
    })),
  },
}))

describe('usePlanSync', () => {
  it('reports offline when no user is logged in', () => {
    const { result } = renderHook(() =>
      usePlanSync({
        user: null,
        plans: [],
        mergeRemotePlans: () => {},
        markPlansSynced: () => {},
        applyCurrentPlanData: () => {},
      })
    )

    expect(result.current).toBe('offline')
  })

  it('reports pending when there are dirty plans', async () => {
    const user = { id: 'user-1' } as User
    const plans: PlanMeta[] = [
      {
        id: 'plan-1',
        name: 'Plan',
        updatedAt: new Date().toISOString(),
        lastSyncedAt: '2000-01-01T00:00:00.000Z',
      },
    ]

    const { result } = renderHook(() =>
      usePlanSync({
        user,
        plans,
        mergeRemotePlans: () => {},
        markPlansSynced: () => {},
        applyCurrentPlanData: () => {},
        syncIntervalMs: 60_000,
      })
    )

    await waitFor(() => {
      expect(result.current).toBe('pending')
    })
  })
})
