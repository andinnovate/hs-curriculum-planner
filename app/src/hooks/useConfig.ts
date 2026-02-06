import { useCallback, useEffect, useState } from 'react'
import type { PlannerConfig } from '../types'
import { loadConfig, saveConfig } from '../planStorage'

export function useConfig(planId: string) {
  const [config, setConfig] = useState<PlannerConfig>(() => loadConfig(planId))
  const [loadedPlanId, setLoadedPlanId] = useState(planId)

  useEffect(() => {
    setConfig(loadConfig(planId))
    setLoadedPlanId(planId)
  }, [planId])

  useEffect(() => {
    if (loadedPlanId !== planId) return
    saveConfig(planId, config)
  }, [config, loadedPlanId, planId])

  const setHoursPerCredit = useCallback((value: number) => {
    setConfig((prev) => ({ ...prev, hoursPerCredit: value }))
  }, [])

  const setMinCreditsForGraduation = useCallback((value: number) => {
    setConfig((prev) => ({ ...prev, minCreditsForGraduation: value }))
  }, [])

  const replaceConfig = useCallback((next: PlannerConfig) => {
    setConfig(next)
  }, [])

  return { config, setHoursPerCredit, setMinCreditsForGraduation, replaceConfig }
}
