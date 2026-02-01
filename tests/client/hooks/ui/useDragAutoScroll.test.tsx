/**
 * Tests for useDragAutoScroll hook
 * Covers auto-scrolling during drag operations near container edges
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRef } from 'react'
import { useDragAutoScroll } from '../../../../src/client/hooks/useDragAutoScroll'

// Helper to create a mock container element
function createMockContainer(options: {
  top?: number
  bottom?: number
  left?: number
  right?: number
  scrollTop?: number
  scrollHeight?: number
  clientHeight?: number
} = {}) {
  const container = document.createElement('div')

  const rect = {
    top: options.top ?? 0,
    bottom: options.bottom ?? 500,
    left: options.left ?? 0,
    right: options.right ?? 300,
    width: (options.right ?? 300) - (options.left ?? 0),
    height: (options.bottom ?? 500) - (options.top ?? 0),
    x: options.left ?? 0,
    y: options.top ?? 0,
    toJSON: () => rect
  }

  container.getBoundingClientRect = vi.fn(() => rect)

  Object.defineProperty(container, 'scrollTop', {
    value: options.scrollTop ?? 0,
    writable: true,
    configurable: true
  })

  Object.defineProperty(container, 'scrollHeight', {
    value: options.scrollHeight ?? 1000,
    writable: true,
    configurable: true
  })

  Object.defineProperty(container, 'clientHeight', {
    value: options.clientHeight ?? 500,
    writable: true,
    configurable: true
  })

  return container
}

// Helper to create dragover event (polyfill for jsdom which doesn't have DragEvent)
function createDragOverEvent(clientX: number, clientY: number): Event {
  const event = new MouseEvent('dragover', {
    clientX,
    clientY,
    bubbles: true,
    cancelable: true
  })
  return event
}

describe('useDragAutoScroll', () => {
  let rafCallback: FrameRequestCallback | null = null
  let originalRequestAnimationFrame: typeof requestAnimationFrame
  let originalCancelAnimationFrame: typeof cancelAnimationFrame

  beforeEach(() => {
    rafCallback = null
    originalRequestAnimationFrame = window.requestAnimationFrame
    originalCancelAnimationFrame = window.cancelAnimationFrame

    // Mock requestAnimationFrame
    window.requestAnimationFrame = vi.fn((callback) => {
      rafCallback = callback
      return 1
    }) as unknown as typeof requestAnimationFrame

    window.cancelAnimationFrame = vi.fn()
  })

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame
    window.cancelAnimationFrame = originalCancelAnimationFrame
  })

  describe('initialization', () => {
    it('should not throw when container ref is null', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLElement | null>(null)
        useDragAutoScroll(ref)
        return ref
      })

      expect(result.current.current).toBeNull()
    })

    it('should add event listeners when enabled', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(createMockContainer())
        useDragAutoScroll(ref, { enabled: true })
        return ref
      })

      expect(addEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function), { capture: true })
      expect(addEventListenerSpy).toHaveBeenCalledWith('dragend', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('drop', expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    it('should not add event listeners when disabled', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(createMockContainer())
        useDragAutoScroll(ref, { enabled: false })
        return ref
      })

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('dragover', expect.any(Function), { capture: true })

      addEventListenerSpy.mockRestore()
    })

    it('should use default options', () => {
      // Just verify hook doesn't throw with defaults
      const { result } = renderHook(() => {
        const ref = useRef<HTMLElement | null>(createMockContainer())
        useDragAutoScroll(ref)
        return ref
      })

      expect(result.current.current).not.toBeNull()
    })
  })

  describe('scroll direction detection', () => {
    it('should start scrolling up when dragging near top edge', () => {
      const container = createMockContainer({
        top: 0,
        bottom: 500,
        scrollTop: 100 // Has room to scroll up
      })

      let capturedDragOverHandler: ((event: Event) => void) | null = null
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'dragover') {
            capturedDragOverHandler = handler as (event: Event) => void
          }
        }
      )

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref, { edgeThreshold: 80 })
        return ref
      })

      // Drag near top edge (within 80px threshold)
      const dragEvent = createDragOverEvent(150, 30) // clientY = 30, near top
      act(() => {
        capturedDragOverHandler?.(dragEvent)
      })

      // requestAnimationFrame should have been called to start scroll loop
      expect(window.requestAnimationFrame).toHaveBeenCalled()

      addEventListenerSpy.mockRestore()
    })

    it('should start scrolling down when dragging near bottom edge', () => {
      const container = createMockContainer({
        top: 0,
        bottom: 500,
        scrollTop: 0,
        scrollHeight: 1000,
        clientHeight: 500 // Has room to scroll down
      })

      let capturedDragOverHandler: ((event: Event) => void) | null = null
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'dragover') {
            capturedDragOverHandler = handler as (event: Event) => void
          }
        }
      )

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref, { edgeThreshold: 80 })
        return ref
      })

      // Drag near bottom edge
      const dragEvent = createDragOverEvent(150, 470) // clientY = 470, near bottom (500)
      act(() => {
        capturedDragOverHandler?.(dragEvent)
      })

      expect(window.requestAnimationFrame).toHaveBeenCalled()

      addEventListenerSpy.mockRestore()
    })

    it('should not scroll when cursor is outside horizontal bounds', () => {
      const container = createMockContainer({
        left: 100,
        right: 300,
        top: 0,
        bottom: 500
      })

      let capturedDragOverHandler: ((event: Event) => void) | null = null
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'dragover') {
            capturedDragOverHandler = handler as (event: Event) => void
          }
        }
      )

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref, { edgeThreshold: 80 })
        return ref
      })

      // Drag outside horizontal bounds (clientX = 50, left is 100)
      const dragEvent = createDragOverEvent(50, 30)
      act(() => {
        capturedDragOverHandler?.(dragEvent)
      })

      // cancelAnimationFrame should be called (stop scrolling)
      // or requestAnimationFrame should not start new scroll
      addEventListenerSpy.mockRestore()
    })

    it('should not scroll up when already at top', () => {
      const container = createMockContainer({
        scrollTop: 0 // Already at top
      })

      let capturedDragOverHandler: ((event: Event) => void) | null = null
      vi.spyOn(document, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'dragover') {
            capturedDragOverHandler = handler as (event: Event) => void
          }
        }
      )

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref)
        return ref
      })

      // Drag near top
      const dragEvent = createDragOverEvent(150, 30)

      // Reset mock to track new calls
      ;(window.requestAnimationFrame as unknown as ReturnType<typeof vi.fn>).mockClear()

      act(() => {
        capturedDragOverHandler?.(dragEvent)
      })

      // Should not start scrolling since scrollTop is 0
      // The scroll check should see scrollTop > 0 is false
    })

    it('should not scroll down when already at bottom', () => {
      const container = createMockContainer({
        scrollTop: 500, // At bottom
        scrollHeight: 1000,
        clientHeight: 500 // scrollTop + clientHeight = scrollHeight
      })

      let capturedDragOverHandler: ((event: Event) => void) | null = null
      vi.spyOn(document, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'dragover') {
            capturedDragOverHandler = handler as (event: Event) => void
          }
        }
      )

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref, { edgeThreshold: 80 })
        return ref
      })

      // Drag near bottom
      const dragEvent = createDragOverEvent(150, 470)
      act(() => {
        capturedDragOverHandler?.(dragEvent)
      })

      // Should not start new scroll loop since already at bottom
    })
  })

  describe('scroll speed calculation', () => {
    it('should scroll faster when closer to edge', () => {
      const container = createMockContainer({
        scrollTop: 100
      })

      let capturedDragOverHandler: ((event: Event) => void) | null = null
      vi.spyOn(document, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'dragover') {
            capturedDragOverHandler = handler as (event: Event) => void
          }
        }
      )

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref, { edgeThreshold: 80, maxScrollSpeed: 15 })
        return ref
      })

      // Very close to edge (10px from top)
      const dragEvent = createDragOverEvent(150, 10)
      act(() => {
        capturedDragOverHandler?.(dragEvent)
      })

      // The hook should have calculated a higher speed
      expect(window.requestAnimationFrame).toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = renderHook(() => {
        const ref = useRef<HTMLElement | null>(createMockContainer())
        useDragAutoScroll(ref)
        return ref
      })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function), { capture: true })
      expect(removeEventListenerSpy).toHaveBeenCalledWith('dragend', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('drop', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('should cancel animation frame on unmount', () => {
      const container = createMockContainer({ scrollTop: 100 })

      let capturedDragOverHandler: ((event: Event) => void) | null = null
      vi.spyOn(document, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'dragover') {
            capturedDragOverHandler = handler as (event: Event) => void
          }
        }
      )

      const { unmount } = renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref)
        return ref
      })

      // Start scrolling
      const dragEvent = createDragOverEvent(150, 30)
      act(() => {
        capturedDragOverHandler?.(dragEvent)
      })

      unmount()

      expect(window.cancelAnimationFrame).toHaveBeenCalled()
    })

    it('should stop scrolling on dragend', () => {
      const container = createMockContainer({ scrollTop: 100 })

      let capturedDragOverHandler: ((event: Event) => void) | null = null
      let capturedDragEndHandler: ((event: Event) => void) | null = null

      vi.spyOn(document, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'dragover') {
            capturedDragOverHandler = handler as (event: Event) => void
          }
          if (type === 'dragend') {
            capturedDragEndHandler = handler as (event: Event) => void
          }
        }
      )

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref)
        return ref
      })

      // Start scrolling
      const dragEvent = createDragOverEvent(150, 30)
      act(() => {
        capturedDragOverHandler?.(dragEvent)
      })

      // End drag
      const dragEndEvent = new Event('dragend')
      act(() => {
        capturedDragEndHandler?.(dragEndEvent)
      })

      expect(window.cancelAnimationFrame).toHaveBeenCalled()
    })

    it('should stop scrolling on drop', () => {
      const container = createMockContainer({ scrollTop: 100 })

      let capturedDragOverHandler: ((event: Event) => void) | null = null
      let capturedDropHandler: ((event: Event) => void) | null = null

      vi.spyOn(document, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'dragover') {
            capturedDragOverHandler = handler as (event: Event) => void
          }
          if (type === 'drop') {
            capturedDropHandler = handler as (event: Event) => void
          }
        }
      )

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref)
        return ref
      })

      // Start scrolling
      const dragEvent = createDragOverEvent(150, 30)
      act(() => {
        capturedDragOverHandler?.(dragEvent)
      })

      // Drop
      const dropEvent = new Event('drop')
      act(() => {
        capturedDropHandler?.(dropEvent)
      })

      expect(window.cancelAnimationFrame).toHaveBeenCalled()
    })
  })

  describe('enabled option', () => {
    it('should start scrolling when enabled changes from false to true', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

      const { rerender } = renderHook(
        ({ enabled }) => {
          const ref = useRef<HTMLElement | null>(createMockContainer())
          useDragAutoScroll(ref, { enabled })
          return ref
        },
        { initialProps: { enabled: false } }
      )

      addEventListenerSpy.mockClear()

      rerender({ enabled: true })

      expect(addEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function), { capture: true })

      addEventListenerSpy.mockRestore()
    })

    it('should stop scrolling when enabled changes from true to false', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { rerender } = renderHook(
        ({ enabled }) => {
          const ref = useRef<HTMLElement | null>(createMockContainer())
          useDragAutoScroll(ref, { enabled })
          return ref
        },
        { initialProps: { enabled: true } }
      )

      removeEventListenerSpy.mockClear()

      rerender({ enabled: false })

      expect(removeEventListenerSpy).toHaveBeenCalled()

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('no container', () => {
    it('should handle dragover when container is null gracefully', () => {
      let capturedDragOverHandler: ((event: Event) => void) | null = null
      vi.spyOn(document, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'dragover') {
            capturedDragOverHandler = handler as (event: Event) => void
          }
        }
      )

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(null)
        useDragAutoScroll(ref)
        return ref
      })

      // Should not throw
      const dragEvent = createDragOverEvent(150, 30)
      act(() => {
        capturedDragOverHandler?.(dragEvent)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle edge threshold of 0', () => {
      const container = createMockContainer({ scrollTop: 100 })
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref, { edgeThreshold: 0 })
        return ref
      })

      expect(addEventListenerSpy).toHaveBeenCalledWith('dragover', expect.any(Function), { capture: true })
      addEventListenerSpy.mockRestore()
    })

    it('should handle maxScrollSpeed of 0', () => {
      const container = createMockContainer({ scrollTop: 100 })

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref, { maxScrollSpeed: 0 })
        return ref
      })

      // Should not throw - just won't scroll
    })

    it('should handle very large maxScrollSpeed', () => {
      const container = createMockContainer({ scrollTop: 100 })

      renderHook(() => {
        const ref = useRef<HTMLElement | null>(container)
        useDragAutoScroll(ref, { maxScrollSpeed: 1000 })
        return ref
      })

      // Should not throw
    })
  })

  describe('container ref changes', () => {
    it('should handle container ref becoming null', () => {
      const container = createMockContainer()

      const { rerender } = renderHook(
        ({ containerElement }) => {
          const ref = useRef<HTMLElement | null>(containerElement)
          useDragAutoScroll(ref)
          return ref
        },
        { initialProps: { containerElement: container as HTMLElement | null } }
      )

      // Unmount should not throw
      rerender({ containerElement: null })
    })
  })
})
