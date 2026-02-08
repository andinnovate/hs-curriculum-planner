import type React from 'react'
import type { CategoryBreakdownRow } from '../types'
import { getCategoryColor, rollupCategory } from './categoryUtils'

const CATEGORY_ORDER = [
  'Bible',
  'Language Arts',
  'Math',
  'Science',
  'Social Sciences',
  'Fine Arts',
  'Physical Education',
  'General Electives',
]

function sumCategoryHours(rows: CategoryBreakdownRow[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const row of rows) {
    if (!Number.isFinite(row.hours) || row.hours <= 0) continue
    const category = rollupCategory(row.category)
    totals.set(category, (totals.get(category) ?? 0) + row.hours)
  }
  return totals
}

function sortCategories(a: string, b: string): number {
  const ai = CATEGORY_ORDER.indexOf(a)
  const bi = CATEGORY_ORDER.indexOf(b)
  if (ai === -1 && bi === -1) return a.localeCompare(b)
  if (ai === -1) return 1
  if (bi === -1) return -1
  return ai - bi
}

interface CategoryBarProps {
  rows: CategoryBreakdownRow[]
  totalHours?: number
  scaleMaxHours?: number
  size?: 'xs' | 'sm' | 'md'
  className?: string
  ariaLabel?: string
  onCategoryHover?: (category: string | null) => void
  activeCategory?: string | null
  style?: React.CSSProperties
}

export function CategoryBar({
  rows,
  totalHours,
  scaleMaxHours,
  size = 'sm',
  className,
  ariaLabel,
  onCategoryHover,
  activeCategory,
  style,
}: CategoryBarProps) {
  const totals = sumCategoryHours(rows)
  const sum = Array.from(totals.values()).reduce((a, b) => a + b, 0)
  const total = totalHours != null && totalHours > sum ? totalHours : sum

  if (total <= 0 || totals.size === 0) return null

  const segments = Array.from(totals.entries())
    .sort(([a], [b]) => sortCategories(a, b))
    .map(([category, hours]) => ({
      category,
      hours,
      width: Math.max(0, (hours / total) * 100),
      color: getCategoryColor(category),
    }))

  const classes = ['category-bar', `category-bar--${size}`, onCategoryHover ? 'category-bar--interactive' : '', className]
    .filter(Boolean)
    .join(' ')
  const scaleBase = scaleMaxHours != null && scaleMaxHours > 0 ? scaleMaxHours : total
  const scale = Math.min(1, total / scaleBase)
  const scaledStyle = scaleMaxHours != null
    ? { ...style, width: `${(scale * 100).toFixed(3)}%` }
    : style

  return (
    <div
      className={classes}
      role="img"
      aria-label={ariaLabel}
      style={scaledStyle}
      onMouseLeave={onCategoryHover ? () => onCategoryHover(null) : undefined}
    >
      {segments.map((segment) => (
        <span
          key={segment.category}
          className="category-bar-segment"
          style={{
            width: `${segment.width}%`,
            backgroundColor: segment.color,
            opacity: activeCategory ? (segment.category === activeCategory ? 1 : 0.35) : 1,
          }}
          title={`${segment.category}: ${segment.hours.toFixed(1)} hrs`}
          onMouseEnter={onCategoryHover ? () => onCategoryHover(segment.category) : undefined}
        />
      ))}
    </div>
  )
}
