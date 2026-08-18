import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadTodos, saveTodos } from '@/services/todoStorage'
import { TodoPriority, type Todo } from '@/types/todo'

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
        priority: TodoPriority.High,
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
        priority: TodoPriority.Normal,
      },
    ])
  })

  it('migrates the former primarily priority to critical', () => {
    localStorage.setItem(
      'todos',
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

    expect(loadTodos()[0]?.priority).toBe(TodoPriority.Critical)
  })

  it('keeps valid Todos when another stored item is invalid', () => {
    const validTodo: Todo = {
      id: 'valid-todo',
      title: 'Keep this Todo',
      completed: false,
      createdAt: '2026-08-14T12:00:00.000Z',
      priority: TodoPriority.Normal,
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
})
