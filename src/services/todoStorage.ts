import type { Todo } from '@/types/todo'

const STORAGE_KEY = 'todos'

function isTodo(value: unknown): value is Todo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'completed' in value &&
    typeof value.completed === 'boolean' &&
    'createdAt' in value &&
    typeof value.createdAt === 'string'
  )
}

export function loadTodos(): Todo[] {
  const storedTodos = localStorage.getItem(STORAGE_KEY)

  if (storedTodos === null) {
    return []
  }

  try {
    const todos: unknown = JSON.parse(storedTodos)

    return Array.isArray(todos) && todos.every(isTodo) ? todos : []
  } catch {
    return []
  }
}

export function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}
