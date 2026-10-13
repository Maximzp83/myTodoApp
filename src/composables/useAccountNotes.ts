import { watch, type Ref } from 'vue'
import { useNotesStore } from '@/stores/notes'
import type { AccountUser } from '@/types/auth'

export function useAccountNotes(user: Ref<AccountUser | null>) {
  const notesStore = useNotesStore()
  watch(
    () => user.value?.id ?? null,
    (id) => {
      notesStore.setAccount(id)
      if (id) void notesStore.refresh()
    },
    { immediate: true },
  )
}
