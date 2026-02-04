import { useCallback, useEffect, useState } from 'react'
import type { Year } from '../types'

const STORAGE_KEY = 'curric-planner-locked-years'

function loadLockedYears(): Set<Year> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as number[]
    return new Set(arr.filter((y): y is Year => y >= 1 && y <= 4))
  } catch {
    return new Set()
  }
}

function saveLockedYears(set: Set<Year>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)))
}

export function useLockedYears() {
  const [lockedYears, setLockedYears] = useState<Set<Year>>(loadLockedYears)

  useEffect(() => {
    saveLockedYears(lockedYears)
  }, [lockedYears])

  const toggleLock = useCallback((year: Year) => {
    setLockedYears((prev) => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }, [])

  return { lockedYears, toggleLock }
}
