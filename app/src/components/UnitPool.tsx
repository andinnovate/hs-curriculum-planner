import { useEffect, useMemo, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import type { AssignmentState, CurriculumSet, UnitBreakdown, UnitWithHours } from '../types'
import type { Year } from '../types'
import { UnitCard } from './UnitCard'

interface UnitPoolProps {
  unitsWithHours: UnitWithHours[]
  unitBreakdown: UnitBreakdown
  maxUnitHours: number
  highlightCategory?: string | null
  highlightYear?: Year | null
  unitCurriculumMap: Record<string, string>
  curriculumSetsById: Record<string, CurriculumSet>
  onOpenImport: () => void
  showPrepopulate?: boolean
  confirmPrepopulate?: boolean
  onPrepopulateClick?: () => void
  onCancelPrepopulate?: () => void
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
  unitCurriculumMap,
  curriculumSetsById,
  onOpenImport,
  showPrepopulate = false,
  confirmPrepopulate = false,
  onPrepopulateClick,
  onCancelPrepopulate,
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
  const [selectedCurriculumId, setSelectedCurriculumId] = useState('all')
  const [treeView, setTreeView] = useState(false)

  const unassigned = unitsWithHours.filter((u) => !(u.unit in assignments))
  const availableCurriculumIds = useMemo(() => {
    const ids = new Set<string>()
    for (const unit of unassigned) {
      const id = unitCurriculumMap[unit.unit]
      if (id) ids.add(id)
    }
    return Array.from(ids)
  }, [unassigned, unitCurriculumMap])
  const filteredUnassigned =
    selectedCurriculumId === 'all'
      ? unassigned
      : unassigned.filter((u) => unitCurriculumMap[u.unit] === selectedCurriculumId)
  const isEmpty = unassigned.length === 0
  const showFullPool = !isEmpty || showEmptyPool || isOver || unitsWithHours.length === 0
  const hasSelection = selectedUnitIds.size > 0
  const isMultiDrag = activeDragId != null && selectedUnitIds.has(activeDragId) && selectedUnitIds.size > 1

  useEffect(() => {
    if (selectedCurriculumId === 'all') return
    if (!availableCurriculumIds.includes(selectedCurriculumId)) {
      setSelectedCurriculumId('all')
    }
  }, [availableCurriculumIds, selectedCurriculumId])

  const groupedUnassigned = useMemo(() => {
    if (!treeView) return []
    const groups = new Map<string, UnitWithHours[]>()
    for (const unit of filteredUnassigned) {
      const id = unitCurriculumMap[unit.unit]
      const label = id ? curriculumSetsById[id]?.name ?? id : 'Other'
      if (!groups.has(label)) groups.set(label, [])
      groups.get(label)!.push(unit)
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [treeView, filteredUnassigned, unitCurriculumMap, curriculumSetsById])

  const poolContent = (
    <>
      {showPrepopulate && (
        <div className="unit-pool-prepopulate">
          {confirmPrepopulate ? (
            <>
              <span className="app-prepopulate-confirm">Replace current plan?</span>
              <button
                type="button"
                className="app-prepopulate-btn confirm"
                onClick={onPrepopulateClick}
                disabled={!onPrepopulateClick}
              >
                Yes, prepopulate
              </button>
              <button
                type="button"
                className="app-prepopulate-btn"
                onClick={onCancelPrepopulate}
                disabled={!onCancelPrepopulate}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="app-prepopulate-link"
              onClick={onPrepopulateClick}
              disabled={!onPrepopulateClick}
            >
              Prepopulate Gather &apos;Round 4 year plan
            </button>
          )}
        </div>
      )}
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
      <div className="unit-pool-filters" aria-label="Curriculum filters">
        <label className="unit-pool-filter">
          Provider:
          <select
            value={selectedCurriculumId}
            onChange={(e) => setSelectedCurriculumId(e.target.value)}
          >
            <option value="all">All</option>
            {availableCurriculumIds.map((id) => (
              <option key={id} value={id}>
                {curriculumSetsById[id]?.name ?? id}
              </option>
            ))}
          </select>
        </label>
        <label className="unit-pool-filter unit-pool-filter-toggle">
          <input
            type="checkbox"
            checked={treeView}
            onChange={(e) => setTreeView(e.target.checked)}
          />
          Tree view
        </label>
      </div>
      <p className="unit-pool-hint">
        {selectionMode
          ? 'Select units, then drag to a year or use Assign to year below.'
          : 'Drag units into a year, or here to unassign.'}
      </p>
      {unitsWithHours.length === 0 && (
        <div className="unit-pool-empty">
          <p>No curriculum imported yet.</p>
          <button type="button" className="unit-pool-import" onClick={onOpenImport}>
            Import curriculum
          </button>
        </div>
      )}
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
      {treeView ? (
        <div className="unit-pool-tree">
          {groupedUnassigned.map(([label, units]) => (
            <div key={label} className="unit-pool-group">
              <div className="unit-pool-group-title">{label}</div>
              <ul className="unit-pool-list">
                {units.map((u) => (
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
                      providerLogoUrl={curriculumSetsById[unitCurriculumMap[u.unit] ?? '']?.logoUrl ?? null}
                      providerName={curriculumSetsById[unitCurriculumMap[u.unit] ?? '']?.name ?? null}
                      onShowDetails={onShowUnitDetails}
                      needsAttention={unitsNeedingAttention?.has(u.unit)}
                      isPartOfActiveDrag={isMultiDrag && selectedUnitIds.has(u.unit)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="unit-pool-list">
          {filteredUnassigned.map((u) => (
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
                providerLogoUrl={curriculumSetsById[unitCurriculumMap[u.unit] ?? '']?.logoUrl ?? null}
                providerName={curriculumSetsById[unitCurriculumMap[u.unit] ?? '']?.name ?? null}
                onShowDetails={onShowUnitDetails}
                needsAttention={unitsNeedingAttention?.has(u.unit)}
                isPartOfActiveDrag={isMultiDrag && selectedUnitIds.has(u.unit)}
              />
            </li>
          ))}
        </ul>
      )}
      {unitsWithHours.length > 0 && (
        <button type="button" className="unit-pool-import" onClick={onOpenImport}>
          Import curriculum
        </button>
      )}
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
