import type {
  AssignmentState,
  OptionChoiceState,
  OptionGroupHoursOverrideState,
  OptionalItemHoursOverrideState,
  OptionalItemInclusionState,
  PlanData,
  PlannerConfig,
  UnitOrderByYear,
  Year,
  CurriculumUnitRef,
} from './types'
import { DEFAULT_HOURS_PER_CREDIT, DEFAULT_MIN_CREDITS } from './types'

export const PLAN_LIST_KEY = 'curric-planner-plans'
export const DEFAULT_PLAN_NAME = 'My Plan'

const PLAN_PREFIX = 'curric-planner-plan'

const LEGACY_KEYS = {
  assignments: 'curric-planner-assignments',
  optionChoices: 'curric-planner-option-choices',
  includedOptionalItems: 'curric-planner-included-optional-items',
  optionGroupHoursOverride: 'curric-planner-option-group-hours',
  optionalItemHoursOverride: 'curric-planner-optional-item-hours',
  lockedYears: 'curric-planner-locked-years',
  unitOrderByYear: 'curric-planner-unit-order',
  config: 'curric-planner-config',
} as const

export function getPlanStorageKey(planId: string, suffix: string) {
  return `${PLAN_PREFIX}-${planId}-${suffix}`
}

function loadAssignmentsFromKey(key: string): AssignmentState {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    const out: AssignmentState = {}
    for (const [unit, year] of Object.entries(parsed)) {
      if (year >= 1 && year <= 4) out[unit] = year as Year
    }
    return out
  } catch {
    return {}
  }
}

function saveAssignmentsToKey(key: string, state: AssignmentState) {
  localStorage.setItem(key, JSON.stringify(state))
}

function loadOptionChoicesFromKey(key: string): OptionChoiceState {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    return JSON.parse(raw) as OptionChoiceState
  } catch {
    return {}
  }
}

function saveOptionChoicesToKey(key: string, state: OptionChoiceState) {
  localStorage.setItem(key, JSON.stringify(state))
}

function loadIncludedOptionalItemsFromKey(key: string): OptionalItemInclusionState {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    return JSON.parse(raw) as OptionalItemInclusionState
  } catch {
    return {}
  }
}

function saveIncludedOptionalItemsToKey(key: string, state: OptionalItemInclusionState) {
  localStorage.setItem(key, JSON.stringify(state))
}

function loadOptionGroupHoursOverrideFromKey(key: string): OptionGroupHoursOverrideState {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    return JSON.parse(raw) as OptionGroupHoursOverrideState
  } catch {
    return {}
  }
}

function saveOptionGroupHoursOverrideToKey(key: string, state: OptionGroupHoursOverrideState) {
  localStorage.setItem(key, JSON.stringify(state))
}

function loadOptionalItemHoursOverrideFromKey(key: string): OptionalItemHoursOverrideState {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    return JSON.parse(raw) as OptionalItemHoursOverrideState
  } catch {
    return {}
  }
}

function saveOptionalItemHoursOverrideToKey(key: string, state: OptionalItemHoursOverrideState) {
  localStorage.setItem(key, JSON.stringify(state))
}

function loadCurriculumUnitsFromKey(key: string): CurriculumUnitRef[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CurriculumUnitRef[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCurriculumUnitsToKey(key: string, units: CurriculumUnitRef[]) {
  localStorage.setItem(key, JSON.stringify(units))
}

function loadLockedYearsFromKey(key: string): Set<Year> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as number[]
    return new Set(arr.filter((y): y is Year => y >= 1 && y <= 4))
  } catch {
    return new Set()
  }
}

function saveLockedYearsToKey(key: string, set: Set<Year>) {
  localStorage.setItem(key, JSON.stringify(Array.from(set)))
}

function loadUnitOrderByYearFromKey(key: string): UnitOrderByYear {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: UnitOrderByYear = {}
    for (const [yearStr, arr] of Object.entries(parsed)) {
      const y = parseInt(yearStr, 10)
      if (y >= 1 && y <= 4 && Array.isArray(arr)) {
        out[y as Year] = arr.filter((id): id is string => typeof id === 'string')
      }
    }
    return out
  } catch {
    return {}
  }
}

function saveUnitOrderByYearToKey(key: string, state: UnitOrderByYear) {
  localStorage.setItem(key, JSON.stringify(state))
}

