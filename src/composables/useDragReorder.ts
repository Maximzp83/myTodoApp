import { onBeforeUnmount, ref, type ShallowRef } from 'vue'

// Where the dragged row would land: before a row, or after the last one.
export interface DropTarget {
  id: string
  edge: 'before' | 'after'
}

// Near the top or bottom edge of the window, dragging scrolls the page.
const SCROLL_EDGE = 60
// Pixels per frame when the pointer is at the edge; the speed falls to zero at SCROLL_EDGE.
const MAX_SCROLL_STEP = 18

function scrollStep(clientY: number) {
  const fromTop = clientY
  const fromBottom = window.innerHeight - clientY
  if (fromTop < SCROLL_EDGE)
    return -Math.ceil(MAX_SCROLL_STEP * (1 - Math.max(fromTop, 0) / SCROLL_EDGE))
  if (fromBottom < SCROLL_EDGE)
    return Math.ceil(MAX_SCROLL_STEP * (1 - Math.max(fromBottom, 0) / SCROLL_EDGE))
  return 0
}

/**
 * Reorders the rows of a list by dragging a handle. Rows are the list's children with a
 * `data-reorder-id` attribute. Pointer events cover mouse, touch, and pen. The dragged row
 * follows the pointer while the other rows stay in place; Escape cancels the drag.
 * Holding the pointer near the top or bottom of the window scrolls the page.
 */
export function useDragReorder(
  list: Readonly<ShallowRef<HTMLElement | null>>,
  onDrop: (id: string, index: number) => void,
) {
  const draggingId = ref<string | null>(null)
  const offset = ref(0)
  const dropTarget = ref<DropTarget | null>(null)
  // The pointer's latest position in the window and its start position in the page.
  let pointerY = 0
  let startPageY = 0
  let startIndex = -1
  let dropIndex = -1
  let scrollFrame = 0

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
    window.cancelAnimationFrame(scrollFrame)
    scrollFrame = 0
    window.removeEventListener('keydown', cancelOnEscape)
    window.removeEventListener('scroll', update)
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
    pointerY = event.clientY
    startPageY = event.clientY + window.scrollY
    startIndex = rows().findIndex((row) => row.dataset.reorderId === id)
    dropIndex = startIndex
    draggingId.value = id
    window.addEventListener('keydown', cancelOnEscape)
    // Scrolling moves the rows under a still pointer, by the edge or by the mouse wheel.
    window.addEventListener('scroll', update, { passive: true })
  }

  function update() {
    const id = draggingId.value
    if (id === null) return
    // The row scrolls with the page, so its offset includes how far the page has scrolled.
    offset.value = pointerY + window.scrollY - startPageY
    // The other rows do not move during the drag, so their midpoints give the drop index.
    const others = rows().filter((row) => row.dataset.reorderId !== id)
    dropIndex = others.filter((row) => {
      const rect = row.getBoundingClientRect()
      return rect.top + rect.height / 2 < pointerY
    }).length
    const before = others[dropIndex]?.dataset.reorderId
    const last = others[others.length - 1]?.dataset.reorderId
    if (dropIndex === startIndex) dropTarget.value = null
    else if (before !== undefined) dropTarget.value = { id: before, edge: 'before' }
    else if (last !== undefined) dropTarget.value = { id: last, edge: 'after' }
  }

  // Runs once per frame while the pointer stays near an edge and the page can still scroll.
  function scrollNearEdge() {
    scrollFrame = 0
    const step = scrollStep(pointerY)
    if (draggingId.value === null || step === 0) return
    const scrolled = window.scrollY
    window.scrollBy(0, step)
    if (window.scrollY === scrolled) return
    update()
    scrollFrame = window.requestAnimationFrame(scrollNearEdge)
  }

  function move(event: PointerEvent) {
    if (draggingId.value === null) return
    pointerY = event.clientY
    update()
    if (scrollFrame === 0 && scrollStep(pointerY) !== 0)
      scrollFrame = window.requestAnimationFrame(scrollNearEdge)
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
