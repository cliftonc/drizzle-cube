/**
 * Agent Chat Handler
 * Core streaming handler using the Anthropic Messages API with a manual agentic loop.
 * Makes direct HTTP API calls — no subprocess spawning, fully edge-runtime compatible.
 */

import type { SemanticLayerCompiler } from '../compiler'
import type { SecurityContext } from '../types'
import type { AgentConfig, AgentSSEEvent, AgentHistoryMessage } from './types'
import { buildAgentSystemPrompt } from './system-prompt'
import { getToolDefinitions, createToolExecutor } from './tools'

/**
 * Handle an agent chat request, yielding SSE events as the agent works.
 *
 * Uses the Anthropic Messages API (`@anthropic-ai/sdk`) with `stream: true`
 * (raw async iterable) for Cloudflare Workers / edge-runtime compatibility.
 * Implements a manual agentic loop: send messages → stream response → execute
 * tool calls → append results → repeat until stop_reason !== 'tool_use'.
 */
export async function* handleAgentChat(options: {
  message: string
  sessionId?: string
  history?: AgentHistoryMessage[]
  semanticLayer: SemanticLayerCompiler
  securityContext: SecurityContext
  agentConfig: AgentConfig
  apiKey: string
  /** Per-request context appended to the system prompt (e.g. user info, tenant context) */
  systemContext?: string
}): AsyncGenerator<AgentSSEEvent> {
  const { message, history, semanticLayer, securityContext, agentConfig, apiKey } = options
  const sessionId = options.sessionId || crypto.randomUUID()
  const observability = agentConfig.observability
  const traceId = crypto.randomUUID()
  const chatStartTime = Date.now()

  // Dynamically import the Anthropic SDK (optional peer dependency)
  let Anthropic: any
  try {
    const sdk = await import(/* webpackIgnore: true */ '@anthropic-ai/sdk')
    Anthropic = sdk.default || sdk.Anthropic || sdk
  } catch {
    yield {
      type: 'error',
      data: {
        message: '@anthropic-ai/sdk is required. Install it with: npm install @anthropic-ai/sdk'
      }
    }
    return
  }

  // Create the Anthropic client
  const client = new Anthropic({ apiKey })

  // Build tool definitions and executor
  const tools = getToolDefinitions()
  const executor = createToolExecutor({ semanticLayer, securityContext })

  // Build system prompt from cube metadata + optional per-request context
  const metadata = semanticLayer.getMetadata()
  let systemPrompt = buildAgentSystemPrompt(metadata)
  if (options.systemContext) {
    systemPrompt += `\n\n## User Context\n\n${options.systemContext}`
  }

  // Configure
  const model = agentConfig.model || 'claude-sonnet-4-6'
  const maxTurns = agentConfig.maxTurns || 25
  const maxTokens = agentConfig.maxTokens || 4096

  // Notify observability that chat has started
  try {
    observability?.onChatStart?.({
      traceId,
      sessionId,
      message,
      model,
      historyLength: history?.length ?? 0,
    })
  } catch { /* observability must never break the agent */ }

  // Conversation messages — rebuild from history if provided (e.g. after notebook reload)
  const messages: Array<{ role: string; content: unknown }> = []

  if (history && history.length > 0) {
    for (const msg of history) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content })
      } else if (msg.role === 'assistant') {
        // Build Anthropic content blocks from the stored message
        const contentBlocks: Array<{ type: string; [key: string]: unknown }> = []
        if (msg.content) {
          contentBlocks.push({ type: 'text', text: msg.content })
        }
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          for (const tc of msg.toolCalls) {
            contentBlocks.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.input || {},
            })
          }
          // Push assistant message
          messages.push({ role: 'assistant', content: contentBlocks })
          // Push tool results as the following user message
          messages.push({
            role: 'user',
            content: msg.toolCalls.map((tc) => ({
              type: 'tool_result',
              tool_use_id: tc.id,
              content: typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result ?? ''),
              ...(tc.status === 'error' ? { is_error: true } : {}),
            })),
          })
        } else if (contentBlocks.length > 0) {
          messages.push({ role: 'assistant', content: msg.content })
        }
      }
    }
  }

  // Add the new user message
  messages.push({ role: 'user', content: message })

  let lastTurn = 0
  try {
    for (let turn = 0; turn < maxTurns; turn++) {
      lastTurn = turn + 1
      // Call Messages API with streaming (raw async iterable — CF Workers safe)
      const stream = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        tools,
        messages,
        stream: true
      })

      // Accumulate the assistant's response
      const contentBlocks: Array<{ type: string; [key: string]: unknown }> = []
      let currentBlockIndex = -1
      let currentToolInputJson = ''
      let stopReason = ''
      let inputTokens: number | undefined
      let outputTokens: number | undefined
      const generationStart = Date.now()

      for await (const event of stream) {
        switch (event.type) {
          case 'content_block_start': {
            currentBlockIndex++
            const block = event.content_block as { type: string; id?: string; name?: string; text?: string }
            if (block.type === 'tool_use') {
              contentBlocks.push({ type: 'tool_use', id: block.id, name: block.name, input: {} })
              currentToolInputJson = ''
              yield {
                type: 'tool_use_start',
                data: { id: block.id!, name: block.name!, input: undefined }
              }
            } else if (block.type === 'text') {
              contentBlocks.push({ type: 'text', text: '' })
            }
            break
          }

          case 'content_block_delta': {
            const delta = event.delta as { type: string; text?: string; partial_json?: string }
            if (delta.type === 'text_delta' && delta.text) {
              // Append text to current block
              const textBlock = contentBlocks[currentBlockIndex]
              if (textBlock) {
                textBlock.text = (textBlock.text as string || '') + delta.text
              }
              yield { type: 'text_delta', data: delta.text }
            } else if (delta.type === 'input_json_delta' && delta.partial_json) {
              currentToolInputJson += delta.partial_json
            }
            break
          }

          case 'content_block_stop': {
            // If the current block is a tool_use, parse accumulated JSON
            const block = contentBlocks[currentBlockIndex]
            if (block?.type === 'tool_use' && currentToolInputJson) {
              try {
                block.input = JSON.parse(currentToolInputJson)
              } catch {
                block.input = {}
              }
              currentToolInputJson = ''
            }
            break
          }

          case 'message_start': {
            const msg = (event as any).message
            if (msg?.usage?.input_tokens != null) {
              inputTokens = msg.usage.input_tokens
            }
            break
          }

          case 'message_delta': {
            const messageDelta = event.delta as { stop_reason?: string }
            const deltaUsage = (event as any).usage
            if (deltaUsage?.output_tokens != null) {
              outputTokens = deltaUsage.output_tokens
            }
            if (messageDelta.stop_reason) {
              stopReason = messageDelta.stop_reason
            }
            break
          }
        }
      }

      // Notify observability that this generation (API call) has completed
      try {
        observability?.onGenerationEnd?.({
          traceId,
          turn,
          model,
          stopReason,
          inputTokens,
          outputTokens,
          durationMs: Date.now() - generationStart,
        })
      } catch { /* observability must never break the agent */ }

      // Push the complete assistant message into conversation history
      messages.push({ role: 'assistant', content: contentBlocks })

      // If the model didn't request tool use, we're done
      if (stopReason !== 'tool_use') {
        break
      }

      // Execute all tool calls and collect results
      const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }> = []

      for (const block of contentBlocks) {
        if (block.type !== 'tool_use') continue

        const toolName = block.name as string
        const toolInput = (block.input || {}) as Record<string, unknown>
        const toolUseId = block.id as string

        const executorFn = executor.get(toolName)
        if (!executorFn) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseId,
            content: `Unknown tool: ${toolName}`,
            is_error: true
          })
          yield {
            type: 'tool_use_result',
            data: { id: toolUseId, name: toolName, result: `Unknown tool: ${toolName}`, isError: true }
          }
          continue
        }

        const toolStart = Date.now()
        try {
          const execResult = await executorFn(toolInput)

          // Emit side-effect SSE event if present (add_portlet, add_markdown)
          if (execResult.sideEffect) {
            yield execResult.sideEffect
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseId,
            content: execResult.result,
            ...(execResult.isError ? { is_error: true } : {})
          })

          yield {
            type: 'tool_use_result',
            data: { id: toolUseId, name: toolName, result: execResult.result, ...(execResult.isError ? { isError: true } : {}) }
          }

          try {
            observability?.onToolEnd?.({
              traceId, turn, toolName, toolUseId,
              isError: !!execResult.isError,
              durationMs: Date.now() - toolStart,
            })
          } catch { /* observability must never break the agent */ }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Tool execution failed'
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUseId,
            content: errorMsg,
            is_error: true
          })
          yield {
            type: 'tool_use_result',
            data: { id: toolUseId, name: toolName, result: errorMsg, isError: true }
          }

          try {
            observability?.onToolEnd?.({
              traceId, turn, toolName, toolUseId,
              isError: true,
              durationMs: Date.now() - toolStart,
            })
          } catch { /* observability must never break the agent */ }
        }
      }

      // Signal end of this turn before starting the next
      yield { type: 'turn_complete', data: {} as Record<string, never> }

      // Push tool results as a user message for the next turn
      messages.push({ role: 'user', content: toolResults })
    }

    try {
      observability?.onChatEnd?.({
        traceId,
        sessionId,
        totalTurns: lastTurn,
        durationMs: Date.now() - chatStartTime,
      })
    } catch { /* observability must never break the agent */ }

    yield {
      type: 'done',
      data: { sessionId: sessionId || '', traceId }
    }
  } catch (error) {
    try {
      observability?.onChatEnd?.({
        traceId,
        sessionId,
        totalTurns: 0,
        durationMs: Date.now() - chatStartTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } catch { /* observability must never break the agent */ }

    yield {
      type: 'error',
      data: {
        message: formatAgentError(error)
      }
    }
  }
}

/**
 * Format agent errors into user-friendly messages.
 * Anthropic SDK errors contain raw JSON that shouldn't leak to users.
 */
function formatAgentError(error: unknown): string {
  if (!error || !(error instanceof Error)) {
    return 'Something went wrong. Please try again.'
  }

  const msg = error.message || ''

  // Anthropic API errors — extract the type and return a friendly message
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
