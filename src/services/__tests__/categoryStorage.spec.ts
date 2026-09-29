import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadCategories, saveCategories } from '@/services/categoryStorage'

describe('categoryStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads an empty list when nothing is saved', () => {
    expect(loadCategories()).toEqual([])
  })

  it('saves and loads categories', () => {
    const categories = [{ id: 'work', name: 'Work' }]

    expect(saveCategories(categories)).toBe(true)
    expect(loadCategories()).toEqual(categories)
  })

  it.each(['{invalid', 'null', '{}'])('ignores invalid stored data: %s', (value) => {
    localStorage.setItem('vue-ts-todo.categories.v1', value)

    expect(loadCategories()).toEqual([])
  })

  it('keeps valid categories and ignores invalid or duplicate records', () => {
    localStorage.setItem(
      'vue-ts-todo.categories.v1',
      JSON.stringify([
        { id: 'work', name: ' Work ' },
        { id: 'work', name: 'Duplicate ID' },
        { id: 'duplicate-name', name: 'WORK' },
        { id: '', name: 'Empty ID' },
        { id: 'blank-name', name: '  ' },
        { id: 'overlong', name: 'a'.repeat(51) },
        { id: 'personal', name: 'Personal' },
        null,
      ]),
    )

    expect(loadCategories()).toEqual([
      { id: 'work', name: 'Work' },
      { id: 'personal', name: 'Personal' },
    ])
  })

  it('loads an empty list when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable')
    })

    expect(loadCategories()).toEqual([])
  })

  it('reports when storage cannot save categories', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable')
    })

    expect(saveCategories([])).toBe(false)
  })
})
