import type {
  AssignmentState,
  OptionChoiceState,
  OptionGroupHoursOverrideState,
  OptionalItemInclusionState,
  PlanData,
  PlannerConfig,
  Year,
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
  lockedYears: 'curric-planner-locked-years',
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

export function loadLockedYears(planId: string): Set<Year> {
  return loadLockedYearsFromKey(getPlanStorageKey(planId, 'locked-years'))
}

export function saveLockedYears(planId: string, set: Set<Year>) {
  saveLockedYearsToKey(getPlanStorageKey(planId, 'locked-years'), set)
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

export function normalizePlanData(data: Partial<PlanData> | null | undefined): PlanData {
  return {
    assignments: normalizeAssignments(data?.assignments ?? {}),
    optionChoices: data?.optionChoices ?? {},
    includedOptionalItems: data?.includedOptionalItems ?? {},
    optionGroupHoursOverride: data?.optionGroupHoursOverride ?? {},
    lockedYears: normalizeLockedYears(data?.lockedYears ?? []),
    config: {
      hoursPerCredit: Number(data?.config?.hoursPerCredit) || DEFAULT_HOURS_PER_CREDIT,
      minCreditsForGraduation: Number(data?.config?.minCreditsForGraduation) || DEFAULT_MIN_CREDITS,
    },
  }
}

export function readPlanDataFromStorage(planId: string): PlanData {
  return {
    assignments: loadAssignments(planId),
    optionChoices: loadOptionChoices(planId),
    includedOptionalItems: loadIncludedOptionalItems(planId),
    optionGroupHoursOverride: loadOptionGroupHoursOverride(planId),
    lockedYears: Array.from(loadLockedYears(planId)),
    config: loadConfig(planId),
  }
}

export function writePlanDataToStorage(planId: string, data: PlanData) {
  saveAssignments(planId, data.assignments)
  saveOptionChoices(planId, data.optionChoices)
  saveIncludedOptionalItems(planId, data.includedOptionalItems)
  saveOptionGroupHoursOverride(planId, data.optionGroupHoursOverride)
  saveLockedYears(planId, new Set(data.lockedYears))
  saveConfig(planId, data.config)
}

export function migrateLegacyPlan(planId: string) {
  const legacyAssignments = localStorage.getItem(LEGACY_KEYS.assignments)
  const legacyOptionChoices = localStorage.getItem(LEGACY_KEYS.optionChoices)
  const legacyIncludedOptionalItems = localStorage.getItem(LEGACY_KEYS.includedOptionalItems)
  const legacyOptionGroupHours = localStorage.getItem(LEGACY_KEYS.optionGroupHoursOverride)
  const legacyLockedYears = localStorage.getItem(LEGACY_KEYS.lockedYears)
  const legacyConfig = localStorage.getItem(LEGACY_KEYS.config)

  if (
    !legacyAssignments &&
    !legacyOptionChoices &&
    !legacyIncludedOptionalItems &&
    !legacyOptionGroupHours &&
    !legacyLockedYears &&
    !legacyConfig
  ) {
    return
  }

  const assignmentsKey = getPlanStorageKey(planId, 'assignments')
  const optionChoicesKey = getPlanStorageKey(planId, 'option-choices')
  const includedOptionalItemsKey = getPlanStorageKey(planId, 'included-optional-items')
  const optionGroupHoursKey = getPlanStorageKey(planId, 'option-group-hours')
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
  if (!localStorage.getItem(lockedYearsKey) && legacyLockedYears) {
    localStorage.setItem(lockedYearsKey, legacyLockedYears)
  }
  if (!localStorage.getItem(configKey) && legacyConfig) {
    localStorage.setItem(configKey, legacyConfig)
  }
}
