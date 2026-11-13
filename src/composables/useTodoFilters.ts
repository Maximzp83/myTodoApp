import { computed, ref, watch, type Ref } from 'vue'
import type { TodoCategory, TodoCategoryFilter } from '@/types/category'
import { TodoFilter, TodoSort, type Todo, type TodoPriorityId } from '@/types/todo'

function assertNever(value: never): never {
  throw new Error(`Unsupported Todo filter: ${String(value)}`)
}

function compareByCreation(a: Todo, b: Todo) {
  return Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id)
}

export function useTodoFilters(todos: Ref<Todo[]>, categories?: Readonly<Ref<TodoCategory[]>>) {
  const filter = ref<TodoFilter>(TodoFilter.All)
  const priorityId = ref<TodoPriorityId | null>(null)
  const categoryId = ref<TodoCategoryFilter>(undefined)
  const sort = ref<TodoSort>(TodoSort.OldestFirst)
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

    const visibleTodos =
      priorityId.value === null
        ? statusFilteredTodos
        : statusFilteredTodos.filter((todo) => todo.priorityId === priorityId.value)
    const direction = sort.value === TodoSort.NewestFirst ? -1 : 1
    // Copy before sorting: the visible list may be the store's own array.
    return [...visibleTodos].sort((a, b) => direction * compareByCreation(a, b))
  })

  const activeCount = computed(() => categoryTodos.value.filter((todo) => !todo.completed).length)
  const hasCompleted = computed(() => categoryTodos.value.some((todo) => todo.completed))

  return { filter, priorityId, categoryId, sort, filteredTodos, activeCount, hasCompleted }
}
