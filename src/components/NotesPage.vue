<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'
import AccountToolbar from '@/components/AccountToolbar.vue'
import NoteDialog from '@/components/NoteDialog.vue'
import NoteList from '@/components/NoteList.vue'
import NoteTabActions from '@/components/NoteTabActions.vue'
import NoteTabForm from '@/components/NoteTabForm.vue'
import NoteTabs from '@/components/NoteTabs.vue'
import { useActiveNoteTab } from '@/composables/useActiveNoteTab'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { useNotesStore } from '@/stores/notes'
import type { AccountUser } from '@/types/auth'
import { DEFAULT_NOTE_TAB_NAME, type NoteDraft } from '@/types/note'

defineProps<{ user: AccountUser; accountBusy: boolean; authError: string }>()
const emit = defineEmits<{ logout: [] }>()
const notesStore = useNotesStore()
const { tabs, notes } = storeToRefs(notesStore)
const { activeTabId, tabNotes } = useActiveNoteTab(tabs, notes)
const panelId = useId()
const noteIdPrefix = useId()
const newNoteButton = useTemplateRef('newNoteButton')
const actionsTabId = ref<string | null>(null)
const tabFormResetVersion = ref(0)
const tabActionResetVersion = ref(0)
const activeTab = computed(() => tabs.value.find((tab) => tab.id === activeTabId.value))

// The open dialog: a note id to edit it, or null to create a note in the active tab.
const dialogNoteId = ref<string | null | undefined>(undefined)
const dialogNote = computed(() =>
  dialogNoteId.value ? (notes.value.find((note) => note.id === dialogNoteId.value) ?? null) : null,
)
const dialogOpen = computed(
  () =>
    dialogNoteId.value === null || (dialogNoteId.value !== undefined && dialogNote.value !== null),
)
const dialogSaving = ref(false)
const dialogBusy = computed(
  () =>
    dialogSaving.value ||
    notesStore.creating ||
    (dialogNote.value !== null && notesStore.removingIds.has(dialogNote.value.id)),
)
const dirty = ref(false)
useUnsavedChanges(dirty)

watch(activeTabId, (id) => {
  if (id !== actionsTabId.value) actionsTabId.value = null
})

async function closeTabActions() {
  const id = actionsTabId.value
  actionsTabId.value = null
  await nextTick()
  if (id) document.getElementById(`${panelId}-manage-${id}`)?.focus()
}

async function manageTab(id: string) {
  if (actionsTabId.value === id) {
    await closeTabActions()
    return
  }
  activeTabId.value = id
  actionsTabId.value = id
  await nextTick()
  document.getElementById(`${panelId}-actions`)?.querySelector<HTMLButtonElement>('button')?.focus()
}

async function createTab(name: string) {
  const tab = await notesStore.addTab(name)
  if (tab) {
    activeTabId.value = tab.id
    tabFormResetVersion.value += 1
  }
}

async function renameTab(id: string, name: string) {
  if (await notesStore.renameTab(id, name)) tabActionResetVersion.value += 1
}

async function removeTab(id: string) {
  if (await notesStore.removeTab(id)) {
    await nextTick()
    document.getElementById(panelId)?.focus()
  }
}

async function closeDialog(focusNoteId: string | null) {
  dialogNoteId.value = undefined
  await nextTick()
  const noteButton = focusNoteId && document.getElementById(`${noteIdPrefix}-${focusNoteId}`)
  if (noteButton) noteButton.focus()
  else newNoteButton.value?.focus()
}

async function saveNote(draft: NoteDraft) {
  const noteId = dialogNoteId.value
  if (noteId === undefined || dialogSaving.value) return
  dialogSaving.value = true
  const savedId =
    noteId === null
      ? ((await notesStore.addNote(activeTabId.value, draft))?.id ?? null)
      : (await notesStore.updateNote(noteId, draft))
        ? noteId
        : null
  dialogSaving.value = false
  if (savedId) await closeDialog(savedId)
}

async function removeNote() {
  const noteId = dialogNoteId.value
  if (noteId && (await notesStore.removeNote(noteId))) await closeDialog(null)
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
  <fieldset
    class="todo-workspace"
    :disabled="!notesStore.loaded || notesStore.loading || accountBusy"
    :aria-busy="notesStore.loading || notesStore.tabSaving"
  >
    <legend class="sr-only">Your notes and tabs</legend>
    <div class="todo-categories">
      <NoteTabForm :tabs="tabs" :reset-version="tabFormResetVersion" @create="createTab" />
      <NoteTabs
        v-model="activeTabId"
        :tabs="tabs"
        :panel-id="panelId"
        :actions-tab-id="actionsTabId"
        @manage="manageTab"
      />
      <NoteTabActions
        v-if="activeTab && actionsTabId === activeTab.id"
        :id="`${panelId}-actions`"
        :key="activeTab.id"
        :tab="activeTab"
        :tabs="tabs"
        :busy="notesStore.tabSaving || accountBusy"
        :reset-version="tabActionResetVersion"
        @rename="renameTab"
        @remove="removeTab"
        @close="closeTabActions"
      />
    </div>
    <div
      :id="panelId"
      class="notes-panel"
      role="tabpanel"
      :aria-label="activeTab?.name ?? DEFAULT_NOTE_TAB_NAME"
      tabindex="0"
    >
      <button
        ref="newNoteButton"
        class="button button--primary notes-panel__new"
        type="button"
        @click="dialogNoteId = null"
      >
        New note
      </button>
      <NoteList :notes="tabNotes" :id-prefix="noteIdPrefix" @open="dialogNoteId = $event" />
    </div>
  </fieldset>
  <NoteDialog
    v-if="dialogOpen"
    :key="dialogNoteId ?? 'new'"
    v-model:dirty="dirty"
    :note="dialogNote"
    :busy="dialogBusy"
    :error="notesStore.error"
    @save="saveNote"
    @remove="removeNote"
    @close="closeDialog(dialogNoteId ?? null)"
  />
</template>
