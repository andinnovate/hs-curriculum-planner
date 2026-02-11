import { useCallback, useEffect, useState } from 'react'
import type {
  OptionChoiceState,
  OptionGroupHoursOverrideState,
  OptionalItemHoursOverrideState,
  OptionalItemInclusionState,
} from '../types'
import {
  loadIncludedOptionalItems,
  loadOptionChoices,
  loadOptionGroupHoursOverride,
  loadOptionalItemHoursOverride,
  saveIncludedOptionalItems,
  saveOptionChoices,
  saveOptionGroupHoursOverride,
  saveOptionalItemHoursOverride,
} from '../planStorage'

export function useOptionChoices(planId: string) {
  const [optionChoices, setOptionChoices] = useState<OptionChoiceState>(() => loadOptionChoices(planId))
  const [includedOptionalItems, setIncludedOptionalItems] = useState<OptionalItemInclusionState>(() =>
    loadIncludedOptionalItems(planId)
  )
  const [optionGroupHoursOverride, setOptionGroupHoursOverride] = useState<OptionGroupHoursOverrideState>(() =>
    loadOptionGroupHoursOverride(planId)
  )
  const [optionalItemHoursOverride, setOptionalItemHoursOverride] = useState<OptionalItemHoursOverrideState>(() =>
    loadOptionalItemHoursOverride(planId)
  )
  const [loadedPlanId, setLoadedPlanId] = useState(planId)

  useEffect(() => {
    setOptionChoices(loadOptionChoices(planId))
    setIncludedOptionalItems(loadIncludedOptionalItems(planId))
    setOptionGroupHoursOverride(loadOptionGroupHoursOverride(planId))
    setOptionalItemHoursOverride(loadOptionalItemHoursOverride(planId))
    setLoadedPlanId(planId)
  }, [planId])

  useEffect(() => {
    if (loadedPlanId !== planId) return
    saveOptionChoices(planId, optionChoices)
  }, [optionChoices, loadedPlanId, planId])

  useEffect(() => {
    if (loadedPlanId !== planId) return
    saveIncludedOptionalItems(planId, includedOptionalItems)
  }, [includedOptionalItems, loadedPlanId, planId])

  useEffect(() => {
    if (loadedPlanId !== planId) return
    saveOptionGroupHoursOverride(planId, optionGroupHoursOverride)
  }, [loadedPlanId, optionGroupHoursOverride, planId])

  useEffect(() => {
    if (loadedPlanId !== planId) return
    saveOptionalItemHoursOverride(planId, optionalItemHoursOverride)
  }, [loadedPlanId, optionalItemHoursOverride, planId])

  const getOptionGroupHours = useCallback(
    (unit: string, optionGroupId: string, defaultHours: number | null): number | null => {
      const override = optionGroupHoursOverride[unit]?.[optionGroupId]
      return override != null ? override : defaultHours
    },
    [optionGroupHoursOverride]
  )

  const setOptionGroupHours = useCallback(
    (unit: string, optionGroupId: string, hours: number) => {
      setOptionGroupHoursOverride((prev) => ({
        ...prev,
        [unit]: {
          ...(prev[unit] ?? {}),
          [optionGroupId]: hours,
        },
      }))
    },
    []
  )

  const setChoice = useCallback((unit: string, optionGroupId: string, subcategory: string) => {
    setOptionChoices((prev) => ({
      ...prev,
      [unit]: {
        ...(prev[unit] ?? {}),
        [optionGroupId]: subcategory,
      },
    }))
  }, [])

  const clearChoice = useCallback((unit: string, optionGroupId: string) => {
    setOptionChoices((prev) => {
      const next = { ...prev, [unit]: { ...(prev[unit] ?? {}) } }
      delete next[unit][optionGroupId]
      if (Object.keys(next[unit]).length === 0) delete next[unit]
      return next
    })
  }, [])

  const getChoice = useCallback(
    (unit: string, optionGroupId: string): string | undefined => {
      return optionChoices[unit]?.[optionGroupId]
    },
    [optionChoices]
  )

  const isOptionalItemIncluded = useCallback(
    (unit: string, optionalItemId: string): boolean => {
      return includedOptionalItems[unit]?.[optionalItemId] ?? false
    },
    [includedOptionalItems]
  )

  const setOptionalItemIncluded = useCallback(
    (unit: string, optionalItemId: string, included: boolean) => {
      setIncludedOptionalItems((prev) => ({
        ...prev,
        [unit]: {
          ...(prev[unit] ?? {}),
          [optionalItemId]: included,
        },
      }))
    },
    []
  )

  const getOptionalItemHours = useCallback(
    (unit: string, optionalItemId: string, defaultHours: number): number => {
      const override = optionalItemHoursOverride[unit]?.[optionalItemId]
      return override != null ? override : defaultHours
    },
    [optionalItemHoursOverride]
  )

  const setOptionalItemHours = useCallback(
    (unit: string, optionalItemId: string, hours: number) => {
      setOptionalItemHoursOverride((prev) => ({
        ...prev,
        [unit]: {
          ...(prev[unit] ?? {}),
          [optionalItemId]: hours,
        },
      }))
    },
    []
  )

  const replaceOptionChoices = useCallback((next: OptionChoiceState) => {
    setOptionChoices(next)
  }, [])

  const replaceIncludedOptionalItems = useCallback((next: OptionalItemInclusionState) => {
    setIncludedOptionalItems(next)
  }, [])

  const replaceOptionGroupHoursOverride = useCallback((next: OptionGroupHoursOverrideState) => {
    setOptionGroupHoursOverride(next)
  }, [])

  const replaceOptionalItemHoursOverride = useCallback((next: OptionalItemHoursOverrideState) => {
    setOptionalItemHoursOverride(next)
  }, [])

  return {
    optionChoices,
    setChoice,
    clearChoice,
    getChoice,
    optionGroupHoursOverride,
    getOptionGroupHours,
    setOptionGroupHours,
    optionalItemHoursOverride,
    getOptionalItemHours,
    setOptionalItemHours,
    includedOptionalItems,
    isOptionalItemIncluded,
    setOptionalItemIncluded,
    replaceOptionChoices,
    replaceIncludedOptionalItems,
    replaceOptionGroupHoursOverride,
    replaceOptionalItemHoursOverride,
  }
}
