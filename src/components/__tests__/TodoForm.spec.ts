import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TodoForm from '@/components/TodoForm.vue'
import { prioritiesList, TodoPriorityId } from '@/types/todo'

describe('TodoForm', () => {
  it('offers every priority and selects normal by default', () => {
    const wrapper = mount(TodoForm)
    const prioritySelect = wrapper.get<HTMLSelectElement>('#todo-priority')

    expect(wrapper.findAll('option').map((option) => Number(option.attributes('value')))).toEqual(
      prioritiesList.map((priority) => priority.id),
    )
    expect(Number(prioritySelect.element.value)).toBe(TodoPriorityId.Normal)
  })

  it('emits the selected priority and resets the form', async () => {
    const wrapper = mount(TodoForm)
    const titleInput = wrapper.get<HTMLInputElement>('#new-todo')
    const prioritySelect = wrapper.get<HTMLSelectElement>('#todo-priority')

    await titleInput.setValue('Critical task')
    await prioritySelect.setValue(String(TodoPriorityId.Critical))
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('add')).toEqual([['Critical task', TodoPriorityId.Critical]])
    expect(titleInput.element.value).toBe('')
    expect(Number(prioritySelect.element.value)).toBe(TodoPriorityId.Normal)
  })
})
