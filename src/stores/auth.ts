import { onScopeDispose, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authService from '@/services/auth'
import { errorMessage } from '@/services/errors'
import { isCloudConfigured } from '@/services/supabase'
import type { AccountUser, AuthMode } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AccountUser | null>(null)
  const initialized = ref(false)
  const busy = ref(false)
  const error = ref('')
  const notice = ref('')
  const configured = isCloudConfigured
  let initializing = false
  let accountVersion = 0
  let unsubscribe: (() => void) | undefined

  function setUser(nextUser: AccountUser | null) {
    accountVersion += 1
    user.value = nextUser
  }

  async function initialize() {
    if (initializing || initialized.value) return
    initializing = true
    try {
      if (!configured)
        throw new Error('Account services are unavailable. Please contact the site owner.')
      unsubscribe = authService.onAccountChange(setUser)
      const version = accountVersion
      const currentUser = await authService.getCurrentUser()
      if (version === accountVersion) setUser(currentUser)
    } catch (cause) {
      error.value = errorMessage(cause, 'Could not restore your session. Please try again.')
    } finally {
      initialized.value = true
      initializing = false
    }
  }

  async function authenticate(mode: AuthMode, email: string, password: string) {
    if (busy.value || !configured) return
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      const nextUser = await (mode === 'sign-up' ? authService.signUp : authService.signIn)(
        email.trim(),
        password,
      )
      setUser(nextUser)
      if (mode === 'sign-up' && !nextUser) {
        notice.value = 'Check your email to confirm your account, then sign in.'
      }
    } catch (cause) {
      error.value = errorMessage(cause, 'Could not sign in. Please try again.')
    } finally {
      busy.value = false
    }
  }

  async function logout() {
    if (busy.value) return
    busy.value = true
    error.value = ''
    try {
      await authService.signOut()
      setUser(null)
      notice.value = ''
    } catch (cause) {
      error.value = errorMessage(cause, 'Could not sign out. Please try again.')
    } finally {
      busy.value = false
    }
  }

  onScopeDispose(() => unsubscribe?.())
  return { user, initialized, busy, configured, error, notice, initialize, authenticate, logout }
})
