import { useDraggable } from '@dnd-kit/core'
import type { UnitWithHours } from '../types'

interface UnitCardProps {
  unitWithHours: UnitWithHours
  onShowDetails?: (unit: string) => void
  isLocked?: boolean
  /** When true, unit has an option group with no selection; show details icon as red (attention needed) */
  needsAttention?: boolean
}

export function UnitCard({ unitWithHours, onShowDetails, isLocked, needsAttention }: UnitCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: unitWithHours.unit,
    data: { unit: unitWithHours.unit },
  })

  const dragProps = isLocked ? {} : { ...listeners, ...attributes }

  return (
    <div
      ref={setNodeRef}
      className={`unit-card ${isDragging ? 'unit-card-dragging' : ''} ${isLocked ? 'unit-card-locked' : ''}`}
    >
      <span className="unit-card-drag" {...dragProps}>
        <span className="unit-card-name">{unitWithHours.unit}</span>
        <span className="unit-card-hours">{unitWithHours.totalHours.toFixed(1)} hrs</span>
      </span>
      {onShowDetails && (
        <button
          type="button"
          className={`unit-card-details${needsAttention ? ' unit-card-details-attention' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onShowDetails(unitWithHours.unit)
          }}
          aria-label={needsAttention ? `Show details for ${unitWithHours.unit} (choice needed)` : `Show details for ${unitWithHours.unit}`}
          title={needsAttention ? 'Category breakdown — option choice needed' : 'Show category breakdown'}
        >
          <span aria-hidden>ⓘ</span>
        </button>
      )}
    </div>
  )
}
