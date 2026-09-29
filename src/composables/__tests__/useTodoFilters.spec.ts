import { nextTick, ref } from 'vue'
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
    categoryId: 'work',
  },
  {
    id: 'completed-todo',
    title: 'Completed Todo',
    completed: true,
    createdAt: '2026-08-14T13:00:00.000Z',
    priorityId: TodoPriorityId.High,
    categoryId: null,
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

  it('filters by category and scopes the summary to the selected tab', () => {
    const { categoryId, filteredTodos, activeCount, hasCompleted } = useTodoFilters(ref(todos))

    categoryId.value = 'work'
    expect(filteredTodos.value).toEqual([todos[0]])
    expect(activeCount.value).toBe(1)
    expect(hasCompleted.value).toBe(false)

    categoryId.value = null
    expect(filteredTodos.value).toEqual([todos[1]])
    expect(activeCount.value).toBe(0)
    expect(hasCompleted.value).toBe(true)

    categoryId.value = undefined
    expect(filteredTodos.value).toEqual(todos)
  })

  it('combines category, status, and priority filters', () => {
    const { categoryId, filter, priorityId, filteredTodos } = useTodoFilters(ref(todos))

    categoryId.value = 'work'
    priorityId.value = TodoPriorityId.Normal
    filter.value = TodoFilter.Active
    expect(filteredTodos.value).toEqual([todos[0]])

    filter.value = TodoFilter.Completed
    expect(filteredTodos.value).toEqual([])

    categoryId.value = null
    priorityId.value = TodoPriorityId.High
    expect(filteredTodos.value).toEqual([todos[1]])
  })

  it('updates the selected category list when a task is moved', () => {
    const todoState = ref(todos.map((todo) => ({ ...todo })))
    const { categoryId, filteredTodos } = useTodoFilters(todoState)
    categoryId.value = 'work'

    const task = todoState.value.find((todo) => todo.id === 'active-todo')
    if (!task) throw new Error('Expected active task fixture')
    task.categoryId = null

    expect(filteredTodos.value).toEqual([])
  })

  it('shows all Uncategorized tasks when the selected category disappears', async () => {
    const categories = ref([{ id: 'work', name: 'Work' }])
    const todoState = ref(todos.map((todo) => ({ ...todo })))
    const { categoryId, filter, priorityId, filteredTodos } = useTodoFilters(todoState, categories)
    categoryId.value = 'work'
    filter.value = TodoFilter.Active
    priorityId.value = TodoPriorityId.Normal
    categories.value = []
    todoState.value = todoState.value.map((todo) => ({ ...todo, categoryId: null }))
    await nextTick()
    expect(categoryId.value).toBeNull()
    expect(filter.value).toBe(TodoFilter.All)
    expect(priorityId.value).toBeNull()
    expect(filteredTodos.value).toEqual(todoState.value)
  })

  it('preserves the selected category and filters when its name changes', async () => {
    const categories = ref([{ id: 'work', name: 'Work' }])
    const { categoryId, filter, priorityId } = useTodoFilters(ref(todos), categories)
    categoryId.value = 'work'
    filter.value = TodoFilter.Completed
    priorityId.value = TodoPriorityId.High
    categories.value = [{ id: 'work', name: 'Projects' }]
    await nextTick()
    expect(categoryId.value).toBe('work')
    expect(filter.value).toBe(TodoFilter.Completed)
    expect(priorityId.value).toBe(TodoPriorityId.High)
  })
})
