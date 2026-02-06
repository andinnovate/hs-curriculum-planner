import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BreakdownPopup } from './BreakdownPopup'
import type { UnitOptionChoice, UnitOptionGroup, UnitOptionalItem } from '../types'

describe('BreakdownPopup', () => {
  it('renders option groups and optional items and fires callbacks', () => {
    const optionGroups: UnitOptionGroup[] = [
      {
        id: 'group-1',
        unit: 'Algebra',
        category: 'Math',
        label: 'Choose a track',
      },
    ]
    const optionChoices: UnitOptionChoice[] = [
      {
        id: 'choice-1',
        option_group_id: 'group-1',
        subcategory: 'Track A',
        hours: 10,
        recommended_books: [],
      },
      {
        id: 'choice-2',
        option_group_id: 'group-1',
        subcategory: 'Track B',
        hours: 12,
        recommended_books: [],
      },
    ]
    const optionalItems: UnitOptionalItem[] = [
      {
        id: 'opt-1',
        unit: 'Algebra',
        category: 'Math',
        subcategory: 'Lab',
        hours: 4,
        description: 'Optional lab',
      },
    ]

    const setChoice = vi.fn()
    const clearChoice = vi.fn()
    const setOptionalItemIncluded = vi.fn()

    render(
      <BreakdownPopup
        title="Algebra"
        rows={[]}
        totalHours={0}
        onClose={() => {}}
        unit="Algebra"
        optionGroups={optionGroups}
        optionChoicesByGroupId={{ 'group-1': optionChoices }}
        optionalItems={optionalItems}
        getChoice={() => 'Track A'}
        setChoice={setChoice}
        clearChoice={clearChoice}
        isOptionalItemIncluded={() => false}
        setOptionalItemIncluded={setOptionalItemIncluded}
      />
    )

    fireEvent.click(screen.getByText(/Track B/i))
    expect(setChoice).toHaveBeenCalledWith('Algebra', 'group-1', 'Track B')

    fireEvent.click(screen.getByText('Optional lab'))
    expect(setOptionalItemIncluded).toHaveBeenCalledWith('Algebra', 'opt-1', true)
  })
})
