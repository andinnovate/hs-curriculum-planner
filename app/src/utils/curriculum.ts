import { supabase } from '../supabase'
import type { CurriculumUnitRef } from '../types'

interface UnitRow {
  unit: string
  curriculum_id?: string | null
}

export async function fetchCurriculumUnitRefs(curriculumIds: string[]): Promise<CurriculumUnitRef[]> {
  if (curriculumIds.length === 0) return []

  const [baseRes, groupsRes, itemsRes] = await Promise.all([
    supabase
      .from('unit_subcategory_hours')
      .select('unit, curriculum_id')
      .in('curriculum_id', curriculumIds),
    supabase
      .from('unit_option_groups')
      .select('unit, curriculum_id')
      .in('curriculum_id', curriculumIds),
    supabase
      .from('unit_optional_items')
      .select('unit, curriculum_id')
      .in('curriculum_id', curriculumIds),
  ])

  if (baseRes.error) throw baseRes.error
  if (groupsRes.error) throw groupsRes.error
  if (itemsRes.error) throw itemsRes.error

  const out: CurriculumUnitRef[] = []
  const seen = new Set<string>()

  const ingest = (rows: UnitRow[]) => {
    for (const row of rows) {
      const unit = String(row.unit ?? '').trim()
      const curriculumId = String(row.curriculum_id ?? '').trim()
      if (!unit || !curriculumId) continue
      const key = `${curriculumId}\t${unit}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ curriculumId, unit })
    }
  }

  ingest((baseRes.data ?? []) as UnitRow[])
  ingest((groupsRes.data ?? []) as UnitRow[])
  ingest((itemsRes.data ?? []) as UnitRow[])

  return out
}
