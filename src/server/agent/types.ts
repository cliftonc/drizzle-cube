/**
 * Agent Types
 * Types for the agentic AI notebook handler
 */

import type { ChartType, ChartAxisConfig, ChartDisplayConfig } from '../../client/types'

/**
 * Request body for the agent chat endpoint
 */
export interface AgentChatRequest {
  /** User message to send to the agent */
  message: string
  /** Session ID for multi-turn conversations */
  sessionId?: string
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
 * SSE events emitted by the agent handler
 */
export type AgentSSEEvent =
  | { type: 'text_delta'; data: string }
  | { type: 'tool_use_start'; data: { id: string; name: string; input?: unknown } }
  | { type: 'tool_use_result'; data: { id: string; name: string; result?: unknown; isError?: boolean } }
  | { type: 'add_portlet'; data: PortletBlockData }
  | { type: 'add_markdown'; data: MarkdownBlockData }
  | { type: 'turn_complete'; data: Record<string, never> }
  | { type: 'done'; data: { sessionId: string } }
  | { type: 'error'; data: { message: string } }
