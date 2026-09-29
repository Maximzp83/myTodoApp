import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as todoApi from '@/services/todoApi'
import { errorMessage } from '@/services/errors'
import {
  MAX_CATEGORY_NAME_LENGTH,
  type TodoCategory,
  type TodoCategoryFilter,
} from '@/types/category'
import { isTodoPriorityId, TodoPriorityId, type Todo } from '@/types/todo'

const MAX_TITLE_LENGTH = 120

export const useTodoStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const categories = ref<TodoCategory[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const togglingIds = ref(new Set<string>())
  const loaded = ref(false)
  const error = ref('')
  const userId = ref<string | null>(null)
  const browserDataAvailable = ref(todoApi.hasBrowserData())
  const busy = computed(() => loading.value || saving.value)
  const canImport = computed(
    () =>
      loaded.value &&
      browserDataAvailable.value &&
      todos.value.length === 0 &&
      categories.value.length === 0,
  )
  let accountVersion = 0
  const pendingToggles = new Map<string, Promise<void>>()

  function setAccount(id: string | null) {
    if (userId.value === id) return
    accountVersion += 1
    userId.value = id
    todos.value = []
    categories.value = []
    loaded.value = false
    loading.value = false
    saving.value = false
    togglingIds.value = new Set()
    pendingToggles.clear()
    error.value = ''
  }

  async function refresh() {
    if (!userId.value || busy.value) return
    const id = userId.value
    const version = accountVersion
    loading.value = true
    error.value = ''
    try {
      // Fetch only after pending toggles settle, so a stale read cannot undo them.
      if (pendingToggles.size > 0) await Promise.all(pendingToggles.values())
      if (version !== accountVersion) return
      const data = await todoApi.fetchAccountData(id)
      if (version !== accountVersion) return
      todos.value = data.todos
      categories.value = data.categories
      loaded.value = true
    } catch (cause) {
      if (version === accountVersion)
        error.value = errorMessage(cause, 'Could not load your tasks. Please try again.')
    } finally {
      if (version === accountVersion) loading.value = false
    }
  }

  async function mutate<T>(
    operation: (id: string) => Promise<T>,
    commit: (result: T) => void,
  ): Promise<T | null> {
    if (!userId.value || !loaded.value || busy.value) return null
    const id = userId.value
    const version = accountVersion
    saving.value = true
    error.value = ''
    try {
      // For example, Clear completed must see confirmed completion on the server.
      if (pendingToggles.size > 0) await Promise.all(pendingToggles.values())
      if (version !== accountVersion) return null
      const result = await operation(id)
      if (version !== accountVersion) return null
      commit(result)
      return result
    } catch (cause) {
      if (version === accountVersion)
        error.value = errorMessage(cause, 'Could not save your changes. Please try again.')
      return null
    } finally {
      if (version === accountVersion) saving.value = false
    }
  }

  function isKnownCategory(categoryId: string | null) {
    return categoryId === null || categories.value.some((category) => category.id === categoryId)
  }

  async function addCategory(name: string) {
    const trimmedName = name.trim()
    if (
      trimmedName.length === 0 ||
      trimmedName.length > MAX_CATEGORY_NAME_LENGTH ||
      categories.value.some((category) => category.name.toLowerCase() === trimmedName.toLowerCase())
    )
      return null
    return mutate(
      (id) => todoApi.createCategory(id, trimmedName),
      (category) => {
        categories.value.push(category)
      },
    )
  }

  async function addTodo(
    title: string,
    priorityId: TodoPriorityId = TodoPriorityId.Normal,
    categoryId: string | null = null,
  ) {
    const trimmedTitle = title.trim()
    if (
      trimmedTitle.length === 0 ||
      trimmedTitle.length > MAX_TITLE_LENGTH ||
      !isTodoPriorityId(priorityId) ||
      !isKnownCategory(categoryId)
    )
      return false
    const result = await mutate(
      (id) => todoApi.createTodo(id, trimmedTitle, priorityId, categoryId),
      (todo) => {
        todos.value.push(todo)
      },
    )
    return result !== null
  }

  async function renameCategory(id: string, name: string) {
    const category = categories.value.find((item) => item.id === id)
    const trimmedName = name.trim()
    if (
      !category ||
      trimmedName.length === 0 ||
      trimmedName.length > MAX_CATEGORY_NAME_LENGTH ||
      trimmedName === category.name ||
      categories.value.some(
        (item) => item.id !== id && item.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    )
      return false
    const result = await mutate(
      (owner) => todoApi.renameCategory(owner, id, trimmedName),
      (updated) => {
        categories.value = categories.value.map((item) => (item.id === updated.id ? updated : item))
      },
    )
    return result !== null
  }

  async function removeCategory(id: string) {
    if (!categories.value.some((category) => category.id === id)) return false
    const result = await mutate(
      (owner) => todoApi.deleteCategory(owner, id),
      (deletedId) => {
        categories.value = categories.value.filter((category) => category.id !== deletedId)
        todos.value = todos.value.map((todo) =>
          todo.categoryId === deletedId ? { ...todo, categoryId: null } : todo,
        )
      },
    )
    return result !== null
  }

  function removeIds(ids: string[]) {
    todos.value = todos.value.filter((todo) => !ids.includes(todo.id))
  }

  async function removeTodo(id: string) {
    if (!todos.value.some((todo) => todo.id === id)) return
    await mutate((owner) => todoApi.deleteTodo(owner, id), removeIds)
  }

  function replaceTodo(updatedTodo: Todo) {
    todos.value = todos.value.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
  }

  async function toggleTodo(id: string) {
    if (!userId.value || !loaded.value || busy.value || togglingIds.value.has(id)) return
    const todo = todos.value.find((item) => item.id === id)
    if (!todo) return
    const owner = userId.value
    const version = accountVersion
    const previousCompleted = todo.completed
    togglingIds.value.add(id)
    error.value = ''
    replaceTodo({ ...todo, completed: !previousCompleted })

    const pending = (async () => {
      try {
        const updated = await todoApi.updateTodo(owner, id, { completed: !previousCompleted })
        if (version !== accountVersion) return
        replaceTodo(updated)
      } catch (cause) {
        if (version !== accountVersion) return
        const current = todos.value.find((item) => item.id === id)
        if (current) replaceTodo({ ...current, completed: previousCompleted })
        error.value = errorMessage(cause, 'Could not save your changes. Please try again.')
      } finally {
        if (version === accountVersion) {
          togglingIds.value.delete(id)
          pendingToggles.delete(id)
        }
      }
    })()
    pendingToggles.set(id, pending)
    await pending
  }

  async function moveTodo(id: string, categoryId: string | null) {
    const todo = todos.value.find((item) => item.id === id)
    if (!todo || !isKnownCategory(categoryId) || todo.categoryId === categoryId) return
    await mutate((owner) => todoApi.updateTodo(owner, id, { category_id: categoryId }), replaceTodo)
  }

  async function clearCompleted(categoryId: TodoCategoryFilter = undefined) {
    if (
      !todos.value.some(
        (todo) => todo.completed && (categoryId === undefined || todo.categoryId === categoryId),
      )
    )
      return
    await mutate((owner) => todoApi.deleteCompleted(owner, categoryId), removeIds)
  }

  async function importLocalData() {
    if (!canImport.value) return
    const result = await mutate(
      async (id) => {
        await todoApi.importBrowserData(id)
        return true
      },
      () => {
        browserDataAvailable.value = false
      },
    )
    if (result) await refresh()
  }

  return {
    todos,
    categories,
    loading,
    saving,
    togglingIds,
    loaded,
    busy,
    error,
    canImport,
    setAccount,
    refresh,
    addCategory,
    renameCategory,
    removeCategory,
    addTodo,
    removeTodo,
    toggleTodo,
    moveTodo,
    clearCompleted,
    importLocalData,
  }
})
