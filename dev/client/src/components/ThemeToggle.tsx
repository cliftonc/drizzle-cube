import { useEffect, useState } from 'react'
import { getTheme, setTheme, watchThemeChanges, type Theme, getIcon } from '@drizzle-cube/client'

const SunIcon = getIcon('sun')
const MoonIcon = getIcon('moon')
const SparklesIcon = getIcon('sparkles')

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')

  useEffect(() => {
    // Initialize theme state
    setCurrentTheme(getTheme())

    // Watch for theme changes from other sources
    const unwatch = watchThemeChanges((theme) => {
      setCurrentTheme(theme)
    })

    return unwatch
  }, [])

  const cycleTheme = () => {
    // Cycle through: light → dark → neon → light
    let nextTheme: Theme
    if (currentTheme === 'light') {
      nextTheme = 'dark'
    } else if (currentTheme === 'dark') {
      nextTheme = 'neon'
    } else {
      nextTheme = 'light'
    }

    setTheme(nextTheme)
    setCurrentTheme(nextTheme)
  }

  const getIcon = () => {
    switch (currentTheme) {
      case 'light':
        return <MoonIcon className="w-5 h-5" aria-hidden="true" />
      case 'dark':
        return <SparklesIcon className="w-5 h-5" aria-hidden="true" />
      case 'neon':
        return <SunIcon className="w-5 h-5" aria-hidden="true" />
      default:
        return <MoonIcon className="w-5 h-5" aria-hidden="true" />
    }
  }

  const getLabel = () => {
    switch (currentTheme) {
      case 'light':
        return 'Switch to dark mode'
      case 'dark':
        return 'Switch to neon mode'
      case 'neon':
        return 'Switch to light mode'
      default:
        return 'Switch theme'
    }
  }

  return (
    <button
      onClick={cycleTheme}
      className={`inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors ${className}`}
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  )
}
