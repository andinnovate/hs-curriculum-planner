import { useDraggable } from '@dnd-kit/core'
import type { UnitWithHours } from '../types'

interface UnitCardProps {
  unitWithHours: UnitWithHours
  onShowDetails?: (unit: string) => void
}

export function UnitCard({ unitWithHours, onShowDetails }: UnitCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: unitWithHours.unit,
    data: { unit: unitWithHours.unit },
  })

  return (
    <div
      ref={setNodeRef}
      className={`unit-card ${isDragging ? 'unit-card-dragging' : ''}`}
    >
      <span className="unit-card-drag" {...listeners} {...attributes}>
        <span className="unit-card-name">{unitWithHours.unit}</span>
        <span className="unit-card-hours">{unitWithHours.totalHours.toFixed(1)} hrs</span>
      </span>
      {onShowDetails && (
        <button
          type="button"
          className="unit-card-details"
          onClick={(e) => {
            e.stopPropagation()
            onShowDetails(unitWithHours.unit)
          }}
          aria-label={`Show details for ${unitWithHours.unit}`}
          title="Show category breakdown"
        >
          <span aria-hidden>ⓘ</span>
        </button>
      )}
    </div>
  )
}
