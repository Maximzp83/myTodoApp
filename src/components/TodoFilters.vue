<script setup lang="ts">
import type { TodoFilter } from '@/types/todo'

defineProps<{
  modelValue: TodoFilter
}>()

const emit = defineEmits<{
  'update:modelValue': [filter: TodoFilter]
}>()

const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
] satisfies { value: TodoFilter; label: string }[]
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
