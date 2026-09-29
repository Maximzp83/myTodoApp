import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadCategories, saveCategories } from '@/services/categoryStorage'
import { loadTodos, saveTodos } from '@/services/todoStorage'
import { useTodoStore } from '@/stores/todo'
import { TodoPriorityId, type Todo } from '@/types/todo'

vi.mock('@/services/todoStorage')
vi.mock('@/services/categoryStorage')

const activeTodo: Todo = {
  id: 'active-todo',
  title: 'Active Todo',
  completed: false,
  createdAt: '2026-08-14T12:00:00.000Z',
  priorityId: TodoPriorityId.Normal,
  categoryId: null,
}

const completedTodo: Todo = {
  id: 'completed-todo',
  title: 'Completed Todo',
  completed: true,
  createdAt: '2026-08-14T13:00:00.000Z',
  priorityId: TodoPriorityId.High,
  categoryId: null,
}

describe('Todo store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadTodos).mockReturnValue([])
    vi.mocked(loadCategories).mockReturnValue([])
    setActivePinia(createPinia())
  })

  it('loads the initial Todo collection from storage', () => {
    vi.mocked(loadTodos).mockReturnValue([{ ...activeTodo }])

    const store = useTodoStore()

    expect(store.todos).toEqual([activeTodo])
  })

  it('adds a trimmed Todo and persists the collection', () => {
    const store = useTodoStore()

    store.addTodo('  Learn Pinia  ', TodoPriorityId.High)

    expect(store.todos).toHaveLength(1)
    expect(store.todos[0]).toEqual({
      id: expect.any(String),
      title: 'Learn Pinia',
      completed: false,
      createdAt: expect.any(String),
      priorityId: TodoPriorityId.High,
      categoryId: null,
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
    const invalidPriorityId = 999 as TodoPriorityId

    store.addTodo('Invalid priority', invalidPriorityId)

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

  it('creates a trimmed category and persists it', () => {
    const store = useTodoStore()

    const category = store.addCategory('  Work  ')

    expect(category).toEqual({ id: expect.any(String), name: 'Work' })
    expect(store.categories).toEqual([category])
    expect(saveCategories).toHaveBeenCalledExactlyOnceWith(store.categories)
  })

  it('rejects empty, overlong, and duplicate category names', () => {
    vi.mocked(loadCategories).mockReturnValue([{ id: 'work', name: 'Work' }])
    const store = useTodoStore()

    expect(store.addCategory('  ')).toBeNull()
    expect(store.addCategory('a'.repeat(51))).toBeNull()
    expect(store.addCategory('  wOrK  ')).toBeNull()
    expect(store.categories).toEqual([{ id: 'work', name: 'Work' }])
    expect(saveCategories).not.toHaveBeenCalled()
  })

  it('adds tasks to known categories and rejects an unknown category', () => {
    vi.mocked(loadCategories).mockReturnValue([{ id: 'work', name: 'Work' }])
    const store = useTodoStore()

    store.addTodo('Categorized task', TodoPriorityId.High, 'work')
    store.addTodo('Invalid category', TodoPriorityId.Normal, 'missing')

    expect(store.todos).toHaveLength(1)
    expect(store.todos[0]).toMatchObject({ title: 'Categorized task', categoryId: 'work' })
    expect(saveTodos).toHaveBeenCalledTimes(1)
  })

  it('moves existing tasks between a category and uncategorized', () => {
    vi.mocked(loadCategories).mockReturnValue([{ id: 'work', name: 'Work' }])
    vi.mocked(loadTodos).mockReturnValue([{ ...activeTodo }])
    const store = useTodoStore()

    store.moveTodo(activeTodo.id, 'work')
    expect(store.todos[0]?.categoryId).toBe('work')

    store.moveTodo(activeTodo.id, null)
    expect(store.todos[0]?.categoryId).toBeNull()
    expect(saveTodos).toHaveBeenCalledTimes(2)
  })

  it('does not persist invalid or unchanged category moves', () => {
    vi.mocked(loadTodos).mockReturnValue([{ ...activeTodo }])
    const store = useTodoStore()

    store.moveTodo('missing', null)
    store.moveTodo(activeTodo.id, 'missing')
    store.moveTodo(activeTodo.id, null)

    expect(store.todos).toEqual([activeTodo])
    expect(saveTodos).not.toHaveBeenCalled()
  })

  it('keeps tasks with an unavailable category as uncategorized', () => {
    vi.mocked(loadTodos).mockReturnValue([{ ...activeTodo, categoryId: 'missing' }])

    expect(useTodoStore().todos).toEqual([activeTodo])
  })

  it('clears completed tasks only in the selected category', () => {
    vi.mocked(loadCategories).mockReturnValue([{ id: 'work', name: 'Work' }])
    vi.mocked(loadTodos).mockReturnValue([
      { ...activeTodo, categoryId: 'work' },
      { ...completedTodo, id: 'work-completed', categoryId: 'work' },
      { ...completedTodo },
    ])
    const store = useTodoStore()

    store.clearCompleted('work')

    expect(store.todos.map((todo) => todo.id)).toEqual([activeTodo.id, completedTodo.id])
    expect(saveTodos).toHaveBeenCalledTimes(1)

    store.clearCompleted('missing')
    expect(saveTodos).toHaveBeenCalledTimes(1)

    store.clearCompleted(null)
    expect(store.todos.map((todo) => todo.id)).toEqual([activeTodo.id])
    expect(saveTodos).toHaveBeenCalledTimes(2)
  })
})
