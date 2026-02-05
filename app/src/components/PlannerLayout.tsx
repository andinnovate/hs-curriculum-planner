import { useCallback, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { AssignmentState, UnitWithHours } from '../types'
import type { Year } from '../types'
import { UnitPool } from './UnitPool'
import { YearColumn } from './YearColumn'

interface PlannerLayoutProps {
  unitsWithHours: UnitWithHours[]
  assignments: AssignmentState
  lockedYears: Set<Year>
  onToggleLock: (year: Year) => void
  onSetAssignment: (unit: string, year: Year) => void
  onRemoveAssignment: (unit: string) => void
  onShowUnitDetails: (unit: string) => void
  unitsNeedingAttention?: Set<string>
}

export function PlannerLayout({
  unitsWithHours,
  assignments,
  lockedYears,
  onToggleLock,
  onSetAssignment,
  onRemoveAssignment,
  onShowUnitDetails,
  unitsNeedingAttention,
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
    const unit = active.id as string
    setActiveId(null)
    if (!over) return
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

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="planner-layout">
        <aside className="planner-sidebar">
          <UnitPool
            unitsWithHours={unitsWithHours}
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
        <div className="planner-years">
          {([1, 2, 3, 4] as const).map((y) => (
            <YearColumn
              key={y}
              year={y}
              unitsWithHours={unitsWithHours}
              assignments={assignments}
              isLocked={lockedYears.has(y)}
              onToggleLock={onToggleLock}
              onRemove={onRemoveAssignment}
              onShowUnitDetails={onShowUnitDetails}
              unitsNeedingAttention={unitsNeedingAttention}
              selectedUnitCount={selectedUnitIds.size}
              onAssignSelectionToYear={handleAssignSelectionToYear}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeUnit ? (
          activeSelectionForOverlay ? (
            <div className="unit-card unit-card-overlay unit-card-overlay-multi">
              <span className="unit-card-drag">
                <span className="unit-card-name">{activeSelectionForOverlay.size} units</span>
              </span>
            </div>
          ) : (
            <div className="unit-card unit-card-overlay">
              <span className="unit-card-drag">
                <span className="unit-card-name">{activeUnit.unit}</span>
                <span className="unit-card-hours">{activeUnit.totalHours.toFixed(1)} hrs</span>
              </span>
            </div>
          )
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
