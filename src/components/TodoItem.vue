<script setup lang="ts">
import type { Todo } from '@/types/todo'

defineProps<{
  todo: Todo
}>()

const emit = defineEmits<{
  toggle: [id: string]
  remove: [id: string]
}>()
</script>

<template>
  <li class="todo-item" :class="{ 'todo-item--completed': todo.completed }">
    <input
      :id="`todo-${todo.id}`"
      class="todo-item__checkbox"
      type="checkbox"
      :checked="todo.completed"
      @change="emit('toggle', todo.id)"
    />
    <div class="todo-item__content">
      <label class="todo-item__title" :for="`todo-${todo.id}`">{{ todo.title }}</label>
      <span class="todo-priority" :class="`todo-priority--${todo.priority}`">
        {{ todo.priority }}
      </span>
    </div>
    <button
      class="button button--danger todo-item__remove"
      type="button"
      :aria-label="`Delete ${todo.title}`"
      @click="emit('remove', todo.id)"
    >
      Delete
    </button>
  </li>
</template>
