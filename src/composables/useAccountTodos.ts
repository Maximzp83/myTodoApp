import { watch, type Ref } from 'vue'
import { useTodoStore } from '@/stores/todo'
import type { AccountUser } from '@/types/auth'

export function useAccountTodos(user: Ref<AccountUser | null>) {
  const todoStore = useTodoStore()
  watch(
    () => user.value?.id ?? null,
    (id) => {
      todoStore.setAccount(id)
      if (id) void todoStore.refresh()
    },
    { immediate: true },
  )
}
