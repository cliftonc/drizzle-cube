/**
 * AgenticNotebook - AI-powered data analysis notebook
 *
 * Top-level component combining a notebook canvas (left) with a chat panel (right).
 * The AI agent discovers available data, executes queries, creates visualizations,
 * and explains findings within a single conversational flow.
 *
 * Responsive behavior:
 * - Wide (>= 768px): Drag-resizable two-column layout
 * - Narrow (< 768px): Toggle between collapsed icon strip + expanded panel
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
  type NotebookBlock,
  type NotebookConfig,
} from '../../stores/notebookStore'
import NotebookCanvas from './NotebookCanvas'
import AgentChatPanel from './AgentChatPanel'
import { useNotebookLayout } from '../../hooks/useNotebookLayout'
import { getChartTypeIcon, getIcon } from '../../icons/registry'
import type { ColorPalette } from '../../types'
import type { ReactNode } from 'react'

export interface AgenticNotebookProps {
  /** Initial config to restore (saved notebooks) */
  config?: NotebookConfig
  /** Override default agent endpoint (default: apiUrl + '/agent/chat') */
  agentEndpoint?: string
  /** Client-side API key (for demo/try-site use) */
  agentApiKey?: string
  /** Override LLM provider (anthropic | openai | google) */
  agentProvider?: string
  /** Override LLM model (e.g. 'gpt-4o', 'gemini-2.0-flash') */
  agentModel?: string
  /** Override provider endpoint URL (for OpenAI-compatible services) */
  agentProviderEndpoint?: string
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
 * Collapsed strip showing notebook block icons (shown in narrow mode when chat is expanded)
 */
function CollapsedNotebookStrip({
  blocks,
  pulsingBlockId,
  nudge,
  onExpand,
}: {
  blocks: NotebookBlock[]
  pulsingBlockId: string | null
  nudge: boolean
  onExpand: () => void
}) {
  const BookOpenIcon = getIcon('bookOpen')
  const DocumentIcon = getIcon('documentText')

  return (
    <button
      type="button"
      onClick={onExpand}
      className="dc:h-full dc:flex-shrink-0 dc:flex dc:flex-col dc:items-center dc:pt-3 dc:gap-2 bg-dc-surface border-dc-border dc:border-r dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors"
      style={
        nudge
          ? { animation: 'dc-strip-nudge 0.8s ease-in-out 2', width: 48 }
          : { width: 48 }
      }
      title="Expand notebook"
    >
      <BookOpenIcon className="dc:w-5 dc:h-5 text-dc-text-muted" />
      <div
        className="dc:flex dc:flex-col dc:items-center dc:gap-1.5 dc:flex-1 dc:overflow-y-auto dc:py-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {blocks.length === 0 ? (
          <span
            className="dc:text-[9px] text-dc-text-disabled dc:writing-vertical-lr dc:mt-2"
            style={{ writingMode: 'vertical-lr' }}
          >
            No blocks
          </span>
        ) : (
          blocks.map((block) => {
            const isPulsing = block.id === pulsingBlockId
            let Icon: React.ComponentType<{ className?: string }>
            if (block.type === 'portlet') {
              Icon = getChartTypeIcon(block.chartType)
            } else {
              Icon = DocumentIcon
            }
            return (
              <div
                key={block.id}
                className="dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded"
                style={
                  isPulsing
                    ? { animation: 'dc-icon-pulse 0.6s ease-in-out 3' }
                    : undefined
                }
                title={block.type === 'portlet' ? block.title : (block.title || 'Markdown')}
              >
                <Icon className="dc:w-4 dc:h-4 text-dc-text-muted" />
              </div>
            )
          })
        )}
      </div>
    </button>
  )
}

/**
 * Collapsed strip showing AI chat icon (shown in narrow mode when notebook is expanded)
 */
function CollapsedChatStrip({ onExpand }: { onExpand: () => void }) {
  const SparklesIcon = getIcon('sparkles')

  return (
    <button
      type="button"
      onClick={onExpand}
      className="dc:w-12 dc:h-full dc:flex-shrink-0 dc:flex dc:flex-col dc:items-center dc:pt-3 dc:gap-2 bg-dc-surface border-dc-border dc:border-l dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors"
      title="Expand AI chat"
    >
      <SparklesIcon className="dc:w-5 dc:h-5 text-dc-accent" />
      <span
        className="dc:text-[10px] dc:font-medium text-dc-text-muted"
        style={{ writingMode: 'vertical-lr' }}
      >
        AI Chat
      </span>
    </button>
  )
}

/**
 * Inner component that uses the notebook store (must be inside provider)
 */
