/**
 * AgentChatPanel - Right panel containing chat messages and input
 */

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useNotebookStore, selectChatState } from '../../stores/notebookStore'
import type { ChatMessage as ChatMessageType } from '../../stores/notebookStore'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { useAgentChatController } from './useAgentChatController'
import { ChatHeader, FeedbackBar, ThinkingBubble, EmptyState, getChatPanelFlags } from './agentChatParts'
import { useTranslation } from '../../hooks/useTranslation'

/** Renders the message list, or the empty state when there are no messages. */
function MessageList({
  messages,
  loadingComponent,
}: {
  messages: ChatMessageType[]
  loadingComponent?: React.ReactNode
}) {
  if (messages.length === 0) return <EmptyState />
  return (
    <>
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} loadingComponent={loadingComponent} />
      ))}
    </>
  )
}

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
  const { t } = useTranslation()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialPromptSentRef = useRef(false)
  const [scoredTraceIds, setScoredTraceIds] = useState<Set<string>>(new Set())

  // Store state
  const { messages, isStreaming, inputValue } = useNotebookStore(useShallow(selectChatState))
  const setInputValue = useNotebookStore((s) => s.setInputValue)
  const reset = useNotebookStore((s) => s.reset)
  const setIsStreaming = useNotebookStore((s) => s.setIsStreaming)
  const portletBlockCount = useNotebookStore((s) => s.blocks.filter((b) => b.type === 'portlet').length)

  // Streaming/chat lifecycle (send, abort, thinking + traceId state)
  const {
    doSend,
    handleStop,
    abort,
    isThinking,
    setIsThinking,
    lastTraceId,
    setLastTraceId,
  } = useAgentChatController({
    agentEndpoint,
    agentApiKey,
    agentProvider,
    agentModel,
    agentProviderEndpoint,
    onDashboardSaved,
    messages,
    isStreaming,
  })

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
  }, [abort, setIsStreaming, setIsThinking, reset, setLastTraceId, onClear])

  const handleSaveAsDashboard = useCallback(() => {
    doSend(t('notebook.saveAsDashboardPrompt'))
  }, [doSend, t])

  const handleScore = useCallback((value: number) => {
    if (!lastTraceId || !onScore) return
    onScore({ traceId: lastTraceId, value })
    setScoredTraceIds(prev => new Set(prev).add(lastTraceId))
  }, [lastTraceId, onScore])

  const { showSaveAsDashboard, showClear, showFeedback, lastScored } = getChatPanelFlags({
    onDashboardSaved: !!onDashboardSaved,
    onScore: !!onScore,
    isStreaming,
    portletBlockCount,
    messageCount: messages.length,
    lastTraceId,
    scoredTraceIds,
  })

  return (
    <div className="dc:flex dc:flex-col dc:h-full bg-dc-surface">
      <ChatHeader
        showSaveAsDashboard={showSaveAsDashboard}
        showClear={showClear}
        isStreaming={isStreaming}
        onSaveAsDashboard={handleSaveAsDashboard}
        onClear={handleClear}
      />

      {/* Messages */}
      <div className="dc:flex-1 dc:overflow-y-auto dc:px-4 dc:py-3">
        <MessageList messages={messages} loadingComponent={loadingComponent} />
        {/* Thinking indicator (between turns or waiting for first response) */}
        {isThinking && <ThinkingBubble loadingComponent={loadingComponent} />}

        {/* Feedback (thumbs up/down) */}
        {(showFeedback || lastScored) && (
          <FeedbackBar scored={lastScored} onScore={handleScore} />
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

export default AgentChatPanel
