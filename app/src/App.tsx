import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BreakdownPopup,
  getUnitBreakdownRows,
  getYearBreakdownRows,
  getYearTotalHours,
} from './components/BreakdownPopup'
import { ConfigPanel } from './components/ConfigPanel'
import { ManagePlansPanel } from './components/ManagePlansPanel'
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
    activePlans,
    currentPlanId,
    currentPlan,
    setCurrentPlanId,
    renamePlan,
    touchPlan,
    createPlanFromData,
    markPlansSynced,
    deletePlan,
    purgeDeletedPlans,
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
  const [manageOpen, setManageOpen] = useState(false)
  const [comparePlans, setComparePlans] = useState<{ sourceId: string; targetId: string } | null>(null)
  const [hoverFilter, setHoverFilter] = useState<{ category: string | null; year: Year | null }>({
    category: null,
    year: null,
  })
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
    purgeDeletedPlans,
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

  const handleCopyPlan = (planId: string) => {
    const sourcePlan = activePlans.find((plan) => plan.id === planId)
    if (!sourcePlan) return
    const suggestedName = `${sourcePlan.name} Copy`
    const nextName = window.prompt('Name the copied plan', suggestedName)
    if (!nextName) return
    const data = readPlanDataFromStorage(planId)
    createPlanFromData(nextName, data)
  }

  const handleRenamePlanById = (planId: string) => {
    const sourcePlan = activePlans.find((plan) => plan.id === planId)
    if (!sourcePlan) return
    const nextName = window.prompt('Rename plan', sourcePlan.name)
    if (!nextName) return
    renamePlan(planId, nextName)
  }

  const handleDeletePlan = (planId: string) => {
    const plan = activePlans.find((p) => p.id === planId)
    if (!plan) return
    const ok = window.confirm(`Delete "${plan.name}"? This will remove it from this device and sync later.`)
    if (!ok) return
    deletePlan(planId)
  }

  const compareSource = comparePlans?.sourceId ? activePlans.find((plan) => plan.id === comparePlans.sourceId) : null
  const compareTarget = comparePlans?.targetId ? activePlans.find((plan) => plan.id === comparePlans.targetId) : null
  const comparePlanData = comparePlans ? readPlanDataFromStorage(comparePlans.targetId) : null

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
              <button type="button" className="app-plan-manage" onClick={() => setManageOpen(true)}>
                Manage plans
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
            highlightCategory={hoverFilter.category}
            highlightYear={hoverFilter.year}
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
          onTotalCategoryHover={(category) => setHoverFilter(category ? { category, year: null } : { category: null, year: null })}
          onYearCategoryHover={(year, category) => setHoverFilter(category ? { category, year } : { category: null, year: null })}
          activeTotalCategory={hoverFilter.year == null ? hoverFilter.category : null}
          activeYearCategoryByYear={{
            1: hoverFilter.year === 1 ? hoverFilter.category : null,
            2: hoverFilter.year === 2 ? hoverFilter.category : null,
            3: hoverFilter.year === 3 ? hoverFilter.category : null,
            4: hoverFilter.year === 4 ? hoverFilter.category : null,
          }}
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
      {comparePlans && compareSource && compareTarget && comparePlanData && (
        <PlanComparePopup
          currentPlanName={compareSource.name}
          otherPlanName={compareTarget.name}
          currentData={readPlanDataFromStorage(compareSource.id)}
          otherData={comparePlanData}
          onClose={() => setComparePlans(null)}
        />
      )}
      {manageOpen && auth.user && (
        <ManagePlansPanel
          plans={activePlans}
          currentPlanId={currentPlanId}
          onClose={() => setManageOpen(false)}
          onRename={handleRenamePlanById}
          onCopy={handleCopyPlan}
          onDelete={handleDeletePlan}
          onSelectPlan={setCurrentPlanId}
          onCompare={(sourceId, targetId) => {
            setComparePlans({ sourceId, targetId })
            setManageOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default App
