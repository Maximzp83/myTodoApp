<script setup lang="ts">
import { useId } from 'vue'
import { TodoSort } from '@/types/todo'

const sort = defineModel<TodoSort>({ required: true })
const selectId = useId()

const sortLabels = {
  [TodoSort.OldestFirst]: 'Oldest first',
  [TodoSort.NewestFirst]: 'Newest first',
} satisfies Record<TodoSort, string>
const sortOptions = Object.values(TodoSort).map((value) => ({
  value,
  label: sortLabels[value],
}))
</script>

<template>
  <div class="todo-sort">
    <label :for="selectId">Sort</label>
    <select :id="selectId" v-model="sort" class="todo-form__select">
      <option v-for="option in sortOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </div>
</template>
