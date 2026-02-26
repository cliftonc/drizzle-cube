/**
 * AgentChatPanel - Right panel containing chat messages and input
 */

import React, { useRef, useEffect, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useNotebookStore, selectChatState, selectChatActions } from '../../stores/notebookStore'
import { useAgentChat } from '../../hooks/useAgentChat'
import type { PortletBlock, MarkdownBlock } from '../../stores/notebookStore'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

interface AgentChatPanelProps {
  agentEndpoint?: string
  agentApiKey?: string
  onClear?: () => void
}

const AgentChatPanel = React.memo(function AgentChatPanel({
  agentEndpoint,
  agentApiKey,
  onClear,
}: AgentChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Track whether the next content should start a new assistant message
  // (set after turn_complete, cleared when first content of new turn arrives)
  const needsNewMessageRef = useRef(false)

  // Store state
  const { messages, isStreaming, inputValue } = useNotebookStore(useShallow(selectChatState))
  const {
    addMessage,
    appendToLastAssistantMessage,
    addToolCallToLastAssistant,
    updateLastToolCall,
    setIsStreaming,
    setInputValue,
    setSessionId,
  } = useNotebookStore(useShallow(selectChatActions))

  const sessionId = useNotebookStore((s) => s.sessionId)
  const addBlock = useNotebookStore((s) => s.addBlock)
  const reset = useNotebookStore((s) => s.reset)

  // Lazily create a new assistant message when needed (between turns)
  const ensureNewMessage = useCallback(() => {
    if (needsNewMessageRef.current) {
      needsNewMessageRef.current = false
      addMessage({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: '',
        toolCalls: [],
        timestamp: Date.now(),
      })
    }
  }, [addMessage])

  // Auto-scroll only when NEW messages arrive (not on initial load)
  const prevMsgCountRef = useRef(messages.length)
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMsgCountRef.current = messages.length
  }, [messages])

  // Agent chat hook
  const { sendMessage, abort } = useAgentChat({
    agentEndpoint,
    agentApiKey,
    onTextDelta: useCallback((text: string) => {
      ensureNewMessage()
      appendToLastAssistantMessage(text)
    }, [ensureNewMessage, appendToLastAssistantMessage]),
    onToolStart: useCallback((id: string, name: string, input?: unknown) => {
      ensureNewMessage()
      addToolCallToLastAssistant({ id, name, input, status: 'running' })
    }, [ensureNewMessage, addToolCallToLastAssistant]),
    onToolResult: useCallback((id: string, _name: string, result?: unknown) => {
      updateLastToolCall({ id, status: 'complete', result })
    }, [updateLastToolCall]),
    onAddPortlet: useCallback((data: PortletBlock) => {
      addBlock(data)
    }, [addBlock]),
    onAddMarkdown: useCallback((data: MarkdownBlock) => {
      addBlock(data)
    }, [addBlock]),
    onTurnComplete: useCallback(() => {
      // Don't create a new message yet — just flag that the next turn
      // should start a new bubble (created lazily by ensureNewMessage)
      needsNewMessageRef.current = true
    }, []),
    onDone: useCallback((sid: string) => {
      needsNewMessageRef.current = false
      setSessionId(sid)
      setIsStreaming(false)
    }, [setSessionId, setIsStreaming]),
    onError: useCallback((message: string) => {
      ensureNewMessage()
      appendToLastAssistantMessage(`\n\nError: ${message}`)
      setIsStreaming(false)
    }, [ensureNewMessage, appendToLastAssistantMessage, setIsStreaming]),
  })

  // Send a message (used by both Send and Continue)
  const doSend = useCallback((content: string) => {
    if (!content || isStreaming) return

    needsNewMessageRef.current = false

    // Add user message
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    })

    // Create empty assistant message for first turn's streaming
    addMessage({
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      toolCalls: [],
      timestamp: Date.now(),
    })

    setInputValue('')
    setIsStreaming(true)

    // Send to agent
    sendMessage(content, sessionId)
  }, [isStreaming, addMessage, setInputValue, setIsStreaming, sendMessage, sessionId])

  const handleSend = useCallback(() => {
    doSend(inputValue.trim())
  }, [inputValue, doSend])

  const handleStop = useCallback(() => {
    abort()
    setIsStreaming(false)
  }, [abort, setIsStreaming])

  const handleContinue = useCallback(() => {
    // Just set placeholder text — user types their own follow-up and sends
    setInputValue('')
  }, [setInputValue])

  const handleClear = useCallback(() => {
    abort()
    setIsStreaming(false)
    reset()
    onClear?.()
  }, [abort, setIsStreaming, reset, onClear])

  return (
    <div className="dc:flex dc:flex-col dc:h-full bg-dc-surface">
      {/* Header */}
      <div className="dc:flex dc:items-center dc:justify-between dc:px-4 dc:py-3 border-dc-border dc:border-b">
        <h3 className="dc:text-sm dc:font-semibold text-dc-text">AI Assistant</h3>
        {(messages.length > 0) && (
          <button
            onClick={handleClear}
            disabled={isStreaming}
            className="dc:text-xs dc:px-2 dc:py-1 dc:rounded text-dc-text-secondary dc:hover:opacity-80 dc:disabled:opacity-40"
            title="Clear notebook and chat"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="dc:flex-1 dc:overflow-y-auto dc:px-4 dc:py-3">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onStop={handleStop}
        onContinue={handleContinue}
        isStreaming={isStreaming}
        showContinue={!isStreaming && messages.length > 0}
      />
    </div>
  )
})

function EmptyState() {
  return (
    <div className="dc:flex dc:items-center dc:justify-center dc:h-full">
      <div className="dc:text-center dc:max-w-xs">
        <div className="dc:text-lg dc:font-semibold text-dc-text dc:mb-2">
          Data Analysis Assistant
        </div>
        <p className="dc:text-sm text-dc-text-secondary dc:mb-4">
          Ask me about your data and I'll create visualizations and insights.
        </p>
        <div className="dc:space-y-2 dc:text-xs text-dc-text-muted">
          <p>"Show me employee productivity trends"</p>
          <p>"What are the top departments by headcount?"</p>
          <p>"Compare revenue across product categories"</p>
        </div>
      </div>
    </div>
  )
}

export default AgentChatPanel
