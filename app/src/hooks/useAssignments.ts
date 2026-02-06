import { useCallback, useEffect, useState } from 'react'
import type { AssignmentState, Year } from '../types'
import { loadAssignments, saveAssignments } from '../planStorage'

export function useAssignments(planId: string) {
  const [assignments, setAssignments] = useState<AssignmentState>(() => loadAssignments(planId))
  const [loadedPlanId, setLoadedPlanId] = useState(planId)

  useEffect(() => {
    setAssignments(loadAssignments(planId))
    setLoadedPlanId(planId)
  }, [planId])

  useEffect(() => {
    if (loadedPlanId !== planId) return
    saveAssignments(planId, assignments)
  }, [assignments, loadedPlanId, planId])

  const setAssignment = useCallback((unit: string, year: Year) => {
    setAssignments((prev) => ({ ...prev, [unit]: year }))
  }, [])

  const removeAssignment = useCallback((unit: string) => {
    setAssignments((prev) => {
      const next = { ...prev }
      delete next[unit]
      return next
    })
  }, [])

  const replaceAssignments = useCallback((state: AssignmentState) => {
    setAssignments(state)
  }, [])

  return { assignments, setAssignment, removeAssignment, replaceAssignments }
}
