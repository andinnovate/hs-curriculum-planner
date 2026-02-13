export type Year = 1 | 2 | 3 | 4

export interface UnitWithHours {
  unit: string
  totalHours: number
}

export interface CategoryBreakdownRow {
  category: string
  subcategory: string
  hours: number
  /** When set, show in UI as "Subcategory (source)" e.g. "British Literature (Required Reading: 20 hrs)" or "Physics (Optional lab: 5 hrs)" */
  source?: string
}

/** Per-unit list of category/subcategory/hours rows from unit_subcategory_hours */
export type UnitBreakdown = Record<string, CategoryBreakdownRow[]>

export type AssignmentState = Record<string, Year>

/** Optional per-year ordered list of unit ids (for drag-to-reorder within a year). */
export type UnitOrderByYear = Partial<Record<Year, string[]>>

/** Option group (e.g. "Required Reading" for a unit); choices are mutually exclusive */
export interface UnitOptionGroup {
  id: string
  unit: string
  category: string
  label: string
  curriculumId?: string
  /** Body/instructions from curriculum (e.g. "1 hour per day; add to Language Arts") */
  note?: string | null
}

/** One choice within an option group (subcategory + hours + optional reading list) */
export interface UnitOptionChoice {
  id: string
  option_group_id: string
  subcategory: string
  /** Null when not specified in curriculum (user can override in UI) */
  hours: number | null
  /** Newline-separated lines stored as array of strings (e.g. ["- Book A", "- Book B"]) */
  recommended_books: string[]
}

/** Optional item (Pattern B): e.g. lab work; user can include/exclude */
export interface UnitOptionalItem {
  id: string
  unit: string
  category: string
  subcategory: string
  hours: number
  description: string
  type?: string
  curriculumId?: string
}

/** User's choice per option group: unit -> optionGroupId -> subcategory */
export type OptionChoiceState = Record<string, Record<string, string>>

/** User's included optional items: unit -> optionalItemId -> boolean */
export type OptionalItemInclusionState = Record<string, Record<string, boolean>>

/** Per-user override for option group hours: unit -> optionGroupId -> hours */
export type OptionGroupHoursOverrideState = Record<string, Record<string, number>>

/** Per-user override for optional item hours: unit -> optionalItemId -> hours */
export type OptionalItemHoursOverrideState = Record<string, Record<string, number>>

export interface CurriculumUnitRef {
  curriculumId: string
  unit: string
}

export interface CurriculumSet {
  id: string
  name: string
  provider: string
  logoUrl?: string | null
  description?: string | null
}

export interface PlannerConfig {
  hoursPerCredit: number
  minCreditsForGraduation: number
}

export const DEFAULT_HOURS_PER_CREDIT = 120
export const DEFAULT_MIN_CREDITS = 25

export interface PlanData {
  assignments: AssignmentState
  optionChoices: OptionChoiceState
  includedOptionalItems: OptionalItemInclusionState
  optionGroupHoursOverride: OptionGroupHoursOverrideState
  optionalItemHoursOverride: OptionalItemHoursOverrideState
  curriculumUnits: CurriculumUnitRef[]
  lockedYears: Year[]
  unitOrderByYear?: UnitOrderByYear
  config: PlannerConfig
}

export interface PlanMeta {
  id: string
  name: string
  updatedAt: string
  lastSyncedAt?: string | null
  deletedAt?: string | null
}
