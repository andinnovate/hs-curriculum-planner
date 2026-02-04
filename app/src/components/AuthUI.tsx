import { useState } from 'react'
import type { User } from '@supabase/supabase-js'

type AuthUIProps = {
  user: User | null
  loading: boolean
  error: string | null
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
  onSignOut: () => Promise<void>
  onClearError: () => void
}

export function AuthUI({
  user,
  loading,
  error,
  onSignIn,
  onSignUp,
  onSignOut,
  onClearError,
}: AuthUIProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setSubmitting(true)
    await onSignIn(email.trim(), password)
    setSubmitting(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setSubmitting(true)
    await onSignUp(email.trim(), password)
    setSubmitting(false)
  }

  if (loading) {
    return <span className="auth-ui-loading">…</span>
  }

  if (user) {
    return (
      <div className="auth-ui-signed-in">
        <span className="auth-ui-email">{user.email}</span>
        <button
          type="button"
          className="auth-ui-sign-out"
          onClick={() => onSignOut()}
          disabled={submitting}
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="auth-ui-form-wrap">
      <form className="auth-ui-form" onSubmit={handleSignIn}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            onClearError()
          }}
          className="auth-ui-input"
          autoComplete="email"
          disabled={submitting}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            onClearError()
          }}
          className="auth-ui-input"
          autoComplete="current-password"
          disabled={submitting}
        />
        <div className="auth-ui-buttons">
          <button
            type="submit"
            className="auth-ui-btn auth-ui-btn-signin"
            disabled={submitting}
          >
            Sign in
          </button>
          <button
            type="button"
            className="auth-ui-btn auth-ui-btn-signup"
            disabled={submitting}
            onClick={handleSignUp}
          >
            Sign up
          </button>
        </div>
      </form>
      {error && (
        <p className="auth-ui-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
