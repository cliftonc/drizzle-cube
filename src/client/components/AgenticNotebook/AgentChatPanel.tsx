/**
 * AgentChatPanel - Right panel containing chat messages and input
 */

import React, { useRef, useEffect, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useNotebookStore, selectChatState, selectChatActions } from '../../stores/notebookStore'
import { useAgentChat } from '../../hooks/useAgentChat'
import type { PortletBlock, MarkdownBlock, ChatMessage as ChatMessageType } from '../../stores/notebookStore'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

interface AgentChatPanelProps {
  agentEndpoint?: string
  agentApiKey?: string
  onClear?: () => void
  /** Called when the agent saves a dashboard. Presence enables the "Save as Dashboard" button. */
  onDashboardSaved?: (data: { title: string; description?: string; dashboardConfig: any }) => void
  /** Custom loading indicator for tool call spinners */
  loadingComponent?: React.ReactNode
  /** Initial prompt to auto-send on mount */
  initialPrompt?: string
}

const AgentChatPanel = React.memo(function AgentChatPanel({
  agentEndpoint,
  agentApiKey,
  onClear,
  onDashboardSaved,
  loadingComponent,
  initialPrompt,
}: AgentChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialPromptSentRef = useRef(false)

  // Track whether the next content should start a new assistant message
  // (set after turn_complete, cleared when first content of new turn arrives)
  const needsNewMessageRef = useRef(false)

  // Store state
  const { messages, isStreaming, inputValue } = useNotebookStore(useShallow(selectChatState))
  const {
    addMessage,
    appendToLastAssistantMessage,
    setLastAssistantError,
    addToolCallToLastAssistant,
    updateLastToolCall,
    setIsStreaming,
    setInputValue,
    setSessionId,
  } = useNotebookStore(useShallow(selectChatActions))

  const sessionId = useNotebookStore((s) => s.sessionId)
  const addBlock = useNotebookStore((s) => s.addBlock)
  const reset = useNotebookStore((s) => s.reset)
  const portletBlockCount = useNotebookStore((s) => s.blocks.filter((b) => b.type === 'portlet').length)

  // Refs for values doSend reads at call-time (avoids recreating callbacks on every text delta)
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const isStreamingRef = useRef(isStreaming)
  isStreamingRef.current = isStreaming
  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId

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
    onToolResult: useCallback((id: string, _name: string, result?: unknown, isError?: boolean) => {
      updateLastToolCall({ id, status: isError ? 'error' : 'complete', result })
    }, [updateLastToolCall]),
    onAddPortlet: useCallback((data: PortletBlock) => {
      addBlock(data)
    }, [addBlock]),
    onAddMarkdown: useCallback((data: MarkdownBlock) => {
      addBlock(data)
    }, [addBlock]),
    onDashboardSaved,
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
      setLastAssistantError(message)
      setIsStreaming(false)
    }, [ensureNewMessage, setLastAssistantError, setIsStreaming]),
  })

  // Send a message (used by both Send and Continue)
  // Reads messages/isStreaming/sessionId from refs to avoid recreating on every text delta
  const doSend = useCallback((content: string) => {
    if (!content || isStreamingRef.current) return

    needsNewMessageRef.current = false

    // Capture current messages as history BEFORE adding the new ones
    const history = messagesRef.current.map((m: ChatMessageType) => ({
      role: m.role,
      content: m.content,
      ...(m.toolCalls && m.toolCalls.length > 0 ? { toolCalls: m.toolCalls } : {}),
    }))

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

    // Send to agent with conversation history for session continuity
    sendMessage(content, sessionIdRef.current, history)
  }, [addMessage, setInputValue, setIsStreaming, sendMessage])

  // Auto-send initial prompt on mount (doSend is stable so this won't re-trigger)
  // Reset ref on cleanup so React StrictMode's double-mount doesn't block the real mount
  useEffect(() => {
    if (initialPrompt && !initialPromptSentRef.current && messages.length === 0) {
      initialPromptSentRef.current = true
      // Small delay to ensure chat hook is fully initialized
      const timer = setTimeout(() => doSend(initialPrompt), 100)
      return () => {
        clearTimeout(timer)
        initialPromptSentRef.current = false
      }
    }
  }, [initialPrompt, messages.length, doSend])

  const inputValueRef = useRef(inputValue)
  inputValueRef.current = inputValue

  const handleSend = useCallback(() => {
    doSend(inputValueRef.current.trim())
  }, [doSend])

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

  const handleSaveAsDashboard = useCallback(() => {
    doSend(
      'Save the current notebook as a dashboard with a professional layout, section headers, and appropriate filters.'
    )
  }, [doSend])

  const showSaveAsDashboard = !!onDashboardSaved && !isStreaming && portletBlockCount > 0 && messages.length > 0

  return (
    <div className="dc:flex dc:flex-col dc:h-full bg-dc-surface">
      {/* Header */}
      <div className="dc:flex dc:items-center dc:justify-between dc:px-4 dc:py-3 border-dc-border dc:border-b">
        <h3 className="dc:text-sm dc:font-semibold text-dc-text">AI Assistant</h3>
        <div className="dc:flex dc:items-center dc:gap-1">
          {showSaveAsDashboard && (
            <button
              onClick={handleSaveAsDashboard}
              className="dc:text-xs dc:px-2 dc:py-1 dc:rounded text-dc-accent dc:hover:opacity-80"
              title="Save notebook as a dashboard"
            >
              Save as Dashboard
            </button>
          )}
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
      </div>

      {/* Messages */}
      <div className="dc:flex-1 dc:overflow-y-auto dc:px-4 dc:py-3">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              loadingComponent={loadingComponent}
            />
          ))
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
