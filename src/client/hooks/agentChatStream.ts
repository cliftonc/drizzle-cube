/**
 * Pure helpers for useAgentChat.
 *
 * Extracted to keep the hook's sendMessage callback focused on orchestration.
 * No React imports — these are testable pure functions.
 */

import type { PortletBlock, MarkdownBlock } from '../stores/notebookStore.js'

/** Clean up raw API errors into user-friendly messages */
export function formatUserFacingError(message: string): string {
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

export interface AgentSSEEvent {
  type: 'text_delta' | 'tool_use_start' | 'tool_use_result' | 'add_portlet' | 'add_markdown' | 'dashboard_saved' | 'turn_complete' | 'done' | 'error'
  data: any
}

/** Subset of the hook options that handleAgentEvent dispatches to. */
export interface AgentEventCallbacks {
  onAddPortlet: (data: PortletBlock) => void
  onAddMarkdown: (data: MarkdownBlock) => void
  onDashboardSaved?: (data: { title: string; description?: string; dashboardConfig: any }) => void
  onTextDelta: (text: string) => void
  onToolStart: (id: string, name: string, input?: unknown) => void
  onToolResult: (id: string, name: string, result?: unknown, isError?: boolean) => void
  onDone: (sessionId: string, traceId?: string) => void
  onTurnComplete?: () => void
  onError: (message: string) => void
}

/** Dispatch a single decoded SSE event to the relevant callback. */
export function handleAgentEvent(event: AgentSSEEvent, cb: AgentEventCallbacks): void {
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

/**
 * Parse one block of SSE text (possibly multi-line) and dispatch each
 * `data: ` line. Malformed JSON lines are skipped silently.
 */
export function dispatchSSEBlock(block: string, dispatch: (event: AgentSSEEvent) => void): void {
  const lines = block.trim().split('\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const event: AgentSSEEvent = JSON.parse(line.slice(6))
        dispatch(event)
      } catch {
        // Skip malformed events
      }
    }
  }
}

export interface AgentRequestHeaderOptions {
  baseHeaders?: Record<string, string>
  agentApiKey?: string
  agentProvider?: string
  agentModel?: string
  agentProviderEndpoint?: string
}

/** Build request headers matching CubeClient's auth pattern plus agent overrides. */
export function buildAgentHeaders(opts: AgentRequestHeaderOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts.baseHeaders,
  }
  if (opts.agentApiKey) {
    headers['X-Agent-Api-Key'] = opts.agentApiKey
  }
  if (opts.agentProvider) {
    headers['X-Agent-Provider'] = opts.agentProvider
  }
  if (opts.agentModel) {
    headers['X-Agent-Model'] = opts.agentModel
  }
  if (opts.agentProviderEndpoint) {
    headers['X-Agent-Provider-Endpoint'] = opts.agentProviderEndpoint
  }
  return headers
}
