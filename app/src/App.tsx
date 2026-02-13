import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BreakdownPopup } from './components/BreakdownPopup'
import { getUnitBreakdownRows, getYearBreakdownRows, getYearTotalHours } from './components/breakdownUtils'
import { ConfigPanel } from './components/ConfigPanel'
import { ManagePlansPanel } from './components/ManagePlansPanel'
import { PlanComparePopup } from './components/PlanComparePopup'
import { PlannerLayout } from './components/PlannerLayout'
import { TallyBar } from './components/TallyBar'
import { ImportCurriculumModal } from './components/ImportCurriculumModal'
import { AdminPage } from './components/AdminPage'
import gatherroundPlanJson from './data/gatherround-plan.json'
import { useConfig } from './hooks/useConfig'
import { useCurriculum } from './hooks/useCurriculum'
import { useCurriculumSets } from './hooks/useCurriculumSets'
import { useOptionChoices } from './hooks/useOptionChoices'
import { useAssignments } from './hooks/useAssignments'
import { useLockedYears } from './hooks/useLockedYears'
import { useUnitOrderByYear } from './hooks/useUnitOrderByYear'
import { useCurriculumUnits } from './hooks/useCurriculumUnits'
import { useAuth } from './hooks/useAuth'
import { useAdmin } from './hooks/useAdmin'
import { usePlans } from './hooks/usePlans'
import { usePlanSync } from './hooks/usePlanSync'
import { AuthUI } from './components/AuthUI'
import { readPlanDataFromStorage } from './planStorage'
import {
  computeAssignmentsAfterYearReorder,
  permuteUnitOrderAfterYearReorder,
} from './utils/orderUtils'
import type { AssignmentState, CurriculumUnitRef, PlanData, UnitOrderByYear } from './types'
import type { Year } from './types'
import { fetchCurriculumUnitRefs } from './utils/curriculum'

type GatherroundPlanData =
  | AssignmentState
  | { assignments: AssignmentState; unitOrderByYear?: UnitOrderByYear }

const gatherroundPlanData = gatherroundPlanJson as GatherroundPlanData
const gatherroundPlan: AssignmentState =
  typeof gatherroundPlanData.assignments === 'object'
    ? gatherroundPlanData.assignments
    : (gatherroundPlanData as AssignmentState)
const rawOrder = (gatherroundPlanData as { unitOrderByYear?: Record<string, string[]> }).unitOrderByYear
const gatherroundUnitOrder: UnitOrderByYear = {}
if (rawOrder && typeof rawOrder === 'object') {
  for (const year of [1, 2, 3, 4] as const) {
    const arr = rawOrder[String(year)]
    if (Array.isArray(arr)) gatherroundUnitOrder[year] = arr
  }
}
const gatherroundUnitRefs: CurriculumUnitRef[] = Object.keys(gatherroundPlan).map((unit) => ({
  curriculumId: 'gatherround',
  unit,
}))

type DetailTarget = { type: 'unit'; unit: string } | { type: 'year'; year: Year } | null

function buildPlanSignature(data: PlanData) {
  return JSON.stringify({
    ...data,
    lockedYears: [...data.lockedYears].sort(),
  })
}

