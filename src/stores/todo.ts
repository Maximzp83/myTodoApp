import { ref } from 'vue'
import { defineStore } from 'pinia'
import { loadTodos, saveTodos } from '@/services/todoStorage'
import { isTodoPriorityId, TodoPriorityId, type Todo } from '@/types/todo'

const MAX_TITLE_LENGTH = 120

export const useTodoStore = defineStore('todos', () => {
  const todos = ref<Todo[]>(loadTodos())

  function persistTodos() {
    saveTodos(todos.value)
  }

  function addTodo(title: string, priorityId: TodoPriorityId = TodoPriorityId.Normal) {
    const trimmedTitle = title.trim()

    if (
      trimmedTitle.length === 0 ||
      trimmedTitle.length > MAX_TITLE_LENGTH ||
      !isTodoPriorityId(priorityId)
    ) {
      return
    }

    todos.value.push({
      id: crypto.randomUUID(),
      title: trimmedTitle,
      completed: false,
      createdAt: new Date().toISOString(),
      priorityId,
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

  function clearCompleted() {
    const activeTodos = todos.value.filter((todo) => !todo.completed)

    if (activeTodos.length === todos.value.length) {
      return
    }

    todos.value = activeTodos
    persistTodos()
  }

  return { todos, addTodo, removeTodo, toggleTodo, clearCompleted }
})
