import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import NoteList from '@/components/NoteList.vue'
import { formatNoteDate, type Note } from '@/types/note'

const titled: Note = {
  id: 'note-1',
  tabId: null,
  title: 'Groceries',
  content: 'Milk',
  createdAt: '2026-10-14T10:00:00.000Z',
  position: 1,
}
const untitled: Note = { ...titled, id: 'note-2', title: '', position: 2 }

function threeNotes() {
  return ['Alpha', 'Beta', 'Gamma'].map((title, index) => ({
    ...titled,
    id: title.toLowerCase(),
    title,
    position: index + 1,
  }))
}

// Mounts the list with a parent that applies each reorder, as the notes page does.
function mountReorderable(notes: Note[]) {
  const reorders: [string, string | null][] = []
  let current = notes
  const wrapper: VueWrapper = mount(NoteList, {
    attachTo: document.body,
    props: {
      notes,
      idPrefix: 'n',
      onReorder(id: string, afterId: string | null) {
        reorders.push([id, afterId])
        const others = current.filter((note) => note.id !== id)
        const moved = current.find((note) => note.id === id)
        if (!moved) return
        others.splice(
          afterId === null ? 0 : others.findIndex((n) => n.id === afterId) + 1,
          0,
          moved,
        )
        current = others
        void wrapper.setProps({ notes: others })
      },
    },
  })
  return { wrapper, reorders }
}

// jsdom has no PointerEvent; the list reads only the fields that MouseEvent also has.
async function pointer(
  target: DOMWrapper<Element> | undefined,
  type: string,
  init: MouseEventInit,
) {
  target?.element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }))
  await nextTick()
}

// Rows are 40px high, 50px apart in the page, and move up as the page scrolls.
function stubRows(wrapper: VueWrapper) {
  wrapper.findAll('li').forEach((row, index) => {
    vi.spyOn(row.element, 'getBoundingClientRect').mockImplementation(() =>
      DOMRect.fromRect({ x: 0, y: index * 50 - window.scrollY, width: 300, height: 40 }),
    )
  })
}

// A window of the given height whose page can scroll down by maxScroll pixels.
// Animation frames run only when the test calls runFrame.
function stubWindowScroll(innerHeight: number, maxScroll: number) {
  const frames = new Map<number, FrameRequestCallback>()
  let nextFrame = 0
  vi.stubGlobal('innerHeight', innerHeight)
  vi.stubGlobal('scrollY', 0)
  const scrollBy = vi.fn<(x: number, y: number) => void>((_x, y) => {
    vi.stubGlobal('scrollY', Math.min(Math.max(window.scrollY + y, 0), maxScroll))
    window.dispatchEvent(new Event('scroll'))
  })
  vi.stubGlobal('scrollBy', scrollBy)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    nextFrame += 1
    frames.set(nextFrame, callback)
    return nextFrame
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  return {
    scrollBy,
    pendingFrames: () => frames.size,
    async runFrame() {
      const [id, callback] = [...frames][0] ?? []
      if (id === undefined || !callback) throw new Error('Expected a pending animation frame')
      frames.delete(id)
      callback(0)
      await nextTick()
    },
  }
}

