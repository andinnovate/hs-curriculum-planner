import { useCallback, useEffect, useState } from 'react'
import type { AssignmentState, Year } from '../types'

const STORAGE_KEY = 'curric-planner-assignments'

function loadAssignments(): AssignmentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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

function saveAssignments(state: AssignmentState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useAssignments() {
  const [assignments, setAssignments] = useState<AssignmentState>(loadAssignments)

  useEffect(() => {
    saveAssignments(assignments)
  }, [assignments])

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

  return { assignments, setAssignment, removeAssignment }
}
