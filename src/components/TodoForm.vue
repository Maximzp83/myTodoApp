<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TodoCategory } from '@/types/category'
import { prioritiesList, TodoPriorityId } from '@/types/todo'

const props = defineProps<{
  categories: TodoCategory[]
  defaultCategoryId: string | null
  resetVersion?: number
}>()

const emit = defineEmits<{
  add: [title: string, priorityId: TodoPriorityId, categoryId: string | null]
}>()

const title = ref('')
const priorityId = ref<TodoPriorityId>(TodoPriorityId.Normal)
const categoryId = ref(props.defaultCategoryId)
const canSubmit = computed(() => title.value.trim().length > 0)

watch(
  () => props.defaultCategoryId,
  (newCategoryId) => {
    categoryId.value = newCategoryId
  },
)

function submitTodo() {
  if (!canSubmit.value) {
    return
  }

  emit('add', title.value, priorityId.value, categoryId.value)
}

watch(
  () => props.resetVersion,
  () => {
    title.value = ''
    priorityId.value = TodoPriorityId.Normal
    categoryId.value = props.defaultCategoryId
  },
)
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
    <div class="todo-form__category">
      <label for="todo-category">Category</label>
      <select id="todo-category" v-model="categoryId" class="todo-form__select">
        <option :value="null">Uncategorized</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
    </div>
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
