<script setup lang="ts">
defineProps<{
  activeCount: number
  hasCompleted: boolean
}>()

const emit = defineEmits<{
  clearCompleted: []
}>()
</script>

<template>
  <div class="todo-summary">
    <p class="todo-summary__count" aria-live="polite">
      {{ activeCount }} {{ activeCount === 1 ? 'item' : 'items' }} left
    </p>
    <button
      v-if="hasCompleted"
      class="button button--quiet"
      type="button"
      @click="emit('clearCompleted')"
    >
      Clear completed
    </button>
  </div>
</template>
