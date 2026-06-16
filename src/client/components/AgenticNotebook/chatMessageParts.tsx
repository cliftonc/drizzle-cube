/**
 * chatMessageParts - presentational sub-pieces + helpers for ChatMessage.
 *
 * Pure extraction: no behaviour change. Each piece renders one region of a
 * chat bubble (markdown body, error row, tool-call list, tool-call indicator).
 */
import React, { useState } from 'react'
import type { ChatMessage as ChatMessageType, ToolCallRecord } from '../../stores/notebookStore.js'
import LoadingIndicator from '../LoadingIndicator.js'

/** Simple inline markdown parser for bold, italic, and code in chat text */
export function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining) {
    // Code inline `text`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/)
    if (codeMatch) {
      const [, before, code, after] = codeMatch
      if (before) nodes.push(<span key={key++}>{before}</span>)
      nodes.push(
        <code key={key++} className="dc:px-1 dc:py-0.5 dc:rounded dc:text-xs bg-dc-surface dc:font-mono">
          {code}
        </code>
      )
      remaining = after
      continue
    }

    // Bold **text**
    const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/)
    if (boldMatch) {
      const [, before, bold, after] = boldMatch
      if (before) nodes.push(<span key={key++}>{before}</span>)
      nodes.push(<strong key={key++} className="dc:font-semibold">{bold}</strong>)
      remaining = after
      continue
    }

    // Plain text
    nodes.push(<span key={key}>{remaining}</span>)
    break
  }

  return nodes
}

/** Tool call label mapping for user-friendly display */
const TOOL_LABELS: Record<string, string> = {
  discover_cubes: 'Discovering cubes',
  get_cube_metadata: 'Reading metadata',
  execute_query: 'Executing query',
  add_portlet: 'Adding visualization',
  add_markdown: 'Adding explanation',
}

/** Compute the bubble background/text classes for a message. */
export function getBubbleClass(isUser: boolean, hasError: boolean, hasContent: boolean): string {
  if (isUser) return 'bg-dc-accent text-dc-accent-text dc:rounded-br-sm'
  if (hasError && !hasContent) return 'bg-dc-warning-bg text-dc-text dc:rounded-bl-sm'
  return 'bg-dc-surface-secondary text-dc-text dc:rounded-bl-sm'
}

/** Spinner or status glyph shown at the start of a tool-call row. */
function ToolCallStatusIcon({
  toolCall,
  loadingComponent,
}: {
  toolCall: ToolCallRecord
  loadingComponent?: React.ReactNode
}) {
  if (toolCall.status === 'running') {
    if (loadingComponent) {
      return (
        <span className="dc:inline-flex dc:items-center dc:justify-center dc:h-3 dc:w-3">
          {loadingComponent}
        </span>
      )
    }
    return <LoadingIndicator size="xs" />
  }
  return (
    <span className="dc:text-xs">
      {toolCall.status === 'error' ? '✗' : '✓'}
    </span>
  )
}

/** Stringify a tool-call result for the expanded preview. */
function formatToolResult(result: unknown): string {
  return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
}

/** Expanded result preview for a completed tool call. */
function ToolCallResult({ result }: { result: unknown }) {
  if (result == null) return null
  return (
    <pre className="dc:mt-1 dc:p-2 dc:rounded dc:text-[11px] dc:overflow-x-auto dc:max-h-32 dc:overflow-y-auto bg-dc-surface-secondary text-dc-text-secondary">
      {formatToolResult(result)}
    </pre>
  )
}

export function ToolCallIndicator({
  toolCall,
  loadingComponent,
}: {
  toolCall: ToolCallRecord
  loadingComponent?: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const label = TOOL_LABELS[toolCall.name] || toolCall.name
  const isRunning = toolCall.status === 'running'

  return (
    <div className="dc:my-1 dc:text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="dc:flex dc:items-center dc:gap-1.5 text-dc-text-secondary dc:hover:opacity-80 dc:transition-opacity"
      >
        <ToolCallStatusIcon toolCall={toolCall} loadingComponent={loadingComponent} />
        <span>{label}{isRunning ? '...' : ''}</span>
        {!isRunning && (
          <span className="dc:text-[10px] dc:opacity-60">
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </button>
      {expanded && <ToolCallResult result={toolCall.result} />}
    </div>
  )
}

/** Error row shown below message text. */
export function MessageError({ error, hasContent }: { error: string; hasContent: boolean }) {
  return (
    <div className={`dc:flex dc:items-start dc:gap-2 ${hasContent ? 'dc:mt-2 dc:pt-2 dc:border-t dc:border-current dc:border-opacity-10' : ''}`}>
      <span className="dc:text-base dc:leading-none dc:mt-0.5 text-dc-warning dc:flex-shrink-0">{'⚠'}</span>
      <span className="text-dc-text-secondary">{error}</span>
    </div>
  )
}

interface MessageFlags {
  isUser: boolean
  hasContent: boolean
  hasError: boolean
  hasToolCalls: boolean
  toolCalls: ToolCallRecord[]
  /** False for empty assistant messages that should not render. */
  shouldRender: boolean
}

/** Derive render flags for a chat message. */
export function getMessageFlags(message: ChatMessageType): MessageFlags {
  const isUser = message.role === 'user'
  const hasContent = !!message.content?.trim()
  const hasError = !!message.error
  const toolCalls = message.toolCalls ?? []
  const hasToolCalls = toolCalls.length > 0
  return {
    isUser,
    hasContent,
    hasError,
    hasToolCalls,
    toolCalls,
    shouldRender: isUser || hasContent || hasError || hasToolCalls,
  }
}

/** Inner content of a chat bubble: text, error row, and tool calls. */
export function ChatBubbleBody({
  message,
  flags,
  loadingComponent,
}: {
  message: ChatMessageType
  flags: MessageFlags
  loadingComponent?: React.ReactNode
}) {
  const { isUser, hasContent, hasError, hasToolCalls, toolCalls } = flags
  return (
    <>
      {/* Message text */}
      {hasContent && (
        <div className="dc:whitespace-pre-wrap dc:break-words">
          {isUser ? message.content : renderInlineMarkdown(message.content)}
        </div>
      )}

      {/* Error display */}
      {hasError && <MessageError error={message.error!} hasContent={hasContent} />}

      {/* Tool call indicators */}
      {hasToolCalls && (
        <ToolCallList
          toolCalls={toolCalls}
          loadingComponent={loadingComponent}
          separated={hasContent || hasError}
        />
      )}
    </>
  )
}

/** List of tool-call indicators for a message. */
export function ToolCallList({
  toolCalls,
  loadingComponent,
  separated,
}: {
  toolCalls: ToolCallRecord[]
  loadingComponent?: React.ReactNode
  separated: boolean
}) {
  return (
    <div className={separated ? 'dc:mt-1 dc:border-t dc:border-current dc:border-opacity-10 dc:pt-1' : ''}>
      {toolCalls.map((tc, i) => (
        <ToolCallIndicator key={tc.id || i} toolCall={tc} loadingComponent={loadingComponent} />
      ))}
    </div>
  )
}
