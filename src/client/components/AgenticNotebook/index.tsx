/**
 * AgenticNotebook - AI-powered data analysis notebook
 *
 * Top-level component combining a notebook canvas (left) with a chat panel (right).
 * The AI agent discovers available data, executes queries, creates visualizations,
 * and explains findings within a single conversational flow.
 *
 * Requires:
 * - CubeProvider wrapping this component
 * - Server configured with `agent` option in HonoAdapterOptions
 * - @anthropic-ai/claude-agent-sdk installed on the server
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  NotebookStoreProvider,
  useNotebookStore,
  type NotebookConfig,
} from '../../stores/notebookStore'
import NotebookCanvas from './NotebookCanvas'
import AgentChatPanel from './AgentChatPanel'
import type { ColorPalette } from '../../types'
import type { ReactNode } from 'react'

export interface AgenticNotebookProps {
  /** Initial config to restore (saved notebooks) */
  config?: NotebookConfig
  /** Override default agent endpoint (default: apiUrl + '/agent/chat') */
  agentEndpoint?: string
  /** Client-side API key (for demo/try-site use) */
  agentApiKey?: string
  /** Callback when notebook state changes (for persistence) */
  onSave?: (config: NotebookConfig) => void | Promise<void>
  /** Callback when dirty state changes */
  onDirtyStateChange?: (isDirty: boolean) => void
  /** Color palette for charts */
  colorPalette?: ColorPalette
  /** Called when the agent saves a dashboard. Presence enables the "Save as Dashboard" button. */
  onDashboardSaved?: (data: { title: string; description?: string; dashboardConfig: any }) => void
  /** Called when user submits feedback (thumbs up/down). Receives traceId from the last agent response. */
  onScore?: (data: { traceId: string; value: number; comment?: string }) => void
  /** Custom loading indicator for tool call spinners (defaults to LoadingIndicator) */
  loadingComponent?: ReactNode
  /** Additional CSS class name */
  className?: string
  /** Initial prompt to auto-send on mount */
  initialPrompt?: string
}

/**
 * Inner component that uses the notebook store (must be inside provider)
 */
function AgenticNotebookInner({
  agentEndpoint,
  agentApiKey,
  onSave,
  onDirtyStateChange,
  onDashboardSaved,
  onScore,
  loadingComponent,
  className,
  initialPrompt,
}: Omit<AgenticNotebookProps, 'config' | 'colorPalette'>) {
  const [dividerPosition, setDividerPosition] = useState(60) // 60% left, 40% right
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const blockCount = useNotebookStore((s) => s.blocks.length)
  const messageCount = useNotebookStore((s) => s.messages.length)
  const isStreaming = useNotebookStore((s) => s.isStreaming)
  const save = useNotebookStore((s) => s.save)

  // Track dirty state
  const initialRef = useRef({ blockCount, msgCount: messageCount })
  useEffect(() => {
    const isDirty =
      blockCount !== initialRef.current.blockCount ||
      messageCount !== initialRef.current.msgCount
    onDirtyStateChange?.(isDirty)
  }, [blockCount, messageCount, onDirtyStateChange])

  // Debounced save - fires 1s after blocks/messages count stabilizes
  // Waits until streaming completes to avoid saving partial content
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const pendingSaveRef = useRef(false)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  // Track whether we've ever had content (so we save empty state on Clear but not on initial mount)
  const hasHadContentRef = useRef(blockCount > 0 || messageCount > 0)
  useEffect(() => {
    if (blockCount > 0 || messageCount > 0) {
      hasHadContentRef.current = true
    }
    if (!onSaveRef.current || !hasHadContentRef.current) return

    if (isStreaming) {
      // Mark that a save is needed once streaming completes
      pendingSaveRef.current = true
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      return
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      pendingSaveRef.current = false
      const config = save()
      onSaveRef.current?.(config)
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [blockCount, messageCount, isStreaming, save])

  // Flush pending save when streaming ends
  useEffect(() => {
    if (!isStreaming && pendingSaveRef.current && onSaveRef.current && hasHadContentRef.current) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        pendingSaveRef.current = false
        const config = save()
        onSaveRef.current?.(config)
      }, 1000)
    }
  }, [isStreaming, save])

  // Explicit clear handler — save immediately with empty state
  const handleClear = useCallback(() => {
    if (onSaveRef.current) {
      // Cancel any pending debounced save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      onSaveRef.current({ blocks: [], messages: [] })
    }
  }, [])

  // Divider drag handlers
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newPos = ((moveEvent.clientX - rect.left) / rect.width) * 100
      setDividerPosition(Math.min(Math.max(newPos, 30), 80))
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`dc:flex dc:h-full dc:w-full dc:overflow-hidden bg-dc-surface-secondary ${className || ''}`}
    >
      {/* Left: Notebook Canvas */}
      <div
        className="dc:h-full dc:overflow-hidden"
        style={{ width: `${dividerPosition}%` }}
      >
        <NotebookCanvas />
      </div>

      {/* Resizable Divider */}
      <div
        className="dc:w-1 dc:h-full dc:cursor-col-resize dc:flex-shrink-0 dc:transition-colors bg-dc-border dc:hover:bg-dc-accent"
        onMouseDown={handleDividerMouseDown}
      />

      {/* Right: Chat Panel */}
      <div
        className="dc:h-full dc:overflow-hidden"
        style={{ width: `${100 - dividerPosition}%` }}
      >
        <AgentChatPanel
          agentEndpoint={agentEndpoint}
          agentApiKey={agentApiKey}
          onClear={handleClear}
          onDashboardSaved={onDashboardSaved}
          onScore={onScore}
          loadingComponent={loadingComponent}
          initialPrompt={initialPrompt}
        />
      </div>
    </div>
  )
}

/**
 * AgenticNotebook - AI-powered data analysis notebook
 *
 * @example
 * ```tsx
 * <CubeProvider apiOptions={{ apiUrl: '/api/cubejs-api/v1' }} token={token}>
 *   <AgenticNotebook
 *     agentApiKey="sk-..."
 *     onSave={(config) => saveToDatabase(config)}
 *   />
 * </CubeProvider>
 * ```
 */
const AgenticNotebook = React.memo(function AgenticNotebook({
  config,
  ...props
}: AgenticNotebookProps) {
  return (
    <NotebookStoreProvider initialConfig={config}>
      <AgenticNotebookInner {...props} />
    </NotebookStoreProvider>
  )
})

export default AgenticNotebook
