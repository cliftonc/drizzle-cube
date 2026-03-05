/**
 * Anthropic LLM Provider
 * Implements the LLMProvider interface for Claude models via @anthropic-ai/sdk.
 */

import type { LLMProvider, ToolDefinition, InternalMessage, ToolResult, NormalizedEvent } from './types'

export class AnthropicProvider implements LLMProvider {
  private client: any

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private apiKey: string
  private initialized = false

  private async ensureClient(): Promise<void> {
    if (this.initialized) return
    let Anthropic: any
    try {
      const sdk = await import(/* webpackIgnore: true */ '@anthropic-ai/sdk')
      Anthropic = sdk.default || sdk.Anthropic || sdk
    } catch {
      throw new Error('@anthropic-ai/sdk is required for the Anthropic provider. Install it with: npm install @anthropic-ai/sdk')
    }
    this.client = new Anthropic({ apiKey: this.apiKey })
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

    const { messages: formattedMessages, system } = this.formatMessages(params.messages, params.system)

    return this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens,
      system,
      tools: this.formatTools(params.tools),
      messages: formattedMessages,
      stream: true,
    })
  }

  async *parseStreamEvents(stream: AsyncIterable<unknown>): AsyncGenerator<NormalizedEvent> {
    for await (const event of stream) {
      const e = event as any

      switch (e.type) {
        case 'content_block_start': {
          const block = e.content_block as { type: string; id?: string; name?: string }
          if (block.type === 'tool_use') {
            yield { type: 'tool_use_start', id: block.id!, name: block.name! }
          }
          break
        }

        case 'content_block_delta': {
          const delta = e.delta as { type: string; text?: string; partial_json?: string }
          if (delta.type === 'text_delta' && delta.text) {
            yield { type: 'text_delta', text: delta.text }
          } else if (delta.type === 'input_json_delta' && delta.partial_json) {
            yield { type: 'tool_input_delta', json: delta.partial_json }
          }
          break
        }

        case 'content_block_stop': {
          yield { type: 'tool_use_end' }
          break
        }

        case 'message_start': {
          const msg = e.message
          // Emit partial meta with input tokens (output tokens come in message_delta)
          if (msg?.usage?.input_tokens != null) {
            yield {
              type: 'message_meta',
              inputTokens: msg.usage.input_tokens,
              stopReason: '',
            }
          }
          break
        }

        case 'message_delta': {
          const deltaUsage = e.usage
          const stopReason = e.delta?.stop_reason || ''
          yield {
            type: 'message_meta',
            outputTokens: deltaUsage?.output_tokens,
            stopReason,
          }
          break
        }
      }
    }
  }

  formatTools(tools: ToolDefinition[]): unknown[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }))
  }

  formatMessages(messages: InternalMessage[], system: string): { messages: unknown[]; system?: string } {
    // Anthropic uses `system` as a separate parameter and messages in their native format.
    // InternalMessage maps directly: user → user, assistant → assistant,
    // tool_result → user message with tool_result content blocks.
    const formatted = messages.map((msg) => {
      if (msg.role === 'tool_result') {
        // This shouldn't happen — tool results are already formatted before push.
        // But handle gracefully: convert to user message.
        return { role: 'user', content: msg.content }
      }
      return { role: msg.role, content: msg.content }
    })

    return { messages: formatted, system }
  }

  formatToolResults(results: ToolResult[]): unknown {
    return {
      role: 'user',
      content: results.map((r) => ({
        type: 'tool_result',
        tool_use_id: r.toolUseId,
        content: r.content,
        ...(r.isError ? { is_error: true } : {}),
      })),
    }
  }

  shouldContinue(stopReason: string): boolean {
    return stopReason === 'tool_use'
  }

  formatError(error: unknown): string {
    if (!error || !(error instanceof Error)) {
      return 'Something went wrong. Please try again.'
    }

    const msg = error.message || ''

    const ANTHROPIC_ERROR_MESSAGES: Record<string, string> = {
      overloaded_error: 'The AI service is temporarily overloaded. Please try again in a moment.',
      rate_limit_error: 'Too many requests. Please wait a moment and try again.',
      api_error: 'The AI service encountered an error. Please try again.',
      authentication_error: 'Authentication failed. Please check your API key configuration.',
      invalid_request_error: 'There was a problem with the request. Please try again.',
    }

    // Check for Anthropic SDK error with status/type
    const anyError = error as any
    if (anyError.status || anyError.type) {
      const errorType = anyError.error?.type || anyError.type || ''
      if (ANTHROPIC_ERROR_MESSAGES[errorType]) {
        return ANTHROPIC_ERROR_MESSAGES[errorType]
      }
    }

    // Check if the message looks like raw JSON
    if (msg.startsWith('{') || msg.startsWith('Error: {')) {
      try {
        const parsed = JSON.parse(msg.replace(/^Error:\s*/, ''))
        const errorType = parsed.error?.type || parsed.type || ''
        if (ANTHROPIC_ERROR_MESSAGES[errorType]) {
          return ANTHROPIC_ERROR_MESSAGES[errorType]
        }
      } catch {
        // Not JSON, fall through
      }
      return 'The AI service encountered an error. Please try again.'
    }

    return msg
  }
}
