<script setup lang="ts">
import { prioritiesList, TodoFilter, type TodoPriorityId } from '@/types/todo'

defineProps<{
  modelValue: TodoFilter
  priorityId: TodoPriorityId | null
}>()

const emit = defineEmits<{
  'update:modelValue': [filter: TodoFilter]
  'update:priorityId': [priorityId: TodoPriorityId | null]
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
  <div class="todo-filters">
    <div class="todo-filter-group" aria-label="Filter Todos by status">
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

    <div class="todo-filter-group" aria-label="Filter Todos by priority">
      <button
        class="todo-filter"
        :class="{ 'todo-filter--selected': priorityId === null }"
        type="button"
        :aria-pressed="priorityId === null"
        @click="emit('update:priorityId', null)"
      >
        All priorities
      </button>
      <button
        v-for="priority in prioritiesList"
        :key="priority.id"
        class="todo-filter"
        :class="{ 'todo-filter--selected': priorityId === priority.id }"
        type="button"
        :aria-pressed="priorityId === priority.id"
        @click="emit('update:priorityId', priority.id)"
      >
        {{ priority.label }}
      </button>
    </div>
  </div>
</template>
