import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadCategories, saveCategories } from '@/services/categoryStorage'
import { loadTodos, saveTodos } from '@/services/todoStorage'
import {
  MAX_CATEGORY_NAME_LENGTH,
  type TodoCategory,
  type TodoCategoryFilter,
} from '@/types/category'
import { isTodoPriorityId, TodoPriorityId, type Todo } from '@/types/todo'

const MAX_TITLE_LENGTH = 120

export const useTodoStore = defineStore('todos', () => {
  const categories = ref<TodoCategory[]>(loadCategories())
  const todos = ref<Todo[]>(
    loadTodos().map((todo) => ({
      ...todo,
      categoryId: categories.value.some((category) => category.id === todo.categoryId)
        ? todo.categoryId
        : null,
    })),
  )

  function persistTodos() {
    saveTodos(todos.value)
  }

  function isKnownCategory(categoryId: string | null) {
    return categoryId === null || categories.value.some((category) => category.id === categoryId)
  }

  function addCategory(name: string): TodoCategory | null {
    const trimmedName = name.trim()

    if (
      trimmedName.length === 0 ||
      trimmedName.length > MAX_CATEGORY_NAME_LENGTH ||
      categories.value.some((category) => category.name.toLowerCase() === trimmedName.toLowerCase())
    ) {
      return null
    }

    const category = { id: crypto.randomUUID(), name: trimmedName }
    categories.value.push(category)
    saveCategories(categories.value)
    return category
  }

  function addTodo(
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
    ) {
      return
    }

    todos.value.push({
      id: crypto.randomUUID(),
      title: trimmedTitle,
      completed: false,
      createdAt: new Date().toISOString(),
      priorityId,
      categoryId,
    })
    persistTodos()
  }

  function removeTodo(id: string) {
    const remainingTodos = todos.value.filter((todo) => todo.id !== id)

    if (remainingTodos.length === todos.value.length) {
      return
    }

    todos.value = remainingTodos
    persistTodos()
  }

  function toggleTodo(id: string) {
    const todo = todos.value.find((item) => item.id === id)

    if (!todo) {
      return
    }

    todo.completed = !todo.completed
    persistTodos()
  }

  function moveTodo(id: string, categoryId: string | null) {
    const todo = todos.value.find((item) => item.id === id)

    if (!todo || !isKnownCategory(categoryId) || todo.categoryId === categoryId) {
      return
    }

    todo.categoryId = categoryId
    persistTodos()
  }

  function clearCompleted(categoryId: TodoCategoryFilter = undefined) {
    const activeTodos = todos.value.filter(
      (todo) => !todo.completed || (categoryId !== undefined && todo.categoryId !== categoryId),
    )

    if (activeTodos.length === todos.value.length) {
      return
    }

    todos.value = activeTodos
    persistTodos()
  }

  return {
    todos,
    categories,
    addCategory,
    addTodo,
    removeTodo,
    toggleTodo,
    moveTodo,
    clearCompleted,
  }
})
