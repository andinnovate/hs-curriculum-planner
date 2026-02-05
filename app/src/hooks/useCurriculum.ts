import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import type {
  CategoryBreakdownRow,
  OptionChoiceState,
  OptionGroupHoursOverrideState,
  OptionalItemInclusionState,
  UnitBreakdown,
  UnitWithHours,
} from '../types'
import type { UnitOptionChoice, UnitOptionGroup, UnitOptionalItem } from '../types'

interface SubcategoryRow {
  unit: string
  category: string
  subcategory: string
  hours: number
}

interface OptionGroupRow {
  id: string
  unit: string
  category: string
  label: string
  note?: string | null
}

interface OptionChoiceRow {
  id: string
  option_group_id: string
  subcategory: string
  hours: number | null
  recommended_books: unknown
}

interface OptionalItemRow {
  id: string
  unit: string
  category: string
  subcategory: string
  hours: number
  description: string
}

function parseRecommendedBooks(raw: unknown): UnitOptionChoice['recommended_books'] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (!item || typeof item !== 'object') return { title: String(item) }
    const o = item as Record<string, unknown>
    if (typeof o.description === 'string') {
      return { description: o.description }
    }
    if (typeof o.title === 'string') {
      return {
        title: o.title,
        author: typeof o.author === 'string' ? o.author : undefined,
        contentNote: typeof o.contentNote === 'string' ? o.contentNote : undefined,
      }
    }
    return { title: String(item) }
  })
}

export function useCurriculum(
  optionChoices: OptionChoiceState,
  includedOptionalItems: OptionalItemInclusionState,
  optionGroupHoursOverride: OptionGroupHoursOverrideState
) {
  const [baseBreakdown, setBaseBreakdown] = useState<UnitBreakdown>({})
  const [optionGroups, setOptionGroups] = useState<UnitOptionGroup[]>([])
  const [choicesRaw, setChoicesRaw] = useState<UnitOptionChoice[]>([])
  const [optionalItemsRaw, setOptionalItemsRaw] = useState<UnitOptionalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const [baseRes, groupsRes, choicesRes, itemsRes] = await Promise.all([
          supabase.from('unit_subcategory_hours').select('unit, category, subcategory, hours'),
          supabase.from('unit_option_groups').select('id, unit, category, label, note'),
          supabase.from('unit_option_choices').select('id, option_group_id, subcategory, hours, recommended_books'),
          supabase.from('unit_optional_items').select('id, unit, category, subcategory, hours, description'),
        ])

        if (baseRes.error) throw baseRes.error
        if (groupsRes.error) throw groupsRes.error
        if (choicesRes.error) throw choicesRes.error
        if (itemsRes.error) throw itemsRes.error
        if (cancelled) return

        const breakdown: UnitBreakdown = {}
        for (const row of (baseRes.data ?? []) as SubcategoryRow[]) {
          const unit = row.unit
          const hours = Number(row.hours)
          if (!breakdown[unit]) breakdown[unit] = []
          breakdown[unit].push({
            category: row.category,
            subcategory: row.subcategory,
            hours,
          })
        }
        setBaseBreakdown(breakdown)

        setOptionGroups(
          ((groupsRes.data ?? []) as OptionGroupRow[]).map((g) => ({
            id: g.id,
            unit: g.unit,
            category: g.category,
            label: g.label,
            note: g.note ?? undefined,
          }))
        )

        setChoicesRaw(
          ((choicesRes.data ?? []) as OptionChoiceRow[]).map((r) => ({
            id: r.id,
            option_group_id: r.option_group_id,
            subcategory: r.subcategory,
            hours: r.hours != null ? Number(r.hours) : null,
            recommended_books: parseRecommendedBooks(r.recommended_books),
          }))
        )

        setOptionalItemsRaw(
          ((itemsRes.data ?? []) as OptionalItemRow[]).map((r) => ({
            id: r.id,
            unit: r.unit,
            category: r.category,
            subcategory: r.subcategory,
            hours: Number(r.hours),
            description: r.description,
          }))
        )

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
  }, [])

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
          const shortLabel = item.description.includes(':')
            ? item.description.split(':')[0].trim() + `: ${item.hours} hrs`
            : `${item.description} (${item.hours} hrs)`
          out.push({
            category: item.category,
            subcategory: item.subcategory,
            hours: item.hours,
            source: shortLabel,
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
  ])

  return {
    unitsWithHours,
    unitBreakdown,
    optionGroups,
    optionChoicesByGroupId,
    optionalItemsByUnit,
    unitsWithUnselectedOptionGroups,
    loading,
    error,
  }
}
