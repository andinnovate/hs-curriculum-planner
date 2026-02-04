import type { AssignmentState, UnitWithHours } from '../types'
import type { Year } from '../types'

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

interface TallyBarProps {
  unitsWithHours: UnitWithHours[]
  assignments: AssignmentState
  hoursPerCredit: number
  minCreditsForGraduation: number
  onShowYearDetails?: (year: Year) => void
}

export function TallyBar({
  unitsWithHours,
  assignments,
  hoursPerCredit,
  minCreditsForGraduation,
  onShowYearDetails,
}: TallyBarProps) {
  const byYear = getHoursByYear(unitsWithHours, assignments)
  const totalHours = (byYear[1] ?? 0) + (byYear[2] ?? 0) + (byYear[3] ?? 0) + (byYear[4] ?? 0)
  const totalCredits = hoursPerCredit > 0 ? totalHours / hoursPerCredit : 0
  const meetsMin = totalCredits >= minCreditsForGraduation

  return (
    <footer className="tally-bar">
      <div className="tally-by-year">
        {([1, 2, 3, 4] as const).map((y) => {
          const h = byYear[y] ?? 0
          const c = hoursPerCredit > 0 ? h / hoursPerCredit : 0
          return (
            <span key={y} className="tally-year">
              Year {y}: {h.toFixed(1)} hrs ({c.toFixed(2)} cr)
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
          )
        })}
      </div>
      <div className="tally-total">
        Total: {totalHours.toFixed(1)} hrs ({totalCredits.toFixed(2)} credits).
        Minimum for graduation: {minCreditsForGraduation} credits.
        {meetsMin ? (
          <span className="tally-ok" aria-label="Meets minimum"> ✓</span>
        ) : (
          <span className="tally-short"> (need {Math.max(0, minCreditsForGraduation - totalCredits).toFixed(2)} more)</span>
        )}
      </div>
    </footer>
  )
}
