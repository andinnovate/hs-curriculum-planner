import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { AssignmentState, UnitBreakdown, UnitWithHours } from '../types'
import type { Year } from '../types'
import { UnitCard } from './UnitCard'

interface UnitPoolProps {
  unitsWithHours: UnitWithHours[]
  unitBreakdown: UnitBreakdown
  maxUnitHours: number
  highlightCategory?: string | null
  highlightYear?: Year | null
  assignments: AssignmentState
  onShowUnitDetails: (unit: string) => void
  unitsNeedingAttention?: Set<string>
  selectionMode: boolean
  onToggleSelectionMode: () => void
  selectedUnitIds: Set<string>
  onToggleUnitSelection: (unitId: string) => void
  onAssignSelectionToYear: (year: Year) => void
  /** When set, we're dragging; if this id is in selectedUnitIds, dim all selected cards */
  activeDragId: string | null
}

export function UnitPool({
  unitsWithHours,
  unitBreakdown,
  maxUnitHours,
  highlightCategory,
  highlightYear,
  assignments,
  onShowUnitDetails,
  unitsNeedingAttention,
  selectionMode,
  onToggleSelectionMode,
  selectedUnitIds,
  onToggleUnitSelection,
  onAssignSelectionToYear,
  activeDragId,
}: UnitPoolProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })
  const [showEmptyPool, setShowEmptyPool] = useState(false)

  const unassigned = unitsWithHours.filter((u) => !(u.unit in assignments))
  const isEmpty = unassigned.length === 0
  const showFullPool = !isEmpty || showEmptyPool || isOver
  const hasSelection = selectedUnitIds.size > 0
  const isMultiDrag = activeDragId != null && selectedUnitIds.has(activeDragId) && selectedUnitIds.size > 1

  const poolContent = (
    <>
      <div className="unit-pool-header-row">
        <h2 className="unit-pool-title">Curriculum units</h2>
        <button
          type="button"
          className={`unit-pool-edit-toggle ${selectionMode ? 'unit-pool-edit-toggle--active' : ''}`}
          onClick={onToggleSelectionMode}
          aria-label={selectionMode ? 'Exit selection mode' : 'Select units to assign together'}
          title={selectionMode ? 'Exit selection mode' : 'Select units (then drag or use Assign to year)'}
          aria-pressed={selectionMode}
        >
          <span className="unit-pool-edit-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </span>
        </button>
      </div>
      <p className="unit-pool-hint">
        {selectionMode
          ? 'Select units, then drag to a year or use Assign to year below.'
          : 'Drag units into a year, or here to unassign.'}
      </p>
      {selectionMode && hasSelection && (
        <div className="unit-pool-assign-bar">
          <span className="unit-pool-assign-label">{selectedUnitIds.size} selected</span>
          <span className="unit-pool-assign-label">Assign to year:</span>
          <div className="unit-pool-assign-buttons" aria-label="Assign to year">
            {([1, 2, 3, 4] as const).map((y) => (
              <button
                key={y}
                type="button"
                className="unit-pool-assign-year-btn"
                onClick={() => onAssignSelectionToYear(y)}
                aria-label={`Assign ${selectedUnitIds.size} units to Year ${y}`}
              >
                Y{y}
              </button>
            ))}
          </div>
        </div>
      )}
      <ul className="unit-pool-list">
        {unassigned.map((u) => (
          <li key={u.unit} className="unit-pool-list-item">
            {selectionMode && (
              <label className="unit-pool-check-wrap">
                <input
                  type="checkbox"
                  className="unit-pool-check"
                  checked={selectedUnitIds.has(u.unit)}
                  onChange={() => onToggleUnitSelection(u.unit)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${u.unit}`}
                />
              </label>
            )}
            <UnitCard
              unitWithHours={u}
              breakdownRows={unitBreakdown[u.unit] ?? []}
              scaleMaxHours={maxUnitHours}
              highlightCategory={highlightCategory}
              highlightYear={highlightYear}
              unitYear={assignments[u.unit] ?? null}
              onShowDetails={onShowUnitDetails}
              needsAttention={unitsNeedingAttention?.has(u.unit)}
              isPartOfActiveDrag={isMultiDrag && selectedUnitIds.has(u.unit)}
            />
          </li>
        ))}
      </ul>
      {isEmpty && showFullPool && (
        <button
          type="button"
          className="unit-pool-collapse"
          onClick={() => setShowEmptyPool(false)}
          aria-label="Collapse unassigned"
        >
          Collapse
        </button>
      )}
    </>
  )

  return (
    <div
      ref={setNodeRef}
      className={`unit-pool ${isOver ? 'unit-pool-over' : ''} ${!showFullPool ? 'unit-pool--collapsed' : ''}`}
      aria-label="Unassigned curriculum units"
    >
      {showFullPool ? (
        poolContent
      ) : (
        <button
          type="button"
          className="unit-pool-reveal"
          onClick={() => setShowEmptyPool(true)}
          aria-label="Show unassigned area"
          title="Show unassigned area or drag units here to unassign"
        >
          Unassigned — drag here to unassign or click to show
        </button>
      )}
    </div>
  )
}
