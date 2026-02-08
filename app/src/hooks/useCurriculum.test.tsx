import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCurriculum } from './useCurriculum'
import type { OptionChoiceState, OptionalItemInclusionState, OptionGroupHoursOverrideState } from '../types'

const tableData: Record<string, unknown[]> = {
  unit_subcategory_hours: [
    { unit: 'Algebra', category: 'Math', subcategory: 'Core', hours: 100, curriculum_id: 'gatherround' },
  ],
  unit_option_groups: [
    { id: 'group-1', unit: 'Algebra', category: 'Math', label: 'Track', note: null, curriculum_id: 'gatherround' },
  ],
  unit_option_choices: [
    { id: 'choice-1', option_group_id: 'group-1', subcategory: 'Track A', hours: 10, recommended_books: [], curriculum_id: 'gatherround' },
    { id: 'choice-2', option_group_id: 'group-1', subcategory: 'Track B', hours: 12, recommended_books: [], curriculum_id: 'gatherround' },
  ],
  unit_optional_items: [
    { id: 'opt-1', unit: 'Algebra', category: 'Math', subcategory: 'Lab', hours: 4, description: 'Optional lab', curriculum_id: 'gatherround' },
  ],
}

vi.mock('../supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        in: () =>
          Promise.resolve({
            data: tableData[table] ?? [],
            error: null,
          }),
      }),
    }),
  },
}))

describe('useCurriculum', () => {
  it('computes unit hours with selected options and optional items', async () => {
    const optionChoices: OptionChoiceState = { Algebra: { 'group-1': 'Track B' } }
    const includedOptionalItems: OptionalItemInclusionState = { Algebra: { 'opt-1': true } }
    const optionGroupHoursOverride: OptionGroupHoursOverrideState = { Algebra: { 'group-1': 14 } }
    const curriculumUnits = [{ curriculumId: 'gatherround', unit: 'Algebra' }]

    const { result } = renderHook(() =>
      useCurriculum(optionChoices, includedOptionalItems, optionGroupHoursOverride, curriculumUnits)
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    const algebra = result.current.unitsWithHours.find((u) => u.unit === 'Algebra')
    expect(algebra?.totalHours).toBe(100 + 14 + 4)
  })

  it('marks units with unselected option groups', async () => {
    const curriculumUnits = [{ curriculumId: 'gatherround', unit: 'Algebra' }]
    const { result } = renderHook(() =>
      useCurriculum({}, {}, {}, curriculumUnits)
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.unitsWithUnselectedOptionGroups).toEqual(['Algebra'])
  })
})
