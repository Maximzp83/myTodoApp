<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef } from 'vue'
import { MAX_TODO_NOTE_LENGTH, type Todo } from '@/types/todo'

const props = defineProps<{ todo: Todo; busy: boolean; error: string }>()
const emit = defineEmits<{ save: [id: string, note: string]; close: [] }>()

const dialog = useTemplateRef('dialog')
const headingId = useId()
const textId = useId()
const draft = ref(props.todo.note ?? '')
const changed = computed(() => (draft.value.trim() ? draft.value : null) !== props.todo.note)

onMounted(() => dialog.value?.showModal())
// Closing before unmount lets the browser return focus to the button that opened the dialog.
onBeforeUnmount(() => dialog.value?.close())

function save() {
  if (changed.value && !props.busy) emit('save', props.todo.id, draft.value)
}
</script>

<template>
  <dialog ref="dialog" class="note-dialog" :aria-labelledby="headingId" @close="emit('close')">
    <form class="note-dialog__form" @submit.prevent="save">
      <h2 :id="headingId" class="note-dialog__title">{{ todo.title }}</h2>
      <label class="sr-only" :for="textId">Note</label>
      <textarea
        :id="textId"
        v-model="draft"
        class="note-textarea"
        rows="8"
        :maxlength="MAX_TODO_NOTE_LENGTH"
        placeholder="Write a note for this task…"
        :disabled="busy"
        autofocus
      />
      <p v-if="error" class="note-dialog__error" role="alert">{{ error }}</p>
      <div class="note-dialog__actions">
        <button
          v-if="todo.note"
          class="button button--danger"
          type="button"
          :disabled="busy"
          @click="emit('save', todo.id, '')"
        >
          Delete note
        </button>
        <button class="button button--secondary" type="button" @click="dialog?.close()">
          Cancel
        </button>
        <button class="button button--primary" type="submit" :disabled="busy || !changed">
          {{ busy ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
  </dialog>
</template>
