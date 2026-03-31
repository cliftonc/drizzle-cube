/**
 * AgentChatPanel - Right panel containing chat messages and input
 */

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useNotebookStore, selectChatState, selectChatActions } from '../../stores/notebookStore'
import { useAgentChat } from '../../hooks/useAgentChat'
import type { PortletBlock, MarkdownBlock, ChatMessage as ChatMessageType } from '../../stores/notebookStore'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import LoadingIndicator from '../LoadingIndicator'
import { getIcon } from '../../icons'
import { t } from '../../../i18n/runtime'

const ThumbUpIcon = getIcon('thumbUp')
const ThumbDownIcon = getIcon('thumbDown')

interface AgentChatPanelProps {
  agentEndpoint?: string
  agentApiKey?: string
  agentProvider?: string
  agentModel?: string
  agentProviderEndpoint?: string
  onClear?: () => void
  /** Called when the agent saves a dashboard. Presence enables the "Save as Dashboard" button. */
  onDashboardSaved?: (data: { title: string; description?: string; dashboardConfig: any }) => void
  /** Called when user submits feedback (thumbs up/down) */
  onScore?: (data: { traceId: string; value: number; comment?: string }) => void
  /** Custom loading indicator for tool call spinners */
  loadingComponent?: React.ReactNode
  /** Initial prompt to auto-send on mount */
  initialPrompt?: string
}

