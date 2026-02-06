import { useCallback, useEffect, useState } from 'react'
import type { Year } from '../types'
import { loadLockedYears, saveLockedYears } from '../planStorage'

export function useLockedYears(planId: string) {
  const [lockedYears, setLockedYears] = useState<Set<Year>>(() => loadLockedYears(planId))
  const [loadedPlanId, setLoadedPlanId] = useState(planId)

  useEffect(() => {
    setLockedYears(loadLockedYears(planId))
    setLoadedPlanId(planId)
  }, [planId])

  useEffect(() => {
    if (loadedPlanId !== planId) return
    saveLockedYears(planId, lockedYears)
  }, [loadedPlanId, lockedYears, planId])

  const toggleLock = useCallback((year: Year) => {
    setLockedYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }, [])

  const replaceLockedYears = useCallback((next: Set<Year> | Year[]) => {
    setLockedYears(next instanceof Set ? new Set(next) : new Set(next))
  }, [])

  return { lockedYears, toggleLock, replaceLockedYears }
}