function loadConfigFromKey(key: string): PlannerConfig {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      return { hoursPerCredit: DEFAULT_HOURS_PER_CREDIT, minCreditsForGraduation: DEFAULT_MIN_CREDITS }
    }
    const parsed = JSON.parse(raw) as { hoursPerCredit?: number; minCreditsForGraduation?: number }
    return {
      hoursPerCredit: Number(parsed.hoursPerCredit) || DEFAULT_HOURS_PER_CREDIT,
      minCreditsForGraduation: Number(parsed.minCreditsForGraduation) || DEFAULT_MIN_CREDITS,
    }
  } catch {
    return { hoursPerCredit: DEFAULT_HOURS_PER_CREDIT, minCreditsForGraduation: DEFAULT_MIN_CREDITS }
  }
}

function saveConfigToKey(key: string, config: PlannerConfig) {
  localStorage.setItem(key, JSON.stringify(config))
}

export function loadAssignments(planId: string): AssignmentState {
  return loadAssignmentsFromKey(getPlanStorageKey(planId, 'assignments'))
}

export function saveAssignments(planId: string, state: AssignmentState) {
  saveAssignmentsToKey(getPlanStorageKey(planId, 'assignments'), state)
}

export function loadOptionChoices(planId: string): OptionChoiceState {
  return loadOptionChoicesFromKey(getPlanStorageKey(planId, 'option-choices'))
}

export function saveOptionChoices(planId: string, state: OptionChoiceState) {
  saveOptionChoicesToKey(getPlanStorageKey(planId, 'option-choices'), state)
}

export function loadIncludedOptionalItems(planId: string): OptionalItemInclusionState {
  return loadIncludedOptionalItemsFromKey(getPlanStorageKey(planId, 'included-optional-items'))
}

export function saveIncludedOptionalItems(planId: string, state: OptionalItemInclusionState) {
  saveIncludedOptionalItemsToKey(getPlanStorageKey(planId, 'included-optional-items'), state)
}

export function loadOptionGroupHoursOverride(planId: string): OptionGroupHoursOverrideState {
  return loadOptionGroupHoursOverrideFromKey(getPlanStorageKey(planId, 'option-group-hours'))
}

export function saveOptionGroupHoursOverride(planId: string, state: OptionGroupHoursOverrideState) {
  saveOptionGroupHoursOverrideToKey(getPlanStorageKey(planId, 'option-group-hours'), state)
}

export function loadOptionalItemHoursOverride(planId: string): OptionalItemHoursOverrideState {
  return loadOptionalItemHoursOverrideFromKey(getPlanStorageKey(planId, 'optional-item-hours'))
}

export function saveOptionalItemHoursOverride(planId: string, state: OptionalItemHoursOverrideState) {
  saveOptionalItemHoursOverrideToKey(getPlanStorageKey(planId, 'optional-item-hours'), state)
}

export function loadCurriculumUnits(planId: string): CurriculumUnitRef[] {
  const stored = loadCurriculumUnitsFromKey(getPlanStorageKey(planId, 'curriculum-units'))
  if (stored.length > 0) return stored
  const inferredUnits = new Set<string>([
    ...Object.keys(loadAssignments(planId)),
    ...Object.keys(loadOptionChoices(planId)),
    ...Object.keys(loadIncludedOptionalItems(planId)),
    ...Object.keys(loadOptionGroupHoursOverride(planId)),
    ...Object.keys(loadOptionalItemHoursOverride(planId)),
  ])
  if (inferredUnits.size === 0) return []
  return Array.from(inferredUnits).map((unit) => ({
    curriculumId: 'gatherround',
    unit,
  }))
}

export function saveCurriculumUnits(planId: string, units: CurriculumUnitRef[]) {
  saveCurriculumUnitsToKey(getPlanStorageKey(planId, 'curriculum-units'), units)
}

export function loadLockedYears(planId: string): Set<Year> {
  return loadLockedYearsFromKey(getPlanStorageKey(planId, 'locked-years'))
}

export function saveLockedYears(planId: string, set: Set<Year>) {
  saveLockedYearsToKey(getPlanStorageKey(planId, 'locked-years'), set)
}

export function loadUnitOrderByYear(planId: string): UnitOrderByYear {
  return loadUnitOrderByYearFromKey(getPlanStorageKey(planId, 'unit-order'))
}

export function saveUnitOrderByYear(planId: string, state: UnitOrderByYear) {
  saveUnitOrderByYearToKey(getPlanStorageKey(planId, 'unit-order'), state)
}

export function loadConfig(planId: string): PlannerConfig {
  return loadConfigFromKey(getPlanStorageKey(planId, 'config'))
}

