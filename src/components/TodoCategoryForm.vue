<script setup lang="ts">
import { toRef } from 'vue'
import { useCategoryForm } from '@/composables/useCategoryForm'
import { MAX_CATEGORY_NAME_LENGTH, type TodoCategory } from '@/types/category'

const props = defineProps<{
  categories: TodoCategory[]
}>()

const emit = defineEmits<{
  create: [name: string]
}>()

const { name, trimmedName, error, canSubmit } = useCategoryForm(toRef(props, 'categories'))

function submitCategory() {
  if (!canSubmit.value) {
    return
  }

  emit('create', trimmedName.value)
  name.value = ''
}
</script>

<template>
  <form class="category-form" @submit.prevent="submitCategory">
    <label class="category-form__label" for="new-category">New category</label>
    <div class="category-form__controls">
      <input
        id="new-category"
        v-model="name"
        class="todo-form__input"
        type="text"
        :maxlength="MAX_CATEGORY_NAME_LENGTH"
        placeholder="e.g. Work or Personal"
        autocomplete="off"
        :aria-invalid="error.length > 0"
        :aria-describedby="error ? 'category-error' : undefined"
      />
      <button class="button button--secondary" type="submit" :disabled="!canSubmit">
        Create category
      </button>
    </div>
    <p v-if="error" id="category-error" class="category-form__error" role="status">
      {{ error }}
    </p>
  </form>
</template>
