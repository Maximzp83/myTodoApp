<script setup lang="ts">
import TodoItem from '@/components/TodoItem.vue'
import type { Todo } from '@/types/todo'

defineProps<{
  todos: Todo[]
}>()

const emit = defineEmits<{
  toggle: [id: string]
  remove: [id: string]
}>()
</script>

<template>
  <ul v-if="todos.length > 0" class="todo-list" aria-label="Todo list">
    <TodoItem
      v-for="todo in todos"
      :key="todo.id"
      :todo="todo"
      @toggle="emit('toggle', $event)"
      @remove="emit('remove', $event)"
    />
  </ul>
  <p v-else class="empty-state">No Todos to show.</p>
</template>
