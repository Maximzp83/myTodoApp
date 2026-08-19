<script setup lang="ts">
import { computed } from 'vue'
import { prioritiesList, type Todo } from '@/types/todo'

const props = defineProps<{
  todo: Todo
}>()

const emit = defineEmits<{
  toggle: [id: string]
  remove: [id: string]
}>()

const priorityLabel = computed(
  () =>
    prioritiesList.find((priority) => priority.id === props.todo.priorityId)?.label ?? 'Unknown',
)
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
      <span class="todo-priority" :data-priority-id="todo.priorityId">
        {{ priorityLabel }}
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
