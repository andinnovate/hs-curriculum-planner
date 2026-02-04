import { useDraggable } from '@dnd-kit/core'
import type { UnitWithHours } from '../types'

interface UnitCardProps {
  unitWithHours: UnitWithHours
}

export function UnitCard({ unitWithHours }: UnitCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: unitWithHours.unit,
    data: { unit: unitWithHours.unit },
  })

  return (
    <div
      ref={setNodeRef}
      className={`unit-card ${isDragging ? 'unit-card-dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <span className="unit-card-name">{unitWithHours.unit}</span>
      <span className="unit-card-hours">{unitWithHours.totalHours.toFixed(1)} hrs</span>
    </div>
  )
}
