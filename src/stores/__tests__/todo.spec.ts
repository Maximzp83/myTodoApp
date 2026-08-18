import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadTodos, saveTodos } from '@/services/todoStorage'
import { useTodoStore } from '@/stores/todo'
import { TodoPriority, type Todo } from '@/types/todo'

vi.mock('@/services/todoStorage')

const activeTodo: Todo = {
  id: 'active-todo',
  title: 'Active Todo',
  completed: false,
  createdAt: '2026-08-14T12:00:00.000Z',
  priority: TodoPriority.Normal,
}

const completedTodo: Todo = {
  id: 'completed-todo',
  title: 'Completed Todo',
  completed: true,
  createdAt: '2026-08-14T13:00:00.000Z',
  priority: TodoPriority.High,
}

describe('Todo store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadTodos).mockReturnValue([])
    setActivePinia(createPinia())
  })

  it('loads the initial Todo collection from storage', () => {
    vi.mocked(loadTodos).mockReturnValue([{ ...activeTodo }])

    const store = useTodoStore()

    expect(store.todos).toEqual([activeTodo])
  })

  it('adds a trimmed Todo and persists the collection', () => {
    const store = useTodoStore()

    store.addTodo('  Learn Pinia  ', TodoPriority.High)

    expect(store.todos).toHaveLength(1)
    expect(store.todos[0]).toEqual({
      id: expect.any(String),
      title: 'Learn Pinia',
      completed: false,
      createdAt: expect.any(String),
      priority: TodoPriority.High,
    })
    expect(saveTodos).toHaveBeenCalledExactlyOnceWith(store.todos)
  })

  it('rejects empty and overlong titles without persisting', () => {
    const store = useTodoStore()

    store.addTodo('   ')
    store.addTodo('a'.repeat(121))

    expect(store.todos).toEqual([])
    expect(saveTodos).not.toHaveBeenCalled()
  })

  it('rejects an invalid runtime priority without persisting', () => {
    const store = useTodoStore()
    const invalidPriority = 'invalid' as TodoPriority

    store.addTodo('Invalid priority', invalidPriority)

    expect(store.todos).toEqual([])
    expect(saveTodos).not.toHaveBeenCalled()
  })

  it('removes a Todo and persists the remaining collection', () => {
    vi.mocked(loadTodos).mockReturnValue([{ ...activeTodo }, { ...completedTodo }])
    const store = useTodoStore()

    store.removeTodo(activeTodo.id)

    expect(store.todos).toEqual([completedTodo])
    expect(saveTodos).toHaveBeenCalledWith(store.todos)
  })

  it('toggles a Todo and persists the collection', () => {
    vi.mocked(loadTodos).mockReturnValue([{ ...activeTodo }])
    const store = useTodoStore()

    store.toggleTodo(activeTodo.id)

    expect(store.todos[0]?.completed).toBe(true)
    expect(saveTodos).toHaveBeenCalledWith(store.todos)
  })

  it('clears completed Todos and persists the active collection', () => {
    vi.mocked(loadTodos).mockReturnValue([{ ...activeTodo }, { ...completedTodo }])
    const store = useTodoStore()

    store.clearCompleted()

    expect(store.todos).toEqual([activeTodo])
    expect(saveTodos).toHaveBeenCalledWith(store.todos)
  })

  it('does not persist when an operation leaves state unchanged', () => {
    vi.mocked(loadTodos).mockReturnValue([{ ...activeTodo }])
    const store = useTodoStore()

    store.removeTodo('missing-todo')
    store.toggleTodo('missing-todo')
    store.clearCompleted()

    expect(saveTodos).not.toHaveBeenCalled()
  })
})
