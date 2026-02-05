import { useState } from 'react'
import type { AssignmentState, CategoryBreakdownRow, UnitBreakdown, UnitWithHours } from '../types'
import type { UnitOptionChoice, UnitOptionGroup, UnitOptionalItem } from '../types'
import type { Year } from '../types'

interface BreakdownPopupProps {
  title: string
  rows: CategoryBreakdownRow[]
  totalHours: number
  onClose: () => void
  /** When showing unit details: option groups for this unit (Pattern A) */
  unit?: string
  optionGroups?: UnitOptionGroup[]
  optionChoicesByGroupId?: Record<string, UnitOptionChoice[]>
  /** Optional items for this unit (Pattern B) */
  optionalItems?: UnitOptionalItem[]
  getChoice?: (unit: string, optionGroupId: string) => string | undefined
  setChoice?: (unit: string, optionGroupId: string, subcategory: string) => void
  clearChoice?: (unit: string, optionGroupId: string) => void
  getOptionGroupHours?: (unit: string, optionGroupId: string, defaultHours: number | null) => number | null
  setOptionGroupHours?: (unit: string, optionGroupId: string, hours: number) => void
  isOptionalItemIncluded?: (unit: string, itemId: string) => boolean
  setOptionalItemIncluded?: (unit: string, itemId: string, included: boolean) => void
}

/** Key by (category, subcategory, source) so rows with different sources stay separate for display */
function groupByCategory(rows: CategoryBreakdownRow[]): { category: string; total: number; subcategories: { subcategory: string; hours: number; source?: string }[] }[] {
  const byCat = new Map<string, { subcategories: Map<string, { hours: number; source?: string }> }>()
  for (const r of rows) {
    if (!byCat.has(r.category)) byCat.set(r.category, { subcategories: new Map() })
    const cat = byCat.get(r.category)!
    const key = `${r.subcategory}\t${r.source ?? ''}`
    const prev = cat.subcategories.get(key)
    if (prev) {
      prev.hours += r.hours
    } else {
      cat.subcategories.set(key, { hours: r.hours, source: r.source })
    }
  }
  return Array.from(byCat.entries()).map(([category, { subcategories }]) => ({
    category,
    total: Array.from(subcategories.values()).reduce((a, b) => a + b.hours, 0),
    subcategories: Array.from(subcategories.entries()).map(([key, { hours, source }]) => {
      const subcategory = key.split('\t')[0]
      return { subcategory, hours, source }
    }),
  }))
}

