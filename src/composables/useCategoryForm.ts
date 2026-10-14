import { computed, ref, type Ref } from 'vue'
import { MAX_CATEGORY_NAME_LENGTH } from '@/types/category'

interface NamedItem {
  id: string
  name: string
}

interface CategoryFormOptions {
  maxLength?: number
  duplicateMessage?: string
  // Names taken by built-in items that are not part of the list, such as the General note tab.
  reservedNames?: readonly string[]
}

export function useCategoryForm(
  categories: Readonly<Ref<readonly NamedItem[]>>,
  editingId?: Readonly<Ref<string>>,
  {
    maxLength = MAX_CATEGORY_NAME_LENGTH,
    duplicateMessage = 'A category with this name already exists.',
    reservedNames = [],
  }: CategoryFormOptions = {},
) {
  const name = ref('')
  const trimmedName = computed(() => name.value.trim())
  const error = computed(() => {
    if (trimmedName.value.length > maxLength) {
      return `Use ${maxLength} characters or fewer.`
    }

    const lowerName = trimmedName.value.toLowerCase()
    if (
      reservedNames.some((reserved) => reserved.toLowerCase() === lowerName) ||
      categories.value.some(
        (category) => category.id !== editingId?.value && category.name.toLowerCase() === lowerName,
      )
    ) {
      return duplicateMessage
    }

    return ''
  })
  const canSubmit = computed(() => trimmedName.value.length > 0 && error.value.length === 0)

  return { name, trimmedName, error, canSubmit }
}
