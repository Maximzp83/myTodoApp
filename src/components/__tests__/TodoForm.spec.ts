import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TodoForm from '@/components/TodoForm.vue'
import { prioritiesList, TodoPriorityId } from '@/types/todo'

describe('TodoForm', () => {
  it('offers every priority and selects normal by default', () => {
    const wrapper = mount(TodoForm, { props: { categories: [], defaultCategoryId: null } })
    const prioritySelect = wrapper.get<HTMLSelectElement>('#todo-priority')

    expect(
      prioritySelect.findAll('option').map((option) => Number(option.attributes('value'))),
    ).toEqual(prioritiesList.map((priority) => priority.id))
    expect(Number(prioritySelect.element.value)).toBe(TodoPriorityId.Normal)
  })

  it('emits the selected priority and resets the form', async () => {
    const wrapper = mount(TodoForm, { props: { categories: [], defaultCategoryId: null } })
    const titleInput = wrapper.get<HTMLInputElement>('#new-todo')
    const prioritySelect = wrapper.get<HTMLSelectElement>('#todo-priority')

    await titleInput.setValue('Critical task')
    await prioritySelect.setValue(String(TodoPriorityId.Critical))
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('add')).toEqual([['Critical task', TodoPriorityId.Critical, null]])
    expect(titleInput.element.value).toBe('')
    expect(Number(prioritySelect.element.value)).toBe(TodoPriorityId.Normal)
  })

  it('defaults to the active category, allows another category, and resets after submission', async () => {
    const wrapper = mount(TodoForm, {
      props: {
        categories: [
          { id: 'work', name: 'Work' },
          { id: 'personal', name: 'Personal' },
        ],
        defaultCategoryId: 'work',
      },
    })
    const categorySelect = wrapper.get<HTMLSelectElement>('#todo-category')
    expect(categorySelect.element.value).toBe('work')

    await categorySelect.setValue('personal')
    await wrapper.get('#new-todo').setValue('Personal task')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('add')).toEqual([['Personal task', TodoPriorityId.Normal, 'personal']])
    expect(categorySelect.element.value).toBe('work')

    await wrapper.setProps({ defaultCategoryId: 'personal' })
    expect(categorySelect.element.value).toBe('personal')
  })
})