export function BreakdownPopup({
  title,
  rows,
  totalHours,
  onClose,
  unit,
  optionGroups = [],
  optionChoicesByGroupId = {},
  optionalItems = [],
  getChoice,
  setChoice,
  clearChoice,
  getOptionGroupHours,
  setOptionGroupHours,
  isOptionalItemIncluded,
  setOptionalItemIncluded,
}: BreakdownPopupProps) {
  const grouped = groupByCategory(rows)
  const showUnitOptions = unit && (optionGroups.length > 0 || optionalItems.length > 0)
  const [editingHoursGroupId, setEditingHoursGroupId] = useState<string | null>(null)
  const [editingHoursValue, setEditingHoursValue] = useState('')

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
          {showUnitOptions && optionGroups.length > 0 && unit && getChoice && setChoice && clearChoice && (
            <section className="breakdown-option-groups" aria-label="Choose one">
              {optionGroups.map((group) => {
                const choices = optionChoicesByGroupId[group.id] ?? []
                const selected = getChoice(unit, group.id)
                const chosenChoice = selected
                  ? choices.find((c) => c.subcategory === selected)
                  : null
                const defaultHours = chosenChoice?.hours ?? null
                const effectiveHours =
                  getOptionGroupHours != null
                    ? getOptionGroupHours(unit, group.id, defaultHours)
                    : defaultHours
                const isEditingHours = editingHoursGroupId === group.id
                return (
                  <div key={group.id} className="breakdown-option-group">
                    <h5 className="breakdown-option-group-label">{group.label}</h5>
                    {group.note && (
                      <p className="breakdown-option-group-note">{group.note}</p>
                    )}
                    {choices.length > 0 ? (
                      <>
                        <div className="breakdown-option-choices" role="group" aria-label={`Choose one: ${group.label}`}>
                          {choices.map((c) => (
                            <label key={c.id} className="breakdown-option-choice">
                              <input
                                type="checkbox"
                                checked={selected === c.subcategory}
                                onChange={() => (selected === c.subcategory ? clearChoice(unit, group.id) : setChoice(unit, group.id, c.subcategory))}
                              />
                              <span>
                                {c.subcategory}{' '}
                                ({c.hours != null ? `${c.hours.toFixed(1)} hrs` : '— hrs'})
                              </span>
                            </label>
                          ))}
                        </div>
                        {chosenChoice && getOptionGroupHours != null && setOptionGroupHours != null && (
                          <div className="breakdown-option-group-hours">
                            {isEditingHours ? (
                              <span className="breakdown-option-hours-edit">
                                <label className="breakdown-option-hours-label">
                                  Hours:{' '}
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={editingHoursValue}
                                    onChange={(e) => setEditingHoursValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const n = Number.parseFloat(editingHoursValue)
                                        if (Number.isFinite(n) && n >= 0) {
                                          setOptionGroupHours(unit, group.id, n)
                                          setEditingHoursGroupId(null)
                                        }
                                      }
                                      if (e.key === 'Escape') setEditingHoursGroupId(null)
                                    }}
                                    onBlur={() => {
                                      const n = Number.parseFloat(editingHoursValue)
                                      if (Number.isFinite(n) && n >= 0) {
                                        setOptionGroupHours(unit, group.id, n)
                                      }
                                      setEditingHoursGroupId(null)
                                    }}
                                    autoFocus
                                    aria-label="Hours"
                                  />
                                </label>
                              </span>
                            ) : (
                              <span className="breakdown-option-hours-display">
                                Hours: {effectiveHours != null ? `${effectiveHours.toFixed(1)} ` : '— '}
                                <button
                                  type="button"
                                  className="breakdown-option-hours-edit-link"
                                  onClick={() => {
                                    setEditingHoursGroupId(group.id)
                                    setEditingHoursValue(
                                      effectiveHours != null ? String(effectiveHours) : ''
                                    )
                                  }}
                                >
                                  Edit
                                </button>
                              </span>
                            )}
                          </div>
                        )}
                        {(chosenChoice?.recommended_books?.length ?? 0) > 0 && chosenChoice && (
                          <div className="breakdown-option-recommended-books">
                            {(chosenChoice.recommended_books ?? []).map((book, i) => (
                              <div key={i} className="breakdown-option-book">
                                {book.description != null ? (
                                  <pre className="breakdown-option-book-description">{book.description}</pre>
                                ) : (
                                  <span>
                                    {book.title ?? ''}
                                    {book.author ? ` by ${book.author}` : ''}
                                    {book.contentNote ? ` (${book.contentNote})` : ''}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="breakdown-option-group-note-only">No choices — see note above.</p>
                    )}
                  </div>
                )
              })}
            </section>
          )}
          {showUnitOptions && optionalItems.length > 0 && unit && isOptionalItemIncluded && setOptionalItemIncluded && (
            <section className="breakdown-optional-items" aria-label="Optional work">
              <h5 className="breakdown-optional-items-label">Optional work</h5>
              {optionalItems.map((item) => (
                <label key={item.id} className="breakdown-optional-item">
                  <input
                    type="checkbox"
                    checked={isOptionalItemIncluded(unit, item.id)}
                    onChange={(e) => setOptionalItemIncluded(unit, item.id, e.target.checked)}
                  />
                  <span className="breakdown-optional-item-desc">{item.description}</span>
                  <span className="breakdown-optional-item-meta">
                    {item.hours.toFixed(1)} hrs → {item.subcategory}
                  </span>
                </label>
              ))}
            </section>
          )}
          {grouped.length === 0 && !showUnitOptions ? (
            <p className="breakdown-empty">No category breakdown available.</p>
          ) : grouped.length > 0 ? (
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
                  <tr key={`${g.category}-${s.subcategory}-${s.source ?? ''}`}>
                    {i === 0 && (
                      <td rowSpan={g.subcategories.length} className="breakdown-category">
                        {g.category}
                      </td>
                    )}
                    <td>
                      {s.source ? `${s.subcategory} (${s.source})` : s.subcategory}
                    </td>
                    <td className="breakdown-num">{s.hours.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          ) : null}
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
