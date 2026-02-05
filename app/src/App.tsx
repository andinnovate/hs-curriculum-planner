import { useMemo, useState } from 'react'
import {
  BreakdownPopup,
  getUnitBreakdownRows,
  getYearBreakdownRows,
  getYearTotalHours,
} from './components/BreakdownPopup'
import { ConfigPanel } from './components/ConfigPanel'
import { PlannerLayout } from './components/PlannerLayout'
import { TallyBar } from './components/TallyBar'
import gatherroundPlanJson from './data/gatherround-plan.json'
import { useConfig } from './hooks/useConfig'
import { useCurriculum } from './hooks/useCurriculum'
import { useOptionChoices } from './hooks/useOptionChoices'
import { useAssignments } from './hooks/useAssignments'
import { useLockedYears } from './hooks/useLockedYears'
import { useAuth } from './hooks/useAuth'
import { AuthUI } from './components/AuthUI'
import type { AssignmentState } from './types'
import type { Year } from './types'

const gatherroundPlan = gatherroundPlanJson as AssignmentState

type DetailTarget = { type: 'unit'; unit: string } | { type: 'year'; year: Year } | null

function App() {
  const { config, setHoursPerCredit, setMinCreditsForGraduation } = useConfig()
  const {
    optionChoices,
    includedOptionalItems,
    optionGroupHoursOverride,
    setChoice,
    clearChoice,
    getChoice,
    getOptionGroupHours,
    setOptionGroupHours,
    isOptionalItemIncluded,
    setOptionalItemIncluded,
  } = useOptionChoices()
  const {
    unitsWithHours,
    unitBreakdown,
    optionGroups,
    optionChoicesByGroupId,
    optionalItemsByUnit,
    unitsWithUnselectedOptionGroups,
    loading,
    error,
  } = useCurriculum(optionChoices, includedOptionalItems, optionGroupHoursOverride)

  const unitsNeedingAttention = useMemo(
    () => new Set(unitsWithUnselectedOptionGroups),
    [unitsWithUnselectedOptionGroups]
  )
  const { assignments, setAssignment, removeAssignment, replaceAssignments } = useAssignments()
  const { lockedYears, toggleLock } = useLockedYears()
  const auth = useAuth()
  const [confirmPrepopulate, setConfirmPrepopulate] = useState(false)
  const [detailTarget, setDetailTarget] = useState<DetailTarget>(null)

  if (error) {
    return (
      <div style={{ padding: '1rem', color: 'crimson' }}>
        Failed to load curriculum: {error}
      </div>
    )
  }

  const handlePrepopulateClick = () => {
    if (confirmPrepopulate) {
      replaceAssignments(gatherroundPlan)
      setConfirmPrepopulate(false)
    } else {
      setConfirmPrepopulate(true)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Homeschool 4-Year Planner</h1>
        <div className="app-header-actions">
          <AuthUI
            user={auth.user}
            loading={auth.loading}
            error={auth.error}
            onSignIn={auth.signIn}
            onSignUp={auth.signUp}
            onSignOut={auth.signOut}
            onClearError={auth.clearError}
          />
          {confirmPrepopulate ? (
            <>
              <span className="app-prepopulate-confirm">Replace current plan?</span>
              <button type="button" className="app-prepopulate-btn confirm" onClick={handlePrepopulateClick}>
                Yes, prepopulate
              </button>
              <button type="button" className="app-prepopulate-btn" onClick={() => setConfirmPrepopulate(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="app-prepopulate-link" onClick={handlePrepopulateClick}>
              Prepopulate Gather &apos;Round 4 year plan
            </button>
          )}
        </div>
        <ConfigPanel
          hoursPerCredit={config.hoursPerCredit}
          minCreditsForGraduation={config.minCreditsForGraduation}
          onHoursPerCreditChange={setHoursPerCredit}
          onMinCreditsChange={setMinCreditsForGraduation}
        />
      </header>
      <main className="app-main">
        {loading ? (
          <p>Loading curriculum…</p>
        ) : (
          <PlannerLayout
            unitsWithHours={unitsWithHours}
            assignments={assignments}
            lockedYears={lockedYears}
            onToggleLock={toggleLock}
            onSetAssignment={setAssignment}
            onRemoveAssignment={removeAssignment}
            onShowUnitDetails={(unit) => setDetailTarget({ type: 'unit', unit })}
            unitsNeedingAttention={unitsNeedingAttention}
          />
        )}
      </main>
      {!loading && (
        <TallyBar
          unitsWithHours={unitsWithHours}
          assignments={assignments}
          hoursPerCredit={config.hoursPerCredit}
          minCreditsForGraduation={config.minCreditsForGraduation}
          onShowYearDetails={(year) => setDetailTarget({ type: 'year', year })}
        />
      )}
      {detailTarget && (
        <BreakdownPopup
          title={detailTarget.type === 'unit' ? detailTarget.unit : `Year ${detailTarget.year} breakdown`}
          rows={
            detailTarget.type === 'unit'
              ? getUnitBreakdownRows(detailTarget.unit, unitBreakdown)
              : getYearBreakdownRows(detailTarget.year, assignments, unitBreakdown)
          }
          totalHours={
            detailTarget.type === 'unit'
              ? unitsWithHours.find((u) => u.unit === detailTarget.unit)?.totalHours ?? 0
              : getYearTotalHours(detailTarget.year, assignments, unitsWithHours)
          }
          onClose={() => setDetailTarget(null)}
          unit={detailTarget.type === 'unit' ? detailTarget.unit : undefined}
          optionGroups={detailTarget.type === 'unit' ? optionGroups.filter((g) => g.unit === detailTarget.unit) : undefined}
          optionChoicesByGroupId={detailTarget.type === 'unit' ? optionChoicesByGroupId : undefined}
          optionalItems={detailTarget.type === 'unit' ? (optionalItemsByUnit[detailTarget.unit] ?? []) : undefined}
          getChoice={detailTarget.type === 'unit' ? getChoice : undefined}
          setChoice={detailTarget.type === 'unit' ? setChoice : undefined}
          clearChoice={detailTarget.type === 'unit' ? clearChoice : undefined}
          getOptionGroupHours={detailTarget.type === 'unit' ? getOptionGroupHours : undefined}
          setOptionGroupHours={detailTarget.type === 'unit' ? setOptionGroupHours : undefined}
          isOptionalItemIncluded={detailTarget.type === 'unit' ? isOptionalItemIncluded : undefined}
          setOptionalItemIncluded={detailTarget.type === 'unit' ? setOptionalItemIncluded : undefined}
        />
      )}
    </div>
  )
}

export default App
