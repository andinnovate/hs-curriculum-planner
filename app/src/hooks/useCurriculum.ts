import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { UnitWithHours } from '../types'

interface Row {
  unit: string
  hours: number
}

export function useCurriculum() {
  const [unitsWithHours, setUnitsWithHours] = useState<UnitWithHours[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const { data, error: e } = await supabase
          .from('unit_subcategory_hours')
          .select('unit, hours')

        if (e) throw e
        if (cancelled) return

        const byUnit = new Map<string, number>()
        for (const row of (data ?? []) as Row[]) {
          const prev = byUnit.get(row.unit) ?? 0
          byUnit.set(row.unit, prev + Number(row.hours))
        }

        const list: UnitWithHours[] = Array.from(byUnit.entries())
          .map(([unit, totalHours]) => ({ unit, totalHours }))
          .sort((a, b) => a.unit.localeCompare(b.unit))

        setUnitsWithHours(list)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  return { unitsWithHours, loading, error }
}
