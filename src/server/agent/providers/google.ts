/**
 * Google Gemini LLM Provider
 * Implements the LLMProvider interface for Google Gemini models via @google/generative-ai.
 */

import type { LLMProvider, ToolDefinition, InternalMessage, ToolResult, NormalizedEvent, ContentBlock } from './types'

/**
 * Convert JSON Schema type strings to Gemini's uppercase SchemaType enum values.
 * Gemini requires uppercase type values like "STRING", "NUMBER", "OBJECT", etc.
 */
function convertSchemaForGemini(schema: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(schema)) {
    if (key === 'type' && typeof value === 'string') {
      result[key] = value.toUpperCase()
    } else if (key === 'properties' && typeof value === 'object' && value !== null) {
      const props: Record<string, unknown> = {}
      for (const [propKey, propValue] of Object.entries(value as Record<string, unknown>)) {
        if (typeof propValue === 'object' && propValue !== null) {
          props[propKey] = convertSchemaForGemini(propValue as Record<string, unknown>)
        } else {
          props[propKey] = propValue
        }
      }
      result[key] = props
    } else if (key === 'items' && typeof value === 'object' && value !== null) {
      result[key] = convertSchemaForGemini(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }

  return result
}

export class GoogleProvider implements LLMProvider {
  private apiKey: string
  private sdk: any
  private initialized = false

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async ensureSDK(): Promise<void> {
    if (this.initialized) return
    try {
      this.sdk = await import(/* webpackIgnore: true */ '@google/generative-ai')
    } catch {
      throw new Error('@google/generative-ai is required for the Google provider. Install it with: npm install @google/generative-ai')
    }
    this.initialized = true
  }

  async createStream(params: {
    model: string
    maxTokens: number
    system: string
    tools: ToolDefinition[]
    messages: InternalMessage[]
  }): Promise<AsyncIterable<unknown>> {
    await this.ensureSDK()

    const { GoogleGenerativeAI } = this.sdk
    const genAI = new GoogleGenerativeAI(this.apiKey)

    const model = genAI.getGenerativeModel({
      model: params.model,
      systemInstruction: params.system,
      generationConfig: {
        maxOutputTokens: params.maxTokens,
      },
    })

    const { messages } = this.formatMessages(params.messages, params.system)
    const tools = this.formatTools(params.tools)

    const result = await model.generateContentStream({
      contents: messages,
      tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
    })

    return result.stream
  }

  async *parseStreamEvents(stream: AsyncIterable<unknown>): AsyncGenerator<NormalizedEvent> {
    let stopReason = 'stop'
    let hadFunctionCall = false

    for await (const chunk of stream) {
      const c = chunk as any

      // Usage metadata
      if (c.usageMetadata) {
        yield {
          type: 'message_meta',
          inputTokens: c.usageMetadata.promptTokenCount,
          outputTokens: c.usageMetadata.candidatesTokenCount,
          stopReason: '',
        }
      }

      const candidate = c.candidates?.[0]
      if (!candidate) continue

      // Check finish reason
      if (candidate.finishReason) {
        if (candidate.finishReason === 'STOP') stopReason = 'stop'
        else if (candidate.finishReason === 'MAX_TOKENS') stopReason = 'max_tokens'
        else stopReason = candidate.finishReason
      }

      const parts = candidate.content?.parts
      if (!parts) continue

      for (const part of parts) {
        if (part.text && !part.thought) {
          yield { type: 'text_delta', text: part.text }
        }

        if (part.functionCall) {
          hadFunctionCall = true
          const id = `gemini-tc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
          // Preserve Gemini thoughtSignature for history replay (required by Gemini 3 models)
          const metadata: Record<string, unknown> | undefined = part.thoughtSignature
            ? { thoughtSignature: part.thoughtSignature }
            : undefined
          yield { type: 'tool_use_start', id, name: part.functionCall.name, ...(metadata ? { metadata } : {}) }
          yield { type: 'tool_input_delta', json: JSON.stringify(part.functionCall.args || {}) }
          yield { type: 'tool_use_end' }
        }
      }
    }

    // Function calls take precedence — Gemini sends finishReason: 'STOP' even with function calls
    yield {
      type: 'message_meta',
      stopReason: hadFunctionCall ? 'tool_use' : stopReason,
    }
  }

  formatTools(tools: ToolDefinition[]): unknown[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: convertSchemaForGemini(t.parameters),
    }))
  }

  formatMessages(messages: InternalMessage[], _system: string): { messages: unknown[] } {
    // Gemini uses 'user' and 'model' roles, system instruction is separate.
    // Tool results are sent as 'user' messages with functionResponse parts.
    const formatted: unknown[] = []

    for (const msg of messages) {
      if (msg.role === 'tool_result') {
        // Tool results stored by formatToolResults() — convert to Gemini functionResponse parts
        const results = (msg as any)._toolResults as ToolResult[] | undefined
        if (results && results.length > 0) {
          formatted.push({
            role: 'user',
            parts: results.map((r) => ({
              functionResponse: {
                name: r.toolName || r.toolUseId,
                response: { content: r.content, isError: r.isError || false },
              },
            })),
          })
        } else {
          // Fallback for history replay or raw tool_result messages
          const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
          if (text) {
            formatted.push({ role: 'user', parts: [{ text }] })
          }
        }
      } else if (msg.role === 'user') {
        const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        formatted.push({ role: 'user', parts: [{ text }] })
      } else if (msg.role === 'assistant') {
        if (typeof msg.content === 'string') {
          formatted.push({ role: 'model', parts: [{ text: msg.content }] })
        } else {
          const blocks = msg.content as ContentBlock[]
          const parts: unknown[] = []

          for (const block of blocks) {
            if (block.type === 'text' && block.text) {
              parts.push({ text: block.text })
            } else if (block.type === 'tool_use') {
              const fcPart: Record<string, unknown> = {
                functionCall: {
                  name: block.name!,
                  args: block.input || {},
                },
              }
              // Preserve Gemini thoughtSignature for history replay (required by Gemini 3 models)
              if (block.metadata?.thoughtSignature) {
                fcPart.thoughtSignature = block.metadata.thoughtSignature
              }
              parts.push(fcPart)
            }
          }

          if (parts.length > 0) {
            formatted.push({ role: 'model', parts })
          }
        }
      }
    }

    return { messages: formatted }
  }

  formatToolResults(results: ToolResult[]): unknown {
    // Return as InternalMessage with tool results attached.
    // formatMessages() reads _toolResults to build Gemini functionResponse parts.
    return {
      role: 'tool_result',
      content: results.map((r) => `${r.toolName || r.toolUseId}: ${r.content}`).join('\n'),
      _toolResults: results,
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
    const anyError = error as any

    if (anyError.status === 429) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    if (anyError.status === 403 || anyError.status === 401) {
      return 'Authentication failed. Please check your API key configuration.'
    }
    if (anyError.status === 503 || anyError.status === 500) {
      return 'The AI service is temporarily unavailable. Please try again in a moment.'
    }

    // Gemini-specific error patterns
    if (msg.includes('SAFETY')) {
      return 'The request was blocked by safety filters. Please rephrase your request.'
    }
    if (msg.includes('RECITATION')) {
      return 'The response was blocked due to recitation concerns. Please try a different query.'
    }

    // Check for raw JSON
    if (msg.startsWith('{') || msg.startsWith('[')) {
      return 'The AI service encountered an error. Please try again.'
    }

    return msg
  }
}
