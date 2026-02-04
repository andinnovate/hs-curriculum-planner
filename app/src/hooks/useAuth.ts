import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../supabase'

export type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export type AuthActions = {
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    setError(null)
    const { error: err } = await supabase.auth.signUp({ email, password })
    if (err) setError(err.message)
  }

  const signIn = async (email: string, password: string) => {
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
  }

  const signOut = async () => {
    setError(null)
    await supabase.auth.signOut()
  }

  const clearError = () => setError(null)

  return {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    clearError,
  }
}
