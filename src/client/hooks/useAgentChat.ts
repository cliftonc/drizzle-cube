/**
 * useAgentChat Hook
 * SSE streaming hook for the agentic notebook chat interface
 */

import { useRef, useCallback, useState } from 'react'
import { useCubeApi } from '../providers/CubeProvider'
import type { PortletBlock, MarkdownBlock } from '../stores/notebookStore'
import {
  formatUserFacingError,
  handleAgentEvent,
  dispatchSSEBlock,
  buildAgentHeaders,
  type AgentSSEEvent,
} from './agentChatStream'

export interface UseAgentChatOptions {
  /** Override default agent endpoint (default: apiUrl + '/agent/chat') */
  agentEndpoint?: string
  /** Client-side API key for demo/try-site use */
  agentApiKey?: string
  /** Override LLM provider (anthropic | openai | google) */
  agentProvider?: string
  /** Override LLM model (e.g. 'gpt-4o', 'gemini-2.0-flash') */
  agentModel?: string
  /** Override provider endpoint URL (for OpenAI-compatible services) */
  agentProviderEndpoint?: string
  /** Called when agent adds a portlet to the notebook */
  onAddPortlet: (data: PortletBlock) => void
  /** Called when agent adds a markdown block to the notebook */
  onAddMarkdown: (data: MarkdownBlock) => void
  /** Called when the agent saves a dashboard configuration */
  onDashboardSaved?: (data: { title: string; description?: string; dashboardConfig: any }) => void
  /** Called when streaming text arrives */
  onTextDelta: (text: string) => void
  /** Called when a tool call starts */
  onToolStart: (id: string, name: string, input?: unknown) => void
  /** Called when a tool call completes */
  onToolResult: (id: string, name: string, result?: unknown, isError?: boolean) => void
  /** Called when the agent completes with session ID and optional trace ID */
  onDone: (sessionId: string, traceId?: string) => void
  /** Called when a turn completes (between agentic turns) */
  onTurnComplete?: () => void
  /** Called on error */
  onError: (message: string) => void
}

/** Simplified message format for sending conversation history */
export interface AgentHistoryMessage {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: Array<{
    id: string
    name: string
    input?: unknown
    result?: unknown
    status: 'running' | 'complete' | 'error'
  }>
}

export interface UseAgentChatResult {
  /** Send a message to the agent, optionally with prior conversation history */
  sendMessage: (content: string, sessionId?: string | null, history?: AgentHistoryMessage[]) => Promise<void>
  /** Whether the agent is currently streaming */
  isStreaming: boolean
  /** Abort the current stream */
  abort: () => void
}

/**
 * Hook for streaming chat with the agentic notebook backend.
 * Uses fetch() with ReadableStream to consume SSE events.
 */
export function useAgentChat(options: UseAgentChatOptions): UseAgentChatResult {
  const { agentEndpoint, agentApiKey, agentProvider, agentModel, agentProviderEndpoint } = options

  const { cubeApi } = useCubeApi()
  const abortControllerRef = useRef<AbortController | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  // Store callbacks in a ref so handleEvent always reads the latest
  // without causing sendMessage to be recreated on every render
  const callbacksRef = useRef(options)
  callbacksRef.current = options

  const sendMessage = useCallback(async (content: string, sessionId?: string | null, history?: AgentHistoryMessage[]) => {
    const handleEvent = (event: AgentSSEEvent) => handleAgentEvent(event, callbacksRef.current)

    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    setIsStreaming(true)

    try {
      // Build endpoint URL from CubeClient's API URL
      const apiUrl = (cubeApi as any).apiUrl || '/cubejs-api/v1'
      const endpoint = agentEndpoint || `${apiUrl}/agent/chat`

      // Build headers matching CubeClient's auth pattern (plus agent overrides)
      const headers = buildAgentHeaders({
        baseHeaders: (cubeApi as any).headers,
        agentApiKey,
        agentProvider,
        agentModel,
        agentProviderEndpoint,
      })

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: (cubeApi as any).credentials ?? 'include',
        body: JSON.stringify({
          message: content,
          ...(sessionId ? { sessionId } : {}),
          ...(history && history.length > 0 ? { history } : {}),
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Agent request failed: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body received')
      }

      // Read SSE stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE events (delimited by double newline)
        const events = buffer.split('\n\n')
        buffer = events.pop() || '' // Keep incomplete last chunk

        for (const eventStr of events) {
          dispatchSSEBlock(eventStr, handleEvent)
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        dispatchSSEBlock(buffer, handleEvent)
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        const raw = error instanceof Error ? error.message : 'Stream failed'
        callbacksRef.current.onError(formatUserFacingError(raw))
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [cubeApi, agentEndpoint, agentApiKey, agentProvider, agentModel, agentProviderEndpoint])

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
    }
  }, [])

  return {
    sendMessage,
    isStreaming,
    abort,
  }
}
