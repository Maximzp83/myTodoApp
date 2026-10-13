import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import TodoNoteDialog from '@/components/TodoNoteDialog.vue'
import { TodoPriorityId, type Todo } from '@/types/todo'

const todo: Todo = {
  id: 'todo-1',
  title: 'Buy milk',
  completed: false,
  createdAt: '2026-10-12T10:00:00.000Z',
  priorityId: TodoPriorityId.Normal,
  categoryId: null,
  note: null,
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

function mountDialog(note: string | null = null) {
  return mount(TodoNoteDialog, {
    props: { todo: { ...todo, note }, busy: false, error: '' },
    attachTo: document.body,
  })
}

describe('TodoNoteDialog', () => {
  it('opens as a modal showing the existing note', () => {
    const wrapper = mountDialog('Two liters')
    expect(wrapper.get<HTMLDialogElement>('dialog').element.open).toBe(true)
    expect(wrapper.get('h2').text()).toBe('Buy milk')
    expect(wrapper.get<HTMLTextAreaElement>('textarea').element.value).toBe('Two liters')
    wrapper.unmount()
  })

  it('saves only a changed note', async () => {
    const wrapper = mountDialog()
    const save = wrapper.get<HTMLButtonElement>('button[type="submit"]')
    expect(save.element.disabled).toBe(true)
    await wrapper.get('textarea').setValue('   ')
    expect(save.element.disabled).toBe(true)
    await wrapper.get('textarea').setValue('Lactose free')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toEqual([[todo.id, 'Lactose free']])
    wrapper.unmount()
  })

  it('deletes an existing note and closes on cancel', async () => {
    const wrapper = mountDialog('Old note')
    await wrapper.get('button.button--danger').trigger('click')
    expect(wrapper.emitted('save')).toEqual([[todo.id, '']])
    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Cancel')
    await cancel?.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('shows a save error inside the dialog', () => {
    const wrapper = mount(TodoNoteDialog, {
      props: { todo, busy: false, error: 'Could not save your changes.' },
    })
    expect(wrapper.get('[role="alert"]').text()).toBe('Could not save your changes.')
    wrapper.unmount()
  })
})
