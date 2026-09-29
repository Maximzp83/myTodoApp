<script setup lang="ts">
import { computed } from 'vue'
import type { TodoCategory } from '@/types/category'
import { prioritiesList, type Todo } from '@/types/todo'

const props = defineProps<{
  todo: Todo
  categories: TodoCategory[]
}>()

const emit = defineEmits<{
  toggle: [id: string]
  remove: [id: string]
  move: [id: string, categoryId: string | null]
}>()

const priorityLabel = computed(
  () =>
    prioritiesList.find((priority) => priority.id === props.todo.priorityId)?.label ?? 'Unknown',
)

function changeCategory(event: Event) {
  if (event.target instanceof HTMLSelectElement) {
    emit('move', props.todo.id, event.target.value || null)
  }
}
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
    <div class="todo-item__actions">
      <label class="sr-only" :for="`category-${todo.id}`">Category for {{ todo.title }}</label>
      <select
        :id="`category-${todo.id}`"
        class="todo-form__select todo-item__category"
        :value="todo.categoryId ?? ''"
        @change="changeCategory"
      >
        <option value="">Uncategorized</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
      <button
        class="button button--danger todo-item__remove"
        type="button"
        :aria-label="`Delete ${todo.title}`"
        @click="emit('remove', todo.id)"
      >
        Delete
      </button>
    </div>
  </li>
</template>
