<script setup lang="ts">
import { computed, nextTick, ref, toRef, useId, useTemplateRef, watch } from 'vue'
import { useCategoryForm } from '@/composables/useCategoryForm'
import { MAX_CATEGORY_NAME_LENGTH, type TodoCategory } from '@/types/category'

const props = defineProps<{
  category: TodoCategory
  categories: TodoCategory[]
  busy: boolean
  resetVersion: number
}>()
const emit = defineEmits<{
  rename: [id: string, name: string]
  remove: [id: string]
  close: []
}>()
const mode = ref<'view' | 'edit' | 'delete'>('view')
const id = useId()
const editingId = computed(() => props.category.id)
const { name, trimmedName, error, canSubmit } = useCategoryForm(
  toRef(props, 'categories'),
  editingId,
)
const hasChanged = computed(() => trimmedName.value !== props.category.name)
const nameInput = useTemplateRef<HTMLInputElement>('nameInput')
const editButton = useTemplateRef<HTMLButtonElement>('editButton')
const deleteButton = useTemplateRef<HTMLButtonElement>('deleteButton')
const cancelButton = useTemplateRef<HTMLButtonElement>('cancelButton')

async function startEdit() {
  name.value = props.category.name
  mode.value = 'edit'
  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}

async function startDelete() {
  mode.value = 'delete'
  await nextTick()
  cancelButton.value?.focus()
}

async function cancel() {
  const previous = mode.value
  mode.value = 'view'
  await nextTick()
  if (previous === 'delete') deleteButton.value?.focus()
  else editButton.value?.focus()
}

function submit() {
  if (!props.busy && canSubmit.value && hasChanged.value)
    emit('rename', props.category.id, trimmedName.value)
}

watch(() => props.resetVersion, cancel)
</script>

<template>
  <div class="category-actions" @keydown.esc.prevent="mode === 'view' && !busy && emit('close')">
    <div v-if="mode === 'view'" class="category-actions__buttons">
      <button
        ref="editButton"
        class="button button--secondary"
        type="button"
        :disabled="busy"
        @click="startEdit"
      >
        Edit category
      </button>
      <button
        ref="deleteButton"
        class="button button--danger"
        type="button"
        :disabled="busy"
        @click="startDelete"
      >
        Delete category
      </button>
    </div>
    <form
      v-else-if="mode === 'edit'"
      @submit.prevent="submit"
      @keydown.esc.stop.prevent="!busy && cancel()"
    >
      <label class="category-form__label" :for="`${id}-name`">Category name</label>
      <input
        :id="`${id}-name`"
        ref="nameInput"
        v-model="name"
        class="todo-form__input"
        type="text"
        :maxlength="MAX_CATEGORY_NAME_LENGTH"
        :disabled="busy"
        required
        :aria-invalid="error.length > 0"
        :aria-describedby="error ? `${id}-error` : undefined"
      />
      <p v-if="error" :id="`${id}-error`" class="category-form__error" role="status">{{ error }}</p>
      <div class="category-actions__buttons">
        <button
          class="button button--secondary"
          type="submit"
          :disabled="busy || !canSubmit || !hasChanged"
        >
          Save category
        </button>
        <button class="button button--quiet" type="button" :disabled="busy" @click="cancel">
          Cancel
        </button>
      </div>
    </form>
    <div
      v-else
      class="category-actions__confirmation"
      @keydown.esc.stop.prevent="!busy && cancel()"
    >
      <p>Delete “{{ category.name }}”? Its tasks will be kept in Uncategorized.</p>
      <div class="category-actions__buttons">
        <button
          class="button button--danger"
          type="button"
          :disabled="busy"
          @click="emit('remove', category.id)"
        >
          Confirm delete category
        </button>
        <button
          ref="cancelButton"
          class="button button--quiet"
          type="button"
          :disabled="busy"
          @click="cancel"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
