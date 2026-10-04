export const THEME_STORAGE_KEY = 'flfc-theme'

export const readThemePreference = () => {
  try {
    const preference = window.localStorage.getItem(THEME_STORAGE_KEY)
    return preference === 'light' || preference === 'dark' ? preference : null
  } catch {
    return null
  }
}

export const applyTheme = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const initializeTheme = () => {
  const theme = readThemePreference()
    ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  applyTheme(theme)
}
