<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AuthMode } from '@/types/auth'

defineProps<{ busy: boolean; configured: boolean; error: string; notice: string }>()
const emit = defineEmits<{ submit: [mode: AuthMode, email: string, password: string] }>()
const mode = ref<AuthMode>('sign-in')
const email = ref('')
const password = ref('')
watch(mode, () => {
  password.value = ''
})
</script>

<template>
  <section class="auth-panel" aria-labelledby="auth-heading">
    <h2 id="auth-heading">
      {{ mode === 'sign-in' ? 'Sign in to your Todos' : 'Create your account' }}
    </h2>
    <p class="auth-panel__intro">Your tasks and categories, available on all your devices.</p>
    <div class="auth-panel__modes" aria-label="Account options">
      <button
        class="todo-filter"
        type="button"
        :aria-pressed="mode === 'sign-in'"
        :class="{ 'todo-filter--selected': mode === 'sign-in' }"
        :disabled="busy"
        @click="mode = 'sign-in'"
      >
        Sign in
      </button>
      <button
        class="todo-filter"
        type="button"
        :aria-pressed="mode === 'sign-up'"
        :class="{ 'todo-filter--selected': mode === 'sign-up' }"
        :disabled="busy"
        @click="mode = 'sign-up'"
      >
        Register
      </button>
    </div>
    <form class="auth-form" @submit.prevent="emit('submit', mode, email, password)">
      <fieldset class="auth-form__fields" :disabled="busy || !configured">
        <label for="account-email">Email</label>
        <input
          id="account-email"
          v-model="email"
          class="todo-form__input"
          type="email"
          autocomplete="email"
          required
        />
        <label for="account-password">Password</label>
        <input
          id="account-password"
          v-model="password"
          class="todo-form__input"
          type="password"
          :autocomplete="mode === 'sign-up' ? 'new-password' : 'current-password'"
          :minlength="mode === 'sign-up' ? 8 : undefined"
          required
          :aria-describedby="mode === 'sign-up' ? 'password-hint' : undefined"
        />
        <p v-if="mode === 'sign-up'" id="password-hint" class="auth-panel__intro">
          Use at least 8 characters.
        </p>
        <button class="button button--primary" type="submit">
          {{ busy ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : 'Sign in' }}
        </button>
      </fieldset>
    </form>
    <p v-if="error" class="account-message account-message--error" role="alert">{{ error }}</p>
    <p v-if="notice" class="account-message" role="status">{{ notice }}</p>
  </section>
</template>
