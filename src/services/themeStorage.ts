export const Theme = {
  Light: 'light',
  Dark: 'dark',
} as const

export type Theme = (typeof Theme)[keyof typeof Theme]

const STORAGE_KEY = 'vue-ts-todo.theme'

export function loadTheme(): Theme {
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEY)

    return storedTheme === Theme.Dark ? Theme.Dark : Theme.Light
  } catch {
    return Theme.Light
  }
}

export function saveTheme(theme: Theme): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
    return true
  } catch {
    return false
  }
}
