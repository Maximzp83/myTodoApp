import { computed, ref, watch, type Ref } from 'vue'
import type { TodoCategory, TodoCategoryFilter } from '@/types/category'
import { TodoFilter, type Todo, type TodoPriorityId } from '@/types/todo'

function assertNever(value: never): never {
  throw new Error(`Unsupported Todo filter: ${String(value)}`)
}

export function useTodoFilters(todos: Ref<Todo[]>, categories?: Readonly<Ref<TodoCategory[]>>) {
  const filter = ref<TodoFilter>(TodoFilter.All)
  const priorityId = ref<TodoPriorityId | null>(null)
  const categoryId = ref<TodoCategoryFilter>(undefined)
  if (categories) {
    watch(
      () =>
        typeof categoryId.value === 'string' &&
        !categories.value.some((category) => category.id === categoryId.value),
      (missing) => {
        if (!missing) return
        categoryId.value = null
        filter.value = TodoFilter.All
        priorityId.value = null
      },
    )
  }
  const categoryTodos = computed(() =>
    categoryId.value === undefined
      ? todos.value
      : todos.value.filter((todo) => todo.categoryId === categoryId.value),
  )

  const filteredTodos = computed(() => {
    let statusFilteredTodos = categoryTodos.value

    switch (filter.value) {
      case TodoFilter.All:
        break
      case TodoFilter.Active:
        statusFilteredTodos = categoryTodos.value.filter((todo) => !todo.completed)
        break
      case TodoFilter.Completed:
        statusFilteredTodos = categoryTodos.value.filter((todo) => todo.completed)
        break
      default:
        return assertNever(filter.value)
    }

    if (priorityId.value === null) {
      return statusFilteredTodos
    }

    return statusFilteredTodos.filter((todo) => todo.priorityId === priorityId.value)
  })

  const activeCount = computed(() => categoryTodos.value.filter((todo) => !todo.completed).length)
  const hasCompleted = computed(() => categoryTodos.value.some((todo) => todo.completed))

  return { filter, priorityId, categoryId, filteredTodos, activeCount, hasCompleted }
}
