import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadTheme, saveTheme, Theme } from '@/services/themeStorage'

describe('themeStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the light theme when no saved theme exists', () => {
    expect(loadTheme()).toBe(Theme.Light)
  })

  it('saves and loads the dark theme', () => {
    expect(saveTheme(Theme.Dark)).toBe(true)

    expect(loadTheme()).toBe(Theme.Dark)
  })

  it('uses the light theme for an unrecognised saved value', () => {
    localStorage.setItem('vue-ts-todo.theme', 'midnight')

    expect(loadTheme()).toBe(Theme.Light)
  })

  it('uses the light theme when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable')
    })

    expect(loadTheme()).toBe(Theme.Light)
  })

  it('reports when storage cannot save the theme', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable')
    })

    expect(saveTheme(Theme.Dark)).toBe(false)
  })
})
