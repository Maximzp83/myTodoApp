import { fetchAllRows, getSupabase } from '@/services/supabase'
import type { NoteRow, NoteTabRow } from '@/types/database'
import type { Note, NoteDraft, NoteTab } from '@/types/note'

// The database column stays `body`; the app calls it content.
export function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    tabId: row.tab_id,
    title: row.title,
    content: row.body,
    createdAt: row.created_at,
  }
}

export function toNoteTab(row: NoteTabRow): NoteTab {
  return { id: row.id, name: row.name }
}

export async function fetchNotesData(userId: string) {
  const client = getSupabase()
  const [tabRows, noteRows] = await Promise.all([
    fetchAllRows((from, to) =>
      client
        .from('note_tabs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')
        .order('id')
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      client
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to),
    ),
  ])
  return { tabs: tabRows.map(toNoteTab), notes: noteRows.map(toNote) }
}

export async function createTab(userId: string, name: string) {
  const { data, error } = await getSupabase()
    .from('note_tabs')
    .insert({ user_id: userId, name })
    .select()
    .single()
  if (error) throw error
  return toNoteTab(data)
}

export async function renameTab(userId: string, id: string, name: string) {
  const { data, error } = await getSupabase()
    .from('note_tabs')
    .update({ name })
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return toNoteTab(data)
}

export async function deleteTab(userId: string, id: string) {
  // The database moves the tab's notes to General in the same transaction.
  const { data, error } = await getSupabase()
    .from('note_tabs')
    .delete()
    .eq('user_id', userId)
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function createNote(userId: string, draft: NoteDraft) {
  const { data, error } = await getSupabase()
    .from('notes')
    .insert({ user_id: userId, tab_id: draft.tabId, title: draft.title, body: draft.content })
    .select()
    .single()
  if (error) throw error
  return toNote(data)
}

export async function updateNote(userId: string, id: string, draft: NoteDraft) {
  const { data, error } = await getSupabase()
    .from('notes')
    .update({ title: draft.title, body: draft.content, tab_id: draft.tabId })
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
