import { onBeforeUnmount, ref, type ShallowRef } from 'vue'

// Where the dragged row would land: before a row, or after the last one.
export interface DropTarget {
  id: string
  edge: 'before' | 'after'
}

/**
 * Reorders the rows of a list by dragging a handle. Rows are the list's children with a
 * `data-reorder-id` attribute. Pointer events cover mouse, touch, and pen. The dragged row
 * follows the pointer while the other rows stay in place; Escape cancels the drag.
 */
export function useDragReorder(
  list: Readonly<ShallowRef<HTMLElement | null>>,
  onDrop: (id: string, index: number) => void,
) {
  const draggingId = ref<string | null>(null)
  const offset = ref(0)
  const dropTarget = ref<DropTarget | null>(null)
  let startY = 0
  let startIndex = -1
  let dropIndex = -1

  function rows() {
    return Array.from(list.value?.children ?? []).filter(
      (row): row is HTMLElement =>
        row instanceof HTMLElement && row.dataset.reorderId !== undefined,
    )
  }

  function stop() {
    draggingId.value = null
    dropTarget.value = null
    offset.value = 0
    window.removeEventListener('keydown', cancelOnEscape)
  }

  function cancelOnEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    event.preventDefault()
    stop()
  }

  function start(event: PointerEvent, id: string) {
    if (draggingId.value !== null || event.button !== 0) return
    if (!(event.currentTarget instanceof Element)) return
    // Keeps the page from selecting text or scrolling, and sends the next events to the handle.
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    startY = event.clientY
    startIndex = rows().findIndex((row) => row.dataset.reorderId === id)
    dropIndex = startIndex
    draggingId.value = id
    window.addEventListener('keydown', cancelOnEscape)
  }

  function move(event: PointerEvent) {
    const id = draggingId.value
    if (id === null) return
    offset.value = event.clientY - startY
    // The other rows do not move during the drag, so their midpoints give the drop index.
    const others = rows().filter((row) => row.dataset.reorderId !== id)
    dropIndex = others.filter((row) => {
      const rect = row.getBoundingClientRect()
      return rect.top + rect.height / 2 < event.clientY
    }).length
    const before = others[dropIndex]?.dataset.reorderId
    const last = others[others.length - 1]?.dataset.reorderId
    if (dropIndex === startIndex) dropTarget.value = null
    else if (before !== undefined) dropTarget.value = { id: before, edge: 'before' }
    else if (last !== undefined) dropTarget.value = { id: last, edge: 'after' }
  }

  function finish(event: PointerEvent) {
    const id = draggingId.value
    if (id === null) return
    move(event)
    const changed = dropIndex !== startIndex
    stop()
    if (changed) onDrop(id, dropIndex)
  }

  onBeforeUnmount(stop)

  return { draggingId, offset, dropTarget, start, move, finish, cancel: stop }
}
