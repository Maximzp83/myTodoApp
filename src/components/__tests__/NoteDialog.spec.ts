import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import NoteDialog from '@/components/NoteDialog.vue'
import { formatNoteDate, type Note } from '@/types/note'

const note: Note = {
  id: 'note-1',
  tabId: null,
  title: 'Groceries',
  content: 'Milk\nBread',
  createdAt: '2026-10-14T10:00:00.000Z',
}

beforeAll(() => {
  // jsdom does not implement modal dialogs.
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

function mountDialog(value: Note | null = note) {
  return mount(NoteDialog, {
    props: { note: value, busy: false, error: '' },
    attachTo: document.body,
  })
}

function button(wrapper: ReturnType<typeof mountDialog>, text: string) {
  const found = wrapper.findAll('button').find((item) => item.text() === text)
  if (!found) throw new Error(`Expected button ${text}`)
  return found
}

describe('NoteDialog', () => {
  it('opens a modal with the title, content, and creation date', () => {
    const wrapper = mountDialog()
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    expect(wrapper.get('h2').text()).toBe('Groceries')
    expect(wrapper.get<HTMLInputElement>('input').element.value).toBe('Groceries')
    expect(wrapper.get<HTMLTextAreaElement>('textarea').element.value).toBe('Milk\nBread')
    expect(wrapper.get('time').text()).toBe(formatNoteDate(note.createdAt))
    wrapper.unmount()
  })

  it('edits in place and saves only changes', async () => {
    const wrapper = mountDialog()
    const save = wrapper.get<HTMLButtonElement>('button[type="submit"]')
    expect(save.element.disabled).toBe(true)
    await wrapper.get('input').setValue('Groceries ')
    expect(save.element.disabled).toBe(true)
    await wrapper.get('textarea').setValue('Milk')
    expect(wrapper.emitted('update:dirty')).toContainEqual([true])
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toEqual([[{ title: 'Groceries ', content: 'Milk' }]])
    wrapper.unmount()
  })

  it('creates a note only after something is typed', async () => {
    const wrapper = mountDialog(null)
    expect(wrapper.get('h2').text()).toBe('New note')
    expect(wrapper.find('time').exists()).toBe(false)
    expect(wrapper.findAll('button').some((item) => item.text() === 'Delete note')).toBe(false)
    const save = wrapper.get<HTMLButtonElement>('button[type="submit"]')
    await wrapper.get('textarea').setValue('   ')
    expect(save.element.disabled).toBe(true)
    await wrapper.get('input').setValue('Plan')
    await wrapper.get('form').trigger('keydown', { key: 's', ctrlKey: true })
    expect(wrapper.emitted('save')).toEqual([[{ title: 'Plan', content: '   ' }]])
    wrapper.unmount()
  })

  it('asks before discarding changes on Escape and Cancel', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const wrapper = mountDialog()
    await wrapper.get('textarea').setValue('Changed')
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' })
    expect(confirm).toHaveBeenCalledWith('Discard unsaved changes?')
    expect(wrapper.emitted('close')).toBeUndefined()
    await button(wrapper, 'Cancel').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('closes on Escape without asking when nothing changed', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const wrapper = mountDialog()
    await wrapper.get('dialog').trigger('keydown', { key: 'Escape' })
    expect(confirm).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('confirms deletion and shows errors inside the dialog', async () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const wrapper = mountDialog()
    await button(wrapper, 'Delete note').trigger('click')
    expect(wrapper.emitted('remove')).toBeUndefined()
    await button(wrapper, 'Delete note').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
    await wrapper.setProps({ error: 'Could not save your note.' })
    expect(wrapper.get('[role="alert"]').text()).toBe('Could not save your note.')
    wrapper.unmount()
  })
})
