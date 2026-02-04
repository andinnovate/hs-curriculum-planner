import { useCallback, useEffect, useState } from 'react'
import type { PlannerConfig } from '../types'
import { DEFAULT_HOURS_PER_CREDIT, DEFAULT_MIN_CREDITS } from '../types'

const STORAGE_KEY = 'curric-planner-config'

function loadConfig(): PlannerConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { hoursPerCredit: DEFAULT_HOURS_PER_CREDIT, minCreditsForGraduation: DEFAULT_MIN_CREDITS }
    const parsed = JSON.parse(raw) as { hoursPerCredit?: number; minCreditsForGraduation?: number }
    return {
      hoursPerCredit: Number(parsed.hoursPerCredit) || DEFAULT_HOURS_PER_CREDIT,
      minCreditsForGraduation: Number(parsed.minCreditsForGraduation) || DEFAULT_MIN_CREDITS,
    }
  } catch {
    return { hoursPerCredit: DEFAULT_HOURS_PER_CREDIT, minCreditsForGraduation: DEFAULT_MIN_CREDITS }
  }
}

function saveConfig(config: PlannerConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function useConfig() {
  const [config, setConfig] = useState<PlannerConfig>(loadConfig)

  useEffect(() => {
    saveConfig(config)
  }, [config])

  const setHoursPerCredit = useCallback((value: number) => {
    setConfig((prev) => ({ ...prev, hoursPerCredit: value }))
  }, [])

  const setMinCreditsForGraduation = useCallback((value: number) => {
    setConfig((prev) => ({ ...prev, minCreditsForGraduation: value }))
  }, [])

  return { config, setHoursPerCredit, setMinCreditsForGraduation }
}
