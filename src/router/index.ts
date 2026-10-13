import { createRouter, createWebHashHistory } from 'vue-router'
import TodoWorkspace from '@/components/TodoWorkspace.vue'

// Hash history works on GitHub Pages, which has no fallback for unknown paths.
export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'tasks', component: TodoWorkspace },
    { path: '/notes', name: 'notes', component: () => import('@/components/NotesPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
