import { describe, expect, it } from 'vitest'
import { toNote, toNoteTab } from '@/services/notesApi'

describe('notesApi mapping', () => {
  it('maps a stored body to note content and keeps a missing tab as General', () => {
    expect(
      toNote({
        id: 'note-1',
        user_id: 'account-a',
        title: '',
        body: 'Legacy text',
        tab_id: null,
        created_at: '2026-10-12T09:00:00+00:00',
      }),
    ).toEqual({
      id: 'note-1',
      tabId: null,
      title: '',
      content: 'Legacy text',
      createdAt: '2026-10-12T09:00:00+00:00',
    })
  })

  it('maps a tab row without its owner', () => {
    expect(
      toNoteTab({
        id: 'tab-1',
        user_id: 'account-a',
        name: 'Ideas',
        created_at: '2026-10-14T10:00:00+00:00',
      }),
    ).toEqual({ id: 'tab-1', name: 'Ideas' })
  })
})
