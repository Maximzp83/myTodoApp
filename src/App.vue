<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, useId } from 'vue'
import TodoCategoryForm from '@/components/TodoCategoryForm.vue'
import TodoCategoryTabs from '@/components/TodoCategoryTabs.vue'
import TodoFilters from '@/components/TodoFilters.vue'
import TodoForm from '@/components/TodoForm.vue'
import TodoList from '@/components/TodoList.vue'
import TodoSummary from '@/components/TodoSummary.vue'
import { useTodoFilters } from '@/composables/useTodoFilters'
import { useTheme } from '@/composables/useTheme'
import { useTodoStore } from '@/stores/todo'
import { TodoFilter } from '@/types/todo'

const todoStore = useTodoStore()
const { todos, categories } = storeToRefs(todoStore)
const { filter, priorityId, categoryId, filteredTodos, activeCount, hasCompleted } =
  useTodoFilters(todos)
const { theme, toggleTheme } = useTheme()
const categoryPanelId = useId()
const categoryPanelLabel = computed(
  () =>
    categories.value.find((category) => category.id === categoryId.value)?.name ??
    (categoryId.value === undefined ? 'All tasks' : 'Uncategorized'),
)

function createCategory(name: string) {
  const category = todoStore.addCategory(name)

  if (category) {
    categoryId.value = category.id
    // A new category starts with its complete task list.
    filter.value = TodoFilter.All
    priorityId.value = null
  }
}
</script>

<template>
  <main class="app-shell">
    <section class="todo-card" aria-labelledby="todo-heading">
      <header class="todo-header">
        <div class="todo-header__top">
          <h1 id="todo-heading">My Todos</h1>
          <button
            class="button button--theme"
            type="button"
            :aria-label="theme === 'light' ? 'Enable dark theme' : 'Enable light theme'"
            @click="toggleTheme"
          >
            {{ theme === 'light' ? 'Dark theme' : 'Light theme' }}
          </button>
        </div>
        <p class="todo-header__intro">A simple place to capture tasks and keep moving.</p>
      </header>

      <div class="todo-categories">
        <TodoCategoryForm :categories="categories" @create="createCategory" />
        <TodoCategoryTabs
          v-model="categoryId"
          :categories="categories"
          :panel-id="categoryPanelId"
        />
      </div>

      <div :id="categoryPanelId" role="tabpanel" :aria-label="categoryPanelLabel" tabindex="0">
        <TodoForm
          :categories="categories"
          :default-category-id="categoryId ?? null"
          @add="todoStore.addTodo"
        />

        <div class="todo-controls">
          <TodoFilters v-model="filter" v-model:priority-id="priorityId" />
          <TodoSummary
            :active-count="activeCount"
            :has-completed="hasCompleted"
            @clear-completed="todoStore.clearCompleted(categoryId)"
          />
        </div>

        <TodoList
          :todos="filteredTodos"
          :categories="categories"
          @toggle="todoStore.toggleTodo"
          @remove="todoStore.removeTodo"
          @move="todoStore.moveTodo"
        />
      </div>
    </section>
  </main>
</template>
