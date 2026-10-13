<script setup lang="ts">
import { computed, onUnmounted, ref, useId, watch } from 'vue'
import { useNotesStore } from '@/stores/notes'
import { MAX_NOTE_LENGTH, type Note } from '@/types/note'

const props = defineProps<{ note: Note; removing: boolean }>()
const emit = defineEmits<{ remove: [id: string] }>()
const dirty = defineModel<boolean>('dirty', { default: false })

const notesStore = useNotesStore()
const textId = useId()
const draft = ref(props.note.body)
const saving = ref(false)
const changed = computed(() => draft.value !== props.note.body)
const statusLabel = computed(() =>
  saving.value ? 'Saving…' : changed.value ? 'Unsaved changes' : 'All changes saved',
)

watch(changed, (value) => (dirty.value = value), { immediate: true })
onUnmounted(() => (dirty.value = false))

async function save() {
  if (!changed.value || saving.value || props.removing) return
  saving.value = true
  await notesStore.updateNote(props.note.id, draft.value)
  saving.value = false
}
</script>

<template>
  <form
    class="note-editor"
    @submit.prevent="save"
    @keydown.ctrl.s.prevent="save"
    @keydown.meta.s.prevent="save"
  >
    <label class="sr-only" :for="textId">Note text</label>
    <textarea
      :id="textId"
      v-model="draft"
      class="note-textarea note-editor__text"
      :maxlength="MAX_NOTE_LENGTH"
      placeholder="Start writing…"
      :disabled="removing"
    />
    <div class="note-editor__footer">
      <p class="note-editor__status" role="status" :data-changed="changed">{{ statusLabel }}</p>
      <div class="note-editor__actions">
        <button
          class="button button--danger"
          type="button"
          :disabled="removing || saving"
          @click="emit('remove', note.id)"
        >
          {{ removing ? 'Deleting…' : 'Delete note' }}
        </button>
        <button
          class="button button--primary"
          type="submit"
          :disabled="!changed || saving || removing"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>
  </form>
</template>
