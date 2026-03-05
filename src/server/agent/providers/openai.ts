/**
 * OpenAI LLM Provider
 * Implements the LLMProvider interface for OpenAI models and OpenAI-compatible services
 * (Groq, Together, Mistral, Ollama, etc.) via configurable baseURL.
 */

import type { LLMProvider, ToolDefinition, InternalMessage, ToolResult, NormalizedEvent, ContentBlock } from './types'

export class OpenAIProvider implements LLMProvider {
  private client: any
  private apiKey: string
  private baseURL?: string
  private initialized = false

  constructor(apiKey: string, options?: { baseURL?: string }) {
    this.apiKey = apiKey
    this.baseURL = options?.baseURL
  }

  private async ensureClient(): Promise<void> {
    if (this.initialized) return
    let OpenAI: any
    try {
      const sdk = await import(/* webpackIgnore: true */ 'openai')
      OpenAI = sdk.default || sdk.OpenAI || sdk
    } catch {
      throw new Error('openai is required for the OpenAI provider. Install it with: npm install openai')
    }
    const opts: Record<string, unknown> = { apiKey: this.apiKey }
    if (this.baseURL) {
      opts.baseURL = this.baseURL
    }
    this.client = new OpenAI(opts)
    this.initialized = true
  }

  async createStream(params: {
    model: string
    maxTokens: number
    system: string
    tools: ToolDefinition[]
    messages: InternalMessage[]
  }): Promise<AsyncIterable<unknown>> {
    await this.ensureClient()

    const { messages } = this.formatMessages(params.messages, params.system)

    return this.client.chat.completions.create({
      model: params.model,
      max_completion_tokens: params.maxTokens,
      tools: this.formatTools(params.tools),
      messages,
      stream: true,
      stream_options: { include_usage: true },
    })
  }

  async *parseStreamEvents(stream: AsyncIterable<unknown>): AsyncGenerator<NormalizedEvent> {
    // OpenAI streams `chat.completion.chunk` events.
    // Tool calls are accumulated by index across multiple chunks.
    const activeToolCalls = new Map<number, { id: string; name: string; arguments: string }>()

    for await (const chunk of stream) {
      const c = chunk as any

      // Usage info comes in the final chunk (when stream_options.include_usage is set)
      if (c.usage) {
        yield {
          type: 'message_meta',
          inputTokens: c.usage.prompt_tokens,
          outputTokens: c.usage.completion_tokens,
          stopReason: '', // stop reason comes from choices
        }
      }

      const choice = c.choices?.[0]
      if (!choice) continue

      const delta = choice.delta
      if (!delta) continue

      // Text content
      if (delta.content) {
        yield { type: 'text_delta', text: delta.content }
      }

      // Tool calls — accumulated by index
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0

          if (tc.id) {
            // New tool call starting
            activeToolCalls.set(idx, { id: tc.id, name: tc.function?.name || '', arguments: '' })
            yield { type: 'tool_use_start', id: tc.id, name: tc.function?.name || '' }
          }

          if (tc.function?.name && activeToolCalls.has(idx)) {
            const entry = activeToolCalls.get(idx)!
            if (!entry.name) entry.name = tc.function.name
          }

          if (tc.function?.arguments) {
            const entry = activeToolCalls.get(idx)
            if (entry) {
              entry.arguments += tc.function.arguments
              yield { type: 'tool_input_delta', json: tc.function.arguments }
            }
          }
        }
      }

      // Finish reason
      if (choice.finish_reason) {
        // Emit tool_use_end for all active tool calls with parsed input
        for (const [idx, entry] of activeToolCalls) {
          let parsedInput: Record<string, unknown> = {}
          try { if (entry.arguments) parsedInput = JSON.parse(entry.arguments) } catch { /* ignore */ }
          yield { type: 'tool_use_end', id: entry.id, input: parsedInput }
          activeToolCalls.delete(idx)
        }

        yield {
          type: 'message_meta',
          stopReason: choice.finish_reason,
        }
      }
    }
  }

  formatTools(tools: ToolDefinition[]): unknown[] {
    return tools.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }))
  }

  formatMessages(messages: InternalMessage[], system: string): { messages: unknown[] } {
    // OpenAI uses system as the first message with role: 'system'
    const formatted: unknown[] = [{ role: 'system', content: system }]

    for (const msg of messages) {
      if (msg.role === 'user') {
        formatted.push({ role: 'user', content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) })
      } else if (msg.role === 'assistant') {
        if (typeof msg.content === 'string') {
          formatted.push({ role: 'assistant', content: msg.content })
        } else {
          // Convert content blocks to OpenAI format
          const blocks = msg.content as ContentBlock[]
          const textParts = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('')
          const toolCalls = blocks.filter((b) => b.type === 'tool_use').map((b) => ({
            id: b.id!,
            type: 'function' as const,
            function: {
              name: b.name!,
              arguments: JSON.stringify(b.input || {}),
            },
          }))

          const assistantMsg: Record<string, unknown> = { role: 'assistant' }
          if (textParts) assistantMsg.content = textParts
          if (toolCalls.length > 0) assistantMsg.tool_calls = toolCalls
          formatted.push(assistantMsg)
        }
      } else if ((msg as any).role === 'tool') {
        // Already-formatted tool result from formatToolResults() — pass through as-is
        formatted.push(msg)
      } else if (msg.role === 'tool_result') {
        // Raw tool_result (e.g. from other providers) — convert to user message as fallback
        formatted.push({ role: 'user', content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) })
      }
    }

    return { messages: formatted }
  }

  formatToolResults(results: ToolResult[]): unknown[] {
    // OpenAI uses separate role: 'tool' messages for each tool result
    return results.map((r) => ({
      role: 'tool',
      tool_call_id: r.toolUseId,
      content: r.content,
    }))
  }

  shouldContinue(stopReason: string): boolean {
    return stopReason === 'tool_calls'
  }

  formatError(error: unknown): string {
    if (!error || !(error instanceof Error)) {
      return 'Something went wrong. Please try again.'
    }

    const msg = error.message || ''
    const anyError = error as any

    // OpenAI SDK errors
    if (anyError.status === 429) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    if (anyError.status === 401) {
      return 'Authentication failed. Please check your API key configuration.'
    }
    if (anyError.status === 503 || anyError.status === 502) {
      return 'The AI service is temporarily unavailable. Please try again in a moment.'
    }
    if (anyError.status === 400) {
      return 'There was a problem with the request. Please try again.'
    }

    // Check for raw JSON messages
    if (msg.startsWith('{') || msg.startsWith('Error: {')) {
      return 'The AI service encountered an error. Please try again.'
    }

    return msg
  }
}
