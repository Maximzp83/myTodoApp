<script setup lang="ts">
import { computed, useId } from 'vue'
import type { TodoCategory, TodoCategoryFilter } from '@/types/category'

const props = defineProps<{
  categories: TodoCategory[]
  modelValue: TodoCategoryFilter
  panelId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [categoryId: TodoCategoryFilter]
}>()

const id = useId()
const tabs = computed(() => [
  { id: `${id}-all`, categoryId: undefined, label: 'All tasks' },
  { id: `${id}-uncategorized`, categoryId: null, label: 'Uncategorized' },
  ...props.categories.map((category) => ({
    id: `${id}-${category.id}`,
    categoryId: category.id,
    label: category.name,
  })),
])

function navigateTabs(event: KeyboardEvent, index: number) {
  let nextIndex = index

  switch (event.key) {
    case 'ArrowRight':
      nextIndex = (index + 1) % tabs.value.length
      break
    case 'ArrowLeft':
      nextIndex = (index - 1 + tabs.value.length) % tabs.value.length
      break
    case 'Home':
      nextIndex = 0
      break
    case 'End':
      nextIndex = tabs.value.length - 1
      break
    default:
      return
  }

  const tab = tabs.value[nextIndex]

  if (!tab || !(event.currentTarget instanceof HTMLButtonElement)) {
    return
  }

  event.preventDefault()
  emit('update:modelValue', tab.categoryId)
  event.currentTarget.parentElement
    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    [nextIndex]?.focus()
}
</script>

<template>
  <div class="category-tabs" role="tablist" aria-label="Todo categories">
    <button
      v-for="(tab, index) in tabs"
      :id="tab.id"
      :key="tab.id"
      class="category-tab"
      type="button"
      role="tab"
      :aria-controls="panelId"
      :aria-selected="modelValue === tab.categoryId"
      :title="tab.label"
      :tabindex="modelValue === tab.categoryId ? 0 : -1"
      @click="emit('update:modelValue', tab.categoryId)"
      @keydown="navigateTabs($event, index)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
