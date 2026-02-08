import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { CurriculumSet } from '../types'

interface CurriculumSetRow {
  id: string
  name: string
  provider: string
  logo_url?: string | null
  description?: string | null
}

export function useCurriculumSets() {
  const [sets, setSets] = useState<CurriculumSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchSets() {
      try {
        const { data, error } = await supabase
          .from('curriculum_sets')
          .select('id, name, provider, logo_url, description')
          .order('name')

        if (error) throw error
        if (cancelled) return

        setSets(
          ((data ?? []) as CurriculumSetRow[]).map((row) => ({
            id: row.id,
            name: row.name,
            provider: row.provider,
            logoUrl: row.logo_url ?? null,
            description: row.description ?? null,
          }))
        )
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSets()
    return () => {
      cancelled = true
    }
  }, [])

  return { sets, loading, error }
}
