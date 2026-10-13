import { onScopeDispose, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

// Asks before unsaved changes are discarded by leaving the page or the route.
export function useUnsavedChanges(dirty: Ref<boolean>) {
  function confirmDiscard() {
    return !dirty.value || window.confirm('Discard unsaved changes?')
  }

  function warnBeforeUnload(event: BeforeUnloadEvent) {
    if (dirty.value) event.preventDefault()
  }

  window.addEventListener('beforeunload', warnBeforeUnload)
  onScopeDispose(() => window.removeEventListener('beforeunload', warnBeforeUnload))
  onBeforeRouteLeave(confirmDiscard)

  return { confirmDiscard }
}
