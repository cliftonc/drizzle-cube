/**
 * Agent Types
 * Types for the agentic AI notebook handler
 */

import type { ChartType, ChartAxisConfig, ChartDisplayConfig, DashboardConfig } from '../../client/types'

/**
 * A tool call from a prior conversation turn (for history replay)
 */
export interface AgentHistoryToolCall {
  id: string
  name: string
  input?: unknown
  result?: unknown
  status: 'running' | 'complete' | 'error'
}

/**
 * A message from a prior conversation (for history replay)
 */
export interface AgentHistoryMessage {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: AgentHistoryToolCall[]
}

/**
 * Request body for the agent chat endpoint
 */
export interface AgentChatRequest {
  /** User message to send to the agent */
  message: string
  /** Session ID for multi-turn conversations */
  sessionId?: string
  /** Prior conversation history for session continuity (e.g. after notebook reload) */
  history?: AgentHistoryMessage[]
}

/**
 * Observability hooks for tracing agent chat lifecycle events.
 * Called synchronously (fire-and-forget) — implementations should not throw.
 */
export interface AgentObservabilityHooks {
  /** Called once when agent chat starts */
  onChatStart?: (event: {
    traceId: string
    sessionId?: string
    message: string
    model: string
    historyLength: number
  }) => void

  /** Called after each Anthropic API call completes */
  onGenerationEnd?: (event: {
    traceId: string
    turn: number
    model: string
    stopReason: string
    inputTokens?: number
    outputTokens?: number
    durationMs: number
  }) => void

  /** Called after each tool execution */
  onToolEnd?: (event: {
    traceId: string
    turn: number
    toolName: string
    toolUseId: string
    isError: boolean
    durationMs: number
  }) => void

  /** Called when agent chat completes */
  onChatEnd?: (event: {
    traceId: string
    sessionId?: string
    totalTurns: number
    durationMs: number
    error?: string
  }) => void
}

/**
 * Agent configuration options (provided in adapter options).
 * Uses `@anthropic-ai/sdk` (the standard Anthropic API client) for direct
 * HTTP API calls — no subprocess spawning, fully edge-runtime compatible.
 */
export interface AgentConfig {
  /** Server-side Anthropic API key */
  apiKey?: string
  /** Model to use (default: 'claude-sonnet-4-6') */
  model?: string
  /** Maximum agentic turns per request (default: 25) */
  maxTurns?: number
  /** Maximum tokens per response (default: 4096) */
  maxTokens?: number
  /** Allow X-Agent-Api-Key header to override server apiKey */
  allowClientApiKey?: boolean
  /** Optional observability hooks for tracing */
  observability?: AgentObservabilityHooks
}

/**
 * Data for an add_portlet tool call
 */
export interface PortletBlockData {
  id: string
  title: string
  query: string
  chartType: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
}

/**
 * Data for an add_markdown tool call
 */
export interface MarkdownBlockData {
  id: string
  title?: string
  content: string
}

/**
 * Data emitted when the agent saves a dashboard via the save_as_dashboard tool.
 * The client receives this via SSE and can persist the config however it chooses.
 */
export interface DashboardSavedData {
  title: string
  description?: string
  dashboardConfig: DashboardConfig
}

/**
 * SSE events emitted by the agent handler
 */
export type AgentSSEEvent =
  | { type: 'text_delta'; data: string }
  | { type: 'tool_use_start'; data: { id: string; name: string; input?: unknown } }
  | { type: 'tool_use_result'; data: { id: string; name: string; result?: unknown; isError?: boolean } }
  | { type: 'add_portlet'; data: PortletBlockData }
  | { type: 'add_markdown'; data: MarkdownBlockData }
  | { type: 'dashboard_saved'; data: DashboardSavedData }
  | { type: 'turn_complete'; data: Record<string, never> }
  | { type: 'done'; data: { sessionId: string; traceId?: string } }
  | { type: 'error'; data: { message: string } }
