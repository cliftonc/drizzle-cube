/**
 * Theme utilities and TypeScript types for drizzle-cube theming system
 */

/**
 * Semantic color tokens used throughout drizzle-cube components
 */
export interface ThemeColorTokens {
  // Surface colors
  surface: string
  surfaceSecondary: string
  surfaceTertiary: string
  surfaceHover: string

  // Text colors
  text: string
  textSecondary: string
  textMuted: string
  textDisabled: string

  // Border colors
  border: string
  borderSecondary: string
  borderHover: string

  // Primary colors
  primary: string
  primaryHover: string
  primaryContent: string

  // Semantic state colors
  success: string
  successBg: string
  successBorder: string

  warning: string
  warningBg: string
  warningBorder: string

  error: string
  errorBg: string
  errorBorder: string

  info: string
  infoBg: string
  infoBorder: string

  // Danger colors
  danger: string
  dangerHover: string
  dangerBg: string

  // Overlay colors
  overlay: string
  overlayLight: string
}

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
  name: string
  colors: Partial<ThemeColorTokens>
}

/**
 * Get the current value of a theme CSS variable
 */
export function getThemeVariable(variableName: string): string {
  if (typeof window === 'undefined') return ''

  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--dc-${variableName}`)
    .trim()
}

/**
 * Set a theme CSS variable
 */
export function setThemeVariable(variableName: string, value: string): void {
  if (typeof window === 'undefined') return

  document.documentElement.style.setProperty(`--dc-${variableName}`, value)
}

/**
 * Apply a complete theme configuration
 */
export function applyTheme(theme: ThemeConfig): void {
  if (typeof window === 'undefined') return

  Object.entries(theme.colors).forEach(([key, value]) => {
    if (value) {
      // Convert camelCase to kebab-case
      const cssVarName = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
      setThemeVariable(cssVarName, value)
    }
  })
}

/**
 * Reset theme to defaults by removing custom properties
 */
export function resetTheme(): void {
  if (typeof window === 'undefined') return

  const styleElement = document.documentElement.style
  const properties = Array.from(styleElement)

  properties.forEach(prop => {
    if (prop.startsWith('--dc-')) {
      styleElement.removeProperty(prop)
    }
  })
}

/**
 * Theme type definition
 */
export type Theme = 'light' | 'dark' | 'neon'

/**
 * Get the current theme
 */
export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  // Check localStorage first
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'neon' || stored === 'light') {
    return stored
  }

  // Check for data-theme attribute
  const dataTheme = document.documentElement.getAttribute('data-theme')
  if (dataTheme === 'dark' || dataTheme === 'neon') {
    return dataTheme
  }

  // Check for dark class
  if (document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark')) {
    return 'dark'
  }

  // Check for neon class
  if (document.documentElement.classList.contains('neon') ||
      document.body.classList.contains('neon')) {
    return 'neon'
  }

  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

/**
 * Set the theme
 */
export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') return

  // Remove all theme classes
  document.documentElement.classList.remove('dark', 'neon')

  // Set data-theme attribute
  document.documentElement.setAttribute('data-theme', theme)

  // Add appropriate class for backwards compatibility
  if (theme === 'dark' || theme === 'neon') {
    document.documentElement.classList.add(theme)
  }

  // Persist to localStorage
  localStorage.setItem('theme', theme)
}

/**
 * Detect if dark mode is currently active (backwards compatibility)
 * @deprecated Use getTheme() instead
 */
export function isDarkMode(): boolean {
  const theme = getTheme()
  return theme === 'dark' || theme === 'neon'
}

/**
 * Watch for theme changes
 */
export function watchThemeChanges(callback: (theme: Theme) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  // Watch for class changes on html element
  const observer = new MutationObserver(() => {
    callback(getTheme())
  })

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme']
  })

  // Watch for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const mediaListener = () => callback(getTheme())
  mediaQuery.addEventListener('change', mediaListener)

  // Return cleanup function
  return () => {
    observer.disconnect()
    mediaQuery.removeEventListener('change', mediaListener)
  }
}

/**
 * Example theme configurations
 */
export const THEME_PRESETS = {
  light: {
    name: 'light' as const,
    colors: {
      surface: '#ffffff',
      surfaceSecondary: '#f9fafb',
      text: '#111827',
      textSecondary: '#374151',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      primary: '#3b82f6',
      primaryHover: '#2563eb',
    }
  },
  dark: {
    name: 'dark' as const,
    colors: {
      surface: '#1e293b',
      surfaceSecondary: '#334155',
      text: '#f1f5f9',
      textSecondary: '#e2e8f0',
      textMuted: '#cbd5e1',
      border: '#475569',
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
    }
  },
  neon: {
    name: 'neon' as const,
    colors: {
      surface: '#0a0118',
      surfaceSecondary: '#1a0f2e',
      surfaceTertiary: '#2a1f3e',
      text: '#ffffff',
      textSecondary: '#e0e0ff',
      textMuted: '#b0b0d0',
      border: '#ff00ff',
      borderSecondary: '#00ffff',
      primary: '#00ffff',
      primaryHover: '#00cccc',
      primaryContent: '#000000',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0066',
      info: '#00ffff',
      danger: '#ff1493',
    }
  }
} as const
