import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useCategoryForm } from '@/composables/useCategoryForm'

describe('useCategoryForm', () => {
  it('uses custom limits, duplicate wording, and reserved names', () => {
    const items = ref([{ id: 'ideas', name: 'Ideas' }])
    const { name, error, canSubmit } = useCategoryForm(items, undefined, {
      maxLength: 7,
      duplicateMessage: 'A tab with this name already exists.',
      reservedNames: ['General'],
    })
    name.value = ' IDEAS '
    expect(error.value).toBe('A tab with this name already exists.')
    name.value = 'general'
    expect(error.value).toBe('A tab with this name already exists.')
    name.value = 'Too long'
    expect(error.value).toBe('Use 7 characters or fewer.')
    name.value = 'Work'
    expect(canSubmit.value).toBe(true)
  })

  it('keeps the category defaults', () => {
    const { name, error } = useCategoryForm(ref([{ id: 'work', name: 'Work' }]))
    name.value = 'work'
    expect(error.value).toBe('A category with this name already exists.')
    name.value = 'x'.repeat(51)
    expect(error.value).toBe('Use 50 characters or fewer.')
  })
})