export function saveConfig(planId: string, config: PlannerConfig) {
  saveConfigToKey(getPlanStorageKey(planId, 'config'), config)
}

function normalizeAssignments(raw: AssignmentState | null | undefined): AssignmentState {
  const out: AssignmentState = {}
  if (!raw) return out
  for (const [unit, year] of Object.entries(raw)) {
    if (typeof year === 'number' && year >= 1 && year <= 4) out[unit] = year as Year
  }
  return out
}

function normalizeLockedYears(raw: Year[] | null | undefined): Year[] {
  if (!raw) return []
  return raw.filter((year): year is Year => year >= 1 && year <= 4)
}

function normalizeUnitOrderByYear(
  raw: UnitOrderByYear | null | undefined,
  assignments: AssignmentState
): UnitOrderByYear {
  if (!raw || typeof raw !== 'object') return {}
  const out: UnitOrderByYear = {}
  const unitsByYear: Record<Year, Set<string>> = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() }
  for (const [unit, year] of Object.entries(assignments)) {
    if (year >= 1 && year <= 4) unitsByYear[year as Year].add(unit)
  }
  for (const y of [1, 2, 3, 4] as const) {
    const year = y as Year
    const arr = raw[year]
    if (!Array.isArray(arr)) continue
    const valid = arr.filter((id) => typeof id === 'string' && unitsByYear[year].has(id))
    const seen = new Set<string>()
    const ordered: string[] = []
    for (const id of valid) {
      if (seen.has(id)) continue
      seen.add(id)
      ordered.push(id)
    }
    for (const id of unitsByYear[year]) {
      if (!seen.has(id)) ordered.push(id)
    }
    if (ordered.length > 0) out[year] = ordered
  }
  return out
}

