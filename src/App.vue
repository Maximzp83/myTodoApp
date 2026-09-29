<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AuthPanel from '@/components/AuthPanel.vue'
import TodoWorkspace from '@/components/TodoWorkspace.vue'
import { useTheme } from '@/composables/useTheme'
import { useAccountTodos } from '@/composables/useAccountTodos'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { theme, toggleTheme } = useTheme()
useAccountTodos(user)
onMounted(() => {
  void authStore.initialize()
})
</script>

<template>
  <main class="app-shell">
    <section class="todo-card" aria-labelledby="todo-heading">
      <header class="todo-header">
        <div class="todo-header__top">
          <h1 id="todo-heading">My Todos</h1>
          <button
            class="button button--theme"
            type="button"
            :aria-label="theme === 'light' ? 'Enable dark theme' : 'Enable light theme'"
            @click="toggleTheme"
          >
            {{ theme === 'light' ? 'Dark theme' : 'Light theme' }}
          </button>
        </div>
        <p class="todo-header__intro">A simple place to capture tasks and keep moving.</p>
      </header>
      <p v-if="!authStore.initialized" class="account-message" role="status">
        Restoring your session…
      </p>
      <TodoWorkspace
        v-else-if="user"
        :key="user.id"
        :user="user"
        :account-busy="authStore.busy"
        :auth-error="authStore.error"
        @logout="authStore.logout"
      />
      <AuthPanel
        v-else
        :busy="authStore.busy"
        :configured="authStore.configured"
        :error="authStore.error"
        :notice="authStore.notice"
        @submit="authStore.authenticate"
      />
    </section>
  </main>
</template>
