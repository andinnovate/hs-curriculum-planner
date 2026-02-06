import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PlanData, PlanMeta } from '../types'
import {
  DEFAULT_PLAN_NAME,
  PLAN_LIST_KEY,
  migrateLegacyPlan,
  normalizePlanData,
  writePlanDataToStorage,
} from '../planStorage'

type PlansState = {
  currentPlanId: string
  plans: PlanMeta[]
}

export type RemotePlan = {
  id: string
  name: string
  data: PlanData
  updated_at: string
}

function safeDate(value: string | null | undefined, fallback: string) {
  const parsed = value ? Date.parse(value) : NaN
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString()
}

function createPlanId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `plan_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function normalizePlanMeta(raw: Partial<PlanMeta>, fallbackUpdatedAt: string): PlanMeta {
  return {
    id: String(raw.id ?? createPlanId()),
    name: String(raw.name ?? DEFAULT_PLAN_NAME),
    updatedAt: safeDate(raw.updatedAt, fallbackUpdatedAt),
    lastSyncedAt: raw.lastSyncedAt ?? null,
  }
}

function loadPlansState(): PlansState {
  const fallbackUpdatedAt = new Date().toISOString()
  try {
    const raw = localStorage.getItem(PLAN_LIST_KEY)
    if (!raw) {
      const planId = createPlanId()
      migrateLegacyPlan(planId)
      return {
        currentPlanId: planId,
        plans: [
          {
            id: planId,
            name: DEFAULT_PLAN_NAME,
            updatedAt: fallbackUpdatedAt,
            lastSyncedAt: null,
          },
        ],
      }
    }
    const parsed = JSON.parse(raw) as Partial<PlansState>
    const parsedPlans = Array.isArray(parsed.plans) ? parsed.plans : []
    const normalizedPlans = parsedPlans.map((plan) => normalizePlanMeta(plan, fallbackUpdatedAt))
    const plans = normalizedPlans.length
      ? normalizedPlans
      : [
          {
            id: createPlanId(),
            name: DEFAULT_PLAN_NAME,
            updatedAt: fallbackUpdatedAt,
            lastSyncedAt: null,
          },
        ]
    const currentPlanId =
      parsed.currentPlanId && plans.some((plan) => plan.id === parsed.currentPlanId)
        ? parsed.currentPlanId
        : plans[0].id
    return { currentPlanId, plans }
  } catch {
    const planId = createPlanId()
    migrateLegacyPlan(planId)
    return {
      currentPlanId: planId,
      plans: [
        {
          id: planId,
          name: DEFAULT_PLAN_NAME,
          updatedAt: fallbackUpdatedAt,
          lastSyncedAt: null,
        },
      ],
    }
  }
}

export function usePlans() {
  const [plansState, setPlansState] = useState<PlansState>(loadPlansState)

  useEffect(() => {
    localStorage.setItem(PLAN_LIST_KEY, JSON.stringify(plansState))
  }, [plansState])

  const plans = plansState.plans
  const currentPlanId = plansState.currentPlanId

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === currentPlanId) ?? plans[0],
    [plans, currentPlanId]
  )

  const setCurrentPlanId = useCallback((planId: string) => {
    setPlansState((prev) => {
      if (!prev.plans.some((plan) => plan.id === planId)) return prev
      return { ...prev, currentPlanId: planId }
    })
  }, [])

  const renamePlan = useCallback((planId: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const updatedAt = new Date().toISOString()
    setPlansState((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) =>
        plan.id === planId ? { ...plan, name: trimmed, updatedAt } : plan
      ),
    }))
  }, [])

  const touchPlan = useCallback((planId: string) => {
    const updatedAt = new Date().toISOString()
    setPlansState((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) => (plan.id === planId ? { ...plan, updatedAt } : plan)),
    }))
  }, [])

  const createPlanFromData = useCallback((name: string, data: PlanData) => {
    const planId = createPlanId()
    const updatedAt = new Date().toISOString()
    const planName = name.trim() || DEFAULT_PLAN_NAME
    const normalized = normalizePlanData(data)
    writePlanDataToStorage(planId, normalized)
    setPlansState((prev) => ({
      currentPlanId: planId,
      plans: [
        ...prev.plans,
        { id: planId, name: planName, updatedAt, lastSyncedAt: null },
      ],
    }))
    return planId
  }, [])

  const markPlansSynced = useCallback((planIds: string[], syncedAt: string) => {
    if (planIds.length === 0) return
    setPlansState((prev) => ({
      ...prev,
      plans: prev.plans.map((plan) =>
        planIds.includes(plan.id) ? { ...plan, lastSyncedAt: syncedAt } : plan
      ),
    }))
  }, [])

  const mergeRemotePlans = useCallback(
    (remotePlans: RemotePlan[], options?: { onApplyCurrentPlanData?: (data: PlanData) => void }) => {
      const planDataUpdates: PlanData[] = []
      const storageWrites: { id: string; data: PlanData }[] = []
      let activePlanId = currentPlanId
      setPlansState((prev) => {
        activePlanId = prev.currentPlanId
        let nextPlans = [...prev.plans]
        const planById = new Map(nextPlans.map((plan) => [plan.id, plan]))
        for (const remote of remotePlans) {
          const remoteUpdatedAt = safeDate(remote.updated_at, new Date().toISOString())
          const normalizedData = normalizePlanData(remote.data)
          const local = planById.get(remote.id)
          if (!local) {
            nextPlans = [
              ...nextPlans,
              {
                id: remote.id,
                name: remote.name || DEFAULT_PLAN_NAME,
                updatedAt: remoteUpdatedAt,
                lastSyncedAt: remoteUpdatedAt,
              },
            ]
            storageWrites.push({ id: remote.id, data: normalizedData })
            continue
          }
          const localUpdatedAt = Date.parse(local.updatedAt)
          const remoteTimestamp = Date.parse(remoteUpdatedAt)
          if (Number.isNaN(localUpdatedAt) || remoteTimestamp > localUpdatedAt) {
            nextPlans = nextPlans.map((plan) =>
              plan.id === remote.id
                ? {
                    ...plan,
                    name: remote.name || plan.name,
                    updatedAt: remoteUpdatedAt,
                    lastSyncedAt: remoteUpdatedAt,
                  }
                : plan
            )
            storageWrites.push({ id: remote.id, data: normalizedData })
            if (remote.id === prev.currentPlanId) {
              planDataUpdates.push(normalizedData)
            }
          }
        }
        if (!nextPlans.some((plan) => plan.id === prev.currentPlanId) && nextPlans.length > 0) {
          activePlanId = nextPlans[0].id
          return { currentPlanId: activePlanId, plans: nextPlans }
        }
        return { ...prev, plans: nextPlans }
      })

      storageWrites.forEach((item) => writePlanDataToStorage(item.id, item.data))

      if (options?.onApplyCurrentPlanData && planDataUpdates.length > 0) {
        planDataUpdates.forEach((data) => {
          options.onApplyCurrentPlanData?.(data)
        })
      }
    },
    [currentPlanId]
  )

  return {
    plans,
    currentPlanId,
    currentPlan,
    setCurrentPlanId,
    renamePlan,
    touchPlan,
    createPlanFromData,
    markPlansSynced,
    mergeRemotePlans,
  }
}
