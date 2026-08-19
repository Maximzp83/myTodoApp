import { isTodoPriorityId, TodoPriorityId, type Todo } from '@/types/todo'

const STORAGE_KEY = 'vue-ts-todo.todos.v2'
const PREVIOUS_STORAGE_KEY = 'vue-ts-todo.todos.v1'
const LEGACY_STORAGE_KEY = 'todos'

function parsePriorityId(value: unknown): TodoPriorityId | null {
  if (isTodoPriorityId(value)) {
    return value
  }

  switch (value) {
    case 'low':
      return TodoPriorityId.Low
    case 'normal':
      return TodoPriorityId.Normal
    case 'high':
      return TodoPriorityId.High
    case 'critical':
    case 'primarily':
      return TodoPriorityId.Critical
    default:
      return null
  }
}

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

  const storedPriority =
    'priorityId' in value
      ? value.priorityId
      : 'priority' in value
        ? value.priority
        : TodoPriorityId.Normal
  const priorityId = parsePriorityId(storedPriority)

  if (priorityId === null) {
    return null
  }

  return {
    id: value.id,
    title: value.title,
    completed: value.completed,
    createdAt: value.createdAt,
    priorityId,
  }
}

export function loadTodos(): Todo[] {
  try {
    const storedTodos =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(PREVIOUS_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_STORAGE_KEY)

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
