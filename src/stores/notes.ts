import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as notesApi from '@/services/notesApi'
import { errorMessage } from '@/services/errors'
import {
  compareNoteOrder,
  DEFAULT_NOTE_TAB_NAME,
  MAX_NOTE_CONTENT_LENGTH,
  MAX_NOTE_TAB_NAME_LENGTH,
  MAX_NOTE_TITLE_LENGTH,
  type Note,
  type NoteDraft,
  type NoteTab,
} from '@/types/note'

export const useNotesStore = defineStore('notes', () => {
  const tabs = ref<NoteTab[]>([])
  const notes = ref<Note[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const creating = ref(false)
  const tabSaving = ref(false)
  const removingIds = ref(new Set<string>())
  const error = ref('')
  const userId = ref<string | null>(null)
  let accountVersion = 0
  // Saves of one note run in order, so a slow earlier save cannot overwrite a later one.
  const pendingSaves = new Map<string, Promise<boolean>>()
  // Reorders run one after another. Each one is shown at once; the server's positions are
  // applied when the last queued reorder finishes, so earlier answers cannot undo later moves.
  let reorderQueue: Promise<unknown> = Promise.resolve()
  let queuedReorders = 0
  let confirmedPositions = new Map<string, number>()

  function setAccount(id: string | null) {
    if (userId.value === id) return
    accountVersion += 1
    userId.value = id
    tabs.value = []
    notes.value = []
    loaded.value = false
    loading.value = false
    creating.value = false
    tabSaving.value = false
    removingIds.value = new Set()
    pendingSaves.clear()
    reorderQueue = Promise.resolve()
    queuedReorders = 0
    confirmedPositions = new Map()
    error.value = ''
  }

  async function refresh() {
    if (!userId.value || loading.value) return
    const id = userId.value
    const version = accountVersion
    loading.value = true
    error.value = ''
    try {
      if (pendingSaves.size > 0) await Promise.all(pendingSaves.values())
      await reorderQueue
      if (version !== accountVersion) return
      const data = await notesApi.fetchNotesData(id)
      if (version !== accountVersion) return
      tabs.value = data.tabs
      notes.value = data.notes
      loaded.value = true
    } catch (cause) {
      if (version === accountVersion)
        error.value = errorMessage(cause, 'Could not load your notes. Please try again.')
    } finally {
      if (version === accountVersion) loading.value = false
    }
  }

  function isValidTabName(name: string, exceptId?: string) {
    const lowerName = name.toLowerCase()
    return (
      name.length > 0 &&
      name.length <= MAX_NOTE_TAB_NAME_LENGTH &&
      lowerName !== DEFAULT_NOTE_TAB_NAME.toLowerCase() &&
      !tabs.value.some((tab) => tab.id !== exceptId && tab.name.toLowerCase() === lowerName)
    )
  }

  function normalizeDraft(draft: NoteDraft): NoteDraft | null {
    const title = draft.title.trim()
    if (
      title.length > MAX_NOTE_TITLE_LENGTH ||
      draft.content.length > MAX_NOTE_CONTENT_LENGTH ||
      (draft.tabId !== null && !tabs.value.some((tab) => tab.id === draft.tabId))
    )
      return null
    return { tabId: draft.tabId, title, content: draft.content }
  }

  async function mutateTabs<T>(
    operation: (owner: string) => Promise<T>,
    commit: (result: T) => void,
  ): Promise<T | null> {
    if (!userId.value || !loaded.value || tabSaving.value) return null
    const owner = userId.value
    const version = accountVersion
    tabSaving.value = true
    error.value = ''
    try {
      // A late save response must not bring back the tab id of a deleted tab.
      if (pendingSaves.size > 0) await Promise.all(pendingSaves.values())
      if (version !== accountVersion) return null
      const result = await operation(owner)
      if (version !== accountVersion) return null
      commit(result)
      return result
    } catch (cause) {
      if (version === accountVersion)
        error.value = errorMessage(cause, 'Could not save your changes. Please try again.')
      return null
    } finally {
      if (version === accountVersion) tabSaving.value = false
    }
  }

  async function addTab(name: string) {
    const trimmedName = name.trim()
    if (!isValidTabName(trimmedName)) return null
    return mutateTabs(
      (owner) => notesApi.createTab(owner, trimmedName),
      (tab) => {
        tabs.value.push(tab)
      },
    )
  }

  async function renameTab(id: string, name: string) {
    const tab = tabs.value.find((item) => item.id === id)
    const trimmedName = name.trim()
    if (!tab || trimmedName === tab.name || !isValidTabName(trimmedName, id)) return false
    const result = await mutateTabs(
      (owner) => notesApi.renameTab(owner, id, trimmedName),
      (updated) => {
        tabs.value = tabs.value.map((item) => (item.id === updated.id ? updated : item))
      },
    )
    return result !== null
  }

  async function removeTab(id: string) {
    if (!tabs.value.some((tab) => tab.id === id)) return false
    const result = await mutateTabs(
      (owner) => notesApi.deleteTab(owner, id),
      (deletedId) => {
        tabs.value = tabs.value.filter((tab) => tab.id !== deletedId)
        notes.value = notes.value.map((note) =>
          note.tabId === deletedId ? { ...note, tabId: null } : note,
        )
      },
    )
    return result !== null
  }

  async function addNote(draft: NoteDraft) {
    const normalized = normalizeDraft(draft)
    if (!userId.value || !loaded.value || creating.value || !normalized) return null
    const owner = userId.value
    const version = accountVersion
    creating.value = true
    error.value = ''
    try {
      const note = await notesApi.createNote(owner, normalized)
      if (version !== accountVersion) return null
      notes.value.unshift(note)
      return note
    } catch (cause) {
      if (version === accountVersion)
        error.value = errorMessage(cause, 'Could not create a note. Please try again.')
      return null
    } finally {
      if (version === accountVersion) creating.value = false
    }
  }

  function isAvailable(id: string) {
    return notes.value.some((note) => note.id === id) && !removingIds.value.has(id)
  }

  function updateNote(id: string, draft: NoteDraft) {
    const normalized = normalizeDraft(draft)
    if (!userId.value || !loaded.value || !normalized || !isAvailable(id))
      return Promise.resolve(false)
    const owner = userId.value
    const version = accountVersion
    const previous = pendingSaves.get(id) ?? Promise.resolve(true)
    const pending = previous.then(async () => {
      if (version !== accountVersion || !isAvailable(id)) return false
      try {
        const updated = await notesApi.updateNote(owner, id, normalized)
        if (version !== accountVersion) return false
        // Positions change only through reorders and refresh, so a save cannot undo a move.
        notes.value = notes.value.map((note) =>
          note.id === updated.id ? { ...updated, position: note.position } : note,
        )
        error.value = ''
        return true
      } catch (cause) {
        if (version === accountVersion)
          error.value = errorMessage(cause, 'Could not save your note. Please try again.')
        return false
      }
    })
    pendingSaves.set(id, pending)
    void pending.then(() => {
      if (pendingSaves.get(id) === pending) pendingSaves.delete(id)
    })
    return pending
  }

  async function removeNote(id: string) {
    if (!userId.value || !loaded.value || !isAvailable(id)) return false
    const owner = userId.value
    const version = accountVersion
    removingIds.value.add(id)
    error.value = ''
    try {
      await pendingSaves.get(id)
      await reorderQueue
      if (version !== accountVersion) return false
      const deletedIds = await notesApi.deleteNote(owner, id)
      if (version !== accountVersion) return false
      notes.value = notes.value.filter((note) => !deletedIds.includes(note.id))
      return true
    } catch (cause) {
      if (version === accountVersion)
        error.value = errorMessage(cause, 'Could not delete the note. Please try again.')
      return false
    } finally {
      if (version === accountVersion) removingIds.value.delete(id)
    }
  }

  function applyPositions(positions: ReadonlyMap<string, number>) {
    notes.value = notes.value.map((note) => {
      const position = positions.get(note.id)
      return position === undefined || position === note.position ? note : { ...note, position }
    })
  }

  // Moves a note right after afterId (to the top when null) in the account's order of notes.
  function reorderNote(id: string, afterId: string | null) {
    const moved = notes.value.find((note) => note.id === id)
    if (
      !userId.value ||
      !loaded.value ||
      loading.value ||
      !moved ||
      !isAvailable(id) ||
      afterId === id ||
      (afterId !== null && !isAvailable(afterId))
    )
      return Promise.resolve(false)
    const ordered = notes.value.filter((note) => note.id !== id).sort(compareNoteOrder)
    ordered.splice(
      afterId === null ? 0 : ordered.findIndex((note) => note.id === afterId) + 1,
      0,
      moved,
    )
    if (queuedReorders === 0)
      confirmedPositions = new Map(notes.value.map((note) => [note.id, note.position]))
    queuedReorders += 1
    applyPositions(new Map(ordered.map((note, index) => [note.id, index + 1])))
    error.value = ''
    const version = accountVersion
    const pending = reorderQueue.then(async () => {
      if (version !== accountVersion) return false
      try {
        const positions = await notesApi.reorderNote(id, afterId)
        if (version !== accountVersion) return false
        confirmedPositions = positions
        return true
      } catch (cause) {
        if (version === accountVersion)
          error.value = errorMessage(cause, 'Could not reorder your notes. Please try again.')
        return false
      } finally {
        if (version === accountVersion) {
          queuedReorders -= 1
          // After a failure this restores the last order the server confirmed.
          if (queuedReorders === 0) applyPositions(confirmedPositions)
        }
      }
    })
    reorderQueue = pending
    return pending
  }

  return {
    tabs,
    notes,
    loading,
    loaded,
    creating,
    tabSaving,
    removingIds,
    error,
    setAccount,
    refresh,
    addTab,
    renameTab,
    removeTab,
    addNote,
    updateNote,
    removeNote,
    reorderNote,
  }
})
