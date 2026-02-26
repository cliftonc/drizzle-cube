/**
 * ChatMessage - Renders individual user and assistant messages
 */

import React, { useState } from 'react'
import type { ChatMessage as ChatMessageType, ToolCallRecord } from '../../stores/notebookStore'

/** Simple inline markdown parser for bold, italic, and code in chat text */
function renderInlineMarkdown(text: string): React.ReactNode[] {
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
    nodes.push(<span key={key++}>{remaining}</span>)
    break
  }

  return nodes
}

interface ChatMessageProps {
  message: ChatMessageType
}

/** Tool call label mapping for user-friendly display */
const TOOL_LABELS: Record<string, string> = {
  discover_cubes: 'Discovering cubes',
  get_cube_metadata: 'Reading metadata',
  execute_query: 'Executing query',
  add_portlet: 'Adding visualization',
  add_markdown: 'Adding explanation',
}

function ToolCallIndicator({ toolCall }: { toolCall: ToolCallRecord }) {
  const [expanded, setExpanded] = useState(false)
  const label = TOOL_LABELS[toolCall.name] || toolCall.name
  const isRunning = toolCall.status === 'running'

  return (
    <div className="dc:my-1 dc:text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="dc:flex dc:items-center dc:gap-1.5 text-dc-text-secondary dc:hover:opacity-80 dc:transition-opacity"
      >
        {isRunning ? (
          <span className="dc:inline-block dc:w-3 dc:h-3 dc:border-2 border-dc-accent dc:border-t-transparent dc:rounded-full dc:animate-spin" />
        ) : (
          <span className="dc:text-xs">
            {toolCall.status === 'error' ? '\u2717' : '\u2713'}
          </span>
        )}
        <span>{label}{isRunning ? '...' : ''}</span>
        {!isRunning && (
          <span className="dc:text-[10px] dc:opacity-60">
            {expanded ? '\u25B2' : '\u25BC'}
          </span>
        )}
      </button>
      {expanded && toolCall.result != null && (
        <pre className="dc:mt-1 dc:p-2 dc:rounded dc:text-[11px] dc:overflow-x-auto dc:max-h-32 dc:overflow-y-auto bg-dc-surface-secondary text-dc-text-secondary">
          {typeof toolCall.result === 'string'
            ? toolCall.result
            : JSON.stringify(toolCall.result, null, 2)}
        </pre>
      )}
    </div>
  )
}

const ChatMessage = React.memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const hasContent = !!message.content?.trim()
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0

  // Don't render empty assistant messages
  if (!isUser && !hasContent && !hasToolCalls) return null

  return (
    <div className={`dc:flex dc:mb-3 ${isUser ? 'dc:justify-end' : 'dc:justify-start'}`}>
      <div
        className={`dc:max-w-[85%] dc:rounded-lg dc:px-3 dc:py-2 dc:text-sm ${
          isUser
            ? 'bg-dc-accent text-dc-accent-text dc:rounded-br-sm'
            : 'bg-dc-surface-secondary text-dc-text dc:rounded-bl-sm'
        }`}
      >
        {/* Message text */}
        {hasContent && (
          <div className="dc:whitespace-pre-wrap dc:break-words">
            {isUser ? message.content : renderInlineMarkdown(message.content)}
          </div>
        )}

        {/* Tool call indicators */}
        {hasToolCalls && (
          <div className={hasContent ? 'dc:mt-1 dc:border-t dc:border-current dc:border-opacity-10 dc:pt-1' : ''}>
            {message.toolCalls!.map((tc, i) => (
              <ToolCallIndicator key={tc.id || i} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

export default ChatMessage
