import { useMemo, useState } from 'react'
import type { PlanMeta } from '../types'

type ManagePlansPanelProps = {
  plans: PlanMeta[]
  currentPlanId: string
  onClose: () => void
  onRename: (planId: string) => void
  onCopy: (planId: string) => void
  onDelete: (planId: string) => void
  onSelectPlan: (planId: string) => void
  onCompare: (sourceId: string, targetId: string) => void
  onAddBlankPlan: () => void
}

export function ManagePlansPanel({
  plans,
  currentPlanId,
  onClose,
  onRename,
  onCopy,
  onDelete,
  onSelectPlan,
  onCompare,
  onAddBlankPlan,
}: ManagePlansPanelProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; minWidth: number } | null>(null)
  const [compareSourceId, setCompareSourceId] = useState<string | null>(null)
  const [compareTargetId, setCompareTargetId] = useState<string | null>(null)

  const canDelete = plans.length > 1

  const compareTargets = useMemo(() => {
    if (!compareSourceId) return []
    return plans.filter((plan) => plan.id !== compareSourceId)
  }, [compareSourceId, plans])

  return (
    <div className="manage-plans-backdrop" role="presentation">
      <div
        className="manage-plans-overlay"
        role="presentation"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="manage-plans-panel"
        role="dialog"
        aria-label="Manage plans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="manage-plans-header">
          <h3>Manage plans</h3>
          <button type="button" className="manage-plans-close" onClick={onClose} aria-label="Close manage plans">
            ×
          </button>
        </div>
        <p className="manage-plans-subtitle">
          Rename, copy, compare, or delete plans. Select a plan to make it current.
        </p>
        <ul className="manage-plans-list" onScroll={() => setOpenMenuId(null)}>
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId
            const isCompareSource = compareSourceId === plan.id
            return (
              <li key={plan.id} className={`manage-plan-row ${isCurrent ? 'manage-plan-row--current' : ''}`}>
                <div className="manage-plan-main">
                  <button
                    type="button"
                    className="manage-plan-name"
                    onClick={() => onSelectPlan(plan.id)}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    {plan.name}
                  </button>
                  {isCurrent && <span className="manage-plan-badge">Current</span>}
                </div>
                <div className="manage-plan-actions">
                  {!isCurrent && (
                    <button
                      type="button"
                      className="manage-plan-action"
                      onClick={() => onSelectPlan(plan.id)}
                    >
                      Make current
                    </button>
                  )}
                  <div className="manage-plan-menu-wrap">
                    <button
                      type="button"
                      className="manage-plan-menu-btn"
                      aria-expanded={openMenuId === plan.id}
                      aria-label={`Plan actions for ${plan.name}`}
                      onClick={(event) => {
                        const next = openMenuId === plan.id ? null : plan.id
                        if (!next) {
                          setOpenMenuId(null)
                          return
                        }
                        const buttonRect = event.currentTarget.getBoundingClientRect()
                        const menuHeight = 176
                        const menuWidth = 200
                        const viewportHeight = window.innerHeight
                        const viewportWidth = window.innerWidth
                        const spaceBelow = viewportHeight - buttonRect.bottom
                        const spaceAbove = buttonRect.top
                        const shouldOpenUp = spaceBelow < menuHeight && spaceAbove > spaceBelow
                        const preferredTop = shouldOpenUp
                          ? Math.max(8, buttonRect.top - menuHeight - 6)
                          : Math.min(viewportHeight - menuHeight - 8, buttonRect.bottom + 6)
                        const left = Math.min(buttonRect.left, viewportWidth - menuWidth - 8)
                        setMenuPosition({
                          top: preferredTop,
                          left: Math.max(8, left),
                          minWidth: buttonRect.width,
                        })
                        setOpenMenuId(next)
                      }}
                    >
                      ⋯
                    </button>
                    {openMenuId === plan.id && (
                      <div
                        className="manage-plan-menu"
                        role="menu"
                        style={{
                          top: menuPosition?.top,
                          left: menuPosition?.left,
                          minWidth: Math.max(140, menuPosition?.minWidth ?? 0),
                        }}
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null)
                            onRename(plan.id)
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null)
                            onCopy(plan.id)
                          }}
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenMenuId(null)
                            setCompareSourceId(plan.id)
                            const defaultTarget =
                              plans.find((p) => p.id !== plan.id)?.id ?? null
                            setCompareTargetId(defaultTarget)
                          }}
                        >
                          Compare
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={!canDelete}
                          onClick={() => {
                            setOpenMenuId(null)
                            onDelete(plan.id)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {isCompareSource && compareTargets.length > 0 && (
                  <div className="manage-plan-compare">
                    <label>
                      Compare to
                      <select
                        value={compareTargetId ?? compareTargets[0]?.id ?? ''}
                        onChange={(e) => setCompareTargetId(e.target.value)}
                      >
                        {compareTargets.map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="manage-plan-action"
                      onClick={() => {
                        const targetId = compareTargetId ?? compareTargets[0]?.id
                        if (!targetId) return
                        setCompareSourceId(null)
                        onCompare(plan.id, targetId)
                      }}
                    >
                      Open compare
                    </button>
                    <button
                      type="button"
                      className="manage-plan-link"
                      onClick={() => setCompareSourceId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {isCompareSource && compareTargets.length === 0 && (
                  <div className="manage-plan-compare">
                    <span className="manage-plan-empty">No other plans to compare.</span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <div className="manage-plans-footer">
          {!canDelete && (
            <p className="manage-plan-hint">You must keep at least one plan.</p>
          )}
          <button type="button" className="manage-plan-link manage-plan-add" onClick={onAddBlankPlan}>
            Add a blank plan
          </button>
        </div>
      </div>
    </div>
  )
}
