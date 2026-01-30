import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from '../../../src/client/hooks/useTheme'

/**
 * Tests for useTheme hook
 *
 * This hook uses React 18's useSyncExternalStore to manage theme state
 * externally, preventing parent component re-renders when theme changes.
 * It supports 'light', 'dark', and 'neon' themes.
 */
describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Clear localStorage theme
    localStorage.removeItem('theme')

    // Reset document state to light theme
    document.documentElement.classList.remove('dark', 'neon')
    document.documentElement.setAttribute('data-theme', 'light')
  })

  afterEach(() => {
    // Clean up
    localStorage.removeItem('theme')
    document.documentElement.classList.remove('dark', 'neon')
    document.documentElement.removeAttribute('data-theme')
  })

  describe('initial theme detection', () => {
    it('should return light theme by default', () => {
      const { result } = renderHook(() => useTheme())

      expect(result.current.theme).toBe('light')
    })

    it('should detect dark theme from class on documentElement', () => {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')

      const { result } = renderHook(() => useTheme())

      expect(result.current.theme).toBe('dark')
    })

    it('should detect neon theme from class on documentElement', () => {
      document.documentElement.classList.add('neon')
      document.documentElement.setAttribute('data-theme', 'neon')

      const { result } = renderHook(() => useTheme())

      expect(result.current.theme).toBe('neon')
    })

    it('should detect dark theme from data-theme attribute', () => {
      document.documentElement.setAttribute('data-theme', 'dark')

      const { result } = renderHook(() => useTheme())

      expect(result.current.theme).toBe('dark')
    })

    it('should detect neon theme from data-theme attribute', () => {
      document.documentElement.setAttribute('data-theme', 'neon')

      const { result } = renderHook(() => useTheme())

      expect(result.current.theme).toBe('neon')
    })
  })

  describe('setTheme function', () => {
    it('should return a setTheme function', () => {
      const { result } = renderHook(() => useTheme())

      expect(typeof result.current.setTheme).toBe('function')
    })

    it('should update theme to dark', () => {
      const { result } = renderHook(() => useTheme())

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should update theme to neon', () => {
      const { result } = renderHook(() => useTheme())

      act(() => {
        result.current.setTheme('neon')
      })

      expect(result.current.theme).toBe('neon')
    })

    it('should update theme to light from dark', () => {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')

      const { result } = renderHook(() => useTheme())

      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.theme).toBe('light')
    })

    it('should persist theme to localStorage', () => {
      const { result } = renderHook(() => useTheme())

      act(() => {
        result.current.setTheme('dark')
      })

      expect(localStorage.getItem('theme')).toBe('dark')
    })

    it('should set data-theme attribute on documentElement', () => {
      const { result } = renderHook(() => useTheme())

      act(() => {
        result.current.setTheme('neon')
      })

      expect(document.documentElement.getAttribute('data-theme')).toBe('neon')
    })

    it('should add appropriate class for dark theme', () => {
      const { result } = renderHook(() => useTheme())

      act(() => {
        result.current.setTheme('dark')
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should add appropriate class for neon theme', () => {
      const { result } = renderHook(() => useTheme())

      act(() => {
        result.current.setTheme('neon')
      })

      expect(document.documentElement.classList.contains('neon')).toBe(true)
    })

    it('should remove theme classes when setting light', () => {
      document.documentElement.classList.add('dark')

      const { result } = renderHook(() => useTheme())

      act(() => {
        result.current.setTheme('light')
      })

      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(document.documentElement.classList.contains('neon')).toBe(false)
    })
  })

  describe('setTheme stability', () => {
    it('should return stable setTheme function reference', () => {
      const { result, rerender } = renderHook(() => useTheme())

      const firstSetTheme = result.current.setTheme

      rerender()

      const secondSetTheme = result.current.setTheme

      expect(firstSetTheme).toBe(secondSetTheme)
    })
  })

  describe('theme cycling', () => {
    it('should cycle through themes correctly', () => {
      const { result } = renderHook(() => useTheme())

      expect(result.current.theme).toBe('light')

      act(() => {
        result.current.setTheme('dark')
      })
      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.setTheme('neon')
      })
      expect(result.current.theme).toBe('neon')

      act(() => {
        result.current.setTheme('light')
      })
      expect(result.current.theme).toBe('light')
    })
  })

  describe('multiple hook instances', () => {
    it('should sync theme across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useTheme())
      const { result: result2 } = renderHook(() => useTheme())

      expect(result1.current.theme).toBe(result2.current.theme)

      act(() => {
        result1.current.setTheme('dark')
      })

      // Both instances should reflect the change
      expect(result1.current.theme).toBe('dark')
      expect(result2.current.theme).toBe('dark')
    })
  })

  describe('return object structure', () => {
    it('should return object with theme and setTheme', () => {
      const { result } = renderHook(() => useTheme())

      expect(result.current).toHaveProperty('theme')
      expect(result.current).toHaveProperty('setTheme')
    })

    it('should have correct types', () => {
      const { result } = renderHook(() => useTheme())

      expect(['light', 'dark', 'neon']).toContain(result.current.theme)
      expect(typeof result.current.setTheme).toBe('function')
    })
  })

  describe('edge cases', () => {
    it('should handle rapid theme changes', () => {
      const { result } = renderHook(() => useTheme())

      act(() => {
        result.current.setTheme('dark')
        result.current.setTheme('neon')
        result.current.setTheme('light')
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should handle setting same theme multiple times', () => {
      const { result } = renderHook(() => useTheme())

      act(() => {
        result.current.setTheme('dark')
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
    })
  })

  describe('useSyncExternalStore integration', () => {
    it('should use useSyncExternalStore for state management', () => {
      // This test verifies the hook follows React 18 patterns
      const { result, rerender } = renderHook(() => useTheme())

      // Initial render
      expect(result.current.theme).toBeDefined()

      // Update theme
      act(() => {
        result.current.setTheme('dark')
      })

      // Re-render should reflect state
      rerender()
      expect(result.current.theme).toBe('dark')
    })
  })
})