function mergeCurriculumUnits(base: CurriculumUnitRef[], incoming: CurriculumUnitRef[]) {
  const seen = new Set<string>()
  const out: CurriculumUnitRef[] = []
  const add = (item: CurriculumUnitRef) => {
    const key = `${item.curriculumId}\t${item.unit}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(item)
  }
  base.forEach(add)
  incoming.forEach(add)
  return out
}

function buildBlankPlanData(config: PlanData['config']): PlanData {
  return {
    assignments: {},
    optionChoices: {},
    includedOptionalItems: {},
    optionGroupHoursOverride: {},
    optionalItemHoursOverride: {},
    curriculumUnits: [],
    lockedYears: [],
    unitOrderByYear: {},
    config,
  }
}

function App() {
  const getRoute = useCallback(() => {
    if (typeof window === 'undefined') return 'planner'
    return window.location.hash === '#/admin' ? 'admin' : 'planner'
  }, [])
  const [activePage, setActivePage] = useState<'planner' | 'admin'>(() => getRoute())
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
    optionalItemHoursOverride,
    getOptionalItemHours,
    setOptionalItemHours,
    isOptionalItemIncluded,
    setOptionalItemIncluded,
    replaceOptionChoices,
    replaceIncludedOptionalItems,
    replaceOptionGroupHoursOverride,
    replaceOptionalItemHoursOverride,
  } = useOptionChoices(currentPlanId)
  const { curriculumUnits, replaceCurriculumUnits } = useCurriculumUnits(currentPlanId)
  const { sets: curriculumSets, loading: curriculumSetsLoading, error: curriculumSetsError } = useCurriculumSets()
  const {
    unitsWithHours,
    unitBreakdown,
    optionGroups,
    optionChoicesByGroupId,
    optionalItemsByUnit,
    unitCurriculumMap,
    unitsWithUnselectedOptionGroups,
    loading,
    error,
  } = useCurriculum(
    optionChoices,
    includedOptionalItems,
    optionGroupHoursOverride,
    optionalItemHoursOverride,
    curriculumUnits
  )

  const curriculumSetsById = useMemo(
    () => Object.fromEntries(curriculumSets.map((set) => [set.id, set])),
    [curriculumSets]
  )
  const unitsNeedingAttention = useMemo(
    () => new Set(unitsWithUnselectedOptionGroups),
    [unitsWithUnselectedOptionGroups]
  )
  const { assignments, setAssignment, removeAssignment, replaceAssignments } = useAssignments(currentPlanId)
  const { lockedYears, toggleLock, replaceLockedYears } = useLockedYears(currentPlanId)
  const { unitOrderByYear, reorderUnitsInYear, replaceUnitOrderByYear } = useUnitOrderByYear(currentPlanId)
  const auth = useAuth()
  const { isAdmin, loading: adminLoading, error: adminError } = useAdmin(auth.user)
  const [confirmPrepopulate, setConfirmPrepopulate] = useState(false)
  const [detailTarget, setDetailTarget] = useState<DetailTarget>(null)
  const [manageOpen, setManageOpen] = useState(false)
  const [comparePlans, setComparePlans] = useState<{ sourceId: string; targetId: string } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [hoverFilter, setHoverFilter] = useState<{ category: string | null; year: Year | null }>({
    category: null,
    year: null,
  })
  const suppressTouchRef = useRef(false)
  const planSwitchRef = useRef(false)
  const prepopulateSignatureByPlanRef = useRef<Record<string, string>>({})
  const markPrepopulatePlanIdRef = useRef<string | null>(null)

  const currentPlanData = useMemo<PlanData>(
    () => ({
      assignments,
      optionChoices,
      includedOptionalItems,
      optionGroupHoursOverride,
      optionalItemHoursOverride,
      curriculumUnits,
      lockedYears: Array.from(lockedYears).sort(),
      unitOrderByYear: unitOrderByYear ?? {},
      config,
    }),
    [
      assignments,
      config,
      includedOptionalItems,
      lockedYears,
      optionChoices,
      optionGroupHoursOverride,
      optionalItemHoursOverride,
      curriculumUnits,
      unitOrderByYear,
    ]
  )

  const applyCurrentPlanData = useCallback(
    (data: PlanData) => {
      suppressTouchRef.current = true
      replaceAssignments(data.assignments)
      replaceOptionChoices(data.optionChoices)
      replaceIncludedOptionalItems(data.includedOptionalItems)
      replaceOptionGroupHoursOverride(data.optionGroupHoursOverride)
      replaceOptionalItemHoursOverride(data.optionalItemHoursOverride)
      replaceCurriculumUnits(data.curriculumUnits)
      replaceLockedYears(data.lockedYears)
      replaceUnitOrderByYear(data.unitOrderByYear ?? {})
      replaceConfig(data.config)
    },
    [
      replaceAssignments,
      replaceConfig,
      replaceIncludedOptionalItems,
      replaceLockedYears,
      replaceOptionChoices,
      replaceOptionGroupHoursOverride,
      replaceOptionalItemHoursOverride,
      replaceCurriculumUnits,
      replaceUnitOrderByYear,
    ]
  )

  const handleReorderYears = useCallback(
    (fromIndex: number, toIndex: number) => {
      replaceAssignments(computeAssignmentsAfterYearReorder(assignments, fromIndex, toIndex))
      replaceUnitOrderByYear(permuteUnitOrderAfterYearReorder(unitOrderByYear ?? {}, fromIndex, toIndex))
    },
    [assignments, replaceAssignments, replaceUnitOrderByYear, unitOrderByYear]
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
    setConfirmPrepopulate(false)
  }, [currentPlanId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleHashChange = () => setActivePage(getRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [getRoute])

  useEffect(() => {
    if (!currentPlanId) return
    const signatureMap = lastSignatureRef.current
    if (markPrepopulatePlanIdRef.current === currentPlanId) {
      prepopulateSignatureByPlanRef.current[currentPlanId] = planSignature
      markPrepopulatePlanIdRef.current = null
    }
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
      replaceCurriculumUnits(mergeCurriculumUnits(curriculumUnits, gatherroundUnitRefs))
      replaceAssignments(gatherroundPlan)
      replaceUnitOrderByYear(gatherroundUnitOrder)
      if (currentPlanId) {
        markPrepopulatePlanIdRef.current = currentPlanId
      }
      setConfirmPrepopulate(false)
    } else {
      setConfirmPrepopulate(true)
    }
  }

  const handleImportCurriculum = async (curriculumIds: string[]) => {
    if (curriculumIds.length === 0 || importing) return
    setImporting(true)
    setImportError(null)
    try {
      const importedUnits = await fetchCurriculumUnitRefs(curriculumIds)
      replaceCurriculumUnits(mergeCurriculumUnits(curriculumUnits, importedUnits))
      setImportOpen(false)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err))
    } finally {
      setImporting(false)
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

  const handleAddBlankPlan = () => {
    const name = `New Plan ${activePlans.length + 1}`
    createPlanFromData(name, buildBlankPlanData(config))
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
  const hasGatherroundImported = curriculumUnits.some((entry) => entry.curriculumId === 'gatherround')
  const lastPrepopulateSignature = currentPlanId ? prepopulateSignatureByPlanRef.current[currentPlanId] : null
  const showPrepopulateLink =
    hasGatherroundImported && (!lastPrepopulateSignature || lastPrepopulateSignature !== planSignature)

  const isAdminPage = activePage === 'admin'

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
          {isAdmin && !isAdminPage && (
            <button
              type="button"
              className="app-prepopulate-link"
              onClick={() => {
                if (typeof window !== 'undefined') window.location.hash = '#/admin'
                setActivePage('admin')
              }}
            >
              Admin
            </button>
          )}
          {isAdminPage && (
            <button
              type="button"
              className="app-prepopulate-link"
              onClick={() => {
                if (typeof window !== 'undefined') window.location.hash = ''
                setActivePage('planner')
              }}
            >
              Back to planner
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
        {isAdminPage ? (
          <AdminPage
            user={auth.user}
            isAdmin={isAdmin}
            adminLoading={adminLoading}
            adminError={adminError}
          />
        ) : loading ? (
          <p>Loading curriculum…</p>
        ) : (
          <PlannerLayout
            unitsWithHours={unitsWithHours}
            unitBreakdown={unitBreakdown}
            unitCurriculumMap={unitCurriculumMap}
            curriculumSetsById={curriculumSetsById}
            onOpenImport={() => {
              setImportError(null)
              setImportOpen(true)
            }}
            showPrepopulate={showPrepopulateLink}
            confirmPrepopulate={confirmPrepopulate}
            onPrepopulateClick={handlePrepopulateClick}
            onCancelPrepopulate={() => setConfirmPrepopulate(false)}
            assignments={assignments}
            lockedYears={lockedYears}
            unitOrderByYear={unitOrderByYear ?? {}}
            onToggleLock={toggleLock}
            onSetAssignment={setAssignment}
            onRemoveAssignment={removeAssignment}
            onReorderYears={handleReorderYears}
            onReorderUnitsInYear={reorderUnitsInYear}
            onShowUnitDetails={(unit) => setDetailTarget({ type: 'unit', unit })}
            unitsNeedingAttention={unitsNeedingAttention}
            highlightCategory={hoverFilter.category}
            highlightYear={hoverFilter.year}
          />
        )}
      </main>
      {!loading && !isAdminPage && (
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
          getOptionalItemHours={detailTarget.type === 'unit' ? getOptionalItemHours : undefined}
          setOptionalItemHours={detailTarget.type === 'unit' ? setOptionalItemHours : undefined}
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
      {importOpen && (
        <ImportCurriculumModal
          sets={curriculumSets}
          importedIds={new Set(curriculumUnits.map((entry) => entry.curriculumId))}
          loading={curriculumSetsLoading}
          error={importError ?? curriculumSetsError}
          busy={importing}
          onClose={() => setImportOpen(false)}
          onConfirm={handleImportCurriculum}
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
          onAddBlankPlan={handleAddBlankPlan}
        />
      )}
    </div>
  )
}

export default App
