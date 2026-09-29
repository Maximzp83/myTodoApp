import { computed, ref, type Ref } from 'vue'
import { MAX_CATEGORY_NAME_LENGTH, type TodoCategory } from '@/types/category'

export function useCategoryForm(categories: Readonly<Ref<TodoCategory[]>>) {
  const name = ref('')
  const trimmedName = computed(() => name.value.trim())
  const error = computed(() => {
    if (trimmedName.value.length > MAX_CATEGORY_NAME_LENGTH) {
      return `Use ${MAX_CATEGORY_NAME_LENGTH} characters or fewer.`
    }

    if (
      categories.value.some(
        (category) => category.name.toLowerCase() === trimmedName.value.toLowerCase(),
      )
    ) {
      return 'A category with this name already exists.'
    }

    return ''
  })
  const canSubmit = computed(() => trimmedName.value.length > 0 && error.value.length === 0)

  return { name, trimmedName, error, canSubmit }
}
