/**
 * useNotebookAutosave - debounced persistence of notebook state.
 *
 * Saves 1s after blocks/messages counts stabilize, waiting until streaming
 * completes to avoid persisting partial content. Returns a `clearSave` callback
 * for explicit clears (saves empty state immediately, cancelling pending saves).
 */
import { useCallback, useEffect, useRef } from 'react'
import type { NotebookConfig } from '../../stores/notebookStore'

interface UseNotebookAutosaveParams {
  blockCount: number
  messageCount: number
  isStreaming: boolean
  save: () => NotebookConfig
  onSave?: (config: NotebookConfig) => void | Promise<void>
}

export function useNotebookAutosave({
  blockCount,
  messageCount,
  isStreaming,
  save,
  onSave,
}: UseNotebookAutosaveParams) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const pendingSaveRef = useRef(false)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  // Track whether we've ever had content (so we save empty state on Clear but not on initial mount)
  const hasHadContentRef = useRef(blockCount > 0 || messageCount > 0)

  // Cancel any in-flight debounce timer.
  const cancelTimer = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
  }, [])

  // Schedule a debounced save 1s out, cancelling any in-flight timer.
  const scheduleSave = useCallback(() => {
    cancelTimer()
    saveTimeoutRef.current = setTimeout(() => {
      pendingSaveRef.current = false
      const config = save()
      onSaveRef.current?.(config)
    }, 1000)
  }, [cancelTimer, save])

  // True once the notebook has ever held content.
  const hasContent = blockCount > 0 || messageCount > 0
  if (hasContent) hasHadContentRef.current = true
  const canSave = !!onSaveRef.current && hasHadContentRef.current

  useEffect(() => {
    if (!canSave) return

    if (isStreaming) {
      // Mark that a save is needed once streaming completes
      pendingSaveRef.current = true
      cancelTimer()
      return
    }

    scheduleSave()
    return cancelTimer
  }, [canSave, blockCount, messageCount, isStreaming, cancelTimer, scheduleSave])

  // Flush pending save when streaming ends
  useEffect(() => {
    if (!isStreaming && pendingSaveRef.current && onSaveRef.current && hasHadContentRef.current) {
      scheduleSave()
    }
  }, [isStreaming, scheduleSave])

  // Explicit clear handler — save empty state immediately
  const clearSave = useCallback(() => {
    if (onSaveRef.current) {
      cancelTimer()
      onSaveRef.current({ blocks: [], messages: [] })
    }
  }, [cancelTimer])

  return { clearSave }
}
