import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { AuthUI } from './AuthUI'

describe('AuthUI', () => {
  it('renders sign-in form when logged out', () => {
    render(
      <AuthUI
        user={null}
        loading={false}
        error={null}
        onSignIn={async () => {}}
        onSignUp={async () => {}}
        onSignOut={async () => {}}
        onClearError={() => {}}
      />
    )

    expect(screen.getByPlaceholderText('Email')).toBeTruthy()
    expect(screen.getByPlaceholderText('Password')).toBeTruthy()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeTruthy()
  })

  it('renders signed-in state with email', () => {
    const user = { email: 'planner@example.com' } as User
    render(
      <AuthUI
        user={user}
        loading={false}
        error={null}
        onSignIn={async () => {}}
        onSignUp={async () => {}}
        onSignOut={async () => {}}
        onClearError={() => {}}
      />
    )

    expect(screen.getByText('planner@example.com')).toBeTruthy()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeTruthy()
  })
})
