<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, useId } from 'vue'
import TodoCategoryForm from '@/components/TodoCategoryForm.vue'
import TodoCategoryTabs from '@/components/TodoCategoryTabs.vue'
import TodoCategoryActions from '@/components/TodoCategoryActions.vue'
import TodoFilters from '@/components/TodoFilters.vue'
import TodoForm from '@/components/TodoForm.vue'
import TodoList from '@/components/TodoList.vue'
import TodoSummary from '@/components/TodoSummary.vue'
import { useTodoFilters } from '@/composables/useTodoFilters'
import { useTodoStore } from '@/stores/todo'
import type { AccountUser } from '@/types/auth'
import { TodoFilter, type TodoPriorityId } from '@/types/todo'

defineProps<{ user: AccountUser; accountBusy: boolean; authError: string }>()
const emit = defineEmits<{ logout: [] }>()
const todoStore = useTodoStore()
const { todos, categories } = storeToRefs(todoStore)
const { filter, priorityId, categoryId, filteredTodos, activeCount, hasCompleted } = useTodoFilters(
  todos,
  categories,
)
const categoryPanelId = useId()
const categoryResetVersion = ref(0)
const todoResetVersion = ref(0)
const categoryActionResetVersion = ref(0)
const selectedCategory = computed(() =>
  categories.value.find((category) => category.id === categoryId.value),
)
const categoryPanelLabel = computed(
  () =>
    categories.value.find((category) => category.id === categoryId.value)?.name ??
    (categoryId.value === undefined ? 'All tasks' : 'Uncategorized'),
)

async function createCategory(name: string) {
  const category = await todoStore.addCategory(name)
  if (category) {
    categoryId.value = category.id
    categoryResetVersion.value += 1
    filter.value = TodoFilter.All
    priorityId.value = null
  }
}

async function addTodo(title: string, priority: TodoPriorityId, category: string | null) {
  if (await todoStore.addTodo(title, priority, category)) todoResetVersion.value += 1
}

async function renameCategory(id: string, name: string) {
  if (await todoStore.renameCategory(id, name)) categoryActionResetVersion.value += 1
}

async function removeCategory(id: string) {
  if (await todoStore.removeCategory(id)) {
    await nextTick()
    document.getElementById(categoryPanelId)?.focus()
  }
}
</script>

<template>
  <div class="account-toolbar">
    <p class="account-toolbar__email">{{ user.email }}</p>
    <div class="account-toolbar__actions">
      <button
        class="button button--quiet"
        type="button"
        :disabled="todoStore.busy || accountBusy"
        @click="todoStore.refresh"
      >
        Refresh
      </button>
      <button
        class="button button--secondary"
        type="button"
        :disabled="accountBusy"
        @click="emit('logout')"
      >
        {{ accountBusy ? 'Signing out…' : 'Sign out' }}
      </button>
    </div>
  </div>
  <p
    v-if="authError || todoStore.error"
    class="account-message account-message--error"
    role="alert"
  >
    {{ authError || todoStore.error }}
  </p>
  <p v-if="todoStore.loading" class="account-message" role="status">Loading your tasks…</p>
  <p v-else-if="todoStore.saving" class="account-message" role="status">Saving changes…</p>
  <div v-if="todoStore.canImport" class="browser-import">
    <p>This browser has tasks from the earlier version. Import them into this account?</p>
    <button
      class="button button--secondary"
      type="button"
      :disabled="todoStore.busy"
      @click="todoStore.importLocalData"
    >
      Import browser tasks
    </button>
  </div>
  <fieldset
    class="todo-workspace"
    :disabled="todoStore.busy || !todoStore.loaded || accountBusy"
    :aria-busy="todoStore.busy"
  >
    <legend class="sr-only">Your tasks and categories</legend>
    <div class="todo-categories">
      <TodoCategoryForm
        :categories="categories"
        :reset-version="categoryResetVersion"
        @create="createCategory"
      />
      <TodoCategoryTabs v-model="categoryId" :categories="categories" :panel-id="categoryPanelId" />
      <TodoCategoryActions
        v-if="selectedCategory"
        :key="selectedCategory.id"
        :category="selectedCategory"
        :categories="categories"
        :busy="todoStore.busy || accountBusy"
        :reset-version="categoryActionResetVersion"
        @rename="renameCategory"
        @remove="removeCategory"
      />
    </div>
    <div :id="categoryPanelId" role="tabpanel" :aria-label="categoryPanelLabel" tabindex="0">
      <TodoForm
        :categories="categories"
        :default-category-id="categoryId ?? null"
        :reset-version="todoResetVersion"
        @add="addTodo"
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
  </fieldset>
</template>
