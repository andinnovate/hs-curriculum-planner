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
  selectedUnitCount?: number
  onAssignSelectionToYear?: (year: Year) => void
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
  selectedUnitCount = 0,
  onAssignSelectionToYear,
}: YearColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `year-${year}` })

  const unitsInYear = unitsWithHours.filter((u) => assignments[u.unit] === year)
  const canAssignSelection = !isLocked && selectedUnitCount > 0 && onAssignSelectionToYear

  return (
    <div
      ref={setNodeRef}
      className={`year-column ${isOver && !isLocked ? 'year-column-over' : ''} ${isLocked ? 'year-column-locked' : ''}`}
      aria-label={`Year ${year}`}
    >
      <div className="year-column-header">
        <h3 className="year-column-title">Year {year}</h3>
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
