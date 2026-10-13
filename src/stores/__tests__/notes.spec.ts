import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/services/notesApi'
import { useNotesStore } from '@/stores/notes'
import type { Note } from '@/types/note'

vi.mock('@/services/notesApi')

const first: Note = { id: 'note-1', body: 'First', createdAt: '2026-10-12T10:00:00.000Z' }
const second: Note = { id: 'note-2', body: 'Second', createdAt: '2026-10-12T09:00:00.000Z' }

async function readyStore(notes: Note[] = [first, second]) {
  vi.mocked(api.fetchNotes).mockResolvedValue(notes.map((note) => ({ ...note })))
  const store = useNotesStore()
  store.setAccount('account-a')
  await store.refresh()
  return store
}

describe('notes store', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
  })

  it('does not load or write notes before sign-in', async () => {
    const store = useNotesStore()
    await store.refresh()
    expect(await store.addNote()).toBeNull()
    expect(await store.updateNote(first.id, 'Text')).toBe(false)
    expect(api.fetchNotes).not.toHaveBeenCalled()
    expect(api.createNote).not.toHaveBeenCalled()
  })

  it('loads notes for the signed-in account', async () => {
    const store = await readyStore()
    expect(api.fetchNotes).toHaveBeenCalledWith('account-a')
    expect(store.notes).toEqual([first, second])
    expect(store.loaded).toBe(true)
  })

  it('adds a new note to the top of the list', async () => {
    const store = await readyStore()
    const created = { id: 'note-3', body: '', createdAt: '2026-10-12T11:00:00.000Z' }
    vi.mocked(api.createNote).mockResolvedValue(created)
    expect(await store.addNote()).toEqual(created)
    expect(store.notes.map((note) => note.id)).toEqual(['note-3', 'note-1', 'note-2'])
  })

  it('saves edits of one note in order', async () => {
    const store = await readyStore()
    const calls: string[] = []
    let releaseFirst: () => void = () => undefined
    vi.mocked(api.updateNote)
      .mockImplementationOnce(async (_owner, id, body) => {
        calls.push(body)
        await new Promise<void>((resolve) => (releaseFirst = resolve))
        return { ...first, id, body }
      })
      .mockImplementationOnce(async (_owner, id, body) => {
        calls.push(body)
        return { ...first, id, body }
      })

    const earlier = store.updateNote(first.id, 'Draft')
    const later = store.updateNote(first.id, 'Draft final')
    await Promise.resolve()
    expect(calls).toEqual(['Draft'])
    releaseFirst()
    expect(await earlier).toBe(true)
    expect(await later).toBe(true)
    expect(calls).toEqual(['Draft', 'Draft final'])
    expect(store.notes[0]?.body).toBe('Draft final')
  })

  it('reports a failed save and rejects notes over the length limit', async () => {
    const store = await readyStore()
    vi.mocked(api.updateNote).mockRejectedValue(new Error('Save failed'))
    expect(await store.updateNote(first.id, 'Text')).toBe(false)
    expect(store.error).toBe('Save failed')
    expect(store.notes[0]?.body).toBe('First')
    expect(await store.updateNote(first.id, 'x'.repeat(10001))).toBe(false)
    expect(await store.updateNote('missing', 'Text')).toBe(false)
    expect(api.updateNote).toHaveBeenCalledTimes(1)
  })

  it('deletes a note after its in-flight save and skips later saves', async () => {
    const store = await readyStore()
    let releaseSave: () => void = () => undefined
    vi.mocked(api.updateNote).mockImplementation(async (_owner, id, body) => {
      await new Promise<void>((resolve) => (releaseSave = resolve))
      return { ...first, id, body }
    })
    vi.mocked(api.deleteNote).mockResolvedValue([first.id])

    const save = store.updateNote(first.id, 'Last words')
    await vi.waitFor(() => expect(api.updateNote).toHaveBeenCalled())
    const removal = store.removeNote(first.id)
    expect(store.removingIds.has(first.id)).toBe(true)
    expect(await store.updateNote(first.id, 'Too late')).toBe(false)
    await Promise.resolve()
    expect(api.deleteNote).not.toHaveBeenCalled()
    releaseSave()
    expect(await save).toBe(true)
    expect(await removal).toBe(true)
    expect(api.deleteNote).toHaveBeenCalledExactlyOnceWith('account-a', first.id)
    expect(api.updateNote).toHaveBeenCalledTimes(1)
    expect(store.notes).toEqual([second])
    expect(store.removingIds.size).toBe(0)
  })

  it('clears notes on sign-out and ignores a late load', async () => {
    const store = useNotesStore()
    store.setAccount('account-a')
    let resolveLoad: (notes: Note[]) => void = () => undefined
    vi.mocked(api.fetchNotes).mockReturnValue(new Promise((resolve) => (resolveLoad = resolve)))
    const loading = store.refresh()
    store.setAccount(null)
    resolveLoad([first])
    await loading
    expect(store.notes).toEqual([])
    expect(store.loaded).toBe(false)
  })
})
