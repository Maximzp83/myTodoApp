import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NoteTabs from '@/components/NoteTabs.vue'

const props = {
  tabs: [
    { id: 'ideas', name: 'Ideas' },
    { id: 'recipes', name: 'Recipes' },
  ],
  modelValue: null,
  panelId: 'notes-panel',
  actionsTabId: null,
}

describe('NoteTabs', () => {
  it('shows General first and offers management only for custom tabs', async () => {
    const wrapper = mount(NoteTabs, { props })
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toEqual([
      'General',
      'Ideas',
      'Recipes',
    ])
    expect(wrapper.get('[role="tab"]').attributes('aria-selected')).toBe('true')
    expect(wrapper.findAll('.category-tab__manage')).toHaveLength(2)
    await wrapper.get('[aria-label="Manage tab Ideas"]').trigger('click')
    expect(wrapper.emitted('manage')).toEqual([['ideas']])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('selects tabs by click and with arrow keys', async () => {
    const wrapper = mount(NoteTabs, { props, attachTo: document.body })
    try {
      const tabs = wrapper.findAll<HTMLButtonElement>('[role="tab"]')
      await tabs[1]?.trigger('click')
      await tabs[0]?.trigger('keydown', { key: 'ArrowLeft' })
      await tabs[2]?.trigger('keydown', { key: 'Home' })
      expect(wrapper.emitted('update:modelValue')).toEqual([['ideas'], ['recipes'], [null]])
      expect(document.activeElement).toBe(tabs[0]?.element)
    } finally {
      wrapper.unmount()
    }
  })
})
