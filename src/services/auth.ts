import type { User } from '@supabase/supabase-js'
import { getSupabase } from '@/services/supabase'
import type { AccountUser } from '@/types/auth'

function accountUser(user: User | undefined): AccountUser | null {
  return user ? { id: user.id, email: user.email ?? '' } : null
}

export async function getCurrentUser() {
  const { data, error } = await getSupabase().auth.getSession()
  if (error) throw error
  return accountUser(data.session?.user)
}

export function onAccountChange(callback: (user: AccountUser | null) => void) {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
    // Keep this callback synchronous: the SDK holds its session lock here.
    callback(accountUser(session?.user))
  })
  return () => data.subscription.unsubscribe()
}

export async function signIn(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password })
  if (error) throw error
  return accountUser(data.user)
}

export async function signUp(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).href },
  })
  if (error) throw error
  return accountUser(data.session?.user)
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut({ scope: 'local' })
  if (error) throw error
}
