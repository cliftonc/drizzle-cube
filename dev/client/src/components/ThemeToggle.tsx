import { useEffect, useState } from 'react'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { isDarkMode, watchThemeChanges } from '@drizzle-cube/client'

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Initialize theme state
    setIsDark(isDarkMode())

    // Watch for theme changes from other sources
    const unwatch = watchThemeChanges((darkMode) => {
      setIsDark(darkMode)
    })

    return unwatch
  }, [])

  const toggleTheme = () => {
    const newDarkMode = !isDark

    // Toggle dark class on html element
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Persist to localStorage
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')

    setIsDark(newDarkMode)
  }

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <SunIcon className="w-5 h-5" aria-hidden="true" />
      ) : (
        <MoonIcon className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  )
}
