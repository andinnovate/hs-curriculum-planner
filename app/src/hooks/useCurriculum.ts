import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { UnitBreakdown, UnitWithHours } from '../types'

interface Row {
  unit: string
  category: string
  subcategory: string
  hours: number
}

export function useCurriculum() {
  const [unitsWithHours, setUnitsWithHours] = useState<UnitWithHours[]>([])
  const [unitBreakdown, setUnitBreakdown] = useState<UnitBreakdown>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const { data, error: e } = await supabase
          .from('unit_subcategory_hours')
          .select('unit, category, subcategory, hours')

        if (e) throw e
        if (cancelled) return

        const byUnit = new Map<string, number>()
        const breakdown: UnitBreakdown = {}
        for (const row of (data ?? []) as Row[]) {
          const unit = row.unit
          const hours = Number(row.hours)
          byUnit.set(unit, (byUnit.get(unit) ?? 0) + hours)
          if (!breakdown[unit]) breakdown[unit] = []
          breakdown[unit].push({
            category: row.category,
            subcategory: row.subcategory,
            hours,
          })
        }

        const list: UnitWithHours[] = Array.from(byUnit.entries())
          .map(([unit, totalHours]) => ({ unit, totalHours }))
          .sort((a, b) => a.unit.localeCompare(b.unit))

        setUnitsWithHours(list)
        setUnitBreakdown(breakdown)
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

  return { unitsWithHours, unitBreakdown, loading, error }
}