beforeAll(() => {
  // jsdom does not implement pointer capture.
  Element.prototype.setPointerCapture = () => undefined
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('NoteList', () => {
  it('shows titles or a placeholder with the local creation date', async () => {
    const wrapper = mount(NoteList, { props: { notes: [titled, untitled], idPrefix: 'n' } })
    const items = wrapper.findAll('.note-list__item')
    expect(items[0]?.attributes('id')).toBe('n-note-1')
    expect(items[0]?.get('.note-list__title').text()).toBe('Groceries')
    expect(items[1]?.get('.note-list__title').text()).toBe('Untitled note')
    const date = items[0]?.get('time')
    expect(date?.attributes('datetime')).toBe(titled.createdAt)
    expect(date?.text()).toBe(formatNoteDate(titled.createdAt))
    await items[1]?.trigger('click')
    expect(wrapper.emitted('open')).toEqual([['note-2']])
  })

  it('shows an empty state for a tab without notes', () => {
    const wrapper = mount(NoteList, { props: { notes: [], idPrefix: 'n' } })
    expect(wrapper.text()).toBe('No notes in this tab yet.')
  })

  it('moves a note with the Move up and Move down buttons and announces it', async () => {
    const { wrapper, reorders } = mountReorderable(threeNotes())
    const button = (name: string) => wrapper.get(`button[aria-label="${name}"]`)

    expect(button('Move up: Alpha').attributes('aria-disabled')).toBe('true')
    expect(button('Move down: Gamma').attributes('aria-disabled')).toBe('true')
    await button('Move up: Alpha').trigger('click')
    await button('Move down: Gamma').trigger('click')
    expect(reorders).toEqual([])

    await button('Move down: Alpha').trigger('click')
    await vi.waitFor(() => expect(reorders).toEqual([['alpha', 'beta']]))
    await vi.waitFor(() =>
      expect(wrapper.get('[aria-live="polite"]').text()).toBe('Moved Alpha to position 2 of 3.'),
    )
    expect(wrapper.findAll('.note-list__title').map((title) => title.text())).toEqual([
      'Beta',
      'Alpha',
      'Gamma',
    ])
    expect(document.activeElement?.id).toBe('n-alpha-down')

    await button('Move up: Alpha').trigger('click')
    await vi.waitFor(() => expect(reorders[1]).toEqual(['alpha', null]))
  })

  it('drops a dragged note between the rows it was released over', async () => {
    const { wrapper, reorders } = mountReorderable(threeNotes())
    stubRows(wrapper)
    const handle = wrapper.findAll('.note-list__handle')[2]
    const rows = () => wrapper.findAll('li')

    await pointer(handle, 'pointerdown', { button: 0, clientY: 120 })
    await pointer(handle, 'pointermove', { clientY: 10 })
    expect(rows()[2]?.classes()).toContain('note-list__row--dragging')
    expect(rows()[2]?.attributes('style')).toContain('translateY(-110px)')
    expect(rows()[0]?.classes()).toContain('note-list__row--drop-before')
    await pointer(handle, 'pointerup', { clientY: 10 })

    expect(reorders).toEqual([['gamma', null]])
    expect(rows()[0]?.classes()).not.toContain('note-list__row--drop-before')
  })

  it('scrolls the page while a dragged note is held near the window edge', async () => {
    const page = stubWindowScroll(120, 40)
    const { wrapper, reorders } = mountReorderable(threeNotes())
    stubRows(wrapper)
    const handle = wrapper.findAll('.note-list__handle')[0]
    const rows = () => wrapper.findAll('li')

    await pointer(handle, 'pointerdown', { button: 0, clientY: 20 })
    await pointer(handle, 'pointermove', { clientY: 60 })
    expect(page.pendingFrames()).toBe(0)
    // Scrolling with the mouse wheel keeps the dragged row under the pointer too.
    vi.stubGlobal('scrollY', 10)
    window.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(rows()[0]?.attributes('style')).toContain('translateY(50px)')
    vi.stubGlobal('scrollY', 0)
    await pointer(handle, 'pointermove', { clientY: 115 })
    expect(page.pendingFrames()).toBe(1)
    await page.runFrame()
    expect(page.scrollBy).toHaveBeenLastCalledWith(0, 17)
    expect(rows()[0]?.attributes('style')).toContain('translateY(112px)')
    await page.runFrame()
    await page.runFrame()
    // The fourth frame finds the end of the page and stops scrolling.
    await page.runFrame()
    expect(window.scrollY).toBe(40)
    expect(page.scrollBy).toHaveBeenCalledTimes(4)
    expect(page.pendingFrames()).toBe(0)
    expect(rows()[0]?.attributes('style')).toContain('translateY(135px)')
    expect(rows()[2]?.classes()).toContain('note-list__row--drop-after')

    await pointer(handle, 'pointermove', { clientY: 5 })
    expect(page.pendingFrames()).toBe(1)
    await pointer(handle, 'pointerup', { clientY: 115 })
    expect(page.pendingFrames()).toBe(0)
    expect(reorders).toEqual([['alpha', 'gamma']])
  })

  it('ignores a drag that is cancelled or ends where it started', async () => {
    const { wrapper, reorders } = mountReorderable(threeNotes())
    stubRows(wrapper)
    const handle = wrapper.findAll('.note-list__handle')[0]

    await pointer(handle, 'pointerdown', { button: 0, clientY: 20 })
    await pointer(handle, 'pointermove', { clientY: 130 })
    expect(wrapper.findAll('li')[2]?.classes()).toContain('note-list__row--drop-after')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('.note-list__row--dragging').exists()).toBe(false)
    await pointer(handle, 'pointerup', { clientY: 130 })

    await pointer(handle, 'pointerdown', { button: 0, clientY: 20 })
    await pointer(handle, 'pointerup', { clientY: 30 })
    await pointer(handle, 'pointerdown', { button: 2, clientY: 20 })
    await pointer(handle, 'pointerup', { clientY: 130 })
    expect(reorders).toEqual([])
  })
})
