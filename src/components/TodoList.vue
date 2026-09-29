<script setup lang="ts">
import TodoItem from '@/components/TodoItem.vue'
import type { TodoCategory } from '@/types/category'
import type { Todo } from '@/types/todo'

defineProps<{
  todos: Todo[]
  categories: TodoCategory[]
  togglingIds: ReadonlySet<string>
}>()

const emit = defineEmits<{
  toggle: [id: string]
  remove: [id: string]
  move: [id: string, categoryId: string | null]
}>()
</script>

<template>
  <ul v-if="todos.length > 0" class="todo-list" aria-label="Todo list">
    <TodoItem
      v-for="todo in todos"
      :key="todo.id"
      :todo="todo"
      :categories="categories"
      :toggling="togglingIds.has(todo.id)"
      @toggle="emit('toggle', $event)"
      @remove="emit('remove', $event)"
      @move="(id, categoryId) => emit('move', id, categoryId)"
    />
  </ul>
  <p v-else class="empty-state">No Todos to show.</p>
</template>
