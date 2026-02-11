import { Fragment, useMemo, useState } from 'react'
import type { CategoryBreakdownRow } from '../types'
import type { UnitOptionChoice, UnitOptionGroup, UnitOptionalItem } from '../types'
import { getCategoryColor, rollupCategory } from './categoryUtils'

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

/** Parse note text: normalize escaped \\n (or \\\\n etc.) to newlines and return lines for display */
function parseNoteLines(note: string): string[] {
  const normalized = note.replace(/\\+n/g, '\n')
  return normalized.split('\n')
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
  const breakdownTotal = useMemo(() => {
    if (totalHours > 0) return totalHours
    return grouped.reduce((sum, g) => sum + g.total, 0)
  }, [grouped, totalHours])
  const showUnitOptions = unit && (optionGroups.length > 0 || optionalItems.length > 0)
  const optionalItemsByType = useMemo(() => {
    const map = new Map<string, UnitOptionalItem[]>()
    for (const item of optionalItems) {
      const key = item.type?.trim() || 'Optional work'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return Array.from(map.entries())
  }, [optionalItems])
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
                    {group.note && (() => {
                      const lines = parseNoteLines(group.note!)
                      return (
                        <div className="breakdown-option-group-note">
                          {lines.map((line, i) => (
                            <Fragment key={i}>
                              {line}
                              {i < lines.length - 1 && <br />}
                            </Fragment>
                          ))}
                        </div>
                      )
                    })()}
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
                            {(chosenChoice.recommended_books ?? []).map((line, i) => (
                              <div key={i} className="breakdown-option-book">
                                <span>{line}</span>
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
              {optionalItemsByType.map(([typeLabel, items]) => (
                <div key={typeLabel} className="breakdown-optional-type">
                  <h5 className="breakdown-optional-items-label">{typeLabel}</h5>
                  {items.map((item) => (
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
                </div>
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
                        <div className="breakdown-category-label">
                          <span className="breakdown-category-name">{g.category}</span>
                          <span className="breakdown-category-bar">
                            <span
                              className="breakdown-category-bar-fill"
                              style={{
                                width: `${breakdownTotal > 0 ? Math.min(100, Math.max(0, (g.total / breakdownTotal) * 100)) : 0}%`,
                                backgroundColor: getCategoryColor(rollupCategory(g.category)),
                              }}
                            />
                          </span>
                        </div>
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
