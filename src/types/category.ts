export const MAX_CATEGORY_NAME_LENGTH = 50

export interface TodoCategory {
  id: string
  name: string
}

// undefined selects all tasks; null selects tasks without a category.
export type TodoCategoryFilter = string | null | undefined
