import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadTodos, saveTodos } from '@/services/todoStorage'
import { TodoPriorityId, type Todo } from '@/types/todo'

describe('todoStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns an empty array when no Todos are stored', () => {
    expect(loadTodos()).toEqual([])
  })

  it('returns an empty array when the stored JSON is malformed', () => {
    localStorage.setItem('todos', '{not valid JSON')

    expect(loadTodos()).toEqual([])
  })

  it('returns an empty array when the stored value is not a Todo array', () => {
    localStorage.setItem('todos', JSON.stringify([{ id: 1, title: 'Invalid Todo' }]))

    expect(loadTodos()).toEqual([])
  })

  it('saves and loads Todos', () => {
    const todos: Todo[] = [
      {
        id: 'todo-1',
        title: 'Test persistence',
        completed: false,
        createdAt: '2026-08-14T12:00:00.000Z',
        priorityId: TodoPriorityId.High,
        categoryId: 'work',
      },
    ]

    expect(saveTodos(todos)).toBe(true)

    expect(loadTodos()).toEqual(todos)
  })

  it('loads legacy Todos without a priority as normal priority', () => {
    localStorage.setItem(
      'todos',
      JSON.stringify([
        {
          id: 'legacy-todo',
          title: 'Existing Todo',
          completed: false,
          createdAt: '2026-08-14T12:00:00.000Z',
        },
      ]),
    )

    expect(loadTodos()).toEqual([
      {
        id: 'legacy-todo',
        title: 'Existing Todo',
        completed: false,
        createdAt: '2026-08-14T12:00:00.000Z',
        priorityId: TodoPriorityId.Normal,
        categoryId: null,
      },
    ])
  })

  it('migrates the former primarily priority to critical', () => {
    localStorage.setItem(
      'vue-ts-todo.todos.v1',
      JSON.stringify([
        {
          id: 'legacy-priority-todo',
          title: 'Migrate priority',
          completed: false,
          createdAt: '2026-08-14T12:00:00.000Z',
          priority: 'primarily',
        },
      ]),
    )

    expect(loadTodos()[0]?.priorityId).toBe(TodoPriorityId.Critical)
  })

  it('keeps valid Todos when another stored item is invalid', () => {
    const validTodo: Todo = {
      id: 'valid-todo',
      title: 'Keep this Todo',
      completed: false,
      createdAt: '2026-08-14T12:00:00.000Z',
      priorityId: TodoPriorityId.Normal,
      categoryId: null,
    }
    localStorage.setItem('todos', JSON.stringify([validTodo, { id: 42 }]))

    expect(loadTodos()).toEqual([validTodo])
  })

  it('returns an empty array when localStorage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable')
    })

    expect(loadTodos()).toEqual([])
  })

  it('reports when localStorage cannot save Todos', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable')
    })

    expect(saveTodos([])).toBe(false)
  })

  it('migrates v2 tasks to uncategorized without changing their priority or completion', () => {
    localStorage.setItem(
      'vue-ts-todo.todos.v2',
      JSON.stringify([
        {
          id: 'existing-task',
          title: 'Existing task',
          completed: true,
          createdAt: '2026-08-14T12:00:00.000Z',
          priorityId: TodoPriorityId.Critical,
        },
      ]),
    )

    expect(loadTodos()).toEqual([
      {
        id: 'existing-task',
        title: 'Existing task',
        completed: true,
        createdAt: '2026-08-14T12:00:00.000Z',
        priorityId: TodoPriorityId.Critical,
        categoryId: null,
      },
    ])
  })

  it('does not restore old tasks after the migrated collection is cleared', () => {
    localStorage.setItem(
      'vue-ts-todo.todos.v2',
      JSON.stringify([
        {
          id: 'old-task',
          title: 'Old task',
          completed: false,
          createdAt: '2026-08-14T12:00:00.000Z',
          priorityId: TodoPriorityId.Normal,
        },
      ]),
    )
    expect(saveTodos([])).toBe(true)

    expect(loadTodos()).toEqual([])
  })
})
