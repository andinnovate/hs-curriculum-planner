import { useCallback, useEffect, useState } from 'react'
import type {
  OptionChoiceState,
  OptionGroupHoursOverrideState,
  OptionalItemInclusionState,
} from '../types'

const STORAGE_KEY_CHOICES = 'curric-planner-option-choices'
const STORAGE_KEY_INCLUDED = 'curric-planner-included-optional-items'
const STORAGE_KEY_OPTION_GROUP_HOURS = 'curric-planner-option-group-hours'

function loadOptionChoices(): OptionChoiceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHOICES)
    if (!raw) return {}
    return JSON.parse(raw) as OptionChoiceState
  } catch {
    return {}
  }
}

function loadIncludedOptionalItems(): OptionalItemInclusionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INCLUDED)
    if (!raw) return {}
    return JSON.parse(raw) as OptionalItemInclusionState
  } catch {
    return {}
  }
}

function saveOptionChoices(state: OptionChoiceState) {
  localStorage.setItem(STORAGE_KEY_CHOICES, JSON.stringify(state))
}

function saveIncludedOptionalItems(state: OptionalItemInclusionState) {
  localStorage.setItem(STORAGE_KEY_INCLUDED, JSON.stringify(state))
}

function loadOptionGroupHoursOverride(): OptionGroupHoursOverrideState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPTION_GROUP_HOURS)
    if (!raw) return {}
    return JSON.parse(raw) as OptionGroupHoursOverrideState
  } catch {
    return {}
  }
}

function saveOptionGroupHoursOverride(state: OptionGroupHoursOverrideState) {
  localStorage.setItem(STORAGE_KEY_OPTION_GROUP_HOURS, JSON.stringify(state))
}

export function useOptionChoices() {
  const [optionChoices, setOptionChoices] = useState<OptionChoiceState>(loadOptionChoices)
  const [includedOptionalItems, setIncludedOptionalItems] = useState<OptionalItemInclusionState>(
    loadIncludedOptionalItems
  )
  const [optionGroupHoursOverride, setOptionGroupHoursOverride] = useState<OptionGroupHoursOverrideState>(
    loadOptionGroupHoursOverride
  )

  useEffect(() => {
    saveOptionChoices(optionChoices)
  }, [optionChoices])

  useEffect(() => {
    saveIncludedOptionalItems(includedOptionalItems)
  }, [includedOptionalItems])

  useEffect(() => {
    saveOptionGroupHoursOverride(optionGroupHoursOverride)
  }, [optionGroupHoursOverride])

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

  return {
    optionChoices,
    setChoice,
    clearChoice,
    getChoice,
    optionGroupHoursOverride,
    getOptionGroupHours,
    setOptionGroupHours,
    includedOptionalItems,
    isOptionalItemIncluded,
    setOptionalItemIncluded,
  }
}
