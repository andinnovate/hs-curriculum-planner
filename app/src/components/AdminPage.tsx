import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { CurriculumSet } from '../types'
import { supabase } from '../supabase'
import { fetchCurriculumUnitRefs } from '../utils/curriculum'

type EditableRow = {
  rowKey: string
  id: string
  name: string
  provider: string
  logoUrl: string
  description: string
  originalName: string
  originalProvider: string
  originalLogoUrl: string
  originalDescription: string
  isNew: boolean
  dirty: boolean
  editing: boolean
  saving: boolean
  error: string | null
}

interface AdminPageProps {
  user: User | null
  isAdmin: boolean
  adminLoading: boolean
  adminError: string | null
}

type AdminView =
  | { mode: 'sets' }
  | { mode: 'units'; set: CurriculumSet }
  | { mode: 'unit'; set: CurriculumSet; unit: string }

type UnitRowState = {
  rowKey: string
  name: string
  originalName: string
  editing: boolean
  saving: boolean
  error: string | null
}

type EditableBreakdownRow = {
  rowKey: string
  id?: string
  category: string
  subcategory: string
  hours: string
  originalCategory: string
  originalSubcategory: string
  originalHours: string
  isNew: boolean
  dirty: boolean
  editing: boolean
  saving: boolean
  error: string | null
}

type EditableOptionalItem = {
  rowKey: string
  id?: string
  category: string
  subcategory: string
  hours: string
  description: string
  originalCategory: string
  originalSubcategory: string
  originalHours: string
  originalDescription: string
  isNew: boolean
  dirty: boolean
  editing: boolean
  saving: boolean
  error: string | null
}

type EditableChoice = {
  rowKey: string
  id?: string
  subcategory: string
  hours: string
  recommendedBooks: string
  originalSubcategory: string
  originalHours: string
  originalRecommendedBooks: string
  isNew: boolean
  dirty: boolean
  editing: boolean
  saving: boolean
  error: string | null
}

type EditableOptionGroup = {
  rowKey: string
  id?: string
  category: string
  label: string
  note: string
  originalCategory: string
  originalLabel: string
  originalNote: string
  isNew: boolean
  dirty: boolean
  editing: boolean
  saving: boolean
  error: string | null
  choices: EditableChoice[]
}

function makeRow(set: CurriculumSet): EditableRow {
  return {
    rowKey: set.id,
    id: set.id,
    name: set.name,
    provider: set.provider,
    logoUrl: set.logoUrl ?? '',
    description: set.description ?? '',
    originalName: set.name,
    originalProvider: set.provider,
    originalLogoUrl: set.logoUrl ?? '',
    originalDescription: set.description ?? '',
    isNew: false,
    dirty: false,
    editing: false,
    saving: false,
    error: null,
  }
}

function parseRecommendedBooks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string')
}

function confirmDouble(message: string) {
  if (!window.confirm(message)) return false
  return window.confirm('Please confirm again to delete. This cannot be undone.')
}

function makeUnitRow(name: string): UnitRowState {
  return {
    rowKey: name,
    name,
    originalName: name,
    editing: false,
    saving: false,
    error: null,
  }
}

function makeBreakdownRow(
  row: { id?: string; category: string; subcategory: string; hours: number | string },
  editing = false
): EditableBreakdownRow {
  const hours = String(row.hours)
  return {
    rowKey: row.id ?? `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: row.id,
    category: row.category,
    subcategory: row.subcategory,
    hours,
    originalCategory: row.category,
    originalSubcategory: row.subcategory,
    originalHours: hours,
    isNew: !row.id,
    dirty: !row.id,
    editing,
    saving: false,
    error: null,
  }
}

function makeOptionalItem(
  row: { id?: string; category: string; subcategory: string; hours: number | string; description: string },
  editing = false
): EditableOptionalItem {
  const hours = String(row.hours)
  return {
    rowKey: row.id ?? `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: row.id,
    category: row.category,
    subcategory: row.subcategory,
    hours,
    description: row.description,
    originalCategory: row.category,
    originalSubcategory: row.subcategory,
    originalHours: hours,
    originalDescription: row.description,
    isNew: !row.id,
    dirty: !row.id,
    editing,
    saving: false,
    error: null,
  }
}

function makeChoice(
  row: { id?: string; subcategory: string; hours: number | null; recommended_books: string[] },
  editing = false
): EditableChoice {
  const hours = row.hours != null ? String(row.hours) : ''
  const recommendedBooks = row.recommended_books.join('\n')
  return {
    rowKey: row.id ?? `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: row.id,
    subcategory: row.subcategory,
    hours,
    recommendedBooks,
    originalSubcategory: row.subcategory,
    originalHours: hours,
    originalRecommendedBooks: recommendedBooks,
    isNew: !row.id,
    dirty: !row.id,
    editing,
    saving: false,
    error: null,
  }
}

function makeOptionGroup(
  row: { id?: string; category: string; label: string; note?: string | null; choices: EditableChoice[] },
  editing = false
): EditableOptionGroup {
  return {
    rowKey: row.id ?? `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: row.id,
    category: row.category,
    label: row.label,
    note: row.note ?? '',
    originalCategory: row.category,
    originalLabel: row.label,
    originalNote: row.note ?? '',
    isNew: !row.id,
    dirty: !row.id,
    editing,
    saving: false,
    error: null,
    choices: row.choices,
  }
}

