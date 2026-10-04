import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { applyTheme, readThemePreference, THEME_STORAGE_KEY } from '@/apis/theme.js'

const useTheme = () => {
  const [preference, setPreference] = useState(readThemePreference)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const isDarkMode = preference === 'dark' || (preference === null && systemDark)

  useLayoutEffect(() => {
    applyTheme(isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = (event) => setSystemDark(event.matches)
    const handleStorageChange = (event) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) setPreference(readThemePreference())
    }
    mediaQuery.addEventListener('change', handleSystemChange)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const nextTheme = isDarkMode ? 'light' : 'dark'
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // The switch still works when browser storage is unavailable.
    }
    setPreference(nextTheme)
  }, [isDarkMode])

  return { isDarkMode, toggleTheme }
}

export default useTheme
