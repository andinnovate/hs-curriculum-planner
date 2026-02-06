import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BreakdownPopup,
  getUnitBreakdownRows,
  getYearBreakdownRows,
  getYearTotalHours,
} from './components/BreakdownPopup'
import { ConfigPanel } from './components/ConfigPanel'
import { PlanComparePopup } from './components/PlanComparePopup'
import { PlannerLayout } from './components/PlannerLayout'
import { TallyBar } from './components/TallyBar'
import gatherroundPlanJson from './data/gatherround-plan.json'
import { useConfig } from './hooks/useConfig'
import { useCurriculum } from './hooks/useCurriculum'
import { useOptionChoices } from './hooks/useOptionChoices'
import { useAssignments } from './hooks/useAssignments'
import { useLockedYears } from './hooks/useLockedYears'
import { useAuth } from './hooks/useAuth'
import { usePlans } from './hooks/usePlans'
import { usePlanSync } from './hooks/usePlanSync'
import { AuthUI } from './components/AuthUI'
import { readPlanDataFromStorage } from './planStorage'
import type { AssignmentState, PlanData } from './types'
import type { Year } from './types'

const gatherroundPlan = gatherroundPlanJson as AssignmentState

type DetailTarget = { type: 'unit'; unit: string } | { type: 'year'; year: Year } | null

function buildPlanSignature(data: PlanData) {
  return JSON.stringify({
    ...data,
    lockedYears: [...data.lockedYears].sort(),
  })
}

