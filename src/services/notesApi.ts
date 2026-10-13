import { fetchAllRows, getSupabase } from '@/services/supabase'
import type { NoteRow } from '@/types/database'
import type { Note } from '@/types/note'

function toNote(row: NoteRow): Note {
  return { id: row.id, body: row.body, createdAt: row.created_at }
}

export async function fetchNotes(userId: string) {
  const rows = await fetchAllRows((from, to) =>
    getSupabase()
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to),
  )
  return rows.map(toNote)
}

export async function createNote(userId: string) {
  const { data, error } = await getSupabase()
    .from('notes')
    .insert({ user_id: userId })
    .select()
    .single()
  if (error) throw error
  return toNote(data)
}

export async function updateNote(userId: string, id: string, body: string) {
  const { data, error } = await getSupabase()
    .from('notes')
    .update({ body })
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toNote(data)
}

export async function deleteNote(userId: string, id: string) {
  const { data, error } = await getSupabase()
    .from('notes')
    .delete()
    .eq('user_id', userId)
    .eq('id', id)
    .select('id')
  if (error) throw error
  return data.map((row) => row.id)
}
