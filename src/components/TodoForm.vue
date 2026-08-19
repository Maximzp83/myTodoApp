<script setup lang="ts">
import { computed, ref } from 'vue'
import { prioritiesList, TodoPriorityId } from '@/types/todo'

const emit = defineEmits<{
  add: [title: string, priorityId: TodoPriorityId]
}>()

const title = ref('')
const priorityId = ref<TodoPriorityId>(TodoPriorityId.Normal)
const canSubmit = computed(() => title.value.trim().length > 0)

function submitTodo() {
  if (!canSubmit.value) {
    return
  }

  emit('add', title.value, priorityId.value)
  title.value = ''
  priorityId.value = TodoPriorityId.Normal
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
      <select id="todo-priority" v-model.number="priorityId" class="todo-form__select">
        <option
          v-for="option in prioritiesList"
          :key="option.id"
          :value="option.id"
          v-text="option.label"
        />
      </select>
    </div>
    <button class="button button--primary" type="submit" :disabled="!canSubmit">Add Todo</button>
  </form>
</template>
