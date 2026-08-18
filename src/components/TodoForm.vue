<script setup lang="ts">
import { computed, ref } from 'vue'
import { TodoPriority } from '@/types/todo'

const emit = defineEmits<{
  add: [title: string, priority: TodoPriority]
}>()

const title = ref('')
const priority = ref<TodoPriority>(TodoPriority.Normal)
const canSubmit = computed(() => title.value.trim().length > 0)
const priorityLabels = {
  [TodoPriority.Low]: 'Low',
  [TodoPriority.Normal]: 'Normal',
  [TodoPriority.High]: 'High',
  [TodoPriority.Critical]: 'Critical',
} satisfies Record<TodoPriority, string>
const prioritiesList = Object.values(TodoPriority).map((value) => ({
  value,
  label: priorityLabels[value],
}))

function submitTodo() {
  if (!canSubmit.value) {
    return
  }

  emit('add', title.value, priority.value)
  title.value = ''
  priority.value = TodoPriority.Normal
}
</script>

<template>
  <form class="todo-form" @submit.prevent="submitTodo">
    <label class="sr-only" for="new-todo">New Todo</label>
    <input
      id="new-todo"
      v-model="title"
      class="todo-form__input"
      type="text"
      maxlength="120"
      placeholder="What needs to be done?"
      autocomplete="off"
    />
    <div class="todo-form__priority">
      <label for="todo-priority">Priority</label>
      <select id="todo-priority" v-model="priority" class="todo-form__select">
        <option
          v-for="option in prioritiesList"
          :key="option.value"
          :value="option.value"
          v-text="option.label"
        />
      </select>
    </div>
    <button class="button button--primary" type="submit" :disabled="!canSubmit">Add Todo</button>
  </form>
</template>
