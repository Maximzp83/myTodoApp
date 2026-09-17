import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useTodoFilters } from '@/composables/useTodoFilters'
import { TodoFilter, TodoPriorityId, type Todo } from '@/types/todo'

const todos: Todo[] = [
  {
    id: 'active-todo',
    title: 'Active Todo',
    completed: false,
    createdAt: '2026-08-14T12:00:00.000Z',
    priorityId: TodoPriorityId.Normal,
  },
  {
    id: 'completed-todo',
    title: 'Completed Todo',
    completed: true,
    createdAt: '2026-08-14T13:00:00.000Z',
    priorityId: TodoPriorityId.High,
  },
]

describe('useTodoFilters', () => {
  it('shows all Todos by default', () => {
    const { filter, filteredTodos } = useTodoFilters(ref(todos))

    expect(filter.value).toBe(TodoFilter.All)
    expect(filteredTodos.value).toEqual(todos)
  })

  it('filters active and completed Todos', () => {
    const { filter, filteredTodos } = useTodoFilters(ref(todos))

    filter.value = TodoFilter.Active
    expect(filteredTodos.value).toEqual([todos[0]])

    filter.value = TodoFilter.Completed
    expect(filteredTodos.value).toEqual([todos[1]])
  })

  it('filters by priority and combines it with the status filter', () => {
    const { filter, priorityId, filteredTodos } = useTodoFilters(ref(todos))

    priorityId.value = TodoPriorityId.High
    expect(filteredTodos.value).toEqual([todos[1]])

    filter.value = TodoFilter.Active
    expect(filteredTodos.value).toEqual([])

    priorityId.value = TodoPriorityId.Normal
    expect(filteredTodos.value).toEqual([todos[0]])
  })

  it('derives the active count and completed state reactively', () => {
    const todoState = ref(todos.map((todo) => ({ ...todo })))
    const { activeCount, hasCompleted } = useTodoFilters(todoState)

    expect(activeCount.value).toBe(1)
    expect(hasCompleted.value).toBe(true)

    todoState.value[0]!.completed = true
    expect(activeCount.value).toBe(0)
  })
})
