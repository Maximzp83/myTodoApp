import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TodoCategoryActions from '@/components/TodoCategoryActions.vue'

const work = { id: 'work', name: 'Work' }
function mountActions() {
  return mount(TodoCategoryActions, {
    props: {
      category: work,
      categories: [work, { id: 'personal', name: 'Personal' }],
      busy: false,
      resetVersion: 0,
    },
  })
}

describe('TodoCategoryActions', () => {
  it('validates a rename, excludes its own name from duplicates, and waits for confirmation', async () => {
    const wrapper = mountActions()
    await wrapper.get('button').trigger('click')
    const input = wrapper.get<HTMLInputElement>('input')
    expect(input.element.value).toBe('Work')
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
    await input.setValue('  pErSoNaL  ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="status"]').text()).toBe('A category with this name already exists.')
    expect(wrapper.emitted('rename')).toBeUndefined()
    await input.setValue(' ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('rename')).toBeUndefined()
    await input.setValue('  WORK  ')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('rename')).toEqual([[work.id, 'WORK']])
    expect(input.element.value).toBe('  WORK  ')
    await wrapper.setProps({ resetVersion: 1, category: { ...work, name: 'WORK' } })
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('cancels edits with Escape without emitting a rename', async () => {
    const wrapper = mountActions()
    await wrapper.get('button').trigger('click')
    await wrapper.get('input').setValue('Projects')
    await wrapper.get('form').trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.emitted('rename')).toBeUndefined()
  })

  it('requires explicit delete confirmation and allows cancellation', async () => {
    const wrapper = mountActions()
    await wrapper.get('.button--danger').trigger('click')
    expect(wrapper.text()).toContain('Its tasks will be kept in Uncategorized.')
    expect(wrapper.emitted('remove')).toBeUndefined()
    await wrapper.get('.button--quiet').trigger('click')
    expect(wrapper.text()).not.toContain('Confirm delete category')
    await wrapper.get('.button--danger').trigger('click')
    await wrapper.get('.button--danger').trigger('click')
    expect(wrapper.emitted('remove')).toEqual([[work.id]])
  })

  it('disables rename submissions and cancellation during a pending save', async () => {
    const wrapper = mountActions()
    await wrapper.get('button').trigger('click')
    await wrapper.get('input').setValue('Projects')
    await wrapper.setProps({ busy: true })
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('keydown', { key: 'Escape' })
    expect(wrapper.get<HTMLInputElement>('input').element.disabled).toBe(true)
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
    expect(wrapper.get<HTMLButtonElement>('.button--quiet').element.disabled).toBe(true)
    expect(wrapper.emitted('rename')).toBeUndefined()
  })
})
