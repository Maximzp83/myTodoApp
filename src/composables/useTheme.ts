import { ref, watch } from 'vue'
import { loadTheme, saveTheme, Theme } from '@/services/themeStorage'

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export function useTheme() {
  const theme = ref(loadTheme())

  applyTheme(theme.value)

  watch(theme, (newTheme) => {
    applyTheme(newTheme)
    saveTheme(newTheme)
  })

  function toggleTheme() {
    theme.value = theme.value === Theme.Light ? Theme.Dark : Theme.Light
  }

  return { theme, toggleTheme }
}
