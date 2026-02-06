import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCurriculum } from './useCurriculum'
import type { OptionChoiceState, OptionalItemInclusionState, OptionGroupHoursOverrideState } from '../types'

const tableData = {
  unit_subcategory_hours: [
    { unit: 'Algebra', category: 'Math', subcategory: 'Core', hours: 100 },
  ],
  unit_option_groups: [
    { id: 'group-1', unit: 'Algebra', category: 'Math', label: 'Track', note: null },
  ],
  unit_option_choices: [
    { id: 'choice-1', option_group_id: 'group-1', subcategory: 'Track A', hours: 10, recommended_books: [] },
    { id: 'choice-2', option_group_id: 'group-1', subcategory: 'Track B', hours: 12, recommended_books: [] },
  ],
  unit_optional_items: [
    { id: 'opt-1', unit: 'Algebra', category: 'Math', subcategory: 'Lab', hours: 4, description: 'Optional lab' },
  ],
} as const

vi.mock('../supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () =>
        Promise.resolve({
          data: (tableData as Record<string, unknown[]>)[table] ?? [],
          error: null,
        }),
    }),
  },
}))

describe('useCurriculum', () => {
  it('computes unit hours with selected options and optional items', async () => {
    const optionChoices: OptionChoiceState = { Algebra: { 'group-1': 'Track B' } }
    const includedOptionalItems: OptionalItemInclusionState = { Algebra: { 'opt-1': true } }
    const optionGroupHoursOverride: OptionGroupHoursOverrideState = { Algebra: { 'group-1': 14 } }

    const { result } = renderHook(() =>
      useCurriculum(optionChoices, includedOptionalItems, optionGroupHoursOverride)
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    const algebra = result.current.unitsWithHours.find((u) => u.unit === 'Algebra')
    expect(algebra?.totalHours).toBe(100 + 14 + 4)
  })

  it('marks units with unselected option groups', async () => {
    const { result } = renderHook(() =>
      useCurriculum({}, {}, {})
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.unitsWithUnselectedOptionGroups).toEqual(['Algebra'])
  })
})
