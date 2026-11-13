import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useActiveNoteTab } from '@/composables/useActiveNoteTab'
import type { Note, NoteTab } from '@/types/note'

function note(id: string, tabId: string | null, createdAt: string, position = 1): Note {
  return { id, tabId, title: id, content: '', createdAt, position }
}

describe('useActiveNoteTab', () => {
  it('shows the notes of the active tab in the account order', () => {
    const tabs = ref<NoteTab[]>([{ id: 'ideas', name: 'Ideas' }])
    const notes = ref([
      note('new-general', null, '2026-10-03T10:00:00.000Z', 3),
      note('idea', 'ideas', '2026-10-02T10:00:00.000Z', 2),
      note('old-general', null, '2026-10-01T10:00:00.000Z', 1),
    ])
    const { activeTabId, tabNotes } = useActiveNoteTab(tabs, notes)
    expect(activeTabId.value).toBeNull()
    expect(tabNotes.value.map((item) => item.id)).toEqual(['old-general', 'new-general'])
    activeTabId.value = 'ideas'
    expect(tabNotes.value.map((item) => item.id)).toEqual(['idea'])
  })

  it('shows newer notes first when their positions are equal', () => {
    const tabs = ref<NoteTab[]>([])
    const notes = ref([
      note('old', null, '2026-10-01T10:00:00.000Z'),
      note('new', null, '2026-10-03T10:00:00.000Z'),
    ])
    const { tabNotes } = useActiveNoteTab(tabs, notes)
    expect(tabNotes.value.map((item) => item.id)).toEqual(['new', 'old'])
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
