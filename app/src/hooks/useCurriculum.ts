import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import type {
  CategoryBreakdownRow,
  OptionChoiceState,
  OptionGroupHoursOverrideState,
  OptionalItemHoursOverrideState,
  OptionalItemInclusionState,
  CurriculumUnitRef,
  UnitBreakdown,
  UnitWithHours,
} from '../types'
import type { UnitOptionChoice, UnitOptionGroup, UnitOptionalItem } from '../types'

interface SubcategoryRow {
  unit: string
  category: string
  subcategory: string
  hours: number
  curriculum_id?: string
}

interface OptionGroupRow {
  id: string
  unit: string
  category: string
  label: string
  note?: string | null
  curriculum_id?: string
}

interface OptionChoiceRow {
  id: string
  option_group_id: string
  subcategory: string
  hours: number | null
  recommended_books: unknown
  curriculum_id?: string
}

interface OptionalItemRow {
  id: string
  unit: string
  category: string
  subcategory: string
  hours: number
  description: string
  type?: string | null
  curriculum_id?: string
}

function parseRecommendedBooks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string')
}

export function useCurriculum(
  optionChoices: OptionChoiceState,
  includedOptionalItems: OptionalItemInclusionState,
  optionGroupHoursOverride: OptionGroupHoursOverrideState,
  optionalItemHoursOverride: OptionalItemHoursOverrideState,
  curriculumUnits: CurriculumUnitRef[]
) {
  const [baseBreakdown, setBaseBreakdown] = useState<UnitBreakdown>({})
  const [optionGroups, setOptionGroups] = useState<UnitOptionGroup[]>([])
  const [choicesRaw, setChoicesRaw] = useState<UnitOptionChoice[]>([])
  const [optionalItemsRaw, setOptionalItemsRaw] = useState<UnitOptionalItem[]>([])
  const [unitCurriculumMap, setUnitCurriculumMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const allowedUnits = new Set(curriculumUnits.map((entry) => entry.unit))
    const curriculumIds = Array.from(new Set(curriculumUnits.map((entry) => entry.curriculumId)))

    if (curriculumUnits.length === 0) {
      setBaseBreakdown({})
      setOptionGroups([])
      setChoicesRaw([])
      setOptionalItemsRaw([])
      setUnitCurriculumMap({})
      setLoading(false)
      setError(null)
      return () => {
        cancelled = true
      }
    }

    setLoading(true)

    async function fetchData() {
      try {
        const baseQuery = supabase
          .from('unit_subcategory_hours')
          .select('unit, category, subcategory, hours, curriculum_id')
          .in('curriculum_id', curriculumIds)
        const groupsQuery = supabase
          .from('unit_option_groups')
          .select('id, unit, category, label, note, curriculum_id')
          .in('curriculum_id', curriculumIds)
        const choicesQuery = supabase
          .from('unit_option_choices')
          .select('id, option_group_id, subcategory, hours, recommended_books, curriculum_id')
          .in('curriculum_id', curriculumIds)
        const itemsQuery = supabase
          .from('unit_optional_items')
          .select('id, unit, category, subcategory, hours, description, type, curriculum_id')
          .in('curriculum_id', curriculumIds)

        const [baseRes, groupsRes, choicesRes, itemsRes] = await Promise.all([
          baseQuery,
          groupsQuery,
          choicesQuery,
          itemsQuery,
        ])

        if (baseRes.error) throw baseRes.error
        if (groupsRes.error) throw groupsRes.error
        if (choicesRes.error) throw choicesRes.error
        if (itemsRes.error) throw itemsRes.error
        if (cancelled) return

        const breakdown: UnitBreakdown = {}
        const curriculumByUnit: Record<string, string> = Object.fromEntries(
          curriculumUnits.map((entry) => [entry.unit, entry.curriculumId])
        )
        for (const row of (baseRes.data ?? []) as SubcategoryRow[]) {
          if (!allowedUnits.has(row.unit)) continue
          const unit = row.unit
          const hours = Number(row.hours)
          if (!breakdown[unit]) breakdown[unit] = []
          breakdown[unit].push({
            category: row.category,
            subcategory: row.subcategory,
            hours,
          })
          if (row.curriculum_id) curriculumByUnit[unit] = row.curriculum_id
        }
        setBaseBreakdown(breakdown)

        const filteredGroups = ((groupsRes.data ?? []) as OptionGroupRow[]).filter((g) => allowedUnits.has(g.unit))
        setOptionGroups(
          filteredGroups.map((g) => {
            if (g.curriculum_id) curriculumByUnit[g.unit] = g.curriculum_id
            return {
              id: g.id,
              unit: g.unit,
              category: g.category,
              label: g.label,
              note: g.note ?? undefined,
              curriculumId: g.curriculum_id,
            }
          })
        )

        const allowedGroupIds = new Set(filteredGroups.map((g) => g.id))
        setChoicesRaw(
          ((choicesRes.data ?? []) as OptionChoiceRow[])
            .filter((r) => allowedGroupIds.has(r.option_group_id))
            .map((r) => ({
              id: r.id,
              option_group_id: r.option_group_id,
              subcategory: r.subcategory,
              hours: r.hours != null ? Number(r.hours) : null,
              recommended_books: parseRecommendedBooks(r.recommended_books),
            }))
        )

        setOptionalItemsRaw(
          ((itemsRes.data ?? []) as OptionalItemRow[])
            .filter((r) => allowedUnits.has(r.unit))
            .map((r) => {
              if (r.curriculum_id) curriculumByUnit[r.unit] = r.curriculum_id
              return {
                id: r.id,
                unit: r.unit,
                category: r.category,
                subcategory: r.subcategory,
                hours: Number(r.hours),
                description: r.description,
                type: r.type ?? undefined,
                curriculumId: r.curriculum_id,
              }
            })
        )

        setUnitCurriculumMap(curriculumByUnit)

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
    return () => {
      cancelled = true
    }
  }, [curriculumUnits])

  const optionChoicesByGroupId = useMemo(() => {
    const map: Record<string, UnitOptionChoice[]> = {}
    for (const c of choicesRaw) {
      const gid = c.option_group_id
      if (!map[gid]) map[gid] = []
      map[gid].push(c)
    }
    return map
  }, [choicesRaw])

  const optionalItemsByUnit = useMemo(() => {
    const map: Record<string, UnitOptionalItem[]> = {}
    for (const item of optionalItemsRaw) {
      const u = item.unit
      if (!map[u]) map[u] = []
      map[u].push(item)
    }
    return map
  }, [optionalItemsRaw])

  const unitToGroupIds = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const g of optionGroups) {
      if (!map[g.unit]) map[g.unit] = []
      map[g.unit].push(g.id)
    }
    return map
  }, [optionGroups])

  const { unitBreakdown, unitsWithHours, unitsWithUnselectedOptionGroups } = useMemo(() => {
    const effective: UnitBreakdown = {}
    const allUnits = new Set<string>([
      ...Object.keys(baseBreakdown),
      ...Object.keys(optionalItemsByUnit),
      ...optionGroups.map((g) => g.unit),
    ])

    for (const unit of allUnits) {
      const baseRows = baseBreakdown[unit] ?? []
      const groupIds = unitToGroupIds[unit] ?? []
      const excludedSubcategories = new Set<string>()

      for (const gid of groupIds) {
        const choices = optionChoicesByGroupId[gid] ?? []
        const group = optionGroups.find((g) => g.id === gid)
        if (!group) continue
        for (const c of choices) {
          excludedSubcategories.add(`${group.category}\t${c.subcategory}`)
        }
      }

      const out: CategoryBreakdownRow[] = baseRows.filter(
        (r) => !excludedSubcategories.has(`${r.category}\t${r.subcategory}`)
      )

      for (const gid of groupIds) {
        const choices = optionChoicesByGroupId[gid] ?? []
        const group = optionGroups.find((g) => g.id === gid)
        if (!group || choices.length === 0) continue
        const chosenSubcategory = optionChoices[unit]?.[gid]
        const chosenChoice = chosenSubcategory
          ? choices.find((c) => c.subcategory === chosenSubcategory)
          : null
        if (chosenChoice) {
          const defaultHours = chosenChoice.hours ?? 0
          const hours = optionGroupHoursOverride[unit]?.[gid] ?? defaultHours
          out.push({
            category: group.category,
            subcategory: chosenChoice.subcategory,
            hours,
            source: `${group.label}: ${hours} hrs`,
          })
        } else {
          const maxChoice = choices.reduce(
            (best, c) => ((c.hours ?? 0) > (best?.hours ?? 0) ? c : best),
            choices[0]
          )
          if (maxChoice) {
            const defaultHours = maxChoice.hours ?? 0
            const hours = optionGroupHoursOverride[unit]?.[gid] ?? defaultHours
            out.push({
              category: group.category,
              subcategory: maxChoice.subcategory,
              hours,
              source: `${group.label}: ${hours} hrs`,
            })
          }
        }
      }

      const optionalItems = optionalItemsByUnit[unit] ?? []
      for (const item of optionalItems) {
        if (includedOptionalItems[unit]?.[item.id]) {
          const hoursOverride = optionalItemHoursOverride[unit]?.[item.id]
          const hours = hoursOverride != null ? hoursOverride : item.hours
          const typeLabel = item.type?.trim() || 'Optional work'
          out.push({
            category: item.category,
            subcategory: `${item.subcategory} ${typeLabel}`.trim(),
            hours,
            source: `${typeLabel}: ${hours} hrs`,
          })
        }
      }

      effective[unit] = out
    }

    const byUnit = new Map<string, number>()
    for (const [unit, rows] of Object.entries(effective)) {
      const total = rows.reduce((sum, r) => sum + r.hours, 0)
      byUnit.set(unit, total)
    }

    const list: UnitWithHours[] = Array.from(byUnit.entries())
      .map(([unit, totalHours]) => ({ unit, totalHours }))
      .sort((a, b) => a.unit.localeCompare(b.unit))

    const unitsWithUnselectedOptionGroups: string[] = []
    for (const unit of Object.keys(unitToGroupIds)) {
      const groupIds = unitToGroupIds[unit] ?? []
      const hasUnselected = groupIds.some((gid) => {
        const choices = optionChoicesByGroupId[gid] ?? []
        if (choices.length === 0) return false
        return optionChoices[unit]?.[gid] == null
      })
      if (hasUnselected) unitsWithUnselectedOptionGroups.push(unit)
    }

    return {
      unitBreakdown: effective,
      unitsWithHours: list,
      unitsWithUnselectedOptionGroups,
    }
  }, [
    baseBreakdown,
    unitToGroupIds,
    optionChoicesByGroupId,
    optionGroups,
    optionalItemsByUnit,
    optionChoices,
    includedOptionalItems,
    optionGroupHoursOverride,
    optionalItemHoursOverride,
  ])

  return {
    unitsWithHours,
    unitBreakdown,
    optionGroups,
    optionChoicesByGroupId,
    optionalItemsByUnit,
    unitCurriculumMap,
    unitsWithUnselectedOptionGroups,
    loading,
    error,
  }
}
