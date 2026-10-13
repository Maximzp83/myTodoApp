<script setup lang="ts">
import { notePreview, type Note } from '@/types/note'

defineProps<{ notes: Note[]; selectedId: string | undefined }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <ul v-if="notes.length > 0" class="note-list" aria-label="Notes">
    <li v-for="note in notes" :key="note.id">
      <button
        class="note-list__item"
        type="button"
        :aria-current="note.id === selectedId ? 'true' : undefined"
        @click="emit('select', note.id)"
      >
        <span class="note-list__preview">{{ notePreview(note.body) || 'Empty note' }}</span>
        <span class="note-list__date">{{ new Date(note.createdAt).toLocaleDateString() }}</span>
      </button>
    </li>
  </ul>
  <p v-else class="empty-state">No notes yet.</p>
</template>
