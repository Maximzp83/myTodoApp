<script setup lang="ts">
import { toRef, useId, watch } from 'vue'
import { useCategoryForm } from '@/composables/useCategoryForm'
import { DEFAULT_NOTE_TAB_NAME, MAX_NOTE_TAB_NAME_LENGTH, type NoteTab } from '@/types/note'

const props = defineProps<{
  tabs: NoteTab[]
  resetVersion: number
}>()

const emit = defineEmits<{
  create: [name: string]
}>()

const id = useId()
const { name, trimmedName, error, canSubmit } = useCategoryForm(toRef(props, 'tabs'), undefined, {
  maxLength: MAX_NOTE_TAB_NAME_LENGTH,
  duplicateMessage: 'A tab with this name already exists.',
  reservedNames: [DEFAULT_NOTE_TAB_NAME],
})

function submitTab() {
  if (canSubmit.value) emit('create', trimmedName.value)
}

watch(
  () => props.resetVersion,
  () => {
    name.value = ''
  },
)
</script>

<template>
  <form class="category-form" @submit.prevent="submitTab">
    <label class="category-form__label" :for="`${id}-name`">New tab</label>
    <div class="category-form__controls">
      <input
        :id="`${id}-name`"
        v-model="name"
        class="todo-form__input"
        type="text"
        :maxlength="MAX_NOTE_TAB_NAME_LENGTH"
        placeholder="e.g. Ideas or Recipes"
        autocomplete="off"
        :aria-invalid="error.length > 0"
        :aria-describedby="error ? `${id}-error` : undefined"
      />
      <button class="button button--secondary" type="submit" :disabled="!canSubmit">
        Create tab
      </button>
    </div>
    <p v-if="error" :id="`${id}-error`" class="category-form__error" role="status">
      {{ error }}
    </p>
  </form>
</template>