function App() {
  const {
    plans,
    currentPlanId,
    currentPlan,
    setCurrentPlanId,
    renamePlan,
    touchPlan,
    createPlanFromData,
    markPlansSynced,
    mergeRemotePlans,
  } = usePlans()
  const { config, setHoursPerCredit, setMinCreditsForGraduation, replaceConfig } = useConfig(currentPlanId)
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
    replaceOptionChoices,
    replaceIncludedOptionalItems,
    replaceOptionGroupHoursOverride,
  } = useOptionChoices(currentPlanId)
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
  const { assignments, setAssignment, removeAssignment, replaceAssignments } = useAssignments(currentPlanId)
  const { lockedYears, toggleLock, replaceLockedYears } = useLockedYears(currentPlanId)
  const auth = useAuth()
  const [confirmPrepopulate, setConfirmPrepopulate] = useState(false)
  const [detailTarget, setDetailTarget] = useState<DetailTarget>(null)
  const [comparePlanId, setComparePlanId] = useState('')
  const [showCompare, setShowCompare] = useState(false)
  const suppressTouchRef = useRef(false)
  const planSwitchRef = useRef(false)

  const currentPlanData = useMemo<PlanData>(
    () => ({
      assignments,
      optionChoices,
      includedOptionalItems,
      optionGroupHoursOverride,
      lockedYears: Array.from(lockedYears).sort(),
      config,
    }),
    [assignments, config, includedOptionalItems, lockedYears, optionChoices, optionGroupHoursOverride]
  )

  const applyCurrentPlanData = useCallback(
    (data: PlanData) => {
      suppressTouchRef.current = true
      replaceAssignments(data.assignments)
      replaceOptionChoices(data.optionChoices)
      replaceIncludedOptionalItems(data.includedOptionalItems)
      replaceOptionGroupHoursOverride(data.optionGroupHoursOverride)
      replaceLockedYears(data.lockedYears)
      replaceConfig(data.config)
    },
    [
      replaceAssignments,
      replaceConfig,
      replaceIncludedOptionalItems,
      replaceLockedYears,
      replaceOptionChoices,
      replaceOptionGroupHoursOverride,
    ]
  )

  const syncStatus = usePlanSync({
    user: auth.user,
    plans,
    mergeRemotePlans,
    markPlansSynced,
    applyCurrentPlanData,
  })

  const lastSignatureRef = useRef<Record<string, string>>({})
  const planSignature = useMemo(() => buildPlanSignature(currentPlanData), [currentPlanData])

  useEffect(() => {
    if (!currentPlanId) return
    const storedSignature = buildPlanSignature(readPlanDataFromStorage(currentPlanId))
    lastSignatureRef.current[currentPlanId] = storedSignature
    planSwitchRef.current = true
  }, [currentPlanId])

  useEffect(() => {
    if (!currentPlanId) return
    const signatureMap = lastSignatureRef.current
    if (planSwitchRef.current) {
      if (signatureMap[currentPlanId] === planSignature) {
        planSwitchRef.current = false
      }
      return
    }
    if (suppressTouchRef.current) {
      suppressTouchRef.current = false
      signatureMap[currentPlanId] = planSignature
      return
    }
    const previous = signatureMap[currentPlanId]
    if (!previous) {
      signatureMap[currentPlanId] = planSignature
      return
    }
    if (previous !== planSignature) {
      signatureMap[currentPlanId] = planSignature
      touchPlan(currentPlanId)
    }
  }, [currentPlanId, planSignature, touchPlan])

  const otherPlans = useMemo(() => plans.filter((plan) => plan.id !== currentPlanId), [plans, currentPlanId])

  useEffect(() => {
    if (otherPlans.length === 0) {
      setComparePlanId('')
      return
    }
    if (comparePlanId && otherPlans.some((plan) => plan.id === comparePlanId)) return
    setComparePlanId(otherPlans[0].id)
  }, [comparePlanId, otherPlans])

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

  const handleRenamePlan = () => {
    if (!currentPlan) return
    const nextName = window.prompt('Rename plan', currentPlan.name)
    if (!nextName) return
    renamePlan(currentPlan.id, nextName)
  }

  const handleCopyPlan = () => {
    if (!currentPlan) return
    const suggestedName = `${currentPlan.name} Copy`
    const nextName = window.prompt('Name the copied plan', suggestedName)
    if (!nextName) return
    createPlanFromData(nextName, currentPlanData)
  }

  const comparePlan = comparePlanId ? plans.find((plan) => plan.id === comparePlanId) : null
  const comparePlanData = comparePlanId ? readPlanDataFromStorage(comparePlanId) : null

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
        {auth.user ? (
          <div className="app-plan-bar">
            <div className="app-plan-info">
              <span className="app-plan-label">Plan:</span>
              <span className="app-plan-name">{currentPlan?.name ?? 'Untitled Plan'}</span>
            </div>
            <div className="app-plan-actions">
              <button type="button" className="app-plan-link" onClick={handleRenamePlan}>
                Rename
              </button>
              <button type="button" className="app-plan-link" onClick={handleCopyPlan}>
                Copy
              </button>
              <label className="app-plan-select">
                Change to:
                <select value={currentPlanId} onChange={(e) => setCurrentPlanId(e.target.value)}>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="app-plan-select">
                Compare:
                <select
                  value={comparePlanId}
                  onChange={(e) => setComparePlanId(e.target.value)}
                  disabled={otherPlans.length === 0}
                >
                  {otherPlans.length === 0 && <option value="">No other plans</option>}
                  {otherPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="app-plan-link"
                disabled={!comparePlanId}
                onClick={() => setShowCompare(true)}
              >
                Compare
              </button>
            </div>
            <div className={`app-sync-status app-sync-status--${syncStatus}`}>
              Sync: {syncStatus === 'synced' ? 'complete' : syncStatus === 'pending' ? 'pending' : 'offline'}
            </div>
          </div>
        ) : auth.loading ? null : (
          <div className="app-plan-note">Sign in or Sign up to store and manage plans.</div>
        )}
      </header>
      <main className="app-main">
        {loading ? (
          <p>Loading curriculum…</p>
        ) : (
          <PlannerLayout
            unitsWithHours={unitsWithHours}
            unitBreakdown={unitBreakdown}
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
          unitBreakdown={unitBreakdown}
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
      {showCompare && comparePlan && comparePlanData && (
        <PlanComparePopup
          currentPlanName={currentPlan?.name ?? 'Current plan'}
          otherPlanName={comparePlan.name}
          currentData={currentPlanData}
          otherData={comparePlanData}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  )
}

export default App
