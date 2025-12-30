/**
 * useTheme - External Theme State Hook
 *
 * Uses React 18's useSyncExternalStore to prevent parent component re-renders.
 * The theme state is stored externally and changes are propagated through
 * a subscribe/notify pattern.
 *
 * This prevents the ThemeToggle component from causing Layout re-renders.
 */

import { useSyncExternalStore, useCallback } from 'react'
import { getTheme, setTheme as setThemeUtil, watchThemeChanges, type Theme } from '../theme'

// External store for theme state
const themeStore = {
  listeners: new Set<() => void>(),

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  },

  notify() {
    this.listeners.forEach(listener => listener())
  }
}

// Watch theme changes from DOM/system and notify subscribers
watchThemeChanges(() => {
  themeStore.notify()
})

/**
 * Hook to access and update theme
 *
 * Returns current theme and a setter function.
 * Only components using this hook will re-render on theme changes.
 */
export function useTheme() {
  // Subscribe to external theme store
  const theme = useSyncExternalStore(
    themeStore.subscribe.bind(themeStore),
    getTheme,      // Client-side snapshot
    getTheme       // Server-side snapshot (SSR)
  )

  // Stable setter function
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeUtil(newTheme)
    themeStore.notify()
  }, [])

  return { theme, setTheme }
}
