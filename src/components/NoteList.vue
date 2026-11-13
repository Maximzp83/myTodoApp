<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue'
import { useDragReorder } from '@/composables/useDragReorder'
import { formatNoteDate, type Note } from '@/types/note'

const props = defineProps<{ notes: Note[]; idPrefix: string }>()
const emit = defineEmits<{ open: [id: string]; reorder: [id: string, afterId: string | null] }>()

const list = useTemplateRef<HTMLElement>('list')
const announcement = ref('')
const { draggingId, offset, dropTarget, start, move, finish, cancel } = useDragReorder(
  list,
  (id, index) => void moveTo(id, index),
)

function noteTitle(note: Note) {
  return note.title || 'Untitled note'
}

// Moves a note to the given index of this list; the note then follows the one before it.
async function moveTo(id: string, index: number, focusId?: string) {
  const others = props.notes.filter((note) => note.id !== id)
  const from = props.notes.findIndex((note) => note.id === id)
  if (from === -1 || index === from || index < 0 || index > others.length) return
  emit('reorder', id, others[index - 1]?.id ?? null)
  await nextTick()
  const position = props.notes.findIndex((note) => note.id === id)
  const note = props.notes[position]
  if (note && position === index)
    announcement.value = `Moved ${noteTitle(note)} to position ${index + 1} of ${props.notes.length}.`
  // The moved row is re-inserted into the list, which takes focus away from its button.
  if (focusId) document.getElementById(focusId)?.focus()
}
</script>

<template>
  <ul v-if="notes.length > 0" ref="list" class="note-list" aria-label="Notes">
    <li
      v-for="(note, index) in notes"
      :key="note.id"
      class="note-list__row"
      :class="{
        'note-list__row--dragging': draggingId === note.id,
        'note-list__row--drop-before': dropTarget?.id === note.id && dropTarget.edge === 'before',
        'note-list__row--drop-after': dropTarget?.id === note.id && dropTarget.edge === 'after',
      }"
      :style="draggingId === note.id ? { transform: `translateY(${offset}px)` } : undefined"
      :data-reorder-id="note.id"
    >
      <span
        class="note-list__handle"
        title="Drag to reorder"
        aria-hidden="true"
        @pointerdown="start($event, note.id)"
        @pointermove="move"
        @pointerup="finish"
        @pointercancel="cancel"
      >
        <svg viewBox="0 0 12 20" width="12" height="20" fill="currentColor">
          <circle cx="3" cy="4" r="1.6" />
          <circle cx="9" cy="4" r="1.6" />
          <circle cx="3" cy="10" r="1.6" />
          <circle cx="9" cy="10" r="1.6" />
          <circle cx="3" cy="16" r="1.6" />
          <circle cx="9" cy="16" r="1.6" />
        </svg>
      </span>
      <button
        :id="`${idPrefix}-${note.id}`"
        class="note-list__item"
        type="button"
        @click="emit('open', note.id)"
      >
        <span class="note-list__title" :class="{ 'note-list__title--empty': !note.title }">
          {{ noteTitle(note) }}
        </span>
        <time class="note-list__date" :datetime="note.createdAt">
          {{ formatNoteDate(note.createdAt) }}
        </time>
      </button>
      <!-- For keyboard and screen reader users; visible only while one of them has focus. -->
      <div class="note-list__move">
        <button
          :id="`${idPrefix}-${note.id}-up`"
          class="button button--quiet"
          type="button"
          :aria-label="`Move up: ${noteTitle(note)}`"
          :aria-disabled="index === 0"
          @click="moveTo(note.id, index - 1, `${idPrefix}-${note.id}-up`)"
        >
          Move up
        </button>
        <button
          :id="`${idPrefix}-${note.id}-down`"
          class="button button--quiet"
          type="button"
          :aria-label="`Move down: ${noteTitle(note)}`"
          :aria-disabled="index === notes.length - 1"
          @click="moveTo(note.id, index + 1, `${idPrefix}-${note.id}-down`)"
        >
          Move down
        </button>
      </div>
    </li>
  </ul>
  <p v-else class="empty-state">No notes in this tab yet.</p>
  <p class="sr-only" aria-live="polite">{{ announcement }}</p>
</template>
