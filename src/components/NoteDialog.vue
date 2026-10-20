<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import {
  DEFAULT_NOTE_TAB_NAME,
  formatNoteDate,
  MAX_NOTE_CONTENT_LENGTH,
  MAX_NOTE_TITLE_LENGTH,
  type Note,
  type NoteDraft,
  type NoteTab,
  type NoteTabId,
} from '@/types/note'

// Without a note, the dialog creates a new one in newNoteTabId.
const props = defineProps<{
  note: Note | null
  tabs: NoteTab[]
  newNoteTabId: NoteTabId
  busy: boolean
  error: string
}>()
const emit = defineEmits<{ save: [draft: NoteDraft]; remove: []; close: [] }>()
const dirty = defineModel<boolean>('dirty', { default: false })

const dialog = useTemplateRef('dialog')
const id = useId()
const title = ref(props.note?.title ?? '')
const content = ref(props.note?.content ?? '')
// A note whose tab was deleted elsewhere is shown in General.
const initialTabId =
  props.note?.tabId && props.tabs.some((tab) => tab.id === props.note?.tabId)
    ? props.note.tabId
    : null
const tabId = ref<NoteTabId>(props.note ? initialTabId : props.newNoteTabId)
const changed = computed(() =>
  props.note
    ? title.value.trim() !== props.note.title ||
      content.value !== props.note.content ||
      tabId.value !== initialTabId
    : title.value.trim().length > 0 || content.value.trim().length > 0,
)
const heading = computed(() => (props.note ? props.note.title || 'Untitled note' : 'New note'))
let unmounting = false

watch(changed, (value) => (dirty.value = value), { immediate: true })

onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => {
  unmounting = true
  dialog.value?.close()
})
onUnmounted(() => (dirty.value = false))

function requestClose() {
  if (props.busy) return
  if (changed.value && !window.confirm('Discard unsaved changes?')) return
  dialog.value?.close()
}

function save() {
  if (changed.value && !props.busy)
    emit('save', { tabId: tabId.value, title: title.value, content: content.value })
}

function remove() {
  if (!props.busy && window.confirm('Delete this note?')) emit('remove')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="note-dialog"
    :aria-labelledby="`${id}-heading`"
    @keydown.esc.prevent="requestClose"
    @cancel.prevent="requestClose"
    @close="!unmounting && emit('close')"
  >
    <form
      class="note-dialog__form"
      @submit.prevent="save"
      @keydown.ctrl.s.prevent="save"
      @keydown.meta.s.prevent="save"
    >
      <div class="note-dialog__header">
        <h2 :id="`${id}-heading`" class="note-dialog__title">{{ heading }}</h2>
        <p v-if="note" class="note-dialog__date">
          Created <time :datetime="note.createdAt">{{ formatNoteDate(note.createdAt) }}</time>
        </p>
      </div>
      <label class="category-form__label" :for="`${id}-title`">Title</label>
      <input
        :id="`${id}-title`"
        v-model="title"
        class="todo-form__input"
        type="text"
        :maxlength="MAX_NOTE_TITLE_LENGTH"
        placeholder="Untitled note"
        autocomplete="off"
        :disabled="busy"
        autofocus
      />
      <template v-if="note">
        <label class="category-form__label" :for="`${id}-tab`">Tab</label>
        <select :id="`${id}-tab`" v-model="tabId" class="todo-form__select" :disabled="busy">
          <option :value="null">{{ DEFAULT_NOTE_TAB_NAME }}</option>
          <option v-for="tab in tabs" :key="tab.id" :value="tab.id">{{ tab.name }}</option>
        </select>
      </template>
      <label class="category-form__label" :for="`${id}-content`">Content</label>
      <textarea
        :id="`${id}-content`"
        v-model="content"
        class="note-textarea"
        rows="14"
        :maxlength="MAX_NOTE_CONTENT_LENGTH"
        placeholder="Start writing…"
        :disabled="busy"
      />
      <p v-if="error" class="note-dialog__error" role="alert">{{ error }}</p>
      <div class="note-dialog__actions">
        <button
          v-if="note"
          class="button button--danger"
          type="button"
          :disabled="busy"
          @click="remove"
        >
          Delete note
        </button>
        <button
          class="button button--secondary"
          type="button"
          :disabled="busy"
          @click="requestClose"
        >
          Cancel
        </button>
        <button class="button button--primary" type="submit" :disabled="busy || !changed">
          {{ busy ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </form>
  </dialog>
</template>
