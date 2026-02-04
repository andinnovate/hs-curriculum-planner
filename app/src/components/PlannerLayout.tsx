import {
  DndContext,
  type DragEndEvent,
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
}

export function PlannerLayout({
  unitsWithHours,
  assignments,
  lockedYears,
  onToggleLock,
  onSetAssignment,
  onRemoveAssignment,
  onShowUnitDetails,
}: PlannerLayoutProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const unit = active.id as string
    const currentYear = assignments[unit] as Year | undefined
    if (currentYear !== undefined && lockedYears.has(currentYear)) return
    if (over.id === 'pool') {
      onRemoveAssignment(unit)
      return
    }
    if (typeof over.id === 'string' && over.id.startsWith('year-')) {
      const year = parseInt(over.id.replace('year-', ''), 10) as Year
      if (year >= 1 && year <= 4 && !lockedYears.has(year)) onSetAssignment(unit, year)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="planner-layout">
        <aside className="planner-sidebar">
          <UnitPool unitsWithHours={unitsWithHours} assignments={assignments} onShowUnitDetails={onShowUnitDetails} />
        </aside>
        <div className="planner-years">
          {( [1, 2, 3, 4] as const ).map((y) => (
            <YearColumn
              key={y}
              year={y}
              unitsWithHours={unitsWithHours}
              assignments={assignments}
              isLocked={lockedYears.has(y)}
              onToggleLock={onToggleLock}
              onRemove={onRemoveAssignment}
              onShowUnitDetails={onShowUnitDetails}
            />
          ))}
        </div>
      </div>
    </DndContext>
  )
}
