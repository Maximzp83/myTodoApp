<script setup lang="ts">
import { storeToRefs } from 'pinia'
import TodoFilters from '@/components/TodoFilters.vue'
import TodoForm from '@/components/TodoForm.vue'
import TodoList from '@/components/TodoList.vue'
import TodoSummary from '@/components/TodoSummary.vue'
import { useTodoFilters } from '@/composables/useTodoFilters'
import { useTodoStore } from '@/stores/todo'

const todoStore = useTodoStore()
const { todos } = storeToRefs(todoStore)
const { filter, filteredTodos, activeCount, hasCompleted } = useTodoFilters(todos)
</script>

<template>
  <main class="app-shell">
    <section class="todo-card" aria-labelledby="todo-heading">
      <header class="todo-header">
        <h1 id="todo-heading">My Todos</h1>
        <p class="todo-header__intro">A simple place to capture tasks and keep moving.</p>
      </header>

      <TodoForm @add="todoStore.addTodo" />

      <div class="todo-controls">
        <TodoFilters v-model="filter" />
        <TodoSummary
          :active-count="activeCount"
          :has-completed="hasCompleted"
          @clear-completed="todoStore.clearCompleted"
        />
      </div>

      <TodoList
        :todos="filteredTodos"
        @toggle="todoStore.toggleTodo"
        @remove="todoStore.removeTodo"
      />
    </section>
  </main>
</template>
