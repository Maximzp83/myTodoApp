import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/services/notesApi'
import { useNotesStore } from '@/stores/notes'
import type { Note, NoteTab } from '@/types/note'

vi.mock('@/services/notesApi')

const ideas: NoteTab = { id: 'tab-ideas', name: 'Ideas' }
const first: Note = {
  id: 'note-1',
  tabId: ideas.id,
  title: 'First',
  content: 'First content',
  createdAt: '2026-10-14T10:00:00.000Z',
}
const second: Note = {
  id: 'note-2',
  tabId: null,
  title: '',
  content: 'Legacy body',
  createdAt: '2026-10-12T09:00:00.000Z',
}

async function readyStore(notes: Note[] = [first, second], tabs: NoteTab[] = [ideas]) {
  vi.mocked(api.fetchNotesData).mockResolvedValue({
    tabs: tabs.map((tab) => ({ ...tab })),
    notes: notes.map((note) => ({ ...note })),
  })
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
    expect(await store.addNote(null, { title: 'Note', content: '' })).toBeNull()
    expect(await store.updateNote(first.id, { title: 'Note', content: '' })).toBe(false)
    expect(await store.addTab('Work')).toBeNull()
    expect(api.fetchNotesData).not.toHaveBeenCalled()
    expect(api.createNote).not.toHaveBeenCalled()
    expect(api.createTab).not.toHaveBeenCalled()
  })

  it('loads tabs and notes for the signed-in account', async () => {
    const store = await readyStore()
    expect(api.fetchNotesData).toHaveBeenCalledWith('account-a')
    expect(store.tabs).toEqual([ideas])
    expect(store.notes).toEqual([first, second])
    expect(store.loaded).toBe(true)
  })

  it('creates a tab with a trimmed, unique name that is not General', async () => {
    const store = await readyStore()
    const work = { id: 'tab-work', name: 'Work' }
    vi.mocked(api.createTab).mockResolvedValue(work)
    expect(await store.addTab('  Work  ')).toEqual(work)
    expect(api.createTab).toHaveBeenCalledExactlyOnceWith('account-a', 'Work')
    expect(store.tabs).toEqual([ideas, work])

    expect(await store.addTab(' ideas ')).toBeNull()
    expect(await store.addTab('general')).toBeNull()
    expect(await store.addTab('   ')).toBeNull()
    expect(await store.addTab('x'.repeat(51))).toBeNull()
    expect(api.createTab).toHaveBeenCalledTimes(1)
  })

  it('renames a tab and rejects unchanged, duplicate, or reserved names', async () => {
    const store = await readyStore([], [ideas, { id: 'tab-work', name: 'Work' }])
    vi.mocked(api.renameTab).mockResolvedValue({ ...ideas, name: 'Plans' })
    expect(await store.renameTab(ideas.id, ' Plans ')).toBe(true)
    expect(api.renameTab).toHaveBeenCalledExactlyOnceWith('account-a', ideas.id, 'Plans')
    expect(store.tabs[0]?.name).toBe('Plans')

    expect(await store.renameTab(ideas.id, 'Plans')).toBe(false)
    expect(await store.renameTab(ideas.id, 'WORK')).toBe(false)
    expect(await store.renameTab(ideas.id, 'General')).toBe(false)
    expect(await store.renameTab('missing', 'Other')).toBe(false)
    expect(api.renameTab).toHaveBeenCalledTimes(1)
  })

  it('moves the notes of a deleted tab to General after pending saves finish', async () => {
    const store = await readyStore()
    let releaseSave: () => void = () => undefined
    vi.mocked(api.updateNote).mockImplementation(async (_owner, id, draft) => {
      await new Promise<void>((resolve) => (releaseSave = resolve))
      return { ...first, id, ...draft }
    })
    vi.mocked(api.deleteTab).mockResolvedValue(ideas.id)

    const save = store.updateNote(first.id, { title: 'Edited', content: 'Edited content' })
    await vi.waitFor(() => expect(api.updateNote).toHaveBeenCalled())
    const removal = store.removeTab(ideas.id)
    await Promise.resolve()
    expect(api.deleteTab).not.toHaveBeenCalled()
    releaseSave()
    expect(await save).toBe(true)
    expect(await removal).toBe(true)
    expect(api.deleteTab).toHaveBeenCalledExactlyOnceWith('account-a', ideas.id)
    expect(store.tabs).toEqual([])
    expect(store.notes[0]).toMatchObject({ id: first.id, tabId: null, title: 'Edited' })
  })

  it('keeps a tab when its deletion fails', async () => {
    const store = await readyStore()
    vi.mocked(api.deleteTab).mockRejectedValue(new Error('Delete failed'))
    expect(await store.removeTab(ideas.id)).toBe(false)
    expect(store.error).toBe('Delete failed')
    expect(store.tabs).toEqual([ideas])
    expect(store.notes[0]?.tabId).toBe(ideas.id)
    expect(store.tabSaving).toBe(false)
  })

  it('creates a note with a trimmed title in an existing tab', async () => {
    const store = await readyStore()
    const created = { ...first, id: 'note-3', title: 'Plan', content: ' body ' }
    vi.mocked(api.createNote).mockResolvedValue(created)
    expect(await store.addNote(ideas.id, { title: '  Plan ', content: ' body ' })).toEqual(created)
    expect(api.createNote).toHaveBeenCalledExactlyOnceWith('account-a', ideas.id, {
      title: 'Plan',
      content: ' body ',
    })
    expect(store.notes.map((note) => note.id)).toEqual(['note-3', 'note-1', 'note-2'])

    expect(await store.addNote('missing', { title: 'Lost', content: '' })).toBeNull()
    expect(await store.addNote(null, { title: 'x'.repeat(121), content: '' })).toBeNull()
    expect(await store.addNote(null, { title: '', content: 'x'.repeat(10001) })).toBeNull()
    expect(api.createNote).toHaveBeenCalledTimes(1)
  })

  it('reports a failed note creation', async () => {
    const store = await readyStore()
    vi.mocked(api.createNote).mockRejectedValue(new Error('Create failed'))
    expect(await store.addNote(null, { title: 'Note', content: '' })).toBeNull()
    expect(store.error).toBe('Create failed')
    expect(store.creating).toBe(false)
    expect(store.notes).toHaveLength(2)
  })

  it('saves edits of one note in order', async () => {
    const store = await readyStore()
    const calls: string[] = []
    let releaseFirst: () => void = () => undefined
    vi.mocked(api.updateNote)
      .mockImplementationOnce(async (_owner, id, draft) => {
        calls.push(draft.content)
        await new Promise<void>((resolve) => (releaseFirst = resolve))
        return { ...first, id, ...draft }
      })
      .mockImplementationOnce(async (_owner, id, draft) => {
        calls.push(draft.content)
        return { ...first, id, ...draft }
      })

    const earlier = store.updateNote(first.id, { title: 'First', content: 'Draft' })
    const later = store.updateNote(first.id, { title: 'First', content: 'Draft final' })
    await Promise.resolve()
    expect(calls).toEqual(['Draft'])
    releaseFirst()
    expect(await earlier).toBe(true)
    expect(await later).toBe(true)
    expect(calls).toEqual(['Draft', 'Draft final'])
    expect(store.notes[0]?.content).toBe('Draft final')
  })

  it('reports a failed save and keeps the stored note', async () => {
    const store = await readyStore()
    vi.mocked(api.updateNote).mockRejectedValue(new Error('Save failed'))
    expect(await store.updateNote(first.id, { title: 'New', content: 'Text' })).toBe(false)
    expect(store.error).toBe('Save failed')
    expect(store.notes[0]).toEqual(first)
    expect(await store.updateNote('missing', { title: '', content: 'Text' })).toBe(false)
    expect(api.updateNote).toHaveBeenCalledTimes(1)
  })

  it('deletes a note after its in-flight save and skips later saves', async () => {
    const store = await readyStore()
    let releaseSave: () => void = () => undefined
    vi.mocked(api.updateNote).mockImplementation(async (_owner, id, draft) => {
      await new Promise<void>((resolve) => (releaseSave = resolve))
      return { ...first, id, ...draft }
    })
    vi.mocked(api.deleteNote).mockResolvedValue([first.id])

    const save = store.updateNote(first.id, { title: 'First', content: 'Last words' })
    await vi.waitFor(() => expect(api.updateNote).toHaveBeenCalled())
    const removal = store.removeNote(first.id)
    expect(store.removingIds.has(first.id)).toBe(true)
    expect(await store.updateNote(first.id, { title: 'Too late', content: '' })).toBe(false)
    releaseSave()
    expect(await save).toBe(true)
    expect(await removal).toBe(true)
    expect(api.deleteNote).toHaveBeenCalledExactlyOnceWith('account-a', first.id)
    expect(api.updateNote).toHaveBeenCalledTimes(1)
    expect(store.notes).toEqual([second])
    expect(store.removingIds.size).toBe(0)
  })

  it('clears data on sign-out and ignores late responses', async () => {
    const store = await readyStore()
    let resolveTab: (tab: NoteTab) => void = () => undefined
    vi.mocked(api.createTab).mockReturnValue(new Promise((resolve) => (resolveTab = resolve)))
    const creation = store.addTab('Work')
    store.setAccount(null)
    resolveTab({ id: 'tab-work', name: 'Work' })
    expect(await creation).toBeNull()

    store.setAccount('account-b')
    let resolveLoad: (data: { tabs: NoteTab[]; notes: Note[] }) => void = () => undefined
    vi.mocked(api.fetchNotesData).mockReturnValue(new Promise((resolve) => (resolveLoad = resolve)))
    const loading = store.refresh()
    store.setAccount(null)
    resolveLoad({ tabs: [ideas], notes: [first] })
    await loading
    expect(store.tabs).toEqual([])
    expect(store.notes).toEqual([])
    expect(store.loaded).toBe(false)
    expect(store.tabSaving).toBe(false)
  })
})
