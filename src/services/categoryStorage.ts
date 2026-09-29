import { MAX_CATEGORY_NAME_LENGTH, type TodoCategory } from '@/types/category'

const STORAGE_KEY = 'vue-ts-todo.categories.v1'

function parseCategory(value: unknown): TodoCategory | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    !('name' in value) ||
    typeof value.name !== 'string'
  ) {
    return null
  }

  const name = value.name.trim()

  if (name.length === 0 || name.length > MAX_CATEGORY_NAME_LENGTH) {
    return null
  }

  return { id: value.id, name }
}

export function loadCategories(): TodoCategory[] {
  try {
    const storedCategories = localStorage.getItem(STORAGE_KEY)

    if (storedCategories === null) {
      return []
    }

    const storedValue: unknown = JSON.parse(storedCategories)

    if (!Array.isArray(storedValue)) {
      return []
    }

    const categories: TodoCategory[] = []

    for (const value of storedValue) {
      const category = parseCategory(value)

      if (
        category !== null &&
        !categories.some(
          (existing) =>
            existing.id === category.id ||
            existing.name.toLowerCase() === category.name.toLowerCase(),
        )
      ) {
        categories.push(category)
      }
    }

    return categories
  } catch {
    return []
  }
}

export function saveCategories(categories: TodoCategory[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
    return true
  } catch {
    return false
  }
}
