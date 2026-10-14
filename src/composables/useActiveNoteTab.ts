import { computed, ref, type Ref } from 'vue'
import type { Note, NoteTab, NoteTabId } from '@/types/note'

export function useActiveNoteTab(
  tabs: Readonly<Ref<readonly NoteTab[]>>,
  notes: Readonly<Ref<readonly Note[]>>,
) {
  const selectedTabId = ref<NoteTabId>(null)

  // A missing tab (deleted here or on another device) falls back to General.
  function existingTabId(tabId: NoteTabId) {
    return tabId !== null && tabs.value.some((tab) => tab.id === tabId) ? tabId : null
  }

  const activeTabId = computed<NoteTabId>({
    get: () => existingTabId(selectedTabId.value),
    set: (tabId) => {
      selectedTabId.value = tabId
    },
  })

  const tabNotes = computed(() =>
    notes.value
      .filter((note) => existingTabId(note.tabId) === activeTabId.value)
      .sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id),
      ),
  )

  return { activeTabId, tabNotes }
}
