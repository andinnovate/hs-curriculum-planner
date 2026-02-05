import { useDroppable } from '@dnd-kit/core'
import type { AssignmentState, UnitWithHours } from '../types'
import type { Year } from '../types'
import { UnitCard } from './UnitCard'

interface YearColumnProps {
  year: Year
  unitsWithHours: UnitWithHours[]
  assignments: AssignmentState
  isLocked: boolean
  onToggleLock: (year: Year) => void
  onRemove: (unit: string) => void
  onShowUnitDetails: (unit: string) => void
  unitsNeedingAttention?: Set<string>
}

export function YearColumn({
  year,
  unitsWithHours,
  assignments,
  isLocked,
  onToggleLock,
  onRemove,
  onShowUnitDetails,
  unitsNeedingAttention,
}: YearColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `year-${year}` })

  const unitsInYear = unitsWithHours.filter((u) => assignments[u.unit] === year)

  return (
    <div
      ref={setNodeRef}
      className={`year-column ${isOver && !isLocked ? 'year-column-over' : ''} ${isLocked ? 'year-column-locked' : ''}`}
      aria-label={`Year ${year}`}
    >
      <div className="year-column-header">
        <h3 className="year-column-title">Year {year}</h3>
        <button
          type="button"
          className="year-column-lock"
          onClick={() => onToggleLock(year)}
          aria-label={isLocked ? `Unlock year ${year}` : `Lock year ${year}`}
          title={isLocked ? 'Unlock (allow changes)' : 'Lock (prevent changes)'}
        >
          <span aria-hidden>{isLocked ? '🔒' : '🔓'}</span>
        </button>
      </div>
      <ul className="year-column-list">
        {unitsInYear.map((u) => (
          <li key={u.unit} className="year-column-item">
            <UnitCard
              unitWithHours={u}
              onShowDetails={onShowUnitDetails}
              isLocked={isLocked}
              needsAttention={unitsNeedingAttention?.has(u.unit)}
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
        ))}
      </ul>
    </div>
  )
}
