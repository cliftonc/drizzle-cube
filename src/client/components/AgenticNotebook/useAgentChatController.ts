/**
 * useAgentChatController - owns the streaming/chat wiring for AgentChatPanel.
 *
 * Pure extraction of the message-send lifecycle: wires `useAgentChat` callbacks
 * to the notebook store, manages the "thinking" indicator and the lazy
 * between-turn message creation, and exposes `doSend` plus a stop handler.
 * No behaviour change.
 */
import { useCallback, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useNotebookStore, selectChatActions } from '../../stores/notebookStore.js'
import { useAgentChat } from '../../hooks/useAgentChat.js'
import type { PortletBlock, MarkdownBlock, ChatMessage as ChatMessageType } from '../../stores/notebookStore.js'

interface UseAgentChatControllerParams {
  agentEndpoint?: string
  agentApiKey?: string
  agentProvider?: string
  agentModel?: string
  agentProviderEndpoint?: string
  onDashboardSaved?: (data: { title: string; description?: string; dashboardConfig: any }) => void
  messages: ChatMessageType[]
  isStreaming: boolean
}

export function useAgentChatController({
  agentEndpoint,
  agentApiKey,
  agentProvider,
  agentModel,
  agentProviderEndpoint,
  onDashboardSaved,
  messages,
  isStreaming,
}: UseAgentChatControllerParams) {
  const [isThinking, setIsThinking] = useState(false)
  const [lastTraceId, setLastTraceId] = useState<string | null>(null)

  // Track whether the next content should start a new assistant message
  // (set after turn_complete, cleared when first content of new turn arrives)
  const needsNewMessageRef = useRef(false)

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

  const handleStop = useCallback(() => {
    abort()
    setIsStreaming(false)
  }, [abort, setIsStreaming])

  return {
    doSend,
    handleStop,
    abort,
    isThinking,
    setIsThinking,
    lastTraceId,
    setLastTraceId,
  }
}
