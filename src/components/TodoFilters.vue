<script setup lang="ts">
import { TodoFilter } from '@/types/todo'

defineProps<{
  modelValue: TodoFilter
}>()

const emit = defineEmits<{
  'update:modelValue': [filter: TodoFilter]
}>()

const filterLabels = {
  [TodoFilter.All]: 'All',
  [TodoFilter.Active]: 'Active',
  [TodoFilter.Completed]: 'Completed',
} satisfies Record<TodoFilter, string>
const filters = Object.values(TodoFilter).map((value) => ({
  value,
  label: filterLabels[value],
}))
</script>

<template>
  <div class="todo-filters" aria-label="Filter Todos">
    <button
      v-for="option in filters"
      :key="option.value"
      class="todo-filter"
      :class="{ 'todo-filter--selected': modelValue === option.value }"
      type="button"
      :aria-pressed="modelValue === option.value"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
