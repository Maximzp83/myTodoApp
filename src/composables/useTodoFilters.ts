import { computed, ref, type Ref } from 'vue'
import { TodoFilter, type Todo, type TodoPriorityId } from '@/types/todo'

function assertNever(value: never): never {
  throw new Error(`Unsupported Todo filter: ${String(value)}`)
}

export function useTodoFilters(todos: Ref<Todo[]>) {
  const filter = ref<TodoFilter>(TodoFilter.All)
  const priorityId = ref<TodoPriorityId | null>(null)

  const filteredTodos = computed(() => {
    let statusFilteredTodos = todos.value

    switch (filter.value) {
      case TodoFilter.All:
        break
      case TodoFilter.Active:
        statusFilteredTodos = todos.value.filter((todo) => !todo.completed)
        break
      case TodoFilter.Completed:
        statusFilteredTodos = todos.value.filter((todo) => todo.completed)
        break
      default:
        return assertNever(filter.value)
    }

    if (priorityId.value === null) {
      return statusFilteredTodos
    }

    return statusFilteredTodos.filter((todo) => todo.priorityId === priorityId.value)
  })

  const activeCount = computed(() => todos.value.filter((todo) => !todo.completed).length)
  const hasCompleted = computed(() => todos.value.some((todo) => todo.completed))

  return { filter, priorityId, filteredTodos, activeCount, hasCompleted }
}
