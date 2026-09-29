import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TodoCategoryTabs from '@/components/TodoCategoryTabs.vue'

const props = {
  categories: [
    { id: 'work', name: 'Work' },
    { id: 'personal', name: 'Personal' },
  ],
  modelValue: undefined,
  panelId: 'tasks-panel',
  actionsCategoryId: null,
}

describe('TodoCategoryTabs', () => {
  it('offers separate management buttons only for custom categories', async () => {
    const wrapper = mount(TodoCategoryTabs, { props })
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(4)
    expect(wrapper.findAll('.category-tab__manage')).toHaveLength(2)
    expect(wrapper.find('button button').exists()).toBe(false)
    await wrapper.get('[aria-label="Manage category Work"]').trigger('click')
    expect(wrapper.emitted('manage')).toEqual([['work']])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('exposes the expanded state and makes the selected category action keyboard-accessible', async () => {
    const wrapper = mount(TodoCategoryTabs, { props })
    const pencil = wrapper.get('[aria-label="Manage category Work"]')
    expect(pencil.attributes('aria-expanded')).toBe('false')
    expect(pencil.attributes('tabindex')).toBe('-1')
    await wrapper.setProps({ modelValue: 'work', actionsCategoryId: 'work' })
    expect(pencil.attributes('aria-expanded')).toBe('true')
    expect(pencil.attributes('aria-controls')).toBe('tasks-panel-actions')
    expect(pencil.attributes('tabindex')).toBe('0')
  })

  it('keeps arrow and End navigation working with the new tab wrappers', async () => {
    const wrapper = mount(TodoCategoryTabs, { props, attachTo: document.body })
    try {
      const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
      const all = tabs[0]
      const uncategorized = tabs[1]
      const work = tabs[2]
      const personal = tabs[3]
      if (!all || !uncategorized || !work || !personal) throw new Error('Expected category tabs')
      await all.trigger('keydown', { key: 'ArrowRight' })
      expect(document.activeElement).toBe(uncategorized.element)
      await uncategorized.trigger('keydown', { key: 'ArrowRight' })
      expect(document.activeElement).toBe(work.element)
      await work.trigger('keydown', { key: 'End' })
      expect(document.activeElement).toBe(personal.element)
      expect(wrapper.emitted('update:modelValue')).toEqual([[null], ['work'], ['personal']])
    } finally {
      wrapper.unmount()
    }
  })
})
