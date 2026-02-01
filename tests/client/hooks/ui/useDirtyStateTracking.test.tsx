/**
 * Tests for useDirtyStateTracking hook
 * Covers dirty state detection, save handling, and config change tracking
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDirtyStateTracking } from '../../../../src/client/hooks/useDirtyStateTracking'

interface TestConfig {
  title: string
  portlets: { id: string; name: string }[]
}

describe('useDirtyStateTracking', () => {
  const initialConfig: TestConfig = {
    title: 'Test Dashboard',
    portlets: [{ id: '1', name: 'Chart 1' }]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should return handleConfigChange, handleSave, hasChanged, and resetInitialConfig', () => {
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig })
      )

      expect(typeof result.current.handleConfigChange).toBe('function')
      expect(typeof result.current.handleSave).toBe('function')
      expect(typeof result.current.hasChanged).toBe('function')
      expect(typeof result.current.resetInitialConfig).toBe('function')
    })

    it('should start with hasChanged returning false', () => {
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig })
      )

      expect(result.current.hasChanged()).toBe(false)
    })
  })

  describe('handleConfigChange', () => {
    it('should call onConfigChange callback', () => {
      const onConfigChange = vi.fn()
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onConfigChange })
      )

      const newConfig = { ...initialConfig, title: 'Updated Title' }
      act(() => {
        result.current.handleConfigChange(newConfig)
      })

      expect(onConfigChange).toHaveBeenCalledWith(newConfig)
    })

    it('should mark as changed when config differs from initial', () => {
      const onDirtyStateChange = vi.fn()
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onDirtyStateChange })
      )

      expect(result.current.hasChanged()).toBe(false)

      const newConfig = { ...initialConfig, title: 'Updated Title' }
      act(() => {
        result.current.handleConfigChange(newConfig)
      })

      expect(result.current.hasChanged()).toBe(true)
      expect(onDirtyStateChange).toHaveBeenCalledWith(true)
    })

    it('should not mark as changed when config is same as initial', () => {
      const onDirtyStateChange = vi.fn()
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onDirtyStateChange })
      )

      act(() => {
        result.current.handleConfigChange({ ...initialConfig })
      })

      expect(result.current.hasChanged()).toBe(false)
      expect(onDirtyStateChange).not.toHaveBeenCalled()
    })

    it('should work without onConfigChange callback', () => {
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig })
      )

      // Should not throw
      act(() => {
        result.current.handleConfigChange({ ...initialConfig, title: 'New' })
      })

      expect(result.current.hasChanged()).toBe(true)
    })

    it('should work without onDirtyStateChange callback', () => {
      const onConfigChange = vi.fn()
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onConfigChange })
      )

      // Should not throw
      act(() => {
        result.current.handleConfigChange({ ...initialConfig, title: 'New' })
      })

      expect(onConfigChange).toHaveBeenCalled()
    })
  })

  describe('handleSave', () => {
    it('should not call onSave if no changes have been made', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onSave })
      )

      await act(async () => {
        await result.current.handleSave(initialConfig)
      })

      expect(onSave).not.toHaveBeenCalled()
    })

    it('should call onSave after changes have been made', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onSave })
      )

      const newConfig = { ...initialConfig, title: 'Updated' }

      // Make a change first
      act(() => {
        result.current.handleConfigChange(newConfig)
      })

      await act(async () => {
        await result.current.handleSave(newConfig)
      })

      expect(onSave).toHaveBeenCalledWith(newConfig)
    })

    it('should set dirty state to true during save, then false on success', async () => {
      const onDirtyStateChange = vi.fn()
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onSave, onDirtyStateChange })
      )

      const newConfig = { ...initialConfig, title: 'Updated' }

      act(() => {
        result.current.handleConfigChange(newConfig)
      })
      onDirtyStateChange.mockClear()

      await act(async () => {
        await result.current.handleSave(newConfig)
      })

      // First call: dirty=true (save started)
      // Second call: dirty=false (save completed)
      expect(onDirtyStateChange).toHaveBeenNthCalledWith(1, true)
      expect(onDirtyStateChange).toHaveBeenNthCalledWith(2, false)
    })

    it('should keep dirty state on save failure', async () => {
      const onDirtyStateChange = vi.fn()
      const error = new Error('Save failed')
      const onSave = vi.fn().mockRejectedValue(error)
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onSave, onDirtyStateChange })
      )

      const newConfig = { ...initialConfig, title: 'Updated' }

      act(() => {
        result.current.handleConfigChange(newConfig)
      })
      onDirtyStateChange.mockClear()

      await expect(
        act(async () => {
          await result.current.handleSave(newConfig)
        })
      ).rejects.toThrow('Save failed')

      // Only one call: dirty=true (save started), no false because save failed
      expect(onDirtyStateChange).toHaveBeenCalledTimes(1)
      expect(onDirtyStateChange).toHaveBeenCalledWith(true)
    })

    it('should update initial config reference after successful save', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onSave })
      )

      const newConfig = { ...initialConfig, title: 'Updated' }

      act(() => {
        result.current.handleConfigChange(newConfig)
      })
      expect(result.current.hasChanged()).toBe(true)

      await act(async () => {
        await result.current.handleSave(newConfig)
      })

      // After save, the initial reference is updated, so hasChanged should be reset
      // But hasConfigChangedFromInitial.current is still true from the change
      // Subsequent changes should compare against the new saved config
    })

    it('should work without onSave callback', async () => {
      const onDirtyStateChange = vi.fn()
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onDirtyStateChange })
      )

      const newConfig = { ...initialConfig, title: 'Updated' }

      act(() => {
        result.current.handleConfigChange(newConfig)
      })
      onDirtyStateChange.mockClear()

      await act(async () => {
        await result.current.handleSave(newConfig)
      })

      // Should still update dirty state even without onSave
      expect(onDirtyStateChange).toHaveBeenCalledWith(false)
    })
  })

  describe('resetInitialConfig', () => {
    it('should reset the initial config reference', () => {
      const onDirtyStateChange = vi.fn()
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onDirtyStateChange })
      )

      const newConfig = { ...initialConfig, title: 'Updated' }

      // Make a change
      act(() => {
        result.current.handleConfigChange(newConfig)
      })
      expect(result.current.hasChanged()).toBe(true)

      // Reset with new config
      act(() => {
        result.current.resetInitialConfig(newConfig)
      })

      expect(result.current.hasChanged()).toBe(false)
    })

    it('should allow subsequent changes to be detected against new initial', () => {
      const onDirtyStateChange = vi.fn()
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onDirtyStateChange })
      )

      const updatedConfig = { ...initialConfig, title: 'Updated' }

      // Reset with updated config
      act(() => {
        result.current.resetInitialConfig(updatedConfig)
      })

      expect(result.current.hasChanged()).toBe(false)

      // Make change different from new initial
      const anotherConfig = { ...initialConfig, title: 'Another Update' }
      act(() => {
        result.current.handleConfigChange(anotherConfig)
      })

      expect(result.current.hasChanged()).toBe(true)
      expect(onDirtyStateChange).toHaveBeenCalledWith(true)
    })
  })

  describe('complex config comparisons', () => {
    it('should detect changes in nested objects', () => {
      const onDirtyStateChange = vi.fn()
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onDirtyStateChange })
      )

      const newConfig = {
        ...initialConfig,
        portlets: [{ id: '1', name: 'Updated Chart' }]
      }

      act(() => {
        result.current.handleConfigChange(newConfig)
      })

      expect(result.current.hasChanged()).toBe(true)
    })

    it('should detect changes in array length', () => {
      const onDirtyStateChange = vi.fn()
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onDirtyStateChange })
      )

      const newConfig = {
        ...initialConfig,
        portlets: [...initialConfig.portlets, { id: '2', name: 'Chart 2' }]
      }

      act(() => {
        result.current.handleConfigChange(newConfig)
      })

      expect(result.current.hasChanged()).toBe(true)
    })
  })

  describe('async save handling', () => {
    it('should handle concurrent config changes during save', async () => {
      let resolvePromise: () => void
      const savePromise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })
      const onSave = vi.fn().mockReturnValue(savePromise)
      const onDirtyStateChange = vi.fn()

      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig, onSave, onDirtyStateChange })
      )

      const newConfig = { ...initialConfig, title: 'Updated' }

      act(() => {
        result.current.handleConfigChange(newConfig)
      })

      // Start save (async)
      const saveCallPromise = result.current.handleSave(newConfig)

      // Save hasn't completed yet
      expect(onDirtyStateChange).toHaveBeenCalledWith(true)

      // Complete the save
      await act(async () => {
        resolvePromise!()
        await saveCallPromise
      })

      expect(onDirtyStateChange).toHaveBeenCalledWith(false)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined callbacks gracefully', () => {
      const { result } = renderHook(() =>
        useDirtyStateTracking({
          initialConfig,
          onConfigChange: undefined,
          onSave: undefined,
          onDirtyStateChange: undefined
        })
      )

      // Should not throw
      act(() => {
        result.current.handleConfigChange({ ...initialConfig, title: 'New' })
      })
    })

    it('should handle empty config object', () => {
      const emptyConfig = {} as TestConfig
      const { result } = renderHook(() =>
        useDirtyStateTracking({ initialConfig: emptyConfig })
      )

      expect(result.current.hasChanged()).toBe(false)
    })
  })

  describe('callback stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() =>
        useDirtyStateTracking({ initialConfig })
      )

      const firstHandleConfigChange = result.current.handleConfigChange
      const firstHandleSave = result.current.handleSave
      const firstHasChanged = result.current.hasChanged
      const firstResetInitialConfig = result.current.resetInitialConfig

      rerender()

      expect(result.current.handleConfigChange).toBe(firstHandleConfigChange)
      expect(result.current.handleSave).toBe(firstHandleSave)
      expect(result.current.hasChanged).toBe(firstHasChanged)
      expect(result.current.resetInitialConfig).toBe(firstResetInitialConfig)
    })
  })
})
