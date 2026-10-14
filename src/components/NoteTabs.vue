<script setup lang="ts">
import { computed, useId } from 'vue'
import { DEFAULT_NOTE_TAB_NAME, type NoteTab, type NoteTabId } from '@/types/note'

const props = defineProps<{
  tabs: NoteTab[]
  modelValue: NoteTabId
  panelId: string
  actionsTabId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [tabId: NoteTabId]
  manage: [tabId: string]
}>()

const id = useId()
const items = computed(() => [
  { id: `${id}-general`, tabId: null, label: DEFAULT_NOTE_TAB_NAME },
  ...props.tabs.map((tab) => ({ id: `${id}-${tab.id}`, tabId: tab.id, label: tab.name })),
])

function navigateTabs(event: KeyboardEvent, index: number) {
  let nextIndex = index

  switch (event.key) {
    case 'ArrowRight':
      nextIndex = (index + 1) % items.value.length
      break
    case 'ArrowLeft':
      nextIndex = (index - 1 + items.value.length) % items.value.length
      break
    case 'Home':
      nextIndex = 0
      break
    case 'End':
      nextIndex = items.value.length - 1
      break
    default:
      return
  }

  const item = items.value[nextIndex]

  if (!item || !(event.currentTarget instanceof HTMLButtonElement)) {
    return
  }

  event.preventDefault()
  emit('update:modelValue', item.tabId)
  event.currentTarget
    .closest('[role="tablist"]')
    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    [nextIndex]?.focus()
}
</script>

<template>
  <div class="category-tabs" role="tablist" aria-label="Note tabs">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="category-tab-wrap"
      role="presentation"
    >
      <button
        :id="item.id"
        class="category-tab"
        :class="{ 'category-tab--editable': item.tabId !== null }"
        type="button"
        role="tab"
        :aria-controls="panelId"
        :aria-selected="modelValue === item.tabId"
        :title="item.label"
        :tabindex="modelValue === item.tabId ? 0 : -1"
        @click="emit('update:modelValue', item.tabId)"
        @keydown="navigateTabs($event, index)"
      >
        {{ item.label }}
      </button>
      <button
        v-if="item.tabId !== null"
        :id="`${panelId}-manage-${item.tabId}`"
        class="category-tab__manage"
        type="button"
        :aria-label="`Manage tab ${item.label}`"
        :aria-expanded="actionsTabId === item.tabId"
        :aria-controls="actionsTabId === item.tabId ? `${panelId}-actions` : undefined"
        :tabindex="modelValue === item.tabId ? 0 : -1"
        @click.stop="emit('manage', item.tabId)"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m16 4 4 4-12 12-5 1 1-5Z" />
          <path d="m14 6 4 4" />
        </svg>
      </button>
    </div>
  </div>
</template>
