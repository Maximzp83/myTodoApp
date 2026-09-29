import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/services/todoApi'
import { useTodoStore } from '@/stores/todo'
import { TodoPriorityId, type Todo } from '@/types/todo'

vi.mock('@/services/todoApi')

const activeTodo: Todo = {
  id: 'active-todo',
  title: 'Active Todo',
  completed: false,
  createdAt: '2026-08-14T12:00:00.000Z',
  priorityId: TodoPriorityId.Normal,
  categoryId: null,
}
const completedTodo: Todo = {
  ...activeTodo,
  id: 'completed-todo',
  title: 'Completed Todo',
  completed: true,
}
const work = { id: 'work', name: 'Work' }

async function readyStore(todos: Todo[] = [], categories = [work]) {
  vi.mocked(api.fetchAccountData).mockResolvedValue({
    todos: todos.map((todo) => ({ ...todo })),
    categories,
  })
  const store = useTodoStore()
  store.setAccount('account-a')
  await store.refresh()
  return store
}

describe('cloud Todo store', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(api.hasBrowserData).mockReturnValue(false)
    setActivePinia(createPinia())
  })

  it('does not load or write data before sign-in', async () => {
    const store = useTodoStore()
    await store.refresh()
    await store.addTodo('Private task')
    expect(store.todos).toEqual([])
    expect(api.fetchAccountData).not.toHaveBeenCalled()
    expect(api.createTodo).not.toHaveBeenCalled()
  })

  it('loads tasks and categories for the signed-in account', async () => {
    const store = await readyStore([activeTodo])
    expect(api.fetchAccountData).toHaveBeenCalledWith('account-a')
    expect(store.todos).toEqual([activeTodo])
    expect(store.categories).toEqual([work])
    expect(store.loaded).toBe(true)
  })

  it('adds a trimmed task and commits the server result', async () => {
    const store = await readyStore()
    const saved = {
      ...activeTodo,
      title: 'Learn Pinia',
      priorityId: TodoPriorityId.High,
      categoryId: work.id,
    }
    vi.mocked(api.createTodo).mockResolvedValue(saved)
    expect(await store.addTodo('  Learn Pinia  ', TodoPriorityId.High, work.id)).toBe(true)
    expect(api.createTodo).toHaveBeenCalledExactlyOnceWith(
      'account-a',
      'Learn Pinia',
      TodoPriorityId.High,
      work.id,
    )
    expect(store.todos).toEqual([saved])
  })

  it('rejects invalid task input without sending requests', async () => {
    const store = await readyStore()
    await store.addTodo(' ')
    await store.addTodo('a'.repeat(121))
    await store.addTodo('Bad priority', 999 as TodoPriorityId)
    await store.addTodo('Bad category', TodoPriorityId.Normal, 'missing')
    expect(api.createTodo).not.toHaveBeenCalled()
  })

  it('creates a category and rejects duplicate, empty, or overlong names', async () => {
    const store = await readyStore([], [])
    vi.mocked(api.createCategory).mockResolvedValue(work)
    expect(await store.addCategory('  Work  ')).toEqual(work)
    expect(api.createCategory).toHaveBeenCalledExactlyOnceWith('account-a', 'Work')
    expect(await store.addCategory('wOrK')).toBeNull()
    expect(await store.addCategory(' ')).toBeNull()
    expect(await store.addCategory('a'.repeat(51))).toBeNull()
    expect(api.createCategory).toHaveBeenCalledTimes(1)
  })

  it('does not change tasks when the server rejects a save', async () => {
    const store = await readyStore([activeTodo])
    vi.mocked(api.updateTodo).mockRejectedValue(new Error('Network unavailable'))
    await store.toggleTodo(activeTodo.id)
    expect(store.todos).toEqual([activeTodo])
    expect(store.error).toBe('Network unavailable')
    expect(store.busy).toBe(false)
  })

  it('toggles and moves a task using confirmed server responses', async () => {
    const store = await readyStore([activeTodo])
    const toggled = { ...activeTodo, completed: true }
    vi.mocked(api.updateTodo)
      .mockResolvedValueOnce(toggled)
      .mockResolvedValueOnce({ ...toggled, categoryId: work.id })
    await store.toggleTodo(activeTodo.id)
    expect(store.todos[0]?.completed).toBe(true)
    await store.moveTodo(activeTodo.id, work.id)
    expect(store.todos[0]?.categoryId).toBe(work.id)
    expect(api.updateTodo).toHaveBeenLastCalledWith('account-a', activeTodo.id, {
      category_id: work.id,
    })
  })

  it('removes only ids confirmed deleted by the server', async () => {
    const store = await readyStore([activeTodo, completedTodo])
    vi.mocked(api.deleteTodo).mockResolvedValue([activeTodo.id])
    await store.removeTodo(activeTodo.id)
    expect(store.todos).toEqual([completedTodo])
  })

  it('scopes clearing completed tasks to the selected category', async () => {
    const workCompleted = { ...completedTodo, id: 'work-completed', categoryId: work.id }
    const store = await readyStore([activeTodo, completedTodo, workCompleted])
    vi.mocked(api.deleteCompleted).mockResolvedValue([workCompleted.id])
    await store.clearCompleted(work.id)
    expect(api.deleteCompleted).toHaveBeenCalledWith('account-a', work.id)
    expect(store.todos).toEqual([activeTodo, completedTodo])
    vi.mocked(api.deleteCompleted).mockResolvedValue([completedTodo.id])
    await store.clearCompleted(null)
    expect(api.deleteCompleted).toHaveBeenLastCalledWith('account-a', null)
  })

  it('ignores unchanged or invalid operations', async () => {
    const store = await readyStore([activeTodo])
    await store.removeTodo('missing')
    await store.toggleTodo('missing')
    await store.moveTodo(activeTodo.id, 'missing')
    await store.moveTodo(activeTodo.id, null)
    await store.clearCompleted()
    expect(api.updateTodo).not.toHaveBeenCalled()
    expect(api.deleteTodo).not.toHaveBeenCalled()
    expect(api.deleteCompleted).not.toHaveBeenCalled()
  })

  it('clears account data immediately on sign-out', async () => {
    const store = await readyStore([activeTodo])
    store.setAccount(null)
    expect(store.todos).toEqual([])
    expect(store.categories).toEqual([])
    expect(store.loaded).toBe(false)
  })

  it('ignores a late load response after account switching', async () => {
    const store = useTodoStore()
    store.setAccount('account-a')
    let resolveLoad: (data: Awaited<ReturnType<typeof api.fetchAccountData>>) => void = () => {
      throw new Error('Load was not started')
    }
    vi.mocked(api.fetchAccountData).mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve
      }),
    )
    const loading = store.refresh()
    store.setAccount('account-b')
    resolveLoad({ todos: [activeTodo], categories: [work] })
    await loading
    expect(store.todos).toEqual([])
    expect(store.categories).toEqual([])
    expect(store.loaded).toBe(false)
  })

  it('ignores a late mutation result after sign-out', async () => {
    const store = await readyStore([activeTodo])
    let resolveSave: (todo: Todo) => void = () => {
      throw new Error('Save was not started')
    }
    vi.mocked(api.updateTodo).mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve
      }),
    )
    const saving = store.toggleTodo(activeTodo.id)
    store.setAccount(null)
    resolveSave({ ...activeTodo, completed: true })
    await saving
    expect(store.todos).toEqual([])
    expect(store.saving).toBe(false)
  })

  it('supports retrying an initial load failure', async () => {
    const store = useTodoStore()
    store.setAccount('account-a')
    vi.mocked(api.fetchAccountData)
      .mockRejectedValueOnce(new Error('Load failed'))
      .mockResolvedValueOnce({ todos: [activeTodo], categories: [] })
    await store.refresh()
    expect(store.loaded).toBe(false)
    expect(store.error).toBe('Load failed')
    await store.refresh()
    expect(store.todos).toEqual([activeTodo])
    expect(store.error).toBe('')
  })

  it('allows explicit browser import only into an empty, loaded account', async () => {
    vi.mocked(api.hasBrowserData).mockReturnValue(true)
    const store = await readyStore([], [])
    expect(store.canImport).toBe(true)
    vi.mocked(api.importBrowserData).mockResolvedValue()
    vi.mocked(api.fetchAccountData).mockResolvedValue({ todos: [activeTodo], categories: [] })
    await store.importLocalData()
    expect(api.importBrowserData).toHaveBeenCalledExactlyOnceWith('account-a')
    expect(store.todos).toEqual([activeTodo])
    expect(store.canImport).toBe(false)
  })
})
