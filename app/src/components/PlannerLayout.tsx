import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { AssignmentState, CurriculumSet, UnitBreakdown, UnitOrderByYear, UnitWithHours } from '../types'
import type { Year } from '../types'
import { getOrderedUnitsInYear } from '../utils/orderUtils'
import { UnitPool } from './UnitPool'
import { YearColumn } from './YearColumn'

const YEAR_COL_IDS = ['year-col-1', 'year-col-2', 'year-col-3', 'year-col-4'] as const

interface SortableYearColumnProps {
  year: Year
  unitsWithHours: UnitWithHours[]
  unitBreakdown: UnitBreakdown
  maxUnitHours: number
  highlightCategory?: string | null
  highlightYear?: Year | null
  unitCurriculumMap: Record<string, string>
  curriculumSetsById: Record<string, CurriculumSet>
  assignments: AssignmentState
  unitOrderByYear: UnitOrderByYear
  isLocked: boolean
  anyYearLocked: boolean
  onToggleLock: (year: Year) => void
  onRemove: (unit: string) => void
  onReorderUnitsInYear: (year: Year, newOrder: string[]) => void
  onShowUnitDetails: (unit: string) => void
  unitsNeedingAttention?: Set<string>
  selectedUnitCount?: number
  onAssignSelectionToYear?: (year: Year) => void
}

function SortableYearColumn({
  year,
  unitsWithHours,
  unitBreakdown,
  maxUnitHours,
  highlightCategory,
  highlightYear,
  unitCurriculumMap,
  curriculumSetsById,
  assignments,
  unitOrderByYear,
  isLocked,
  anyYearLocked,
  onToggleLock,
  onRemove,
  onReorderUnitsInYear,
  onShowUnitDetails,
  unitsNeedingAttention,
  selectedUnitCount = 0,
  onAssignSelectionToYear,
}: SortableYearColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `year-col-${year}` })
  const orderedUnitsInYear = useMemo(
    () => getOrderedUnitsInYear(year, assignments, unitOrderByYear, unitsWithHours),
    [year, assignments, unitOrderByYear, unitsWithHours]
  )
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }),
    [transform, transition, isDragging]
  )
  const yearDragHandleProps =
    !isLocked && !anyYearLocked
      ? { ...attributes, ...listeners }
      : undefined
  return (
    <div ref={setNodeRef} style={style}>
      <YearColumn
        year={year}
        unitsWithHours={unitsWithHours}
        unitBreakdown={unitBreakdown}
        maxUnitHours={maxUnitHours}
        highlightCategory={highlightCategory}
        highlightYear={highlightYear}
        unitCurriculumMap={unitCurriculumMap}
        curriculumSetsById={curriculumSetsById}
        assignments={assignments}
        orderedUnitsInYear={orderedUnitsInYear}
        isLocked={isLocked}
        yearDragHandleProps={yearDragHandleProps}
        onToggleLock={onToggleLock}
        onRemove={onRemove}
        onReorderUnitsInYear={onReorderUnitsInYear}
        onShowUnitDetails={onShowUnitDetails}
        unitsNeedingAttention={unitsNeedingAttention}
        selectedUnitCount={selectedUnitCount}
        onAssignSelectionToYear={onAssignSelectionToYear}
      />
    </div>
  )
}

interface PlannerLayoutProps {
  unitsWithHours: UnitWithHours[]
  unitBreakdown: UnitBreakdown
  unitCurriculumMap: Record<string, string>
  curriculumSetsById: Record<string, CurriculumSet>
  assignments: AssignmentState
  lockedYears: Set<Year>
  unitOrderByYear: UnitOrderByYear
  onToggleLock: (year: Year) => void
  onSetAssignment: (unit: string, year: Year) => void
  onRemoveAssignment: (unit: string) => void
  onReorderYears: (fromIndex: number, toIndex: number) => void
  onReorderUnitsInYear: (year: Year, newOrder: string[]) => void
  onShowUnitDetails: (unit: string) => void
  unitsNeedingAttention?: Set<string>
  highlightCategory?: string | null
  highlightYear?: Year | null
  onOpenImport: () => void
  showPrepopulate?: boolean
  confirmPrepopulate?: boolean
  onPrepopulateClick?: () => void
  onCancelPrepopulate?: () => void
}

