import type { AssignmentState, UnitOrderByYear, UnitWithHours, Year } from '../types'

const YEARS: readonly Year[] = [1, 2, 3, 4]

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const copy = array.slice()
  const [removed] = copy.splice(from, 1)
  copy.splice(to, 0, removed)
  return copy
}

/**
 * Returns unit ids for the given year in display order.
 * Uses unitOrderByYear when present and valid; otherwise derives from unitsWithHours
 * (units assigned to this year in array order), with any missing units appended.
 */
export function getOrderedUnitsInYear(
  year: Year,
  assignments: AssignmentState,
  unitOrderByYear: UnitOrderByYear,
  unitsWithHours: UnitWithHours[]
): string[] {
  const assigned = unitsWithHours.filter((u) => assignments[u.unit] === year).map((u) => u.unit)
  const ordered = unitOrderByYear[year]
  if (Array.isArray(ordered) && ordered.length > 0) {
    const assignedSet = new Set(assigned)
    const seen = new Set<string>()
    const result: string[] = []
    for (const id of ordered) {
      if (assignedSet.has(id) && !seen.has(id)) {
        seen.add(id)
        result.push(id)
      }
    }
    for (const id of assigned) {
      if (!seen.has(id)) result.push(id)
    }
    return result
  }
  return assigned
}

/**
 * Given a year-column drag: column at fromIndex (1-based) moved to toIndex (1-based).
 * Returns new assignments: each unit's year is remapped so that the content that was
 * in year at fromIndex is now in the year at toIndex, etc.
 */
export function computeAssignmentsAfterYearReorder(
  assignments: AssignmentState,
  fromIndex: number,
  toIndex: number
): AssignmentState {
  if (fromIndex < 1 || fromIndex > 4 || toIndex < 1 || toIndex > 4) return assignments
  if (fromIndex === toIndex) return assignments
  const order = arrayMove([...YEARS], fromIndex - 1, toIndex - 1)
  // order[i] = which year's content is now at position i+1
  // So for each old year Y, new year = (index of Y in order) + 1
  const oldToNew: Record<Year, Year> = {} as Record<Year, Year>
  for (const y of YEARS) {
    const idx = order.indexOf(y)
    oldToNew[y] = (idx + 1) as Year
  }
  const next: AssignmentState = {}
  for (const [unit, year] of Object.entries(assignments)) {
    if (year >= 1 && year <= 4) next[unit] = oldToNew[year as Year]
  }
  return next
}

/**
 * After year reorder, permute unitOrderByYear so each year's list is the old list
 * from the year whose content is now in that position.
 */
export function permuteUnitOrderAfterYearReorder(
  unitOrderByYear: UnitOrderByYear,
  fromIndex: number,
  toIndex: number
): UnitOrderByYear {
  if (fromIndex < 1 || fromIndex > 4 || toIndex < 1 || toIndex > 4) return unitOrderByYear
  if (fromIndex === toIndex) return unitOrderByYear
  const order = arrayMove([...YEARS], fromIndex - 1, toIndex - 1)
  const next: UnitOrderByYear = {}
  for (let i = 0; i < 4; i++) {
    const newYear = (i + 1) as Year
    const oldYear = order[i] as Year
    const list = unitOrderByYear[oldYear]
    if (list && list.length > 0) next[newYear] = [...list]
  }
  return next
}
