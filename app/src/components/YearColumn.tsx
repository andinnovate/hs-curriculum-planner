import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { AssignmentState, CurriculumSet, UnitBreakdown, UnitWithHours } from '../types'
import type { Year } from '../types'
import { UnitCard } from './UnitCard'

interface YearColumnProps {
  year: Year
  unitsWithHours: UnitWithHours[]
  unitBreakdown: UnitBreakdown
  maxUnitHours: number
  highlightCategory?: string | null
  highlightYear?: Year | null
  unitCurriculumMap: Record<string, string>
  curriculumSetsById: Record<string, CurriculumSet>
  assignments: AssignmentState
  orderedUnitsInYear: string[]
  isLocked: boolean
  yearDragHandleProps?: React.HTMLAttributes<HTMLSpanElement>
  onToggleLock: (year: Year) => void
  onRemove: (unit: string) => void
  onReorderUnitsInYear: (year: Year, newOrder: string[]) => void
  onShowUnitDetails: (unit: string) => void
  unitsNeedingAttention?: Set<string>
  selectedUnitCount?: number
  onAssignSelectionToYear?: (year: Year) => void
}

function SortableUnitRow({
  unitId,
  year,
  unitsWithHours,
  unitBreakdown,
  maxUnitHours,
  highlightCategory,
  highlightYear,
  unitCurriculumMap,
  curriculumSetsById,
  isLocked,
  onRemove,
  onShowUnitDetails,
  needsAttention,
}: {
  unitId: string
  year: Year
  unitsWithHours: UnitWithHours[]
  unitBreakdown: UnitBreakdown
  maxUnitHours: number
  highlightCategory?: string | null
  highlightYear?: Year | null
  unitCurriculumMap: Record<string, string>
  curriculumSetsById: Record<string, CurriculumSet>
  isLocked: boolean
  onRemove: (unit: string) => void
  onShowUnitDetails: (unit: string) => void
  needsAttention: boolean
}) {
  const u = unitsWithHours.find((x) => x.unit === unitId)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `sort-unit-${year}-${unitId}`,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  if (!u) return null
  return (
    <li ref={setNodeRef} style={style} className="year-column-item">
      {!isLocked && (
        <span
          className="unit-drag-handle"
          {...listeners}
          {...attributes}
          aria-label={`Drag to reorder ${u.unit}`}
          title="Drag to reorder"
        >
          <span className="unit-drag-handle-grip" aria-hidden />
        </span>
      )}
      <UnitCard
        unitWithHours={u}
        breakdownRows={unitBreakdown[u.unit] ?? []}
        scaleMaxHours={maxUnitHours}
        highlightCategory={highlightCategory}
        highlightYear={highlightYear}
        unitYear={year}
        providerLogoUrl={curriculumSetsById[unitCurriculumMap[u.unit] ?? '']?.logoUrl ?? null}
        providerName={curriculumSetsById[unitCurriculumMap[u.unit] ?? '']?.name ?? null}
        onShowDetails={onShowUnitDetails}
        isLocked={isLocked}
        needsAttention={needsAttention}
      />
      {!isLocked && (
        <button
          type="button"
          className="year-column-remove"
          onClick={() => onRemove(u.unit)}
          aria-label={`Remove ${u.unit} from year ${year}`}
          title="Move back to unassigned"
        >
          ×
        </button>
      )}
    </li>
  )
}

export function YearColumn({
  year,
  unitsWithHours,
  unitBreakdown,
  maxUnitHours,
  highlightCategory,
  highlightYear,
  unitCurriculumMap,
  curriculumSetsById,
  assignments,
  orderedUnitsInYear,
  isLocked,
  yearDragHandleProps,
  onToggleLock,
  onRemove,
  onReorderUnitsInYear: _onReorderUnitsInYear,
  onShowUnitDetails,
  unitsNeedingAttention,
  selectedUnitCount = 0,
  onAssignSelectionToYear,
}: YearColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `year-${year}` })

  const unitsInYear = unitsWithHours.filter((u) => assignments[u.unit] === year)
  const canAssignSelection = !isLocked && selectedUnitCount > 0 && onAssignSelectionToYear
  const providerIds = new Set(
    unitsInYear
      .map((u) => unitCurriculumMap[u.unit])
      .filter((id): id is string => Boolean(id))
  )
  const providers = Array.from(providerIds)
    .map((id) => curriculumSetsById[id])
    .filter(Boolean)
  const providerIcons = providers.filter((provider) => Boolean(provider.logoUrl))

  const sortableUnitIds = useMemo(
    () => orderedUnitsInYear.map((id) => `sort-unit-${year}-${id}`),
    [year, orderedUnitsInYear]
  )

  return (
    <div
      ref={setNodeRef}
      className={`year-column ${isOver && !isLocked ? 'year-column-over' : ''} ${isLocked ? 'year-column-locked' : ''}`}
      aria-label={`Year ${year}`}
    >
      <div className="year-column-header">
        {yearDragHandleProps && (
          <span
            className="year-drag-handle"
            {...yearDragHandleProps}
            aria-label={`Drag to reorder year ${year}`}
            title="Drag to reorder year"
          >
            <span className="year-drag-handle-grip" aria-hidden />
          </span>
        )}
        <h3 className="year-column-title">Year {year}</h3>
        {providerIcons.length > 0 && (
          <div className="year-column-providers" aria-label={`Year ${year} curriculum providers`}>
            {providerIcons.map((provider) => (
              <img
                key={provider.id}
                src={provider.logoUrl ?? undefined}
                alt={provider.name}
                title={provider.name}
                className="year-column-provider"
              />
            ))}
          </div>
        )}
        {canAssignSelection && (
          <button
            type="button"
            className="year-column-assign-here"
            onClick={() => onAssignSelectionToYear(year)}
            aria-label={`Assign ${selectedUnitCount} selected units to Year ${year}`}
            title={`Assign ${selectedUnitCount} units here`}
          >
            Assign here
          </button>
        )}
        <button
          type="button"
          className="year-column-lock"
          onClick={() => onToggleLock(year)}
          aria-label={isLocked ? `Unlock year ${year}` : `Lock year ${year}`}
          title={isLocked ? 'Unlock (allow changes)' : 'Lock (prevent changes)'}
        >
          <span className={`year-column-lock-icon ${isLocked ? 'year-column-lock-icon--locked' : 'year-column-lock-icon--unlocked'}`} aria-hidden>
            {isLocked ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 1 1 8 0v4" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V5a4 4 0 0 1 8 0" />
              </svg>
            )}
          </span>
        </button>
      </div>
      <SortableContext items={sortableUnitIds} strategy={verticalListSortingStrategy}>
        <ul className="year-column-list">
          {orderedUnitsInYear.map((unitId) => (
            <SortableUnitRow
              key={unitId}
              unitId={unitId}
              year={year}
              unitsWithHours={unitsWithHours}
              unitBreakdown={unitBreakdown}
              maxUnitHours={maxUnitHours}
              highlightCategory={highlightCategory}
              highlightYear={highlightYear}
              unitCurriculumMap={unitCurriculumMap}
              curriculumSetsById={curriculumSetsById}
              isLocked={isLocked}
              onRemove={onRemove}
              onShowUnitDetails={onShowUnitDetails}
              needsAttention={unitsNeedingAttention?.has(unitId) ?? false}
            />
          ))}
        </ul>
      </SortableContext>
    </div>
  )
}
