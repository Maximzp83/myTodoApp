import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useActiveNoteTab } from '@/composables/useActiveNoteTab'
import type { Note, NoteTab } from '@/types/note'

function note(id: string, tabId: string | null, createdAt: string): Note {
  return { id, tabId, title: id, content: '', createdAt }
}

describe('useActiveNoteTab', () => {
  it('shows the notes of the active tab, newest first', () => {
    const tabs = ref<NoteTab[]>([{ id: 'ideas', name: 'Ideas' }])
    const notes = ref([
      note('old-general', null, '2026-10-01T10:00:00.000Z'),
      note('idea', 'ideas', '2026-10-02T10:00:00.000Z'),
      note('new-general', null, '2026-10-03T10:00:00.000Z'),
    ])
    const { activeTabId, tabNotes } = useActiveNoteTab(tabs, notes)
    expect(activeTabId.value).toBeNull()
    expect(tabNotes.value.map((item) => item.id)).toEqual(['new-general', 'old-general'])
    activeTabId.value = 'ideas'
    expect(tabNotes.value.map((item) => item.id)).toEqual(['idea'])
  })

  it('falls back to General when the active tab or a note tab no longer exists', () => {
    const tabs = ref<NoteTab[]>([{ id: 'ideas', name: 'Ideas' }])
    const notes = ref([
      note('idea', 'ideas', '2026-10-02T10:00:00.000Z'),
      note('orphan', 'deleted-elsewhere', '2026-10-01T10:00:00.000Z'),
    ])
    const { activeTabId, tabNotes } = useActiveNoteTab(tabs, notes)
    expect(tabNotes.value.map((item) => item.id)).toEqual(['orphan'])
    activeTabId.value = 'ideas'
    tabs.value = []
    expect(activeTabId.value).toBeNull()
    expect(tabNotes.value.map((item) => item.id)).toEqual(['idea', 'orphan'])
  })
})
