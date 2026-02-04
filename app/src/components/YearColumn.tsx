import { useDroppable } from '@dnd-kit/core'
import type { AssignmentState, UnitWithHours } from '../types'
import type { Year } from '../types'
import { UnitCard } from './UnitCard'

interface YearColumnProps {
  year: Year
  unitsWithHours: UnitWithHours[]
  assignments: AssignmentState
  onRemove: (unit: string) => void
  onShowUnitDetails: (unit: string) => void
}

export function YearColumn({ year, unitsWithHours, assignments, onRemove, onShowUnitDetails }: YearColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `year-${year}` })

  const unitsInYear = unitsWithHours.filter((u) => assignments[u.unit] === year)

  return (
    <div
      ref={setNodeRef}
      className={`year-column ${isOver ? 'year-column-over' : ''}`}
      aria-label={`Year ${year}`}
    >
      <h3 className="year-column-title">Year {year}</h3>
      <ul className="year-column-list">
        {unitsInYear.map((u) => (
          <li key={u.unit} className="year-column-item">
            <UnitCard unitWithHours={u} onShowDetails={onShowUnitDetails} />
            <button
              type="button"
              className="year-column-remove"
              onClick={() => onRemove(u.unit)}
              aria-label={`Remove ${u.unit} from year ${year}`}
              title="Move back to unassigned"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