function AgenticNotebookInner({
  agentEndpoint,
  agentApiKey,
  agentProvider,
  agentModel,
  agentProviderEndpoint,
  onSave,
  onDirtyStateChange,
  onDashboardSaved,
  onScore,
  loadingComponent,
  className,
  initialPrompt,
}: Omit<AgenticNotebookProps, 'config' | 'colorPalette'>) {
  const [dividerPosition, setDividerPosition] = useState(60) // 60% left, 40% right
  const dividerContainerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)

  // Responsive layout
  const { containerRef: layoutRef, layoutMode } = useNotebookLayout()
  const [expandedPanel, setExpandedPanel] = useState<'chat' | 'notebook'>('chat')
  const [pulsingBlockId, setPulsingBlockId] = useState<string | null>(null)
  const [nudgeStrip, setNudgeStrip] = useState(false)
  const prevLayoutModeRef = useRef(layoutMode)

  const blocks = useNotebookStore((s) => s.blocks)
  const blockCount = blocks.length
  const messageCount = useNotebookStore((s) => s.messages.length)
  const isStreaming = useNotebookStore((s) => s.isStreaming)
  const save = useNotebookStore((s) => s.save)

  // Reset to chat when crossing from narrow → wide
  useEffect(() => {
    if (prevLayoutModeRef.current === 'narrow' && layoutMode === 'wide') {
      setExpandedPanel('chat')
    }
    prevLayoutModeRef.current = layoutMode
  }, [layoutMode])

  // Detect new blocks added while notebook is collapsed → pulse the icon
  const prevBlockCountRef = useRef(blockCount)
  useEffect(() => {
    if (
      layoutMode === 'narrow' &&
      expandedPanel === 'chat' &&
      blockCount > prevBlockCountRef.current
    ) {
      // Find the newest block (last in the array)
      const newestBlock = blocks[blocks.length - 1]
      if (newestBlock) {
        setPulsingBlockId(newestBlock.id)
        const timer = setTimeout(() => setPulsingBlockId(null), 2000)
        return () => clearTimeout(timer)
      }
    }
    prevBlockCountRef.current = blockCount
  }, [blockCount, blocks, layoutMode, expandedPanel])

  // Nudge the notebook strip when streaming ends while collapsed and there are blocks
  const wasStreamingRef = useRef(false)
  useEffect(() => {
    if (isStreaming) {
      wasStreamingRef.current = true
    } else if (
      wasStreamingRef.current &&
      layoutMode === 'narrow' &&
      expandedPanel === 'chat' &&
      blockCount > 0
    ) {
      wasStreamingRef.current = false
      setNudgeStrip(true)
      const timer = setTimeout(() => setNudgeStrip(false), 1700)
      return () => clearTimeout(timer)
    }
  }, [isStreaming, layoutMode, expandedPanel, blockCount])

  // Merge refs: layoutRef (RefCallback) + dividerContainerRef (for drag calculations)
  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      layoutRef(node)
      dividerContainerRef.current = node
    },
    [layoutRef],
  )

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
      if (!isDraggingRef.current || !dividerContainerRef.current) return
      const rect = dividerContainerRef.current.getBoundingClientRect()
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

  const chatPanel = (
    <AgentChatPanel
      agentEndpoint={agentEndpoint}
      agentApiKey={agentApiKey}
      agentProvider={agentProvider}
      agentModel={agentModel}
      agentProviderEndpoint={agentProviderEndpoint}
      onClear={handleClear}
      onDashboardSaved={onDashboardSaved}
      onScore={onScore}
      loadingComponent={loadingComponent}
      initialPrompt={initialPrompt}
    />
  )

  // --- Narrow mode: collapsed strip + expanded panel ---
  if (layoutMode === 'narrow') {
    return (
      <div
        ref={mergedRef}
        className={`dc:flex dc:h-full dc:w-full dc:overflow-hidden bg-dc-surface-secondary ${className || ''}`}
      >
        {expandedPanel === 'chat' ? (
          <>
            <CollapsedNotebookStrip
              blocks={blocks}
              pulsingBlockId={pulsingBlockId}
              nudge={nudgeStrip}
              onExpand={() => setExpandedPanel('notebook')}
            />
            <div className="dc:h-full dc:overflow-hidden dc:flex-1">
              {chatPanel}
            </div>
          </>
        ) : (
          <>
            <div className="dc:h-full dc:overflow-hidden dc:flex-1">
              <NotebookCanvas />
            </div>
            <CollapsedChatStrip onExpand={() => setExpandedPanel('chat')} />
          </>
        )}
      </div>
    )
  }

  // --- Wide mode: existing drag-resizable two-column layout ---
  return (
    <div
      ref={mergedRef}
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
        {chatPanel}
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
