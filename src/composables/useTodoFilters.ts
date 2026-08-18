import { computed, ref, type Ref } from 'vue'
import { TodoFilter, type Todo } from '@/types/todo'

function assertNever(value: never): never {
  throw new Error(`Unsupported Todo filter: ${String(value)}`)
}

export function useTodoFilters(todos: Ref<Todo[]>) {
  const filter = ref<TodoFilter>(TodoFilter.All)

  const filteredTodos = computed(() => {
    switch (filter.value) {
      case TodoFilter.All:
        return todos.value
      case TodoFilter.Active:
        return todos.value.filter((todo) => !todo.completed)
      case TodoFilter.Completed:
        return todos.value.filter((todo) => todo.completed)
      default:
        return assertNever(filter.value)
    }
  })

  const activeCount = computed(() => todos.value.filter((todo) => !todo.completed).length)
  const hasCompleted = computed(() => todos.value.some((todo) => todo.completed))

  return { filter, filteredTodos, activeCount, hasCompleted }
}
