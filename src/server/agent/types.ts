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

  /** Called after each LLM API call completes */
  onGenerationEnd?: (event: {
    traceId: string
    turn: number
    model: string
    stopReason: string
    inputTokens?: number
    outputTokens?: number
    durationMs: number
    /** Messages array sent to the API */
    input?: unknown
    /** Assistant content blocks from the response */
    output?: unknown
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
 * Supports multiple LLM providers — defaults to Anthropic for backward compatibility.
 * All providers use direct HTTP API calls — no subprocess spawning, fully edge-runtime compatible.
 */
export interface AgentConfig {
  /**
   * LLM provider to use (default: 'anthropic').
   * - 'anthropic': Claude models via @anthropic-ai/sdk
   * - 'openai': OpenAI models via openai SDK (also supports Groq, Together, Mistral, Ollama via baseURL)
   * - 'google': Gemini models via @google/generative-ai
   */
  provider?: 'anthropic' | 'openai' | 'google'
  /**
   * Base URL for OpenAI-compatible providers.
   * Only used when provider is 'openai'. Examples:
   * - Groq: 'https://api.groq.com/openai/v1'
   * - Together: 'https://api.together.xyz/v1'
   * - Ollama: 'http://localhost:11434/v1'
   */
  baseURL?: string
  /** Server-side API key for the selected provider */
  apiKey?: string
  /** Model to use (default depends on provider: 'claude-sonnet-4-6' for Anthropic, 'gpt-4.1-mini' for OpenAI, 'gemini-3-flash-preview' for Google) */
  model?: string
  /** Maximum agentic turns per request (default: 25) */
  maxTurns?: number
  /** Maximum tokens per response (default: 4096) */
  maxTokens?: number
  /** Allow X-Agent-Api-Key header to override server apiKey */
  allowClientApiKey?: boolean
  /** Optional observability hooks for tracing */
  observability?: AgentObservabilityHooks
  /**
   * Build per-request system context for the LLM prompt from the authenticated security context.
   * Called on every agent chat request with the resolved security context.
   * The returned string is appended to the system prompt under "## User Context".
   *
   * @example
   * buildSystemContext: (securityContext) =>
   *   `User: ${securityContext.userName}, Role: ${securityContext.role}`
   */
  buildSystemContext?: (securityContext: Record<string, unknown>) => string | undefined
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
