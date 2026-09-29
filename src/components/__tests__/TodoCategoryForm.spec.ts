import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TodoCategoryForm from '@/components/TodoCategoryForm.vue'

describe('TodoCategoryForm', () => {
  it('requires a name and emits the trimmed name on submission', async () => {
    const wrapper = mount(TodoCategoryForm, { props: { categories: [] } })
    const input = wrapper.get<HTMLInputElement>('#new-category')
    const button = wrapper.get<HTMLButtonElement>('button')
    expect(button.element.disabled).toBe(true)

    await input.setValue('   ')
    expect(button.element.disabled).toBe(true)

    await input.setValue('  Work  ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('create')).toEqual([['Work']])
    expect(input.element.value).toBe('  Work  ')
    await wrapper.setProps({ resetVersion: 1 })
    expect(input.element.value).toBe('')
  })

  it('explains duplicate names and prevents their submission', async () => {
    const wrapper = mount(TodoCategoryForm, {
      props: { categories: [{ id: 'work', name: 'Work' }] },
    })

    await wrapper.get('#new-category').setValue('  wOrK ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[role="status"]').text()).toBe('A category with this name already exists.')
    expect(wrapper.get<HTMLButtonElement>('button').element.disabled).toBe(true)
    expect(wrapper.emitted('create')).toBeUndefined()
  })
})
