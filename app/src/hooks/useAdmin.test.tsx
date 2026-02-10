import { renderHook, waitFor } from '@testing-library/react'
import type { User } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdmin } from './useAdmin'

const mockRpc = vi.hoisted(() => vi.fn())

vi.mock('../supabase', () => ({
  supabase: {
    rpc: mockRpc,
  },
}))

describe('useAdmin', () => {
  beforeEach(() => {
    mockRpc.mockReset()
  })

  it('treats app metadata role admin as admin without rpc', async () => {
    const user = {
      id: 'user-1',
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: { role: 'admin' },
      user_metadata: {},
    } as User
    mockRpc.mockResolvedValue({ data: false, error: null })

    const { result } = renderHook(() => useAdmin(user))

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('falls back to rpc when metadata is not admin', async () => {
    const user = {
      id: 'user-2',
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
    } as User
    mockRpc.mockResolvedValue({ data: true, error: null })

    const { result } = renderHook(() => useAdmin(user))

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true)
    })

    expect(mockRpc).toHaveBeenCalledWith('is_admin')
    expect(result.current.loading).toBe(false)
  })

  it('reports error when rpc fails', async () => {
    const user = {
      id: 'user-3',
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
    } as User
    mockRpc.mockResolvedValue({ data: null, error: { message: 'nope' } })

    const { result } = renderHook(() => useAdmin(user))

    await waitFor(() => {
      expect(result.current.error).toBe('nope')
    })

    expect(result.current.isAdmin).toBe(false)
  })
})