export function AdminPage({ user, isAdmin, adminLoading, adminError }: AdminPageProps) {
  const [rows, setRows] = useState<EditableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<AdminView>({ mode: 'sets' })
  const [unitRows, setUnitRows] = useState<UnitRowState[]>([])
  const [newUnitName, setNewUnitName] = useState('')
  const [newUnitCategory, setNewUnitCategory] = useState('')
  const [newUnitSubcategory, setNewUnitSubcategory] = useState('')
  const [newUnitHours, setNewUnitHours] = useState('1')
  const [unitsLoading, setUnitsLoading] = useState(false)
  const [unitsError, setUnitsError] = useState<string | null>(null)
  const [breakdownRows, setBreakdownRows] = useState<EditableBreakdownRow[]>([])
  const [optionalItems, setOptionalItems] = useState<EditableOptionalItem[]>([])
  const [optionGroups, setOptionGroups] = useState<EditableOptionGroup[]>([])
  const [unitDetailLoading, setUnitDetailLoading] = useState(false)
  const [unitDetailError, setUnitDetailError] = useState<string | null>(null)
  const originalByIdRef = useRef<Record<string, CurriculumSet>>({})

  const fetchSets = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('curriculum_sets')
      .select('id, name, provider, logo_url, description')
      .order('name')

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const mapped = ((data ?? []) as Array<{
      id: string
      name: string
      provider: string
      logo_url?: string | null
      description?: string | null
    }>).map((row) => ({
      id: row.id,
      name: row.name,
      provider: row.provider,
      logoUrl: row.logo_url ?? null,
      description: row.description ?? null,
    }))

    originalByIdRef.current = Object.fromEntries(mapped.map((set) => [set.id, set]))
    setRows(mapped.map(makeRow))
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchSets()
  }, [fetchSets])

  const hasRows = rows.length > 0

  const addRow = () => {
    setRows((prev) => [
      {
        rowKey: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        id: '',
        name: '',
        provider: '',
        logoUrl: '',
        description: '',
        originalName: '',
        originalProvider: '',
        originalLogoUrl: '',
        originalDescription: '',
        isNew: true,
        dirty: true,
        editing: true,
        saving: false,
        error: null,
      },
      ...prev,
    ])
  }

  const updateRow = (rowKey: string, field: keyof EditableRow, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.rowKey === rowKey
          ? {
              ...row,
              [field]: value,
              dirty: true,
            }
          : row
      )
    )
  }

  const toggleSetEdit = (rowKey: string, editing: boolean) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.rowKey !== rowKey) return row
        if (!editing && row.isNew) return row
        return {
          ...row,
          editing,
          error: null,
          name: editing ? row.name : row.originalName,
          provider: editing ? row.provider : row.originalProvider,
          logoUrl: editing ? row.logoUrl : row.originalLogoUrl,
          description: editing ? row.description : row.originalDescription,
          dirty: editing ? row.dirty : false,
        }
      })
    )
  }

  const saveRow = async (rowKey: string) => {
    const row = rows.find((r) => r.rowKey === rowKey)
    if (!row) return

    const id = row.id.trim()
    const name = row.name.trim()
    const provider = row.provider.trim()

    if (!id || !name || !provider) {
      setRows((prev) =>
        prev.map((r) =>
          r.rowKey === rowKey ? { ...r, error: 'ID, name, and provider are required.' } : r
        )
      )
      return
    }

    setRows((prev) =>
      prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: true, error: null } : r))
    )

    const payload = {
      id,
      name,
      provider,
      logo_url: row.logoUrl.trim() || null,
      description: row.description.trim() || null,
    }

    const { data, error } = await supabase
      .from('curriculum_sets')
      .upsert(payload, { onConflict: 'id' })
      .select('id, name, provider, logo_url, description')
      .single()

    if (error) {
      setRows((prev) =>
        prev.map((r) =>
          r.rowKey === rowKey ? { ...r, saving: false, error: error.message } : r
        )
      )
      return
    }

    const nextSet: CurriculumSet = {
      id: data.id,
      name: data.name,
      provider: data.provider,
      logoUrl: data.logo_url ?? null,
      description: data.description ?? null,
    }
    originalByIdRef.current[data.id] = nextSet

    setRows((prev) =>
      prev.map((r) =>
        r.rowKey === rowKey
          ? {
              ...makeRow(nextSet),
              rowKey: r.rowKey,
              isNew: false,
              dirty: false,
              saving: false,
              error: null,
            }
          : r
      )
    )
  }

  const cancelRow = (rowKey: string) => {
    setRows((prev) => {
      const row = prev.find((r) => r.rowKey === rowKey)
      if (!row) return prev
      if (row.isNew) {
        return prev.filter((r) => r.rowKey !== rowKey)
      }
      const original = originalByIdRef.current[row.id]
      return prev.map((r) =>
        r.rowKey === rowKey && original
          ? { ...makeRow(original), rowKey: r.rowKey }
          : r
      )
    })
  }

  const deleteRow = async (rowKey: string) => {
    const row = rows.find((r) => r.rowKey === rowKey)
    if (!row) return
    if (row.isNew) {
      setRows((prev) => prev.filter((r) => r.rowKey !== rowKey))
      return
    }
    if (!confirmDouble(`Delete curriculum set "${row.name}"?`)) return

    setRows((prev) =>
      prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: true, error: null } : r))
    )

    const { error } = await supabase.from('curriculum_sets').delete().eq('id', row.id)
    if (error) {
      setRows((prev) =>
        prev.map((r) =>
          r.rowKey === rowKey ? { ...r, saving: false, error: error.message } : r
        )
      )
      return
    }

    delete originalByIdRef.current[row.id]
    setRows((prev) => prev.filter((r) => r.rowKey !== rowKey))
  }

  const canEdit = isAdmin && !adminLoading
  const blockedMessage = useMemo(() => {
    if (adminLoading) return 'Checking admin access…'
    if (!user) return 'Sign in to access admin tools.'
    if (!isAdmin) return 'You do not have admin access.'
    return null
  }, [adminLoading, isAdmin, user])

  const loadUnitsForSet = async (set: CurriculumSet) => {
    setUnitsLoading(true)
    setUnitsError(null)
    try {
      const refs = await fetchCurriculumUnitRefs([set.id])
      const unitNames = Array.from(new Set(refs.map((ref) => ref.unit))).sort((a, b) => a.localeCompare(b))
      setUnitRows(unitNames.map(makeUnitRow))
    } catch (err) {
      setUnitsError(err instanceof Error ? err.message : String(err))
      setUnitRows([])
    } finally {
      setUnitsLoading(false)
    }
  }

  const loadUnitDetail = async (setId: string, unit: string) => {
    setUnitDetailLoading(true)
    setUnitDetailError(null)
    try {
      const baseRes = await supabase
        .from('unit_subcategory_hours')
        .select('id, category, subcategory, hours')
        .eq('curriculum_id', setId)
        .eq('unit', unit)
      if (baseRes.error) throw baseRes.error

      const groupsRes = await supabase
        .from('unit_option_groups')
        .select('id, category, label, note')
        .eq('curriculum_id', setId)
        .eq('unit', unit)
      if (groupsRes.error) throw groupsRes.error

      const groupRows = (groupsRes.data ?? []) as Array<{
        id: string
        category: string
        label: string
        note?: string | null
      }>
      const groupIds = groupRows.map((g) => g.id)

      let choicesRows: Array<{
        id: string
        option_group_id: string
        subcategory: string
        hours: number | null
        recommended_books: unknown
      }> = []

      if (groupIds.length > 0) {
        const choicesRes = await supabase
          .from('unit_option_choices')
          .select('id, option_group_id, subcategory, hours, recommended_books')
          .eq('curriculum_id', setId)
          .in('option_group_id', groupIds)
        if (choicesRes.error) throw choicesRes.error
        choicesRows = (choicesRes.data ?? []) as typeof choicesRows
      }

      const itemsRes = await supabase
        .from('unit_optional_items')
        .select('id, category, subcategory, hours, description')
        .eq('curriculum_id', setId)
        .eq('unit', unit)
      if (itemsRes.error) throw itemsRes.error

      const breakdown = (baseRes.data ?? []) as Array<{
        id: string
        category: string
        subcategory: string
        hours: number
      }>
      setBreakdownRows(breakdown.map((row) => makeBreakdownRow(row, false)))

      const groupsWithChoices = groupRows.map((group) => ({
        ...group,
        choices: choicesRows
          .filter((choice) => choice.option_group_id === group.id)
          .map((choice) => ({
            id: choice.id,
            subcategory: choice.subcategory,
            hours: choice.hours != null ? Number(choice.hours) : null,
            recommended_books: parseRecommendedBooks(choice.recommended_books),
          })),
      }))
      setOptionGroups(
        groupsWithChoices.map((group) =>
          makeOptionGroup({
            id: group.id,
            category: group.category,
            label: group.label,
            note: group.note,
            choices: group.choices.map((choice) => makeChoice(choice, false)),
          })
        )
      )

      const optional = (itemsRes.data ?? []) as Array<{
        id: string
        category: string
        subcategory: string
        hours: number
        description: string
      }>
      setOptionalItems(optional.map((row) => makeOptionalItem(row, false)))
    } catch (err) {
      setUnitDetailError(err instanceof Error ? err.message : String(err))
      setBreakdownRows([])
      setOptionGroups([])
      setOptionalItems([])
    } finally {
      setUnitDetailLoading(false)
    }
  }

  const handleAddUnit = async () => {
    if (view.mode !== 'units') return
    const name = newUnitName.trim()
    const category = newUnitCategory.trim()
    const subcategory = newUnitSubcategory.trim()
    const hours = Number.parseFloat(newUnitHours)
    if (!name || !category || !subcategory || !Number.isFinite(hours) || hours <= 0) {
      setUnitsError('Unit name, category, subcategory, and hours are required.')
      return
    }
    setUnitsError(null)
    setUnitsLoading(true)
    const { error } = await supabase.from('unit_subcategory_hours').insert({
      unit: name,
      category,
      subcategory,
      hours,
      curriculum_id: view.set.id,
    })
    setUnitsLoading(false)
    if (error) {
      setUnitsError(error.message)
      return
    }
    setNewUnitName('')
    setNewUnitCategory('')
    setNewUnitSubcategory('')
    setNewUnitHours('1')
    await loadUnitsForSet(view.set)
  }

  const updateUnitRow = (rowKey: string, value: string) => {
    setUnitRows((prev) =>
      prev.map((row) => (row.rowKey === rowKey ? { ...row, name: value } : row))
    )
  }

  const toggleUnitEdit = (rowKey: string, editing: boolean) => {
    setUnitRows((prev) =>
      prev.map((row) =>
        row.rowKey === rowKey
          ? { ...row, editing, name: editing ? row.name : row.originalName, error: null }
          : row
      )
    )
  }

  const saveUnitRename = async (rowKey: string) => {
    if (view.mode !== 'units') return
    const row = unitRows.find((r) => r.rowKey === rowKey)
    if (!row) return
    const nextName = row.name.trim()
    if (!nextName) {
      setUnitRows((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, error: 'Unit name is required.' } : r))
      )
      return
    }
    if (nextName === row.originalName) {
      toggleUnitEdit(rowKey, false)
      return
    }
    setUnitRows((prev) =>
      prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: true, error: null } : r))
    )
    const setId = view.set.id
    const oldName = row.originalName
    const updates = [
      supabase.from('unit_subcategory_hours').update({ unit: nextName }).eq('curriculum_id', setId).eq('unit', oldName),
      supabase.from('unit_option_groups').update({ unit: nextName }).eq('curriculum_id', setId).eq('unit', oldName),
      supabase.from('unit_optional_items').update({ unit: nextName }).eq('curriculum_id', setId).eq('unit', oldName),
    ]
    const results = await Promise.all(updates)
    const firstError = results.find((res) => res.error)?.error
    if (firstError) {
      setUnitRows((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: false, error: firstError.message } : r))
      )
      return
    }
    setUnitRows((prev) =>
      prev.map((r) =>
        r.rowKey === rowKey
          ? { ...r, saving: false, editing: false, originalName: nextName, name: nextName }
          : r
      )
    )
  }

  const deleteUnit = async (rowKey: string) => {
    if (view.mode !== 'units') return
    const row = unitRows.find((r) => r.rowKey === rowKey)
    if (!row) return
    if (!confirmDouble(`Delete unit "${row.originalName}"? This will remove all related rows.`)) return
    setUnitRows((prev) =>
      prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: true, error: null } : r))
    )
    const setId = view.set.id
    const unitName = row.originalName
    const deletes = [
      supabase.from('unit_subcategory_hours').delete().eq('curriculum_id', setId).eq('unit', unitName),
      supabase.from('unit_option_groups').delete().eq('curriculum_id', setId).eq('unit', unitName),
      supabase.from('unit_optional_items').delete().eq('curriculum_id', setId).eq('unit', unitName),
    ]
    const results = await Promise.all(deletes)
    const firstError = results.find((res) => res.error)?.error
    if (firstError) {
      setUnitRows((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: false, error: firstError.message } : r))
      )
      return
    }
    setUnitRows((prev) => prev.filter((r) => r.rowKey !== rowKey))
  }

  const updateBreakdownRow = (rowKey: string, field: keyof EditableBreakdownRow, value: string) => {
    setBreakdownRows((prev) =>
      prev.map((row) =>
        row.rowKey === rowKey
          ? { ...row, [field]: value, dirty: true }
          : row
      )
    )
  }

  const addBreakdownRow = () => {
    setBreakdownRows((prev) => [
      makeBreakdownRow({ category: '', subcategory: '', hours: 1 }, true),
      ...prev,
    ])
  }

  const saveBreakdownRow = async (rowKey: string) => {
    if (view.mode !== 'unit') return
    const row = breakdownRows.find((r) => r.rowKey === rowKey)
    if (!row) return
    const category = row.category.trim()
    const subcategory = row.subcategory.trim()
    const hours = Number.parseFloat(row.hours)
    if (!category || !subcategory || !Number.isFinite(hours) || hours <= 0) {
      setBreakdownRows((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, error: 'Category, subcategory, and hours are required.' } : r))
      )
      return
    }
    setBreakdownRows((prev) =>
      prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: true, error: null } : r))
    )
    if (row.isNew) {
      const { data, error } = await supabase
        .from('unit_subcategory_hours')
        .insert({
          unit: view.unit,
          category,
          subcategory,
          hours,
          curriculum_id: view.set.id,
        })
        .select('id, category, subcategory, hours')
        .single()
      if (error) {
        setBreakdownRows((prev) =>
          prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: false, error: error.message } : r))
        )
        return
      }
      setBreakdownRows((prev) =>
        prev.map((r) =>
          r.rowKey === rowKey
            ? { ...makeBreakdownRow({ id: data.id, category: data.category, subcategory: data.subcategory, hours: data.hours }, false), rowKey: r.rowKey }
            : r
        )
      )
      return
    }
    const { error } = await supabase
      .from('unit_subcategory_hours')
      .update({ category, subcategory, hours })
      .eq('id', row.id)
    if (error) {
      setBreakdownRows((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: false, error: error.message } : r))
      )
      return
    }
    setBreakdownRows((prev) =>
      prev.map((r) =>
        r.rowKey === rowKey
          ? {
              ...r,
              saving: false,
              dirty: false,
              editing: false,
              originalCategory: category,
              originalSubcategory: subcategory,
              originalHours: String(hours),
            }
          : r
      )
    )
  }

  const deleteBreakdownRow = async (rowKey: string) => {
    const row = breakdownRows.find((r) => r.rowKey === rowKey)
    if (!row) return
    if (row.isNew) {
      setBreakdownRows((prev) => prev.filter((r) => r.rowKey !== rowKey))
      return
    }
    if (!confirmDouble(`Delete breakdown row "${row.category} / ${row.subcategory}"?`)) return
    const { error } = await supabase.from('unit_subcategory_hours').delete().eq('id', row.id)
    if (error) {
      setBreakdownRows((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, error: error.message } : r))
      )
      return
    }
    setBreakdownRows((prev) => prev.filter((r) => r.rowKey !== rowKey))
  }

  const toggleBreakdownEdit = (rowKey: string, editing: boolean) => {
    setBreakdownRows((prev) =>
      prev.map((row) => {
        if (row.rowKey !== rowKey) return row
        if (!editing && row.isNew) return row
        return {
          ...row,
          editing,
          error: null,
          category: editing ? row.category : row.originalCategory,
          subcategory: editing ? row.subcategory : row.originalSubcategory,
          hours: editing ? row.hours : row.originalHours,
          dirty: editing ? row.dirty : false,
        }
      })
    )
  }

  const updateOptionalItem = (rowKey: string, field: keyof EditableOptionalItem, value: string) => {
    setOptionalItems((prev) =>
      prev.map((row) =>
        row.rowKey === rowKey
          ? { ...row, [field]: value, dirty: true }
          : row
      )
    )
  }

  const addOptionalItem = () => {
    setOptionalItems((prev) => [
      makeOptionalItem({ category: '', subcategory: '', hours: 1, description: '' }, true),
      ...prev,
    ])
  }

  const saveOptionalItem = async (rowKey: string) => {
    if (view.mode !== 'unit') return
    const row = optionalItems.find((r) => r.rowKey === rowKey)
    if (!row) return
    const category = row.category.trim()
    const subcategory = row.subcategory.trim()
    const description = row.description.trim()
    const hours = Number.parseFloat(row.hours)
    if (!category || !subcategory || !description || !Number.isFinite(hours) || hours <= 0) {
      setOptionalItems((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, error: 'All fields are required.' } : r))
      )
      return
    }
    setOptionalItems((prev) =>
      prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: true, error: null } : r))
    )
    if (row.isNew) {
      const { data, error } = await supabase
        .from('unit_optional_items')
        .insert({
          unit: view.unit,
          category,
          subcategory,
          hours,
          description,
          curriculum_id: view.set.id,
        })
        .select('id, category, subcategory, hours, description')
        .single()
      if (error) {
        setOptionalItems((prev) =>
          prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: false, error: error.message } : r))
        )
        return
      }
      setOptionalItems((prev) =>
        prev.map((r) =>
          r.rowKey === rowKey
            ? {
                ...makeOptionalItem(
                  {
                    id: data.id,
                    category: data.category,
                    subcategory: data.subcategory,
                    hours: data.hours,
                    description: data.description,
                  },
                  false
                ),
                rowKey: r.rowKey,
              }
            : r
        )
      )
      return
    }
    const { error } = await supabase
      .from('unit_optional_items')
      .update({ category, subcategory, hours, description })
      .eq('id', row.id)
    if (error) {
      setOptionalItems((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: false, error: error.message } : r))
      )
      return
    }
    setOptionalItems((prev) =>
      prev.map((r) =>
        r.rowKey === rowKey
          ? {
              ...r,
              saving: false,
              dirty: false,
              editing: false,
              originalCategory: category,
              originalSubcategory: subcategory,
              originalHours: String(hours),
              originalDescription: description,
            }
          : r
      )
    )
  }

  const deleteOptionalItem = async (rowKey: string) => {
    const row = optionalItems.find((r) => r.rowKey === rowKey)
    if (!row) return
    if (row.isNew) {
      setOptionalItems((prev) => prev.filter((r) => r.rowKey !== rowKey))
      return
    }
    if (!confirmDouble(`Delete optional item "${row.description}"?`)) return
    const { error } = await supabase.from('unit_optional_items').delete().eq('id', row.id)
    if (error) {
      setOptionalItems((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, error: error.message } : r))
      )
      return
    }
    setOptionalItems((prev) => prev.filter((r) => r.rowKey !== rowKey))
  }

  const toggleOptionalEdit = (rowKey: string, editing: boolean) => {
    setOptionalItems((prev) =>
      prev.map((row) => {
        if (row.rowKey !== rowKey) return row
        if (!editing && row.isNew) return row
        return {
          ...row,
          editing,
          error: null,
          category: editing ? row.category : row.originalCategory,
          subcategory: editing ? row.subcategory : row.originalSubcategory,
          hours: editing ? row.hours : row.originalHours,
          description: editing ? row.description : row.originalDescription,
          dirty: editing ? row.dirty : false,
        }
      })
    )
  }

  const updateOptionGroup = (rowKey: string, field: keyof EditableOptionGroup, value: string) => {
    setOptionGroups((prev) =>
      prev.map((row) =>
        row.rowKey === rowKey ? { ...row, [field]: value, dirty: true } : row
      )
    )
  }

  const addOptionGroup = () => {
    setOptionGroups((prev) => [
      makeOptionGroup({ category: '', label: '', note: '', choices: [] }, true),
      ...prev,
    ])
  }

  const saveOptionGroup = async (rowKey: string) => {
    if (view.mode !== 'unit') return
    const row = optionGroups.find((r) => r.rowKey === rowKey)
    if (!row) return
    const category = row.category.trim()
    const label = row.label.trim()
    if (!category || !label) {
      setOptionGroups((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, error: 'Category and label are required.' } : r))
      )
      return
    }
    setOptionGroups((prev) =>
      prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: true, error: null } : r))
    )
    if (row.isNew) {
      const { data, error } = await supabase
        .from('unit_option_groups')
        .insert({
          unit: view.unit,
          category,
          label,
          note: row.note.trim() || null,
          curriculum_id: view.set.id,
        })
        .select('id, category, label, note')
        .single()
      if (error) {
        setOptionGroups((prev) =>
          prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: false, error: error.message } : r))
        )
        return
      }
      setOptionGroups((prev) =>
        prev.map((r) =>
          r.rowKey === rowKey
            ? {
                ...makeOptionGroup(
                  { id: data.id, category: data.category, label: data.label, note: data.note, choices: r.choices },
                  false
                ),
                rowKey: r.rowKey,
              }
            : r
        )
      )
      return
    }
    const { error } = await supabase
      .from('unit_option_groups')
      .update({ category, label, note: row.note.trim() || null })
      .eq('id', row.id)
    if (error) {
      setOptionGroups((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, saving: false, error: error.message } : r))
      )
      return
    }
    setOptionGroups((prev) =>
      prev.map((r) =>
        r.rowKey === rowKey
          ? {
              ...r,
              saving: false,
              dirty: false,
              editing: false,
              originalCategory: category,
              originalLabel: label,
              originalNote: row.note.trim() || '',
            }
          : r
      )
    )
  }

  const deleteOptionGroup = async (rowKey: string) => {
    const row = optionGroups.find((r) => r.rowKey === rowKey)
    if (!row) return
    if (row.isNew) {
      setOptionGroups((prev) => prev.filter((r) => r.rowKey !== rowKey))
      return
    }
    if (!confirmDouble(`Delete option group "${row.label}"? This will remove all choices.`)) return
    const { error } = await supabase.from('unit_option_groups').delete().eq('id', row.id)
    if (error) {
      setOptionGroups((prev) =>
        prev.map((r) => (r.rowKey === rowKey ? { ...r, error: error.message } : r))
      )
      return
    }
    setOptionGroups((prev) => prev.filter((r) => r.rowKey !== rowKey))
  }

  const toggleOptionGroupEdit = (rowKey: string, editing: boolean) => {
    setOptionGroups((prev) =>
      prev.map((row) => {
        if (row.rowKey !== rowKey) return row
        if (!editing && row.isNew) return row
        return {
          ...row,
          editing,
          error: null,
          category: editing ? row.category : row.originalCategory,
          label: editing ? row.label : row.originalLabel,
          note: editing ? row.note : row.originalNote,
          dirty: editing ? row.dirty : false,
        }
      })
    )
  }

  const updateChoice = (groupKey: string, choiceKey: string, field: keyof EditableChoice, value: string) => {
    setOptionGroups((prev) =>
      prev.map((group) => {
        if (group.rowKey !== groupKey) return group
        return {
          ...group,
          choices: group.choices.map((choice) =>
            choice.rowKey === choiceKey ? { ...choice, [field]: value, dirty: true } : choice
          ),
        }
      })
    )
  }

  const addChoice = (groupKey: string) => {
    setOptionGroups((prev) =>
      prev.map((group) =>
        group.rowKey === groupKey
          ? { ...group, choices: [makeChoice({ subcategory: '', hours: null, recommended_books: [] }, true), ...group.choices] }
          : group
      )
    )
  }

  const saveChoice = async (groupKey: string, choiceKey: string) => {
    if (view.mode !== 'unit') return
    const group = optionGroups.find((g) => g.rowKey === groupKey)
    const choice = group?.choices.find((c) => c.rowKey === choiceKey)
    if (!group || !choice) return
    if (!group.id) {
      setOptionGroups((prev) =>
        prev.map((g) =>
          g.rowKey === groupKey
            ? {
                ...g,
                choices: g.choices.map((c) =>
                  c.rowKey === choiceKey ? { ...c, error: 'Save the option group first.' } : c
                ),
              }
            : g
        )
      )
      return
    }
    const subcategory = choice.subcategory.trim()
    const hours = choice.hours.trim() === '' ? null : Number.parseFloat(choice.hours)
    if (!subcategory || (hours != null && !Number.isFinite(hours))) {
      setOptionGroups((prev) =>
        prev.map((g) =>
          g.rowKey === groupKey
            ? {
                ...g,
                choices: g.choices.map((c) =>
                  c.rowKey === choiceKey ? { ...c, error: 'Subcategory (and valid hours) required.' } : c
                ),
              }
            : g
        )
      )
      return
    }
    setOptionGroups((prev) =>
      prev.map((g) =>
        g.rowKey === groupKey
          ? {
              ...g,
              choices: g.choices.map((c) =>
                c.rowKey === choiceKey ? { ...c, saving: true, error: null } : c
              ),
            }
          : g
      )
    )
    const recommended_books = choice.recommendedBooks
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    if (choice.isNew) {
      const { data, error } = await supabase
        .from('unit_option_choices')
        .insert({
          option_group_id: group.id,
          subcategory,
          hours,
          recommended_books,
          curriculum_id: view.set.id,
        })
        .select('id, subcategory, hours, recommended_books')
        .single()
      if (error) {
        setOptionGroups((prev) =>
          prev.map((g) =>
            g.rowKey === groupKey
              ? {
                  ...g,
                  choices: g.choices.map((c) =>
                    c.rowKey === choiceKey ? { ...c, saving: false, error: error.message } : c
                  ),
                }
              : g
          )
        )
        return
      }
      const updatedChoice = makeChoice({
        id: data.id,
        subcategory: data.subcategory,
        hours: data.hours != null ? Number(data.hours) : null,
        recommended_books: parseRecommendedBooks(data.recommended_books),
      }, false)
      setOptionGroups((prev) =>
        prev.map((g) =>
          g.rowKey === groupKey
            ? {
                ...g,
                choices: g.choices.map((c) =>
                  c.rowKey === choiceKey ? { ...updatedChoice, rowKey: c.rowKey } : c
                ),
              }
            : g
        )
      )
      return
    }
    const { error } = await supabase
      .from('unit_option_choices')
      .update({ subcategory, hours, recommended_books })
      .eq('id', choice.id)
    if (error) {
      setOptionGroups((prev) =>
        prev.map((g) =>
          g.rowKey === groupKey
            ? {
                ...g,
                choices: g.choices.map((c) =>
                  c.rowKey === choiceKey ? { ...c, saving: false, error: error.message } : c
                ),
              }
            : g
        )
      )
      return
    }
    setOptionGroups((prev) =>
      prev.map((g) =>
        g.rowKey === groupKey
          ? {
              ...g,
              choices: g.choices.map((c) =>
                c.rowKey === choiceKey
                  ? {
                      ...c,
                      saving: false,
                      dirty: false,
                      editing: false,
                      originalSubcategory: subcategory,
                      originalHours: hours != null ? String(hours) : '',
                      originalRecommendedBooks: recommended_books.join('\n'),
                    }
                  : c
              ),
            }
          : g
      )
    )
  }

  const deleteChoice = async (groupKey: string, choiceKey: string) => {
    const group = optionGroups.find((g) => g.rowKey === groupKey)
    const choice = group?.choices.find((c) => c.rowKey === choiceKey)
    if (!group || !choice) return
    if (choice.isNew) {
      setOptionGroups((prev) =>
        prev.map((g) =>
          g.rowKey === groupKey ? { ...g, choices: g.choices.filter((c) => c.rowKey !== choiceKey) } : g
        )
      )
      return
    }
    if (!confirmDouble(`Delete choice "${choice.subcategory}"?`)) return
    const { error } = await supabase.from('unit_option_choices').delete().eq('id', choice.id)
    if (error) {
      setOptionGroups((prev) =>
        prev.map((g) =>
          g.rowKey === groupKey
            ? {
                ...g,
                choices: g.choices.map((c) =>
                  c.rowKey === choiceKey ? { ...c, error: error.message } : c
                ),
              }
            : g
        )
      )
      return
    }
    setOptionGroups((prev) =>
      prev.map((g) =>
        g.rowKey === groupKey ? { ...g, choices: g.choices.filter((c) => c.rowKey !== choiceKey) } : g
      )
    )
  }

  const toggleChoiceEdit = (groupKey: string, choiceKey: string, editing: boolean) => {
    setOptionGroups((prev) =>
      prev.map((g) => {
        if (g.rowKey !== groupKey) return g
        return {
          ...g,
          choices: g.choices.map((choice) => {
            if (choice.rowKey !== choiceKey) return choice
            if (!editing && choice.isNew) return choice
            return {
              ...choice,
              editing,
              error: null,
              subcategory: editing ? choice.subcategory : choice.originalSubcategory,
              hours: editing ? choice.hours : choice.originalHours,
              recommendedBooks: editing ? choice.recommendedBooks : choice.originalRecommendedBooks,
              dirty: editing ? choice.dirty : false,
            }
          }),
        }
      })
    )
  }

  const handleOpenUnits = async (set: CurriculumSet) => {
    setView({ mode: 'units', set })
    setUnitDetailError(null)
    setUnitDetailLoading(false)
    setBreakdownRows([])
    setOptionalItems([])
    setOptionGroups([])
    setNewUnitName('')
    setNewUnitCategory('')
    setNewUnitSubcategory('')
    setNewUnitHours('1')
    await loadUnitsForSet(set)
  }

  const handleOpenUnit = async (set: CurriculumSet, unit: string) => {
    setView({ mode: 'unit', set, unit })
    setUnitDetailError(null)
    await loadUnitDetail(set.id, unit)
  }

  const handleRefresh = () => {
    if (view.mode === 'sets') {
      void fetchSets()
      return
    }
    if (view.mode === 'units') {
      void loadUnitsForSet(view.set)
      return
    }
    if (view.mode === 'unit') {
      void loadUnitDetail(view.set.id, view.unit)
    }
  }

  const headerTitle =
    view.mode === 'sets'
      ? 'Curriculum sets'
      : view.mode === 'units'
      ? `Units · ${view.set.name}`
      : `Unit details · ${view.set.name}`

  return (
    <section className="admin-page">
      <header className="admin-header">
        <div>
          <h2>Admin</h2>
          <p className="admin-subtitle">{headerTitle}</p>
        </div>
        <div className="admin-header-actions">
          {view.mode !== 'sets' && (
            <button
              type="button"
              className="admin-link"
              onClick={() => setView({ mode: 'sets' })}
            >
              Back to sets
            </button>
          )}
          {view.mode === 'unit' && (
            <button
              type="button"
              className="admin-link"
              onClick={() => setView({ mode: 'units', set: view.set })}
            >
              Back to units
            </button>
          )}
          <button type="button" className="admin-action" onClick={handleRefresh} disabled={!canEdit}>
            Refresh
          </button>
          {view.mode === 'sets' && (
            <button type="button" className="admin-action primary" onClick={addRow} disabled={!canEdit}>
              New set
            </button>
          )}
        </div>
      </header>

      {adminError && <p className="admin-error">Admin check failed: {adminError}</p>}
      {blockedMessage ? (
        <p className="admin-empty">{blockedMessage}</p>
      ) : view.mode === 'units' ? (
        unitsLoading ? (
          <p className="admin-empty">Loading units…</p>
        ) : unitsError ? (
          <p className="admin-error">Failed to load units: {unitsError}</p>
        ) : (
          <>
            <div className="admin-inline-form">
              <label className="admin-inline-label">
                Unit name
                <input
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder="New unit name"
                  disabled={!canEdit}
                />
              </label>
              <label className="admin-inline-label">
                Category
                <input
                  value={newUnitCategory}
                  onChange={(e) => setNewUnitCategory(e.target.value)}
                  placeholder="Category"
                  disabled={!canEdit}
                />
              </label>
              <label className="admin-inline-label">
                Subcategory
                <input
                  value={newUnitSubcategory}
                  onChange={(e) => setNewUnitSubcategory(e.target.value)}
                  placeholder="Subcategory"
                  disabled={!canEdit}
                />
              </label>
              <label className="admin-inline-label">
                Hours
                <input
                  value={newUnitHours}
                  onChange={(e) => setNewUnitHours(e.target.value)}
                  type="number"
                  min={0.5}
                  step={0.5}
                  disabled={!canEdit}
                />
              </label>
              <button type="button" className="admin-action primary" onClick={handleAddUnit} disabled={!canEdit}>
                Add unit
              </button>
            </div>
            {unitRows.length === 0 ? (
              <p className="admin-empty">No units found for this curriculum set.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th className="admin-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitRows.map((row) => (
                      <tr key={row.rowKey}>
                        <td>
                          {row.editing ? (
                            <input
                              value={row.name}
                              onChange={(e) => updateUnitRow(row.rowKey, e.target.value)}
                              disabled={!canEdit || row.saving}
                            />
                          ) : (
                            row.originalName
                          )}
                        </td>
                        <td className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-action"
                            onClick={() => handleOpenUnit(view.set, row.originalName)}
                            disabled={!canEdit || row.saving}
                          >
                            View details
                          </button>
                          {row.editing ? (
                            <>
                              <button
                                type="button"
                                className="admin-action"
                                onClick={() => saveUnitRename(row.rowKey)}
                                disabled={!canEdit || row.saving}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="admin-link"
                                onClick={() => toggleUnitEdit(row.rowKey, false)}
                                disabled={!canEdit || row.saving}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="admin-link danger"
                                onClick={() => deleteUnit(row.rowKey)}
                                disabled={!canEdit || row.saving}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="admin-icon-button"
                              onClick={() => toggleUnitEdit(row.rowKey, true)}
                              disabled={!canEdit || row.saving}
                              aria-label="Edit unit name"
                              title="Edit"
                            >
                              ✎
                            </button>
                          )}
                          {row.error && <div className="admin-row-error">{row.error}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      ) : view.mode === 'unit' ? (
        unitDetailLoading ? (
          <p className="admin-empty">Loading unit details…</p>
        ) : unitDetailError ? (
          <p className="admin-error">Failed to load unit details: {unitDetailError}</p>
        ) : (
          <div className="admin-detail">
            <h3 className="admin-detail-title">{view.unit}</h3>
            <section className="admin-section">
              <div className="admin-section-header">
                <h4 className="admin-section-title">Base breakdown</h4>
                <button type="button" className="admin-action" onClick={addBreakdownRow} disabled={!canEdit}>
                  Add row
                </button>
              </div>
              {breakdownRows.length === 0 ? (
                <p className="admin-empty">No base breakdown rows.</p>
              ) : (
                <table className="admin-table admin-table-compact">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Subcategory</th>
                      <th>Hours</th>
                      <th className="admin-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdownRows.map((row) => (
                      <tr key={row.rowKey}>
                        <td>
                          {row.editing ? (
                            <input
                              value={row.category}
                              onChange={(e) => updateBreakdownRow(row.rowKey, 'category', e.target.value)}
                              disabled={!canEdit || row.saving}
                            />
                          ) : (
                            row.category
                          )}
                        </td>
                        <td>
                          {row.editing ? (
                            <input
                              value={row.subcategory}
                              onChange={(e) => updateBreakdownRow(row.rowKey, 'subcategory', e.target.value)}
                              disabled={!canEdit || row.saving}
                            />
                          ) : (
                            row.subcategory
                          )}
                        </td>
                        <td>
                          {row.editing ? (
                            <input
                              type="number"
                              min={0.5}
                              step={0.5}
                              value={row.hours}
                              onChange={(e) => updateBreakdownRow(row.rowKey, 'hours', e.target.value)}
                              disabled={!canEdit || row.saving}
                            />
                          ) : (
                            Number.parseFloat(row.hours || '0').toFixed(1)
                          )}
                        </td>
                        <td className="admin-row-actions">
                          {row.editing ? (
                            <>
                              <button
                                type="button"
                                className="admin-action"
                                onClick={() => saveBreakdownRow(row.rowKey)}
                                disabled={!canEdit || row.saving || !row.dirty}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="admin-link"
                                onClick={() =>
                                  row.isNew ? deleteBreakdownRow(row.rowKey) : toggleBreakdownEdit(row.rowKey, false)
                                }
                                disabled={!canEdit || row.saving}
                              >
                                Cancel
                              </button>
                              {!row.isNew && (
                                <button
                                  type="button"
                                  className="admin-link danger"
                                  onClick={() => deleteBreakdownRow(row.rowKey)}
                                  disabled={!canEdit || row.saving}
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              className="admin-icon-button"
                              onClick={() => toggleBreakdownEdit(row.rowKey, true)}
                              disabled={!canEdit || row.saving}
                              aria-label="Edit breakdown row"
                              title="Edit"
                            >
                              ✎
                            </button>
                          )}
                          {row.error && <div className="admin-row-error">{row.error}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="admin-section">
              <div className="admin-section-header">
                <h4 className="admin-section-title">Option groups</h4>
                <button type="button" className="admin-action" onClick={addOptionGroup} disabled={!canEdit}>
                  Add group
                </button>
              </div>
              {optionGroups.length === 0 ? (
                <p className="admin-empty">No option groups.</p>
              ) : (
                optionGroups.map((group) => (
                  <div key={group.rowKey} className="admin-option-group">
                    <div className="admin-option-header">
                      {group.editing ? (
                        <>
                          <input
                            value={group.label}
                            onChange={(e) => updateOptionGroup(group.rowKey, 'label', e.target.value)}
                            placeholder="Group label"
                            disabled={!canEdit || group.saving}
                          />
                          <input
                            value={group.category}
                            onChange={(e) => updateOptionGroup(group.rowKey, 'category', e.target.value)}
                            placeholder="Category"
                            disabled={!canEdit || group.saving}
                          />
                        </>
                      ) : (
                        <>
                          <strong>{group.label}</strong>
                          <span className="admin-muted">{group.category}</span>
                        </>
                      )}
                    </div>
                    {group.editing ? (
                      <textarea
                        value={group.note}
                        onChange={(e) => updateOptionGroup(group.rowKey, 'note', e.target.value)}
                        placeholder="Note (optional)"
                        rows={2}
                        disabled={!canEdit || group.saving}
                      />
                    ) : group.note ? (
                      <p className="admin-note">{group.note}</p>
                    ) : (
                      <p className="admin-empty">No note.</p>
                    )}
                    <div className="admin-row-actions">
                      {group.editing ? (
                        <>
                          <button
                            type="button"
                            className="admin-action"
                            onClick={() => saveOptionGroup(group.rowKey)}
                            disabled={!canEdit || group.saving || !group.dirty}
                          >
                            Save group
                          </button>
                          <button
                            type="button"
                            className="admin-link"
                            onClick={() =>
                              group.isNew ? deleteOptionGroup(group.rowKey) : toggleOptionGroupEdit(group.rowKey, false)
                            }
                            disabled={!canEdit || group.saving}
                          >
                            Cancel
                          </button>
                          {!group.isNew && (
                            <button
                              type="button"
                              className="admin-link danger"
                              onClick={() => deleteOptionGroup(group.rowKey)}
                              disabled={!canEdit || group.saving}
                            >
                              Delete group
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          className="admin-icon-button"
                          onClick={() => toggleOptionGroupEdit(group.rowKey, true)}
                          disabled={!canEdit || group.saving}
                          aria-label="Edit option group"
                          title="Edit"
                        >
                          ✎
                        </button>
                      )}
                      {group.error && <div className="admin-row-error">{group.error}</div>}
                    </div>
                    <div className="admin-section-header">
                      <h5 className="admin-section-title">Choices</h5>
                      <button
                        type="button"
                        className="admin-action"
                        onClick={() => addChoice(group.rowKey)}
                        disabled={!canEdit || group.saving || group.isNew}
                      >
                        Add choice
                      </button>
                    </div>
                    {group.choices.length === 0 ? (
                      <p className="admin-empty">No choices.</p>
                    ) : (
                      <table className="admin-table admin-table-compact">
                        <thead>
                          <tr>
                            <th>Subcategory</th>
                            <th>Hours</th>
                            <th>Recommended books</th>
                            <th className="admin-actions-col">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.choices.map((choice) => (
                            <tr key={choice.rowKey}>
                              <td>
                                {choice.editing ? (
                                  <input
                                    value={choice.subcategory}
                                    onChange={(e) => updateChoice(group.rowKey, choice.rowKey, 'subcategory', e.target.value)}
                                    disabled={!canEdit || choice.saving}
                                  />
                                ) : (
                                  choice.subcategory
                                )}
                              </td>
                              <td>
                                {choice.editing ? (
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={choice.hours}
                                    onChange={(e) => updateChoice(group.rowKey, choice.rowKey, 'hours', e.target.value)}
                                    disabled={!canEdit || choice.saving}
                                  />
                                ) : (
                                  choice.hours === '' ? '—' : Number.parseFloat(choice.hours).toFixed(1)
                                )}
                              </td>
                              <td>
                                {choice.editing ? (
                                  <textarea
                                    value={choice.recommendedBooks}
                                    onChange={(e) => updateChoice(group.rowKey, choice.rowKey, 'recommendedBooks', e.target.value)}
                                    rows={2}
                                    disabled={!canEdit || choice.saving}
                                  />
                                ) : choice.recommendedBooks.trim() ? (
                                  choice.recommendedBooks.split('\n').join(', ')
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="admin-row-actions">
                                {choice.editing ? (
                                  <>
                                    <button
                                      type="button"
                                      className="admin-action"
                                      onClick={() => saveChoice(group.rowKey, choice.rowKey)}
                                      disabled={!canEdit || choice.saving || !choice.dirty}
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-link"
                                      onClick={() =>
                                        choice.isNew
                                          ? deleteChoice(group.rowKey, choice.rowKey)
                                          : toggleChoiceEdit(group.rowKey, choice.rowKey, false)
                                      }
                                      disabled={!canEdit || choice.saving}
                                    >
                                      Cancel
                                    </button>
                                    {!choice.isNew && (
                                      <button
                                        type="button"
                                        className="admin-link danger"
                                        onClick={() => deleteChoice(group.rowKey, choice.rowKey)}
                                        disabled={!canEdit || choice.saving}
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="admin-icon-button"
                                    onClick={() => toggleChoiceEdit(group.rowKey, choice.rowKey, true)}
                                    disabled={!canEdit || choice.saving}
                                    aria-label="Edit option choice"
                                    title="Edit"
                                  >
                                    ✎
                                  </button>
                                )}
                                {choice.error && <div className="admin-row-error">{choice.error}</div>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))
              )}
            </section>

            <section className="admin-section">
              <div className="admin-section-header">
                <h4 className="admin-section-title">Optional items</h4>
                <button type="button" className="admin-action" onClick={addOptionalItem} disabled={!canEdit}>
                  Add item
                </button>
              </div>
              {optionalItems.length === 0 ? (
                <p className="admin-empty">No optional items.</p>
              ) : (
                <table className="admin-table admin-table-compact">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Subcategory</th>
                      <th>Hours</th>
                      <th className="admin-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionalItems.map((item) => (
                      <tr key={item.rowKey}>
                        <td>
                          {item.editing ? (
                            <input
                              value={item.description}
                              onChange={(e) => updateOptionalItem(item.rowKey, 'description', e.target.value)}
                              disabled={!canEdit || item.saving}
                            />
                          ) : (
                            item.description
                          )}
                        </td>
                        <td>
                          {item.editing ? (
                            <input
                              value={item.category}
                              onChange={(e) => updateOptionalItem(item.rowKey, 'category', e.target.value)}
                              disabled={!canEdit || item.saving}
                            />
                          ) : (
                            item.category
                          )}
                        </td>
                        <td>
                          {item.editing ? (
                            <input
                              value={item.subcategory}
                              onChange={(e) => updateOptionalItem(item.rowKey, 'subcategory', e.target.value)}
                              disabled={!canEdit || item.saving}
                            />
                          ) : (
                            item.subcategory
                          )}
                        </td>
                        <td>
                          {item.editing ? (
                            <input
                              type="number"
                              min={0.5}
                              step={0.5}
                              value={item.hours}
                              onChange={(e) => updateOptionalItem(item.rowKey, 'hours', e.target.value)}
                              disabled={!canEdit || item.saving}
                            />
                          ) : (
                            Number.parseFloat(item.hours || '0').toFixed(1)
                          )}
                        </td>
                        <td className="admin-row-actions">
                          {item.editing ? (
                            <>
                              <button
                                type="button"
                                className="admin-action"
                                onClick={() => saveOptionalItem(item.rowKey)}
                                disabled={!canEdit || item.saving || !item.dirty}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="admin-link"
                                onClick={() =>
                                  item.isNew ? deleteOptionalItem(item.rowKey) : toggleOptionalEdit(item.rowKey, false)
                                }
                                disabled={!canEdit || item.saving}
                              >
                                Cancel
                              </button>
                              {!item.isNew && (
                                <button
                                  type="button"
                                  className="admin-link danger"
                                  onClick={() => deleteOptionalItem(item.rowKey)}
                                  disabled={!canEdit || item.saving}
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              className="admin-icon-button"
                              onClick={() => toggleOptionalEdit(item.rowKey, true)}
                              disabled={!canEdit || item.saving}
                              aria-label="Edit optional item"
                              title="Edit"
                            >
                              ✎
                            </button>
                          )}
                          {item.error && <div className="admin-row-error">{item.error}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )
      ) : loading ? (
        <p className="admin-empty">Loading curriculum sets…</p>
      ) : error ? (
        <p className="admin-error">Failed to load curriculum sets: {error}</p>
      ) : !hasRows ? (
        <p className="admin-empty">No curriculum sets found.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Provider</th>
                <th>Logo URL</th>
                <th>Description</th>
                <th className="admin-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowKey} className={row.dirty ? 'admin-row-dirty' : ''}>
                  <td>
                    {row.isNew ? (
                      <input
                        value={row.id}
                        onChange={(e) => updateRow(row.rowKey, 'id', e.target.value)}
                        placeholder="unique-id"
                        disabled={!canEdit || row.saving}
                      />
                    ) : row.editing ? (
                      <input
                        value={row.id}
                        onChange={(e) => updateRow(row.rowKey, 'id', e.target.value)}
                        disabled={!canEdit || row.saving}
                      />
                    ) : (
                      <span>{row.id}</span>
                    )}
                  </td>
                  <td>
                    {row.editing ? (
                      <input
                        value={row.name}
                        onChange={(e) => updateRow(row.rowKey, 'name', e.target.value)}
                        disabled={!canEdit || row.saving}
                      />
                    ) : (
                      row.name
                    )}
                  </td>
                  <td>
                    {row.editing ? (
                      <input
                        value={row.provider}
                        onChange={(e) => updateRow(row.rowKey, 'provider', e.target.value)}
                        disabled={!canEdit || row.saving}
                      />
                    ) : (
                      row.provider
                    )}
                  </td>
                  <td>
                    {row.editing ? (
                      <input
                        value={row.logoUrl}
                        onChange={(e) => updateRow(row.rowKey, 'logoUrl', e.target.value)}
                        placeholder="/providers/logo.png"
                        disabled={!canEdit || row.saving}
                      />
                    ) : (
                      row.logoUrl || '—'
                    )}
                  </td>
                  <td>
                    {row.editing ? (
                      <textarea
                        value={row.description}
                        onChange={(e) => updateRow(row.rowKey, 'description', e.target.value)}
                        rows={2}
                        disabled={!canEdit || row.saving}
                      />
                    ) : (
                      row.description || '—'
                    )}
                  </td>
                  <td className="admin-row-actions">
                    <button
                      type="button"
                      className="admin-action"
                      onClick={() => {
                        const set = originalByIdRef.current[row.id]
                        if (set) void handleOpenUnits(set)
                      }}
                      disabled={!canEdit || row.isNew}
                    >
                      Units
                    </button>
                    {row.editing ? (
                      <>
                        <button
                          type="button"
                          className="admin-action"
                          onClick={() => saveRow(row.rowKey)}
                          disabled={!canEdit || row.saving || (!row.dirty && !row.isNew)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="admin-link"
                          onClick={() => cancelRow(row.rowKey)}
                          disabled={!canEdit || row.saving}
                        >
                          Cancel
                        </button>
                        {!row.isNew && (
                          <button
                            type="button"
                            className="admin-link danger"
                            onClick={() => deleteRow(row.rowKey)}
                            disabled={!canEdit || row.saving}
                          >
                            Delete
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        className="admin-icon-button"
                        onClick={() => toggleSetEdit(row.rowKey, true)}
                        disabled={!canEdit || row.saving}
                        aria-label="Edit curriculum set"
                        title="Edit"
                      >
                        ✎
                      </button>
                    )}
                    {row.error && <div className="admin-row-error">{row.error}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
