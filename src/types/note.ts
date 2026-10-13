export const MAX_NOTE_LENGTH = 10000

export interface Note {
  id: string
  body: string
  createdAt: string
}

export function notePreview(body: string) {
  return (
    body
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? ''
  )
}
