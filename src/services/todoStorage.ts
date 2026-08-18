import { isTodoPriority, TodoPriority, type Todo } from '@/types/todo'

const STORAGE_KEY = 'vue-ts-todo.todos.v1'
const LEGACY_STORAGE_KEY = 'todos'

function parseTodo(value: unknown): Todo | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('title' in value) ||
    typeof value.title !== 'string' ||
    !('completed' in value) ||
    typeof value.completed !== 'boolean' ||
    !('createdAt' in value) ||
    typeof value.createdAt !== 'string'
  ) {
    return null
  }

  const storedPriority = 'priority' in value ? value.priority : TodoPriority.Normal
  const priority = storedPriority === 'primarily' ? TodoPriority.Critical : storedPriority

  if (!isTodoPriority(priority)) {
    return null
  }

  return {
    id: value.id,
    title: value.title,
    completed: value.completed,
    createdAt: value.createdAt,
    priority,
  }
}

export function loadTodos(): Todo[] {
  try {
    const storedTodos =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)

    if (storedTodos === null) {
      return []
    }

    const storedValue: unknown = JSON.parse(storedTodos)

    if (!Array.isArray(storedValue)) {
      return []
    }

    const todos: Todo[] = []

    for (const value of storedValue) {
      const todo = parseTodo(value)

      if (todo !== null) {
        todos.push(todo)
      }
    }

    return todos
  } catch {
    return []
  }
}

export function saveTodos(todos: Todo[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    return true
  } catch {
    return false
  }
}
