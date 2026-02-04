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
  onSetAssignment: (unit: string, year: Year) => void
  onRemoveAssignment: (unit: string) => void
}

export function PlannerLayout({
  unitsWithHours,
  assignments,
  onSetAssignment,
  onRemoveAssignment,
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
    if (over.id === 'pool') {
      onRemoveAssignment(unit)
      return
    }
    if (typeof over.id === 'string' && over.id.startsWith('year-')) {
      const year = parseInt(over.id.replace('year-', ''), 10) as Year
      if (year >= 1 && year <= 4) onSetAssignment(unit, year)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="planner-layout">
        <aside className="planner-sidebar">
          <UnitPool unitsWithHours={unitsWithHours} assignments={assignments} />
        </aside>
        <div className="planner-years">
          {( [1, 2, 3, 4] as const ).map((y) => (
            <YearColumn
              key={y}
              year={y}
              unitsWithHours={unitsWithHours}
              assignments={assignments}
              onRemove={onRemoveAssignment}
            />
          ))}
        </div>
      </div>
    </DndContext>
  )
}
