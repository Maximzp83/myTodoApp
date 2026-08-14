<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{
  add: [title: string]
}>()

const title = ref('')
const canSubmit = computed(() => title.value.trim().length > 0)

function submitTodo() {
  if (!canSubmit.value) {
    return
  }

  emit('add', title.value)
  title.value = ''
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
    <button class="button button--primary" type="submit" :disabled="!canSubmit">Add Todo</button>
  </form>
</template>
