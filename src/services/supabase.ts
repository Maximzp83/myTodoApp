import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
export const isCloudConfigured = Boolean(url && publishableKey)

let client: SupabaseClient<Database> | undefined

export function getSupabase() {
  if (!url || !publishableKey) {
    throw new Error('Account services are unavailable. Please contact the site owner.')
  }

  client ??= createClient<Database>(url, publishableKey)
  return client
}
