import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import type { AccountUser } from '@/types/auth'

vi.mock('@/services/auth')
vi.mock('@/services/supabase', () => ({ isCloudConfigured: true }))
const user: AccountUser = { id: 'account-a', email: 'a@example.com' }
let notify: (user: AccountUser | null) => void

describe('auth store', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
    vi.mocked(api.getCurrentUser).mockResolvedValue(null)
    vi.mocked(api.onAccountChange).mockImplementation((callback) => {
      notify = callback
      return vi.fn<() => void>()
    })
  })

  it('restores an existing session and listens for sign-out', async () => {
    vi.mocked(api.getCurrentUser).mockResolvedValue(user)
    const store = useAuthStore()
    await store.initialize()
    expect(store.user).toEqual(user)
    expect(store.initialized).toBe(true)
    notify(null)
    expect(store.user).toBeNull()
  })

  it('does not overwrite a newer auth event with an initial response', async () => {
    vi.mocked(api.getCurrentUser).mockImplementation(async () => {
      notify(user)
      return null
    })
    const store = useAuthStore()
    await store.initialize()
    expect(store.user).toEqual(user)
  })

  it('signs in with trimmed email and leaves the password unchanged', async () => {
    vi.mocked(api.signIn).mockResolvedValue(user)
    const store = useAuthStore()
    await store.authenticate('sign-in', '  a@example.com  ', ' password ')
    expect(api.signIn).toHaveBeenCalledWith('a@example.com', ' password ')
    expect(store.user).toEqual(user)
    expect(store.busy).toBe(false)
  })

  it('requests email confirmation when signup has no session', async () => {
    vi.mocked(api.signUp).mockResolvedValue(null)
    const store = useAuthStore()
    await store.authenticate('sign-up', user.email, 'password123')
    expect(store.user).toBeNull()
    expect(store.notice).toContain('Check your email')
  })

  it('shows errors without signing in when credentials are rejected', async () => {
    vi.mocked(api.signIn).mockRejectedValue(new Error('Invalid login credentials'))
    const store = useAuthStore()
    await store.authenticate('sign-in', user.email, 'wrong-password')
    expect(store.user).toBeNull()
    expect(store.error).toBe('Invalid login credentials')
  })

  it('clears the session on successful logout', async () => {
    vi.mocked(api.getCurrentUser).mockResolvedValue(user)
    vi.mocked(api.signOut).mockResolvedValue()
    const store = useAuthStore()
    await store.initialize()
    await store.logout()
    expect(store.user).toBeNull()
    expect(api.signOut).toHaveBeenCalledTimes(1)
  })
})
