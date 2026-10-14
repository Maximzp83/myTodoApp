import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NoteTabActions from '@/components/NoteTabActions.vue'

const ideas = { id: 'ideas', name: 'Ideas' }

function mountActions() {
  return mount(NoteTabActions, {
    props: {
      tab: ideas,
      tabs: [ideas, { id: 'recipes', name: 'Recipes' }],
      busy: false,
      resetVersion: 0,
    },
  })
}

function button(wrapper: ReturnType<typeof mountActions>, text: string) {
  const found = wrapper.findAll('button').find((item) => item.text() === text)
  if (!found) throw new Error(`Expected button ${text}`)
  return found
}

describe('NoteTabActions', () => {
  it('renames a tab and rejects duplicates and the General name', async () => {
    const wrapper = mountActions()
    await button(wrapper, 'Edit tab').trigger('click')
    const input = wrapper.get<HTMLInputElement>('input')
    expect(input.element.value).toBe('Ideas')
    await input.setValue(' recipes ')
    expect(wrapper.get('[role="status"]').text()).toBe('A tab with this name already exists.')
    await input.setValue('General')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('rename')).toBeUndefined()
    await input.setValue(' Plans ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('rename')).toEqual([[ideas.id, 'Plans']])
  })

  it('asks before deleting and explains where the notes go', async () => {
    const wrapper = mountActions()
    await button(wrapper, 'Delete tab').trigger('click')
    expect(wrapper.text()).toContain('Delete “Ideas”? Its notes will move to General.')
    await button(wrapper, 'Confirm delete tab').trigger('click')
    expect(wrapper.emitted('remove')).toEqual([[ideas.id]])
  })
})