export function PlannerLayout({
  unitsWithHours,
  unitBreakdown,
  unitCurriculumMap,
  curriculumSetsById,
  assignments,
  lockedYears,
  unitOrderByYear,
  onToggleLock,
  onSetAssignment,
  onRemoveAssignment,
  onReorderYears,
  onReorderUnitsInYear,
  onShowUnitDetails,
  unitsNeedingAttention,
  highlightCategory,
  highlightYear,
  onOpenImport,
  showPrepopulate,
  confirmPrepopulate,
  onPrepopulateClick,
  onCancelPrepopulate,
}: PlannerLayoutProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const activeIdStr = String(active.id)
    setActiveId(null)
    if (!over) return

    // Unit reorder within year (drag from unit handle)
    if (activeIdStr.startsWith('sort-unit-')) {
      const match = activeIdStr.match(/^sort-unit-(\d+)-(.*)$/)
      if (match) {
        const year = parseInt(match[1], 10) as Year
        if (year >= 1 && year <= 4 && !lockedYears.has(year)) {
          const ordered = getOrderedUnitsInYear(year, assignments, unitOrderByYear, unitsWithHours)
          const overIdStr = String(over.id)
          if (overIdStr.startsWith('sort-unit-')) {
            const oldIndex = ordered.indexOf(match[2])
            const overMatch = overIdStr.match(/^sort-unit-\d+-(.*)$/)
            const newIndex = overMatch ? ordered.indexOf(overMatch[1]) : -1
            if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
              const newOrder = arrayMove(ordered, oldIndex, newIndex)
              onReorderUnitsInYear(year, newOrder)
            }
          }
        }
      }
      return
    }

    // Year column reorder (drag from year handle)
    // over.id can be year-col-N (sortable) or year-N (droppable inside column)
    if (activeIdStr.startsWith('year-col-')) {
      const fromYear = parseInt(activeIdStr.replace('year-col-', ''), 10) as Year
      const overIdStr = String(over.id)
      let toYear: Year | null = null
      if (overIdStr.startsWith('year-col-')) {
        toYear = parseInt(overIdStr.replace('year-col-', ''), 10) as Year
      } else if (overIdStr.startsWith('year-')) {
        toYear = parseInt(overIdStr.replace('year-', ''), 10) as Year
      }
      if (toYear != null && fromYear >= 1 && fromYear <= 4 && toYear >= 1 && toYear <= 4 && fromYear !== toYear) {
        const anyLocked = [1, 2, 3, 4].some((y) => lockedYears.has(y as Year))
        if (!anyLocked) onReorderYears(fromYear, toYear)
      }
      return
    }

    // Assign / remove (drag from unit card)
    const unit = activeIdStr
    const currentYear = assignments[unit] as Year | undefined
    if (currentYear !== undefined && lockedYears.has(currentYear)) return
    if (over.id === 'pool') {
      onRemoveAssignment(unit)
      return
    }
    if (typeof over.id === 'string' && over.id.startsWith('year-')) {
      const year = parseInt(over.id.replace('year-', ''), 10) as Year
      if (year >= 1 && year <= 4 && !lockedYears.has(year)) {
        const toAssign = selectedUnitIds.has(unit) && selectedUnitIds.size > 0
          ? selectedUnitIds
          : new Set([unit])
        toAssign.forEach((id) => onSetAssignment(id, year))
        setSelectedUnitIds(new Set())
      }
    }
  }

  const handleToggleUnitSelection = useCallback((unitId: string) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev)
      if (next.has(unitId)) next.delete(unitId)
      else next.add(unitId)
      return next
    })
  }, [])

  const handleAssignSelectionToYear = useCallback(
    (year: Year) => {
      if (year >= 1 && year <= 4 && !lockedYears.has(year)) {
        selectedUnitIds.forEach((id) => onSetAssignment(id, year))
        setSelectedUnitIds(new Set())
      }
    },
    [lockedYears, onSetAssignment, selectedUnitIds]
  )

  const activeUnit = activeId ? unitsWithHours.find((u) => u.unit === activeId) : null
  const activeSelectionForOverlay =
    activeId && selectedUnitIds.has(activeId) && selectedUnitIds.size > 1
      ? selectedUnitIds
      : null
  const maxUnitHours = useMemo(
    () => unitsWithHours.reduce((max, u) => Math.max(max, u.totalHours), 0),
    [unitsWithHours]
  )

  const anyYearLocked = useMemo(
    () => [1, 2, 3, 4].some((y) => lockedYears.has(y as Year)),
    [lockedYears]
  )

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="planner-layout">
        <aside className="planner-sidebar">
          <UnitPool
            unitsWithHours={unitsWithHours}
            unitBreakdown={unitBreakdown}
            maxUnitHours={maxUnitHours}
            highlightCategory={highlightCategory}
            highlightYear={highlightYear}
            unitCurriculumMap={unitCurriculumMap}
            curriculumSetsById={curriculumSetsById}
            onOpenImport={onOpenImport}
            showPrepopulate={showPrepopulate}
            confirmPrepopulate={confirmPrepopulate}
            onPrepopulateClick={onPrepopulateClick}
            onCancelPrepopulate={onCancelPrepopulate}
            assignments={assignments}
            onShowUnitDetails={onShowUnitDetails}
            unitsNeedingAttention={unitsNeedingAttention}
            selectionMode={selectionMode}
            onToggleSelectionMode={() => setSelectionMode((m) => !m)}
            selectedUnitIds={selectedUnitIds}
            onToggleUnitSelection={handleToggleUnitSelection}
            onAssignSelectionToYear={handleAssignSelectionToYear}
            activeDragId={activeId}
          />
        </aside>
        <SortableContext items={[...YEAR_COL_IDS]} strategy={horizontalListSortingStrategy}>
          <div className="planner-years">
            {([1, 2, 3, 4] as const).map((y) => (
              <SortableYearColumn
                key={y}
                year={y}
                unitsWithHours={unitsWithHours}
                unitBreakdown={unitBreakdown}
                maxUnitHours={maxUnitHours}
                highlightCategory={highlightCategory}
                highlightYear={highlightYear}
                unitCurriculumMap={unitCurriculumMap}
                curriculumSetsById={curriculumSetsById}
                assignments={assignments}
                unitOrderByYear={unitOrderByYear}
                isLocked={lockedYears.has(y)}
                anyYearLocked={anyYearLocked}
                onToggleLock={onToggleLock}
                onRemove={onRemoveAssignment}
                onReorderUnitsInYear={onReorderUnitsInYear}
                onShowUnitDetails={onShowUnitDetails}
                unitsNeedingAttention={unitsNeedingAttention}
                selectedUnitCount={selectedUnitIds.size}
                onAssignSelectionToYear={handleAssignSelectionToYear}
              />
            ))}
          </div>
        </SortableContext>
      </div>
      <DragOverlay>
        {activeUnit ? (
          activeSelectionForOverlay ? (
            <div className="unit-card unit-card-overlay unit-card-overlay-multi">
              <span className="unit-card-drag">
                <span className="unit-card-text">
                  <span className="unit-card-name">{activeSelectionForOverlay.size} units</span>
                </span>
              </span>
            </div>
          ) : (
            <div className="unit-card unit-card-overlay">
              <span className="unit-card-drag">
                <span className="unit-card-text">
                  <span className="unit-card-name">{activeUnit.unit}</span>
                  <span className="unit-card-hours">{activeUnit.totalHours.toFixed(1)} hrs</span>
                </span>
              </span>
            </div>
          )
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
