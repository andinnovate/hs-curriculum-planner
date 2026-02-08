import { useMemo, useState } from 'react'
import type { CurriculumSet } from '../types'

interface ImportCurriculumModalProps {
  sets: CurriculumSet[]
  importedIds: Set<string>
  loading: boolean
  error: string | null
  busy?: boolean
  onClose: () => void
  onConfirm: (ids: string[]) => void
}

export function ImportCurriculumModal({
  sets,
  importedIds,
  loading,
  error,
  busy = false,
  onClose,
  onConfirm,
}: ImportCurriculumModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const availableSets = useMemo(
    () => sets.filter((set) => !importedIds.has(set.id)),
    [sets, importedIds]
  )

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    if (selectedIds.size === 0 || busy) return
    onConfirm(Array.from(selectedIds))
  }

  return (
    <div className="import-curriculum-backdrop" role="presentation">
      <div className="import-curriculum-overlay" role="presentation" aria-hidden="true" onClick={onClose} />
      <div className="import-curriculum-panel" role="dialog" aria-label="Import curriculum" onClick={(e) => e.stopPropagation()}>
        <div className="import-curriculum-header">
          <h3>Import curriculum</h3>
          <button type="button" className="import-curriculum-close" onClick={onClose} aria-label="Close import modal">
            ×
          </button>
        </div>
        <p className="import-curriculum-subtitle">
          Choose curriculum sets to add to this plan. Imported units stay with the plan.
        </p>
        {loading ? (
          <p>Loading curriculum sets…</p>
        ) : error ? (
          <p className="import-curriculum-error">Failed to load curriculum sets: {error}</p>
        ) : availableSets.length === 0 ? (
          <p className="import-curriculum-empty">All available curriculum sets are already imported.</p>
        ) : (
          <ul className="import-curriculum-list">
            {availableSets.map((set) => (
              <li key={set.id} className="import-curriculum-item">
                <label className="import-curriculum-card">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(set.id)}
                    onChange={() => toggleSelection(set.id)}
                  />
                  <span className="import-curriculum-card-main">
                    {set.logoUrl && (
                      <img src={set.logoUrl} alt="" className="import-curriculum-logo" aria-hidden="true" />
                    )}
                    <span className="import-curriculum-text">
                      <span className="import-curriculum-name">{set.name}</span>
                      <span className="import-curriculum-provider">{set.provider}</span>
                      {set.description && <span className="import-curriculum-desc">{set.description}</span>}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="import-curriculum-actions">
          <button type="button" className="import-curriculum-cancel" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="import-curriculum-confirm"
            onClick={handleConfirm}
            disabled={busy || selectedIds.size === 0 || loading}
          >
            {busy ? 'Importing…' : 'Import selected'}
          </button>
        </div>
      </div>
    </div>
  )
}