const AgentChatPanel = React.memo(function AgentChatPanel({
  agentEndpoint,
  agentApiKey,
  agentProvider,
  agentModel,
  agentProviderEndpoint,
  onClear,
  onDashboardSaved,
  onScore,
  loadingComponent,
  initialPrompt,
}: AgentChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialPromptSentRef = useRef(false)
  const [lastTraceId, setLastTraceId] = useState<string | null>(null)
  const [scoredTraceIds, setScoredTraceIds] = useState<Set<string>>(new Set())
  const [isThinking, setIsThinking] = useState(false)

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

  // Auto-scroll only when NEW messages arrive or thinking starts (not on initial load)
  const prevMsgCountRef = useRef(messages.length)
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMsgCountRef.current = messages.length
  }, [messages])

  useEffect(() => {
    if (isThinking) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isThinking])

  // Agent chat hook
  const { sendMessage, abort } = useAgentChat({
    agentEndpoint,
    agentApiKey,
    agentProvider,
    agentModel,
    agentProviderEndpoint,
    onTextDelta: useCallback((text: string) => {
      setIsThinking(false)
      ensureNewMessage()
      appendToLastAssistantMessage(text)
    }, [ensureNewMessage, appendToLastAssistantMessage]),
    onToolStart: useCallback((id: string, name: string, input?: unknown) => {
      setIsThinking(false)
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
      setIsThinking(true)
    }, []),
    onDone: useCallback((sid: string, traceId?: string) => {
      needsNewMessageRef.current = false
      setSessionId(sid)
      setIsStreaming(false)
      setIsThinking(false)
      if (traceId) setLastTraceId(traceId)
    }, [setSessionId, setIsStreaming]),
    onError: useCallback((message: string) => {
      setIsThinking(false)
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
    setIsThinking(true)

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
    setIsThinking(false)
    reset()
    setLastTraceId(null)
    setScoredTraceIds(new Set())
    onClear?.()
  }, [abort, setIsStreaming, reset, onClear])

  const handleSaveAsDashboard = useCallback(() => {
    doSend(
      t('notebook.saveAsDashboardPrompt')
    )
  }, [doSend])

  const handleScore = useCallback((value: number) => {
    if (!lastTraceId || !onScore) return
    onScore({ traceId: lastTraceId, value })
    setScoredTraceIds(prev => new Set(prev).add(lastTraceId))
  }, [lastTraceId, onScore])

  const showSaveAsDashboard = !!onDashboardSaved && !isStreaming && portletBlockCount > 0 && messages.length > 0
  const showFeedback = !!onScore && !isStreaming && lastTraceId && messages.length > 0 && !scoredTraceIds.has(lastTraceId)
  const lastScored = lastTraceId ? scoredTraceIds.has(lastTraceId) : false

  return (
    <div className="dc:flex dc:flex-col dc:h-full bg-dc-surface">
      {/* Header */}
      <div className="dc:flex dc:items-center dc:justify-between dc:px-4 dc:py-3 border-dc-border dc:border-b">
        <h3 className="dc:text-sm dc:font-semibold text-dc-text">{t('notebook.aiAssistant')}</h3>
        <div className="dc:flex dc:items-center dc:gap-1">
          {showSaveAsDashboard && (
            <button
              onClick={handleSaveAsDashboard}
              className="dc:text-xs dc:px-2 dc:py-1 dc:rounded text-dc-accent dc:hover:opacity-80"
              title={t('notebook.saveAsDashboardTitle')}
            >
              {t('notebook.saveAsDashboard')}
            </button>
          )}
          {(messages.length > 0) && (
            <button
              onClick={handleClear}
              disabled={isStreaming}
              className="dc:text-xs dc:px-2 dc:py-1 dc:rounded text-dc-text-secondary dc:hover:opacity-80 dc:disabled:opacity-40"
              title={t('notebook.clearTitle')}
            >
              {t('common.actions.clear')}
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
        {/* Thinking indicator (between turns or waiting for first response) */}
        {isThinking && <ThinkingBubble loadingComponent={loadingComponent} />}

        {/* Feedback (thumbs up/down) */}
        {(showFeedback || lastScored) && (
          <div className="dc:flex dc:items-center dc:justify-center dc:gap-3 dc:py-4 dc:mt-2">
            {lastScored ? (
              <span className="dc:text-sm text-dc-text-secondary">{t('notebook.feedbackThanks')}</span>
            ) : (
              <>
                <span className="dc:text-sm text-dc-text-secondary">{t('notebook.feedbackQuestion')}</span>
                <div className="dc:flex dc:items-center dc:gap-2">
                  <button
                    onClick={() => handleScore(1)}
                    className="dc:flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:rounded-lg dc:text-sm dc:font-medium border-dc-border dc:border text-dc-success hover:bg-dc-success-bg dc:transition-colors bg-dc-surface dc:cursor-pointer"
                  >
                    <ThumbUpIcon className="dc:w-4 dc:h-4" />
                    {t('notebook.feedbackYes')}
                  </button>
                  <button
                    onClick={() => handleScore(0)}
                    className="dc:flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:rounded-lg dc:text-sm dc:font-medium border-dc-border dc:border text-dc-error hover:bg-dc-danger-bg dc:transition-colors bg-dc-surface dc:cursor-pointer"
                  >
                    <ThumbDownIcon className="dc:w-4 dc:h-4" />
                    {t('notebook.feedbackNo')}
                  </button>
                </div>
              </>
            )}
          </div>
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

function ThinkingBubble({ loadingComponent }: { loadingComponent?: React.ReactNode }) {
  return (
    <div
      className="dc:flex dc:mb-3 dc:justify-start"
      style={{ animation: 'dc-msg-in 100ms ease-out' }}
    >
      <div className="dc:rounded-lg dc:px-3 dc:py-2 dc:text-sm bg-dc-surface-secondary text-dc-text-secondary dc:rounded-bl-sm dc:flex dc:items-center dc:gap-2">
        {loadingComponent
          ? <span className="dc:inline-flex dc:items-center dc:justify-center dc:h-4 dc:w-4">{loadingComponent}</span>
          : <LoadingIndicator size="xs" />}
        <span>{t('notebook.thinking')}</span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="dc:flex dc:items-center dc:justify-center dc:h-full">
      <div className="dc:text-center dc:max-w-xs">
        <div className="dc:text-lg dc:font-semibold text-dc-text dc:mb-2">
          {t('notebook.emptyState.title')}
        </div>
        <p className="dc:text-sm text-dc-text-secondary dc:mb-4">
          {t('notebook.emptyState.description')}
        </p>
        <div className="dc:space-y-2 dc:text-xs text-dc-text-muted">
          <p>{t('notebook.emptyState.example1')}</p>
          <p>{t('notebook.emptyState.example2')}</p>
          <p>{t('notebook.emptyState.example3')}</p>
        </div>
      </div>
    </div>
  )
}

export default AgentChatPanel
