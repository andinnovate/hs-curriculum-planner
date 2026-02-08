import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CategoryBar } from './CategoryBar'
import { getCategoryColor, rollupCategory } from './categoryUtils'
import type { CategoryBreakdownRow } from '../types'

describe('CategoryBar rollups', () => {
  it('rolls up elective and science categories', () => {
    expect(rollupCategory('Science Electives')).toBe('Science')
    expect(rollupCategory('Physical Science')).toBe('Science')
    expect(rollupCategory('Math Electives')).toBe('Math')
    expect(rollupCategory('Language Arts Electives')).toBe('Language Arts')
    expect(rollupCategory('Social Science Electives')).toBe('Social Sciences')
    expect(rollupCategory('Electives')).toBe('General Electives')
    expect(rollupCategory('Fine Arts')).toBe('Fine Arts')
  })

  it('exposes stable colors for rollup categories', () => {
    expect(getCategoryColor('Science')).toBe('#10b981')
    expect(getCategoryColor('Math')).toBe('#2563eb')
    expect(getCategoryColor('Language Arts')).toBe('#f59e0b')
  })
})

describe('CategoryBar rendering', () => {
  it('combines rolled-up categories into a single segment', () => {
    const rows: CategoryBreakdownRow[] = [
      { category: 'Physical Science', subcategory: 'Chemistry', hours: 5 },
      { category: 'Life Science', subcategory: 'Biology', hours: 3 },
    ]

    const { container } = render(
      <CategoryBar rows={rows} totalHours={8} />
    )

    const segments = container.querySelectorAll('.category-bar-segment')
    expect(segments.length).toBe(1)
    expect(segments[0].getAttribute('title')).toBe('Science: 8.0 hrs')
  })

  it('scales the bar width against the provided max hours', () => {
    const rows: CategoryBreakdownRow[] = [
      { category: 'Math Electives', subcategory: 'Applied', hours: 10 },
    ]

    const { container } = render(
      <CategoryBar rows={rows} totalHours={10} scaleMaxHours={100} />
    )

    const bar = container.querySelector('.category-bar') as HTMLElement | null
    expect(bar).not.toBeNull()
    expect(bar?.style.width).toBe('10%')
  })
})