function normalizeCurriculumUnits(raw: CurriculumUnitRef[] | null | undefined): CurriculumUnitRef[] {
  if (!Array.isArray(raw)) return []
  const out: CurriculumUnitRef[] = []
  const seen = new Set<string>()
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const curriculumId = String((entry as CurriculumUnitRef).curriculumId ?? '').trim()
    const unit = String((entry as CurriculumUnitRef).unit ?? '').trim()
    if (!curriculumId || !unit) continue
    const key = `${curriculumId}\t${unit}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ curriculumId, unit })
  }
  return out
}

export function normalizePlanData(data: Partial<PlanData> | null | undefined): PlanData {
  const assignments = normalizeAssignments(data?.assignments ?? {})
  const optionChoices = data?.optionChoices ?? {}
  const includedOptionalItems = data?.includedOptionalItems ?? {}
  const optionGroupHoursOverride = data?.optionGroupHoursOverride ?? {}
  const optionalItemHoursOverride = data?.optionalItemHoursOverride ?? {}
  let curriculumUnits = normalizeCurriculumUnits(data?.curriculumUnits ?? [])
  if (curriculumUnits.length === 0) {
    const inferredUnits = new Set<string>([
      ...Object.keys(assignments),
      ...Object.keys(optionChoices),
      ...Object.keys(includedOptionalItems),
      ...Object.keys(optionGroupHoursOverride),
      ...Object.keys(optionalItemHoursOverride),
    ])
    if (inferredUnits.size > 0) {
      curriculumUnits = Array.from(inferredUnits).map((unit) => ({
        curriculumId: 'gatherround',
        unit,
      }))
    }
  }
  const lockedYears = normalizeLockedYears(data?.lockedYears ?? [])
  const unitOrderByYear = normalizeUnitOrderByYear(data?.unitOrderByYear ?? {}, assignments)
  return {
    assignments,
    optionChoices,
    includedOptionalItems,
    optionGroupHoursOverride,
    optionalItemHoursOverride,
    curriculumUnits,
    lockedYears,
    unitOrderByYear,
    config: {
      hoursPerCredit: Number(data?.config?.hoursPerCredit) || DEFAULT_HOURS_PER_CREDIT,
      minCreditsForGraduation: Number(data?.config?.minCreditsForGraduation) || DEFAULT_MIN_CREDITS,
    },
  }
}

export function readPlanDataFromStorage(planId: string): PlanData {
  const assignments = loadAssignments(planId)
  return {
    assignments,
    optionChoices: loadOptionChoices(planId),
    includedOptionalItems: loadIncludedOptionalItems(planId),
    optionGroupHoursOverride: loadOptionGroupHoursOverride(planId),
    optionalItemHoursOverride: loadOptionalItemHoursOverride(planId),
    curriculumUnits: loadCurriculumUnits(planId),
    lockedYears: Array.from(loadLockedYears(planId)),
    unitOrderByYear: normalizeUnitOrderByYear(loadUnitOrderByYear(planId), assignments),
    config: loadConfig(planId),
  }
}

export function writePlanDataToStorage(planId: string, data: PlanData) {
  saveAssignments(planId, data.assignments)
  saveOptionChoices(planId, data.optionChoices)
  saveIncludedOptionalItems(planId, data.includedOptionalItems)
  saveOptionGroupHoursOverride(planId, data.optionGroupHoursOverride)
  saveOptionalItemHoursOverride(planId, data.optionalItemHoursOverride)
  saveCurriculumUnits(planId, data.curriculumUnits)
  saveLockedYears(planId, new Set(data.lockedYears))
  saveUnitOrderByYear(planId, data.unitOrderByYear ?? {})
  saveConfig(planId, data.config)
}

export function clearPlanDataFromStorage(planId: string) {
  const keys = [
    getPlanStorageKey(planId, 'assignments'),
    getPlanStorageKey(planId, 'option-choices'),
    getPlanStorageKey(planId, 'included-optional-items'),
    getPlanStorageKey(planId, 'option-group-hours'),
    getPlanStorageKey(planId, 'optional-item-hours'),
    getPlanStorageKey(planId, 'curriculum-units'),
    getPlanStorageKey(planId, 'locked-years'),
    getPlanStorageKey(planId, 'unit-order'),
    getPlanStorageKey(planId, 'config'),
  ]
  keys.forEach((key) => localStorage.removeItem(key))
}

export function migrateLegacyPlan(planId: string) {
  const legacyAssignments = localStorage.getItem(LEGACY_KEYS.assignments)
  const legacyOptionChoices = localStorage.getItem(LEGACY_KEYS.optionChoices)
  const legacyIncludedOptionalItems = localStorage.getItem(LEGACY_KEYS.includedOptionalItems)
  const legacyOptionGroupHours = localStorage.getItem(LEGACY_KEYS.optionGroupHoursOverride)
  const legacyOptionalItemHours = localStorage.getItem(LEGACY_KEYS.optionalItemHoursOverride)
  const legacyLockedYears = localStorage.getItem(LEGACY_KEYS.lockedYears)
  const legacyConfig = localStorage.getItem(LEGACY_KEYS.config)

  if (
    !legacyAssignments &&
    !legacyOptionChoices &&
    !legacyIncludedOptionalItems &&
    !legacyOptionGroupHours &&
    !legacyOptionalItemHours &&
    !legacyLockedYears &&
    !legacyConfig
  ) {
    return
  }

  const assignmentsKey = getPlanStorageKey(planId, 'assignments')
  const optionChoicesKey = getPlanStorageKey(planId, 'option-choices')
  const includedOptionalItemsKey = getPlanStorageKey(planId, 'included-optional-items')
  const optionGroupHoursKey = getPlanStorageKey(planId, 'option-group-hours')
  const optionalItemHoursKey = getPlanStorageKey(planId, 'optional-item-hours')
  const lockedYearsKey = getPlanStorageKey(planId, 'locked-years')
  const configKey = getPlanStorageKey(planId, 'config')

  if (!localStorage.getItem(assignmentsKey) && legacyAssignments) {
    localStorage.setItem(assignmentsKey, legacyAssignments)
  }
  if (!localStorage.getItem(optionChoicesKey) && legacyOptionChoices) {
    localStorage.setItem(optionChoicesKey, legacyOptionChoices)
  }
  if (!localStorage.getItem(includedOptionalItemsKey) && legacyIncludedOptionalItems) {
    localStorage.setItem(includedOptionalItemsKey, legacyIncludedOptionalItems)
  }
  if (!localStorage.getItem(optionGroupHoursKey) && legacyOptionGroupHours) {
    localStorage.setItem(optionGroupHoursKey, legacyOptionGroupHours)
  }
  if (!localStorage.getItem(optionalItemHoursKey) && legacyOptionalItemHours) {
    localStorage.setItem(optionalItemHoursKey, legacyOptionalItemHours)
  }
  if (!localStorage.getItem(lockedYearsKey) && legacyLockedYears) {
    localStorage.setItem(lockedYearsKey, legacyLockedYears)
  }
  if (!localStorage.getItem(configKey) && legacyConfig) {
    localStorage.setItem(configKey, legacyConfig)
  }
}
