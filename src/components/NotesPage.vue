<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref } from 'vue'
import AccountToolbar from '@/components/AccountToolbar.vue'
import NoteEditor from '@/components/NoteEditor.vue'
import NoteList from '@/components/NoteList.vue'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { useNotesStore } from '@/stores/notes'
import type { AccountUser } from '@/types/auth'

defineProps<{ user: AccountUser; accountBusy: boolean; authError: string }>()
const emit = defineEmits<{ logout: [] }>()
const notesStore = useNotesStore()
const { notes } = storeToRefs(notesStore)
const selectedId = ref<string | null>(null)
const dirty = ref(false)
const { confirmDiscard } = useUnsavedChanges(dirty)
const selectedNote = computed(
  () => notes.value.find((note) => note.id === selectedId.value) ?? notes.value[0],
)

function selectNote(id: string) {
  if (id !== selectedNote.value?.id && confirmDiscard()) selectedId.value = id
}

async function createNote() {
  if (!confirmDiscard()) return
  const note = await notesStore.addNote()
  if (!note) return
  selectedId.value = note.id
  await nextTick()
  document.querySelector<HTMLTextAreaElement>('.note-editor__text')?.focus()
}
</script>

<template>
  <AccountToolbar :email="user.email" :busy="accountBusy" @logout="emit('logout')">
    <button
      class="button button--quiet"
      type="button"
      :disabled="notesStore.loading || accountBusy"
      @click="notesStore.refresh"
    >
      Refresh
    </button>
  </AccountToolbar>
  <p
    v-if="authError || notesStore.error"
    class="account-message account-message--error"
    role="alert"
  >
    {{ authError || notesStore.error }}
  </p>
  <section class="notes" aria-label="Your notes" :aria-busy="notesStore.loading">
    <div class="notes__sidebar">
      <button
        class="button button--primary"
        type="button"
        :disabled="!notesStore.loaded || notesStore.creating || accountBusy"
        @click="createNote"
      >
        {{ notesStore.creating ? 'Creating…' : 'New note' }}
      </button>
      <NoteList :notes="notes" :selected-id="selectedNote?.id" @select="selectNote" />
    </div>
    <NoteEditor
      v-if="selectedNote"
      :key="selectedNote.id"
      v-model:dirty="dirty"
      :note="selectedNote"
      :removing="notesStore.removingIds.has(selectedNote.id)"
      @remove="notesStore.removeNote"
    />
    <p v-else-if="notesStore.loaded" class="empty-state notes__placeholder">
      Create a note to start writing.
    </p>
  </section>
</template>
