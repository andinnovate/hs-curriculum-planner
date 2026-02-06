import { useDraggable } from '@dnd-kit/core'
import type { CategoryBreakdownRow, UnitWithHours } from '../types'
import { CategoryBar } from './CategoryBar'

interface UnitCardProps {
  unitWithHours: UnitWithHours
  breakdownRows?: CategoryBreakdownRow[]
  scaleMaxHours?: number
  onShowDetails?: (unit: string) => void
  isLocked?: boolean
  /** When true, unit has an option group with no selection; show details icon as red (attention needed) */
  needsAttention?: boolean
  /** When true, dim this card (e.g. part of a multi-selection being dragged) */
  isPartOfActiveDrag?: boolean
}

export function UnitCard({ unitWithHours, breakdownRows, scaleMaxHours, onShowDetails, isLocked, needsAttention, isPartOfActiveDrag }: UnitCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: unitWithHours.unit,
    data: { unit: unitWithHours.unit },
  })

  const dragProps = isLocked ? {} : { ...listeners, ...attributes }
  const dimmed = isDragging || isPartOfActiveDrag

  return (
    <div
      ref={setNodeRef}
      className={`unit-card ${dimmed ? 'unit-card-dragging' : ''} ${isLocked ? 'unit-card-locked' : ''}`}
    >
      <span className="unit-card-drag" {...dragProps}>
        <span className="unit-card-text">
          <span className="unit-card-name">{unitWithHours.unit}</span>
          <span className="unit-card-hours">{unitWithHours.totalHours.toFixed(1)} hrs</span>
        </span>
        {breakdownRows && breakdownRows.length > 0 && (
          <CategoryBar
            rows={breakdownRows}
            totalHours={unitWithHours.totalHours}
            scaleMaxHours={scaleMaxHours}
            size="xs"
            className="unit-card-bar"
            ariaLabel={`Category breakdown for ${unitWithHours.unit}`}
          />
        )}
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
