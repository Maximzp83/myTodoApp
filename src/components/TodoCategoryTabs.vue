<script setup lang="ts">
import { computed, useId } from 'vue'
import type { TodoCategory, TodoCategoryFilter } from '@/types/category'

const props = defineProps<{
  categories: TodoCategory[]
  modelValue: TodoCategoryFilter
  panelId: string
  actionsCategoryId: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [categoryId: TodoCategoryFilter]
  manage: [categoryId: string]
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
  event.currentTarget
    .closest('[role="tablist"]')
    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    [nextIndex]?.focus()
}
</script>

<template>
  <div class="category-tabs" role="tablist" aria-label="Todo categories">
    <div v-for="(tab, index) in tabs" :key="tab.id" class="category-tab-wrap" role="presentation">
      <button
        :id="tab.id"
        class="category-tab"
        :class="{ 'category-tab--editable': typeof tab.categoryId === 'string' }"
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
      <button
        v-if="typeof tab.categoryId === 'string'"
        :id="`${panelId}-manage-${tab.categoryId}`"
        class="category-tab__manage"
        type="button"
        :aria-label="`Manage category ${tab.label}`"
        :aria-expanded="actionsCategoryId === tab.categoryId"
        :aria-controls="actionsCategoryId === tab.categoryId ? `${panelId}-actions` : undefined"
        :tabindex="modelValue === tab.categoryId ? 0 : -1"
        @click.stop="emit('manage', tab.categoryId)"
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
