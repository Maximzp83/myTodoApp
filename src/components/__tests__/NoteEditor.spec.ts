import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NoteEditor from '@/components/NoteEditor.vue'
import * as api from '@/services/notesApi'
import { useNotesStore } from '@/stores/notes'
import type { Note } from '@/types/note'

vi.mock('@/services/notesApi')

const note: Note = { id: 'note-1', body: 'First', createdAt: '2026-10-12T10:00:00.000Z' }

describe('NoteEditor', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    setActivePinia(createPinia())
  })

  it('saves only when the Save button is used', async () => {
    vi.mocked(api.fetchNotes).mockResolvedValue([{ ...note }])
    const store = useNotesStore()
    store.setAccount('account-a')
    await store.refresh()
    const wrapper = mount(NoteEditor, { props: { note, removing: false } })
    const save = wrapper.get<HTMLButtonElement>('button[type="submit"]')
    expect(save.element.disabled).toBe(true)

    await wrapper.get('textarea').setValue('First, edited')
    expect(wrapper.get('[role="status"]').text()).toBe('Unsaved changes')
    expect(wrapper.emitted('update:dirty')).toContainEqual([true])
    expect(save.element.disabled).toBe(false)
    expect(api.updateNote).not.toHaveBeenCalled()

    vi.mocked(api.updateNote).mockResolvedValue({ ...note, body: 'First, edited' })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.updateNote).toHaveBeenCalledExactlyOnceWith('account-a', note.id, 'First, edited')

    await wrapper.setProps({ note: store.notes[0] })
    expect(wrapper.get('[role="status"]').text()).toBe('All changes saved')
    const dirtyEvents = wrapper.emitted('update:dirty') ?? []
    expect(dirtyEvents[dirtyEvents.length - 1]).toEqual([false])
    expect(save.element.disabled).toBe(true)
  })
})
