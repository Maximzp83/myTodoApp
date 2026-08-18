import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TodoForm from '@/components/TodoForm.vue'
import { TodoPriority } from '@/types/todo'

describe('TodoForm', () => {
  it('offers every priority and selects normal by default', () => {
    const wrapper = mount(TodoForm)
    const prioritySelect = wrapper.get<HTMLSelectElement>('#todo-priority')

    expect(wrapper.findAll('option').map((option) => option.attributes('value'))).toEqual(
      Object.values(TodoPriority),
    )
    expect(prioritySelect.element.value).toBe(TodoPriority.Normal)
  })

  it('emits the selected priority and resets the form', async () => {
    const wrapper = mount(TodoForm)
    const titleInput = wrapper.get<HTMLInputElement>('#new-todo')
    const prioritySelect = wrapper.get<HTMLSelectElement>('#todo-priority')

    await titleInput.setValue('Critical task')
    await prioritySelect.setValue(TodoPriority.Critical)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('add')).toEqual([['Critical task', TodoPriority.Critical]])
    expect(titleInput.element.value).toBe('')
    expect(prioritySelect.element.value).toBe(TodoPriority.Normal)
  })
})
