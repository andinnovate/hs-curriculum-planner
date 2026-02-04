import type { AssignmentState, CategoryBreakdownRow, UnitBreakdown, UnitWithHours } from '../types'
import type { Year } from '../types'

interface BreakdownPopupProps {
  title: string
  rows: CategoryBreakdownRow[]
  totalHours: number
  onClose: () => void
}

function groupByCategory(rows: CategoryBreakdownRow[]): { category: string; total: number; subcategories: { subcategory: string; hours: number }[] }[] {
  const byCat = new Map<string, { subcategories: Map<string, number> }>()
  for (const r of rows) {
    if (!byCat.has(r.category)) byCat.set(r.category, { subcategories: new Map() })
    const cat = byCat.get(r.category)!
    const prev = cat.subcategories.get(r.subcategory) ?? 0
    cat.subcategories.set(r.subcategory, prev + r.hours)
  }
  return Array.from(byCat.entries()).map(([category, { subcategories }]) => ({
    category,
    total: Array.from(subcategories.values()).reduce((a, b) => a + b, 0),
    subcategories: Array.from(subcategories.entries()).map(([subcategory, hours]) => ({ subcategory, hours })),
  }))
}

export function BreakdownPopup({ title, rows, totalHours, onClose }: BreakdownPopupProps) {
  const grouped = groupByCategory(rows)

  return (
    <div className="breakdown-popover-backdrop" onClick={onClose} role="presentation">
      <div className="breakdown-popover" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Details: ${title}`}>
        <div className="breakdown-popover-header">
          <h4 className="breakdown-popover-title">{title}</h4>
          <button type="button" className="breakdown-popover-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="breakdown-popover-body">
          {grouped.length === 0 ? (
            <p className="breakdown-empty">No category breakdown available.</p>
          ) : (
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Subcategory</th>
                <th className="breakdown-num">Hours</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((g) =>
                g.subcategories.map((s, i) => (
                  <tr key={`${g.category}-${s.subcategory}`}>
                    {i === 0 && (
                      <td rowSpan={g.subcategories.length} className="breakdown-category">
                        {g.category}
                      </td>
                    )}
                    <td>{s.subcategory}</td>
                    <td className="breakdown-num">{s.hours.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          )}
          <p className="breakdown-total">
            Total: <strong>{totalHours.toFixed(1)} hrs</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

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
