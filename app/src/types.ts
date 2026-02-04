export type Year = 1 | 2 | 3 | 4

export interface UnitWithHours {
  unit: string
  totalHours: number
}

export type AssignmentState = Record<string, Year>

export interface PlannerConfig {
  hoursPerCredit: number
  minCreditsForGraduation: number
}

export const DEFAULT_HOURS_PER_CREDIT = 120
export const DEFAULT_MIN_CREDITS = 25
