<script setup lang="ts">
defineProps<{ email: string; busy: boolean }>()
const emit = defineEmits<{ logout: [] }>()
</script>

<template>
  <div class="account-toolbar">
    <p class="account-toolbar__email">{{ email }}</p>
    <div class="account-toolbar__actions">
      <slot />
      <button
        class="button button--secondary"
        type="button"
        :disabled="busy"
        @click="emit('logout')"
      >
        {{ busy ? 'Signing out…' : 'Sign out' }}
      </button>
    </div>
  </div>
</template>
