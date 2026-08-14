import { computed, ref, type Ref } from 'vue'
import type { Todo, TodoFilter } from '@/types/todo'

export function useTodoFilters(todos: Ref<Todo[]>) {
  const filter = ref<TodoFilter>('all')

  const filteredTodos = computed(() => {
    if (filter.value === 'active') {
      return todos.value.filter((todo) => !todo.completed)
    }

    if (filter.value === 'completed') {
      return todos.value.filter((todo) => todo.completed)
    }

    return todos.value
  })

  const activeCount = computed(() => todos.value.filter((todo) => !todo.completed).length)
  const hasCompleted = computed(() => todos.value.some((todo) => todo.completed))

  return { filter, filteredTodos, activeCount, hasCompleted }
}
