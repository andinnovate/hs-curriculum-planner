import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { PlanData, PlanMeta } from '../types'
import type { RemotePlan } from './usePlans'
import { supabase } from '../supabase'
import { readPlanDataFromStorage } from '../planStorage'

export type SyncStatus = 'offline' | 'pending' | 'synced'

type UsePlanSyncOptions = {
  user: User | null
  plans: PlanMeta[]
  mergeRemotePlans: (remotePlans: RemotePlan[], options?: { onApplyCurrentPlanData?: (data: PlanData) => void }) => void
  markPlansSynced: (planIds: string[], syncedAt: string) => void
  applyCurrentPlanData: (data: PlanData) => void
  syncIntervalMs?: number
}

function isPlanDirty(plan: PlanMeta) {
  if (!plan.lastSyncedAt) return true
  const updated = Date.parse(plan.updatedAt)
  const synced = Date.parse(plan.lastSyncedAt)
  if (Number.isNaN(updated) || Number.isNaN(synced)) return true
  return updated > synced
}

export function usePlanSync({
  user,
  plans,
  mergeRemotePlans,
  markPlansSynced,
  applyCurrentPlanData,
  syncIntervalMs = 12000,
}: UsePlanSyncOptions): SyncStatus {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline')
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true
    return navigator.onLine
  })

  const plansRef = useRef(plans)
  const userRef = useRef(user)
  const syncingRef = useRef(false)

  useEffect(() => {
    plansRef.current = plans
  }, [plans])

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncDirtyPlans = useCallback(async () => {
    const activeUser = userRef.current
    if (!activeUser || !isOnline) return
    if (syncingRef.current) return
    const dirtyPlans = plansRef.current.filter(isPlanDirty)
    if (dirtyPlans.length === 0) return

    syncingRef.current = true
    setSyncStatus('pending')
    try {
      const payload = dirtyPlans.map((plan) => ({
        id: plan.id,
        user_id: activeUser.id,
        name: plan.name,
        data: readPlanDataFromStorage(plan.id),
      }))
      const { error } = await supabase.from('planner_plans').upsert(payload, { onConflict: 'id' })
      if (error) {
        setSyncStatus('offline')
        return
      }
      const syncedAt = new Date().toISOString()
      markPlansSynced(
        dirtyPlans.map((plan) => plan.id),
        syncedAt
      )
    } finally {
      syncingRef.current = false
    }
  }, [isOnline, markPlansSynced])

  useEffect(() => {
    if (!user || !isOnline) {
      setSyncStatus('offline')
      return
    }
    if (syncingRef.current) {
      setSyncStatus('pending')
      return
    }
    const dirty = plans.some(isPlanDirty)
    setSyncStatus(dirty ? 'pending' : 'synced')
  }, [isOnline, plans, user])

  useEffect(() => {
    if (!user || !isOnline) return
    const id = window.setInterval(() => {
      syncDirtyPlans()
    }, syncIntervalMs)
    return () => window.clearInterval(id)
  }, [isOnline, syncDirtyPlans, syncIntervalMs, user])

  useEffect(() => {
    if (!user || !isOnline) return
    let canceled = false
    const fetchRemote = async () => {
      const { data, error } = await supabase
        .from('planner_plans')
        .select('id, name, data, updated_at')
      if (canceled) return
      if (error) {
        setSyncStatus('offline')
        return
      }
      mergeRemotePlans((data ?? []) as RemotePlan[], {
        onApplyCurrentPlanData: applyCurrentPlanData,
      })
      await syncDirtyPlans()
    }
    fetchRemote()
    return () => {
      canceled = true
    }
  }, [applyCurrentPlanData, isOnline, mergeRemotePlans, syncDirtyPlans, user])

  return syncStatus
}
