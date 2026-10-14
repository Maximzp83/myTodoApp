<script setup lang="ts">
import { formatNoteDate, type Note } from '@/types/note'

defineProps<{ notes: Note[]; idPrefix: string }>()
const emit = defineEmits<{ open: [id: string] }>()
</script>

<template>
  <ul v-if="notes.length > 0" class="note-list" aria-label="Notes">
    <li v-for="note in notes" :key="note.id">
      <button
        :id="`${idPrefix}-${note.id}`"
        class="note-list__item"
        type="button"
        @click="emit('open', note.id)"
      >
        <span class="note-list__title" :class="{ 'note-list__title--empty': !note.title }">
          {{ note.title || 'Untitled note' }}
        </span>
        <time class="note-list__date" :datetime="note.createdAt">
          {{ formatNoteDate(note.createdAt) }}
        </time>
      </button>
    </li>
  </ul>
  <p v-else class="empty-state">No notes in this tab yet.</p>
</template>
