/**
 * useAgentChat Hook
 * SSE streaming hook for the agentic notebook chat interface
 */

import { useRef, useCallback, useState } from 'react'
import { useCubeApi } from '../providers/CubeProvider'
import type { PortletBlock, MarkdownBlock } from '../stores/notebookStore'

/** Clean up raw API errors into user-friendly messages */
function formatUserFacingError(message: string): string {
  // Detect raw JSON error payloads (e.g. from Anthropic API)
  if (message.startsWith('{') || message.includes('"type":"error"')) {
    try {
      const parsed = JSON.parse(message.replace(/^Error:\s*/, ''))
      const errorType = parsed.error?.type || parsed.type || ''
      const friendly: Record<string, string> = {
        overloaded_error: 'The AI service is temporarily busy. Please try again in a moment.',
        rate_limit_error: 'Too many requests. Please wait a moment and try again.',
        api_error: 'The AI service encountered an error. Please try again.',
        authentication_error: 'Authentication failed. Please check your configuration.',
      }
      return friendly[errorType] || 'The AI service encountered an error. Please try again.'
    } catch {
      return 'The AI service encountered an error. Please try again.'
    }
  }
  // HTTP status errors
  if (message.startsWith('Agent request failed:')) {
    const status = message.match(/\d+/)?.[0]
    if (status === '429') return 'Too many requests. Please wait a moment and try again.'
    if (status === '503' || status === '529') return 'The AI service is temporarily busy. Please try again in a moment.'
    return 'The AI service is temporarily unavailable. Please try again.'
  }
  return message
}

interface AgentSSEEvent {
  type: 'text_delta' | 'tool_use_start' | 'tool_use_result' | 'add_portlet' | 'add_markdown' | 'dashboard_saved' | 'turn_complete' | 'done' | 'error'
  data: any
}

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
    function handleEvent(event: AgentSSEEvent) {
      const cb = callbacksRef.current
      switch (event.type) {
        case 'text_delta':
          cb.onTextDelta(event.data)
          break
        case 'tool_use_start':
          cb.onToolStart(event.data.id, event.data.name, event.data.input)
          break
        case 'tool_use_result':
          cb.onToolResult(event.data.id, event.data.name, event.data.result, event.data.isError)
          break
        case 'add_portlet':
          cb.onAddPortlet({
            ...event.data,
            type: 'portlet',
          })
          break
        case 'add_markdown':
          cb.onAddMarkdown({
            ...event.data,
            type: 'markdown',
          })
          break
        case 'dashboard_saved':
          cb.onDashboardSaved?.(event.data)
          break
        case 'turn_complete':
          cb.onTurnComplete?.()
          break
        case 'done':
          cb.onDone(event.data.sessionId, event.data.traceId)
          break
        case 'error':
          cb.onError(event.data.message)
          break
      }
    }

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

      // Build headers matching CubeClient's auth pattern
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(cubeApi as any).headers,
      }

      // Add agent API key if provided
      if (agentApiKey) {
        headers['X-Agent-Api-Key'] = agentApiKey
      }
      if (agentProvider) {
        headers['X-Agent-Provider'] = agentProvider
      }
      if (agentModel) {
        headers['X-Agent-Model'] = agentModel
      }
      if (agentProviderEndpoint) {
        headers['X-Agent-Provider-Endpoint'] = agentProviderEndpoint
      }

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
          const lines = eventStr.trim().split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: AgentSSEEvent = JSON.parse(line.slice(6))
                handleEvent(event)
              } catch {
                // Skip malformed events
              }
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const lines = buffer.trim().split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: AgentSSEEvent = JSON.parse(line.slice(6))
              handleEvent(event)
            } catch {
              // Skip malformed events
            }
          }
        }
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
