export const MAX_NOTE_TITLE_LENGTH = 120
export const MAX_NOTE_CONTENT_LENGTH = 10000
export const MAX_NOTE_TAB_NAME_LENGTH = 50
export const DEFAULT_NOTE_TAB_NAME = 'General'

export interface NoteTab {
  id: string
  name: string
}

// null is the built-in General tab, which cannot be renamed or deleted.
export type NoteTabId = string | null

export interface Note {
  id: string
  tabId: NoteTabId
  title: string
  content: string
  createdAt: string
  // The account's own order of notes: a smaller position comes first.
  position: number
}

// The same order the database uses: position, then newest first.
export function compareNoteOrder(a: Note, b: Note) {
  return (
    a.position - b.position ||
    Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
    b.id.localeCompare(a.id)
  )
}

export interface NoteDraft {
  tabId: NoteTabId
  title: string
  content: string
}

const noteDateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function formatNoteDate(createdAt: string) {
  return noteDateFormat.format(new Date(createdAt))
}
