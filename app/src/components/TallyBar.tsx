import type { AssignmentState, CategoryBreakdownRow, UnitBreakdown, UnitWithHours } from '../types'
import type { Year } from '../types'
import { CategoryBar } from './CategoryBar'

function getHoursByYear(
  unitsWithHours: UnitWithHours[],
  assignments: AssignmentState
): Record<Year, number> {
  const map = new Map(unitsWithHours.map((u) => [u.unit, u.totalHours]))
  const byYear: Record<Year, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const [unit, year] of Object.entries(assignments)) {
    const hours = map.get(unit) ?? 0
    byYear[year as Year] = (byYear[year as Year] ?? 0) + hours
  }
  return byYear
}

function getBreakdownRowsForYear(
  year: Year,
  assignments: AssignmentState,
  unitBreakdown: UnitBreakdown
): CategoryBreakdownRow[] {
  const rows: CategoryBreakdownRow[] = []
  for (const [unit, y] of Object.entries(assignments)) {
    if (y === year) rows.push(...(unitBreakdown[unit] ?? []))
  }
  return rows
}

function getBreakdownRowsForTotal(
  assignments: AssignmentState,
  unitBreakdown: UnitBreakdown
): CategoryBreakdownRow[] {
  const rows: CategoryBreakdownRow[] = []
  for (const [unit] of Object.entries(assignments)) {
    rows.push(...(unitBreakdown[unit] ?? []))
  }
  return rows
}

interface TallyBarProps {
  unitsWithHours: UnitWithHours[]
  unitBreakdown: UnitBreakdown
  assignments: AssignmentState
  hoursPerCredit: number
  minCreditsForGraduation: number
  onShowYearDetails?: (year: Year) => void
  onTotalCategoryHover?: (category: string | null) => void
  activeTotalCategory?: string | null
  onYearCategoryHover?: (year: Year, category: string | null) => void
  activeYearCategoryByYear?: Partial<Record<Year, string | null>>
}

export function TallyBar({
  unitsWithHours,
  unitBreakdown,
  assignments,
  hoursPerCredit,
  minCreditsForGraduation,
  onShowYearDetails,
  onTotalCategoryHover,
  activeTotalCategory,
  onYearCategoryHover,
  activeYearCategoryByYear,
}: TallyBarProps) {
  const byYear = getHoursByYear(unitsWithHours, assignments)
  const totalHours = (byYear[1] ?? 0) + (byYear[2] ?? 0) + (byYear[3] ?? 0) + (byYear[4] ?? 0)
  const totalCredits = hoursPerCredit > 0 ? totalHours / hoursPerCredit : 0
  const meetsMin = totalCredits >= minCreditsForGraduation
  const totalRows = getBreakdownRowsForTotal(assignments, unitBreakdown)
  const maxYearHours = Math.max(byYear[1] ?? 0, byYear[2] ?? 0, byYear[3] ?? 0, byYear[4] ?? 0, 0)

  return (
    <footer className="tally-bar">
      <div className="tally-by-year">
        {([1, 2, 3, 4] as const).map((y) => {
          const h = byYear[y] ?? 0
          const c = hoursPerCredit > 0 ? h / hoursPerCredit : 0
          const rows = getBreakdownRowsForYear(y, assignments, unitBreakdown)
          const activeYearCategory = activeYearCategoryByYear?.[y] ?? null
          return (
            <span key={y} className="tally-year">
              <span className="tally-year-info">
                <span>Year {y}: {h.toFixed(1)} hrs ({c.toFixed(2)} cr)</span>
                {onShowYearDetails && (
                  <button
                    type="button"
                    className="tally-year-details"
                    onClick={() => onShowYearDetails(y)}
                    aria-label={`Show year ${y} breakdown`}
                    title="Show category breakdown for this year"
                  >
                    <span aria-hidden>ⓘ</span>
                  </button>
                )}
              </span>
              <CategoryBar
                rows={rows}
                totalHours={h}
                scaleMaxHours={maxYearHours}
                size="sm"
                className="tally-year-bar"
                ariaLabel={`Year ${y} category breakdown`}
                onCategoryHover={onYearCategoryHover ? (category) => onYearCategoryHover(y, category) : undefined}
                activeCategory={activeYearCategory}
              />
            </span>
          )
        })}
      </div>
      <div className="tally-total">
        <span className="tally-total-line">
          Total: {totalHours.toFixed(1)} hrs ({totalCredits.toFixed(2)} credits).
        </span>
        <span className="tally-total-line tally-total-min">
          Minimum for graduation: {minCreditsForGraduation}{' '}
          <span className="tally-total-min-suffix">
            credits.
            {meetsMin ? (
              <span className="tally-ok" aria-label="Meets minimum"> ✓</span>
            ) : (
              <span className="tally-short"> (need {Math.max(0, minCreditsForGraduation - totalCredits).toFixed(2)} more)</span>
            )}
          </span>
        </span>
        <CategoryBar
          rows={totalRows}
          totalHours={totalHours}
          scaleMaxHours={maxYearHours}
          size="md"
          className="tally-total-bar"
          ariaLabel="Four-year total category breakdown"
          onCategoryHover={onTotalCategoryHover}
          activeCategory={activeTotalCategory}
        />
        <span className="tally-total-bar-label">Four-year total by category</span>
      </div>
    </footer>
  )
}
