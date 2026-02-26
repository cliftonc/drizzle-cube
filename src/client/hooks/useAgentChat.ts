/**
 * useAgentChat Hook
 * SSE streaming hook for the agentic notebook chat interface
 */

import { useRef, useCallback, useState } from 'react'
import { useCubeApi } from '../providers/CubeProvider'
import type { PortletBlock, MarkdownBlock } from '../stores/notebookStore'

interface AgentSSEEvent {
  type: 'text_delta' | 'tool_use_start' | 'tool_use_result' | 'add_portlet' | 'add_markdown' | 'turn_complete' | 'done' | 'error'
  data: any
}

export interface UseAgentChatOptions {
  /** Override default agent endpoint (default: apiUrl + '/agent/chat') */
  agentEndpoint?: string
  /** Client-side API key for demo/try-site use */
  agentApiKey?: string
  /** Called when agent adds a portlet to the notebook */
  onAddPortlet: (data: PortletBlock) => void
  /** Called when agent adds a markdown block to the notebook */
  onAddMarkdown: (data: MarkdownBlock) => void
  /** Called when streaming text arrives */
  onTextDelta: (text: string) => void
  /** Called when a tool call starts */
  onToolStart: (id: string, name: string, input?: unknown) => void
  /** Called when a tool call completes */
  onToolResult: (id: string, name: string, result?: unknown) => void
  /** Called when the agent completes with session ID */
  onDone: (sessionId: string) => void
  /** Called when a turn completes (between agentic turns) */
  onTurnComplete?: () => void
  /** Called on error */
  onError: (message: string) => void
}

export interface UseAgentChatResult {
  /** Send a message to the agent */
  sendMessage: (content: string, sessionId?: string | null) => Promise<void>
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
  const {
    agentEndpoint,
    agentApiKey,
    onAddPortlet,
    onAddMarkdown,
    onTextDelta,
    onToolStart,
    onToolResult,
    onTurnComplete,
    onDone,
    onError,
  } = options

  const { cubeApi } = useCubeApi()
  const abortControllerRef = useRef<AbortController | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = useCallback(async (content: string, sessionId?: string | null) => {
    function handleEvent(event: AgentSSEEvent) {
      switch (event.type) {
        case 'text_delta':
          onTextDelta(event.data)
          break
        case 'tool_use_start':
          onToolStart(event.data.id, event.data.name, event.data.input)
          break
        case 'tool_use_result':
          onToolResult(event.data.id, event.data.name, event.data.result)
          break
        case 'add_portlet':
          onAddPortlet({
            ...event.data,
            type: 'portlet',
          })
          break
        case 'add_markdown':
          onAddMarkdown({
            ...event.data,
            type: 'markdown',
          })
          break
        case 'turn_complete':
          onTurnComplete?.()
          break
        case 'done':
          onDone(event.data.sessionId)
          break
        case 'error':
          onError(event.data.message)
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

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: (cubeApi as any).credentials ?? 'include',
        body: JSON.stringify({
          message: content,
          ...(sessionId ? { sessionId } : {}),
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
        onError(error instanceof Error ? error.message : 'Stream failed')
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [cubeApi, agentEndpoint, agentApiKey, onAddPortlet, onAddMarkdown, onTextDelta, onToolStart, onToolResult, onTurnComplete, onDone, onError])

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
