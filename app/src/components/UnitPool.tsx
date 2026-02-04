import { useDroppable } from '@dnd-kit/core'
import type { AssignmentState, UnitWithHours } from '../types'
import { UnitCard } from './UnitCard'

interface UnitPoolProps {
  unitsWithHours: UnitWithHours[]
  assignments: AssignmentState
  onShowUnitDetails: (unit: string) => void
}

export function UnitPool({ unitsWithHours, assignments, onShowUnitDetails }: UnitPoolProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' })

  const unassigned = unitsWithHours.filter((u) => !(u.unit in assignments))

  return (
    <div
      ref={setNodeRef}
      className={`unit-pool ${isOver ? 'unit-pool-over' : ''}`}
      aria-label="Unassigned curriculum units"
    >
      <h2 className="unit-pool-title">Curriculum units</h2>
      <p className="unit-pool-hint">Drag units into a year, or here to unassign.</p>
      <ul className="unit-pool-list">
        {unassigned.map((u) => (
          <li key={u.unit}>
            <UnitCard unitWithHours={u} onShowDetails={onShowUnitDetails} />
          </li>
        ))}
      </ul>
    </div>
  )
}
