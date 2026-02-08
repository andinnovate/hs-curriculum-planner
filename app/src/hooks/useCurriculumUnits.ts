import { useCallback, useEffect, useState } from 'react'
import type { CurriculumUnitRef } from '../types'
import { loadCurriculumUnits, saveCurriculumUnits } from '../planStorage'

export function useCurriculumUnits(planId: string) {
  const [curriculumUnits, setCurriculumUnits] = useState<CurriculumUnitRef[]>(() => loadCurriculumUnits(planId))
  const [loadedPlanId, setLoadedPlanId] = useState(planId)

  useEffect(() => {
    setCurriculumUnits(loadCurriculumUnits(planId))
    setLoadedPlanId(planId)
  }, [planId])

  useEffect(() => {
    if (loadedPlanId !== planId) return
    saveCurriculumUnits(planId, curriculumUnits)
  }, [curriculumUnits, loadedPlanId, planId])

  const replaceCurriculumUnits = useCallback((units: CurriculumUnitRef[]) => {
    setCurriculumUnits(units)
  }, [])

  return { curriculumUnits, replaceCurriculumUnits }
}
