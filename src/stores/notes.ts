import { ref } from 'vue'
import { defineStore } from 'pinia'
import * as notesApi from '@/services/notesApi'
import { errorMessage } from '@/services/errors'
import { MAX_NOTE_LENGTH, type Note } from '@/types/note'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const creating = ref(false)
  const removingIds = ref(new Set<string>())
  const error = ref('')
  const userId = ref<string | null>(null)
  let accountVersion = 0
  // Saves of one note run in order, so a slow earlier save cannot overwrite a later one.
  const pendingSaves = new Map<string, Promise<boolean>>()

  function setAccount(id: string | null) {
    if (userId.value === id) return
    accountVersion += 1
    userId.value = id
    notes.value = []
    loaded.value = false
    loading.value = false
    creating.value = false
    removingIds.value = new Set()
    pendingSaves.clear()
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
      if (version !== accountVersion) return
      const data = await notesApi.fetchNotes(id)
      if (version !== accountVersion) return
      notes.value = data
      loaded.value = true
    } catch (cause) {
      if (version === accountVersion)
        error.value = errorMessage(cause, 'Could not load your notes. Please try again.')
    } finally {
      if (version === accountVersion) loading.value = false
    }
  }

  async function addNote() {
    if (!userId.value || !loaded.value || creating.value) return null
    const owner = userId.value
    const version = accountVersion
    creating.value = true
    error.value = ''
    try {
      const note = await notesApi.createNote(owner)
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

  function updateNote(id: string, body: string) {
    if (!userId.value || !loaded.value || body.length > MAX_NOTE_LENGTH || !isAvailable(id))
      return Promise.resolve(false)
    const owner = userId.value
    const version = accountVersion
    const previous = pendingSaves.get(id) ?? Promise.resolve(true)
    const pending = previous.then(async () => {
      if (version !== accountVersion || !isAvailable(id)) return false
      try {
        const updated = await notesApi.updateNote(owner, id, body)
        if (version !== accountVersion) return false
        notes.value = notes.value.map((note) => (note.id === updated.id ? updated : note))
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

  return {
    notes,
    loading,
    loaded,
    creating,
    removingIds,
    error,
    setAccount,
    refresh,
    addNote,
    updateNote,
    removeNote,
  }
})
