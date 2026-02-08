import type { AssignmentState, CategoryBreakdownRow, UnitBreakdown, UnitWithHours } from '../types'
import type { Year } from '../types'

export function getUnitBreakdownRows(
  unit: string,
  unitBreakdown: UnitBreakdown
): CategoryBreakdownRow[] {
  return unitBreakdown[unit] ?? []
}

export function getYearBreakdownRows(
  year: Year,
  assignments: AssignmentState,
  unitBreakdown: UnitBreakdown
): CategoryBreakdownRow[] {
  const unitsInYear = Object.entries(assignments)
    .filter(([, y]) => y === year)
    .map(([u]) => u)
  const rows: CategoryBreakdownRow[] = []
  for (const unit of unitsInYear) {
    rows.push(...(unitBreakdown[unit] ?? []))
  }
  return rows
}

export function getYearTotalHours(
  year: Year,
  assignments: AssignmentState,
  unitsWithHours: UnitWithHours[]
): number {
  const map = new Map(unitsWithHours.map((u) => [u.unit, u.totalHours]))
  return Object.entries(assignments)
    .filter(([, y]) => y === year)
    .reduce((sum, [unit]) => sum + (map.get(unit) ?? 0), 0)
}
