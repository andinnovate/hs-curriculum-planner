import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../supabase'

export function useAdmin(user: User | null) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState<string | null>(null)

  const checkAdmin = useCallback(async () => {
    if (!user) {
      setIsAdmin(false)
      setLoading(false)
      setError(null)
      return
    }
    const metadata = (user.app_metadata ?? {}) as Record<string, unknown>
    if (metadata.is_admin === true || metadata.role === 'admin') {
      setIsAdmin(true)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.rpc('is_admin')
    if (error) {
      setError(error.message)
      setIsAdmin(false)
    } else {
      setError(null)
      setIsAdmin(Boolean(data))
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    void checkAdmin()
  }, [checkAdmin])

  return { isAdmin, loading, error, refresh: checkAdmin }
}
