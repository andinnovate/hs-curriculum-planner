import type React from 'react'
import type { CategoryBreakdownRow } from '../types'

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

const CATEGORY_COLORS: Record<string, string> = {
  Bible: '#7c3aed',
  'Language Arts': '#f59e0b',
  Math: '#2563eb',
  Science: '#10b981',
  'Social Sciences': '#f97316',
  'Fine Arts': '#ec4899',
  'Physical Education': '#ef4444',
  'General Electives': '#9ca3af',
}

const CATEGORY_KEYWORDS: { pattern: RegExp; color: string }[] = [
  { pattern: /science/i, color: '#10b981' },
  { pattern: /math/i, color: '#2563eb' },
  { pattern: /language|literature|writing/i, color: '#f59e0b' },
  { pattern: /history|social/i, color: '#f97316' },
  { pattern: /art|music/i, color: '#ec4899' },
  { pattern: /bible|theology|religion/i, color: '#7c3aed' },
  { pattern: /physical|health|pe/i, color: '#ef4444' },
]

const CATEGORY_ROLLUPS: Record<string, string> = {
  'Language Arts Electives': 'Language Arts',
  'Math Electives': 'Math',
  'Physical Science': 'Science',
  'Life Science': 'Science',
  'Earth Science': 'Science',
  'Science Electives': 'Science',
  History: 'Social Sciences',
  'Social Science Electives': 'Social Sciences',
  Electives: 'General Electives',
}

export function rollupCategory(category: string): string {
  return CATEGORY_ROLLUPS[category] ?? category
}

function hashToHue(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) % 360
  }
  return h
}

export function getCategoryColor(category: string): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category]
  const hit = CATEGORY_KEYWORDS.find((entry) => entry.pattern.test(category))
  if (hit) return hit.color
  const hue = hashToHue(category)
  return `hsl(${hue} 60% 55%)`
}

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
  style?: React.CSSProperties
}

export function CategoryBar({
  rows,
  totalHours,
  scaleMaxHours,
  size = 'sm',
  className,
  ariaLabel,
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

  const classes = ['category-bar', `category-bar--${size}`, className].filter(Boolean).join(' ')
  const scaleBase = scaleMaxHours != null && scaleMaxHours > 0 ? scaleMaxHours : total
  const scale = Math.min(1, total / scaleBase)
  const scaledStyle = scaleMaxHours != null
    ? { ...style, width: `${(scale * 100).toFixed(3)}%` }
    : style

  return (
    <div className={classes} role="img" aria-label={ariaLabel} style={scaledStyle}>
      {segments.map((segment) => (
        <span
          key={segment.category}
          className="category-bar-segment"
          style={{ width: `${segment.width}%`, backgroundColor: segment.color }}
          title={`${segment.category}: ${segment.hours.toFixed(1)} hrs`}
        />
      ))}
    </div>
  )
}
