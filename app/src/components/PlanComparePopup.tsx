import type { PlanData, Year } from '../types'

type AssignmentDiff = {
  unit: string
  current?: Year
  other?: Year
}

type PlanComparePopupProps = {
  currentPlanName: string
  otherPlanName: string
  currentData: PlanData
  otherData: PlanData
  onClose: () => void
}

function countNestedDiffs<T extends string | number | boolean>(
  left: Record<string, Record<string, T>>,
  right: Record<string, Record<string, T>>
) {
  const units = new Set([...Object.keys(left), ...Object.keys(right)])
  let count = 0
  for (const unit of units) {
    const leftGroup = left[unit] ?? {}
    const rightGroup = right[unit] ?? {}
    const keys = new Set([...Object.keys(leftGroup), ...Object.keys(rightGroup)])
    for (const key of keys) {
      if (leftGroup[key] !== rightGroup[key]) count += 1
    }
  }
  return count
}

function buildAssignmentDiffs(current: PlanData, other: PlanData): AssignmentDiff[] {
  const units = new Set([
    ...Object.keys(current.assignments),
    ...Object.keys(other.assignments),
  ])
  const diffs: AssignmentDiff[] = []
  for (const unit of units) {
    const currentYear = current.assignments[unit]
    const otherYear = other.assignments[unit]
    if (currentYear !== otherYear) {
      diffs.push({ unit, current: currentYear, other: otherYear })
    }
  }
  return diffs.sort((a, b) => a.unit.localeCompare(b.unit))
}

function formatYear(year?: Year) {
  return year ? `Year ${year}` : 'Unassigned'
}

export function PlanComparePopup({
  currentPlanName,
  otherPlanName,
  currentData,
  otherData,
  onClose,
}: PlanComparePopupProps) {
  const assignmentDiffs = buildAssignmentDiffs(currentData, otherData)
  const optionChoiceDiffs = countNestedDiffs(currentData.optionChoices, otherData.optionChoices)
  const optionalItemDiffs = countNestedDiffs(
    currentData.includedOptionalItems,
    otherData.includedOptionalItems
  )
  const optionalItemHoursDiffs = countNestedDiffs(
    currentData.optionalItemHoursOverride,
    otherData.optionalItemHoursOverride
  )
  const optionGroupHoursDiffs = countNestedDiffs(
    currentData.optionGroupHoursOverride,
    otherData.optionGroupHoursOverride
  )
  const currentLocked = new Set(currentData.lockedYears)
  const otherLocked = new Set(otherData.lockedYears)
  const lockedOnlyCurrent = Array.from(currentLocked).filter((year) => !otherLocked.has(year))
  const lockedOnlyOther = Array.from(otherLocked).filter((year) => !currentLocked.has(year))

  const configDiffs = [
    currentData.config.hoursPerCredit !== otherData.config.hoursPerCredit
      ? {
          label: 'Hours per credit',
          current: String(currentData.config.hoursPerCredit),
          other: String(otherData.config.hoursPerCredit),
        }
      : null,
    currentData.config.minCreditsForGraduation !== otherData.config.minCreditsForGraduation
      ? {
          label: 'Min credits',
          current: String(currentData.config.minCreditsForGraduation),
          other: String(otherData.config.minCreditsForGraduation),
        }
      : null,
  ].filter(Boolean) as { label: string; current: string; other: string }[]

  return (
    <div className="breakdown-popover-backdrop" onClick={onClose} role="presentation">
      <div
        className="breakdown-popover plan-compare-popover"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Compare ${currentPlanName} to ${otherPlanName}`}
      >
        <div className="breakdown-popover-header">
          <h4 className="breakdown-popover-title">Compare plans</h4>
          <button type="button" className="breakdown-popover-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="breakdown-popover-body plan-compare-body">
          <div className="plan-compare-heading">
            <span className="plan-compare-name">{currentPlanName}</span>
            <span className="plan-compare-separator">vs.</span>
            <span className="plan-compare-name">{otherPlanName}</span>
          </div>

          <div className="plan-compare-summary">
            <div>Assignment differences: {assignmentDiffs.length}</div>
            <div>Option choice differences: {optionChoiceDiffs}</div>
            <div>Optional item differences: {optionalItemDiffs}</div>
            <div>Optional item hours differences: {optionalItemHoursDiffs}</div>
            <div>Option hours differences: {optionGroupHoursDiffs}</div>
            <div>
              Locked year differences:{' '}
              {lockedOnlyCurrent.length + lockedOnlyOther.length}
            </div>
            <div>Config differences: {configDiffs.length}</div>
          </div>

          {configDiffs.length > 0 && (
            <div className="plan-compare-config">
              <h5 className="plan-compare-subtitle">Config</h5>
              <table className="plan-compare-table">
                <thead>
                  <tr>
                    <th>Setting</th>
                    <th>{currentPlanName}</th>
                    <th>{otherPlanName}</th>
                  </tr>
                </thead>
                <tbody>
                  {configDiffs.map((diff) => (
                    <tr key={diff.label}>
                      <td>{diff.label}</td>
                      <td>{diff.current}</td>
                      <td>{diff.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="plan-compare-section">
            <h5 className="plan-compare-subtitle">Assignments</h5>
            {assignmentDiffs.length === 0 ? (
              <p className="plan-compare-empty">No assignment differences.</p>
            ) : (
              <table className="plan-compare-table">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>{currentPlanName}</th>
                    <th>{otherPlanName}</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentDiffs.slice(0, 24).map((diff) => (
                    <tr key={diff.unit}>
                      <td>{diff.unit}</td>
                      <td>{formatYear(diff.current)}</td>
                      <td>{formatYear(diff.other)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {assignmentDiffs.length > 24 && (
              <p className="plan-compare-note">
                Showing first 24 differences. Adjust assignments to see more.
              </p>
            )}
          </div>

          {(lockedOnlyCurrent.length > 0 || lockedOnlyOther.length > 0) && (
            <div className="plan-compare-section">
              <h5 className="plan-compare-subtitle">Locked years</h5>
              {lockedOnlyCurrent.length > 0 && (
                <div>
                  {currentPlanName} only: {lockedOnlyCurrent.join(', ')}
                </div>
              )}
              {lockedOnlyOther.length > 0 && (
                <div>
                  {otherPlanName} only: {lockedOnlyOther.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
