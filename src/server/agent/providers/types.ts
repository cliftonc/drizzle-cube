/**
 * LLM Provider Abstraction Types
 * Provider-agnostic interfaces for multi-provider LLM support in the agentic notebook.
 */

/**
 * Generic tool definition (provider-agnostic).
 * Each provider's formatTools() wraps this in its own format.
 */
export interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

/**
 * Provider-agnostic internal message format.
 * The handler uses this for the conversation history; providers convert on the way in/out.
 */
export interface InternalMessage {
  role: 'user' | 'assistant' | 'tool_result'
  content: string | ContentBlock[]
}

export interface ContentBlock {
  type: 'text' | 'tool_use'
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  /** Provider-specific metadata (e.g. Gemini thoughtSignature) */
  metadata?: Record<string, unknown>
}

export interface ToolResult {
  toolUseId: string
  /** Tool name — needed by some providers (e.g. Gemini's functionResponse) */
  toolName?: string
  content: string
  isError?: boolean
}

/**
 * Normalized stream events consumed by the handler's agentic loop.
 * Every provider must emit these — the handler never sees raw provider events.
 */
export type NormalizedEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'tool_use_start'; id: string; name: string; metadata?: Record<string, unknown> }
  | { type: 'tool_input_delta'; json: string }
  | { type: 'tool_use_end'; id?: string; input?: Record<string, unknown> }
  | { type: 'message_meta'; inputTokens?: number; outputTokens?: number; stopReason: string }

/**
 * The core provider interface.
 * Each LLM provider implements these 7 methods to integrate with the agentic loop.
 */
export interface LLMProvider {
  /** Create a streaming API call and return the raw iterable. */
  createStream(params: {
    model: string
    maxTokens: number
    system: string
    tools: ToolDefinition[]
    messages: InternalMessage[]
  }): Promise<AsyncIterable<unknown>>

  /** Parse the raw stream into normalized events the handler understands. */
  parseStreamEvents(stream: AsyncIterable<unknown>): AsyncGenerator<NormalizedEvent>

  /** Convert generic tool definitions to provider-specific format. */
  formatTools(tools: ToolDefinition[]): unknown[]

  /** Convert internal messages + system prompt to provider-specific format. */
  formatMessages(messages: InternalMessage[], system: string): { messages: unknown[]; system?: string }

  /** Convert tool results to provider-specific format for appending as a user message. */
  formatToolResults(results: ToolResult[]): unknown

  /** Return true if the stop reason means the model wants to continue (tool use). */
  shouldContinue(stopReason: string): boolean

  /** Format a provider-specific error into a user-friendly message. */
  formatError(error: unknown): string
}
