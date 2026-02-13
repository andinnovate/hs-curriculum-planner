import { useCallback, useEffect, useState } from 'react'
import type { UnitOrderByYear, Year } from '../types'
import { loadUnitOrderByYear, saveUnitOrderByYear } from '../planStorage'

export function useUnitOrderByYear(planId: string) {
  const [unitOrderByYear, setUnitOrderByYear] = useState<UnitOrderByYear>(() =>
    loadUnitOrderByYear(planId)
  )
  const [loadedPlanId, setLoadedPlanId] = useState(planId)

  useEffect(() => {
    setUnitOrderByYear(loadUnitOrderByYear(planId))
    setLoadedPlanId(planId)
  }, [planId])

  useEffect(() => {
    if (loadedPlanId !== planId) return
    saveUnitOrderByYear(planId, unitOrderByYear)
  }, [loadedPlanId, unitOrderByYear, planId])

  const reorderUnitsInYear = useCallback((year: Year, newOrder: string[]) => {
    setUnitOrderByYear((prev) => ({ ...prev, [year]: newOrder }))
  }, [])

  const replaceUnitOrderByYear = useCallback((next: UnitOrderByYear) => {
    setUnitOrderByYear(next)
  }, [])

  return { unitOrderByYear, reorderUnitsInYear, replaceUnitOrderByYear }
}
