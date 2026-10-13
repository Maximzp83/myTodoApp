import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js'
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

export async function fetchAllRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>,
): Promise<T[]> {
  const rows: T[] = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1)
    if (error) throw error
    if (!data) throw new Error('Could not load your data.')
    rows.push(...data)
    if (data.length < pageSize) return rows
  }
}
