import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NoteList from '@/components/NoteList.vue'
import { formatNoteDate, type Note } from '@/types/note'

const titled: Note = {
  id: 'note-1',
  tabId: null,
  title: 'Groceries',
  content: 'Milk',
  createdAt: '2026-10-14T10:00:00.000Z',
}
const untitled: Note = { ...titled, id: 'note-2', title: '' }

describe('NoteList', () => {
  it('shows titles or a placeholder with the local creation date', async () => {
    const wrapper = mount(NoteList, { props: { notes: [titled, untitled], idPrefix: 'n' } })
    const items = wrapper.findAll('button')
    expect(items[0]?.attributes('id')).toBe('n-note-1')
    expect(items[0]?.get('.note-list__title').text()).toBe('Groceries')
    expect(items[1]?.get('.note-list__title').text()).toBe('Untitled note')
    const date = items[0]?.get('time')
    expect(date?.attributes('datetime')).toBe(titled.createdAt)
    expect(date?.text()).toBe(formatNoteDate(titled.createdAt))
    await items[1]?.trigger('click')
    expect(wrapper.emitted('open')).toEqual([['note-2']])
  })

  it('shows an empty state for a tab without notes', () => {
    const wrapper = mount(NoteList, { props: { notes: [], idPrefix: 'n' } })
    expect(wrapper.text()).toBe('No notes in this tab yet.')
  })
})
