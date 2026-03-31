/**
 * Agent Chat Handler
 * Core streaming handler using the LLM provider abstraction with a manual agentic loop.
 * Makes direct HTTP API calls — no subprocess spawning, fully edge-runtime compatible.
 * Supports Anthropic, OpenAI, Google Gemini, and OpenAI-compatible providers.
 */

import { t } from '../../i18n/runtime'
import type { SemanticLayerCompiler } from '../compiler'
import type { SecurityContext } from '../types'
import type { AgentConfig, AgentSSEEvent, AgentHistoryMessage } from './types'
import type { ContentBlock, InternalMessage, NormalizedEvent, ToolResult } from './providers/types'
import { buildAgentSystemPrompt } from './system-prompt'
import { getToolDefinitions, createToolExecutor } from './tools'
import { createProvider } from './providers/factory'
import type { ProviderName } from './providers/factory'

/** Default models per provider */
const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4.1-mini',
  google: 'gemini-3-flash-preview',
}

/**
 * Handle an agent chat request, yielding SSE events as the agent works.
 *
 * Uses the configured LLM provider with streaming for edge-runtime compatibility.
 * Implements a manual agentic loop: send messages → stream response → execute
 * tool calls → append results → repeat until the model stops requesting tools.
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
  /** Per-request overrides from client headers (take precedence over agentConfig) */
  providerOverride?: string
  modelOverride?: string
  baseURLOverride?: string
}): AsyncGenerator<AgentSSEEvent> {
  const { message, history, semanticLayer, securityContext, agentConfig, apiKey } = options
  const sessionId = options.sessionId || crypto.randomUUID()
  const observability = agentConfig.observability
  const traceId = crypto.randomUUID()
  const chatStartTime = Date.now()

  // Resolve provider and model — per-request overrides take precedence
  const providerName: ProviderName = (options.providerOverride as ProviderName) || agentConfig.provider || 'anthropic'
  const model = options.modelOverride || agentConfig.model || DEFAULT_MODELS[providerName] || 'claude-sonnet-4-6'
  const baseURL = options.baseURLOverride || agentConfig.baseURL
  const maxTurns = agentConfig.maxTurns || 25
  const maxTokens = agentConfig.maxTokens || 4096

  // Create the LLM provider
  let provider
  try {
    provider = await createProvider(providerName, apiKey, { baseURL })
  } catch (error) {
    console.error('[agent] Failed to create %s provider: %s', String(providerName).replace(/\n|\r/g, ''), String(error instanceof Error ? error.message : error).replace(/\n|\r/g, ''))
    yield {
      type: 'error',
      data: {
        message: error instanceof Error ? error.message : t('server.errors.llmInitFailed')
      }
    }
    return
  }

  // Build tool definitions and executor
  const tools = getToolDefinitions()
  const executor = createToolExecutor({ semanticLayer, securityContext })

  // Build system prompt from cube metadata + optional per-request context
  const metadata = semanticLayer.getMetadata()
  let systemPrompt = buildAgentSystemPrompt(metadata)
  if (options.systemContext) {
    systemPrompt += `\n\n## User Context\n\n${options.systemContext}`
  }

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
  const messages: InternalMessage[] = []

  if (history && history.length > 0) {
    for (const msg of history) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content })
      } else if (msg.role === 'assistant') {
        // Build content blocks from the stored message
        const contentBlocks: ContentBlock[] = []
        if (msg.content) {
          contentBlocks.push({ type: 'text', text: msg.content })
        }
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          for (const tc of msg.toolCalls) {
            contentBlocks.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: (tc.input || {}) as Record<string, unknown>,
            })
          }
          // Push assistant message
          messages.push({ role: 'assistant', content: contentBlocks })
          // Push tool results as a tool_result message
          const toolResults: ToolResult[] = msg.toolCalls.map((tc) => ({
            toolUseId: tc.id,
            toolName: tc.name,
            content: typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result ?? ''),
            isError: tc.status === 'error',
          }))
          const formattedResults = provider.formatToolResults(toolResults)
          // Push the formatted results directly as an internal message
          if (Array.isArray(formattedResults)) {
            // OpenAI returns an array of messages
            for (const r of formattedResults) {
              messages.push(r as InternalMessage)
            }
          } else {
            messages.push(formattedResults as InternalMessage)
          }
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

      // Call the LLM with streaming
      const stream = await provider.createStream({
        model,
        maxTokens,
        system: systemPrompt,
        tools,
        messages,
      })

      // Process normalized stream events and accumulate the assistant's response
      const contentBlocks: ContentBlock[] = []
      let currentToolInputJson = ''
      let stopReason = ''
      let inputTokens: number | undefined
      let outputTokens: number | undefined
      const generationStart = Date.now()

      // Track current block state
      let currentBlockIsToolUse = false

      for await (const event of provider.parseStreamEvents(stream)) {
        const e = event as NormalizedEvent

        switch (e.type) {
          case 'text_delta': {
            // Append text to current text block or create one
            const lastBlock = contentBlocks[contentBlocks.length - 1]
            if (lastBlock && lastBlock.type === 'text') {
              lastBlock.text = (lastBlock.text || '') + e.text
            } else {
              contentBlocks.push({ type: 'text', text: e.text })
            }
            yield { type: 'text_delta', data: e.text }
            break
          }

          case 'tool_use_start': {
            // Finalize previous tool's input before starting a new one
            // (OpenAI can return multiple tool calls; the handler tracks a single accumulator)
            if (currentBlockIsToolUse && currentToolInputJson) {
              const prevBlock = contentBlocks[contentBlocks.length - 1]
              if (prevBlock?.type === 'tool_use') {
                try { prevBlock.input = JSON.parse(currentToolInputJson) } catch { /* keep {} */ }
              }
            }
            contentBlocks.push({ type: 'tool_use', id: e.id, name: e.name, input: {}, ...(e.metadata ? { metadata: e.metadata } : {}) })
            currentToolInputJson = ''
            currentBlockIsToolUse = true
            yield {
              type: 'tool_use_start',
              data: { id: e.id, name: e.name, input: undefined }
            }
            break
          }

          case 'tool_input_delta': {
            currentToolInputJson += e.json
            break
          }

          case 'tool_use_end': {
            // Provider-supplied parsed input (OpenAI includes it) — find block by ID
            if (e.id && e.input) {
              const block = contentBlocks.find(b => b.type === 'tool_use' && b.id === e.id)
              if (block) block.input = e.input
            } else if (currentBlockIsToolUse) {
              // Fallback: parse accumulated JSON for the current (last) tool_use block
              const block = contentBlocks[contentBlocks.length - 1]
              if (block?.type === 'tool_use' && currentToolInputJson) {
                try {
                  block.input = JSON.parse(currentToolInputJson)
                } catch {
                  block.input = {}
                }
                currentToolInputJson = ''
              }
              currentBlockIsToolUse = false
            }
            break
          }

          case 'message_meta': {
            if (e.inputTokens != null) inputTokens = e.inputTokens
            if (e.outputTokens != null) outputTokens = e.outputTokens
            if (e.stopReason) stopReason = e.stopReason
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
          input: messages,
          output: contentBlocks,
        })
      } catch { /* observability must never break the agent */ }

      // Push the complete assistant message into conversation history
      messages.push({ role: 'assistant', content: contentBlocks })

      // If the model didn't request tool use, we're done
      if (!provider.shouldContinue(stopReason)) {
        break
      }

      // Execute all tool calls and collect results
      const toolResults: ToolResult[] = []

      for (const block of contentBlocks) {
        if (block.type !== 'tool_use') continue

        const toolName = block.name!
        const toolInput = (block.input || {}) as Record<string, unknown>
        const toolUseId = block.id!

        const executorFn = executor.get(toolName)
        if (!executorFn) {
          toolResults.push({
            toolUseId,
            toolName,
            content: `Unknown tool: ${toolName}`,
            isError: true
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
            toolUseId,
            toolName,
            content: execResult.result,
            ...(execResult.isError ? { isError: true } : {})
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
            toolUseId,
            toolName,
            content: errorMsg,
            isError: true
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

      // Push tool results for the next turn (provider formats them)
      const formattedResults = provider.formatToolResults(toolResults)
      if (Array.isArray(formattedResults)) {
        // OpenAI returns an array of messages (one per tool result)
        for (const r of formattedResults) {
          messages.push(r as InternalMessage)
        }
      } else {
        // Anthropic/Google return a single user message
        messages.push(formattedResults as InternalMessage)
      }
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

    console.error('[agent] Chat error (provider=%s, model=%s): %s', String(providerName).replace(/\n|\r/g, ''), String(model).replace(/\n|\r/g, ''), String(error instanceof Error ? error.message : error).replace(/\n|\r/g, ''))
    yield {
      type: 'error',
      data: {
        message: provider.formatError(error)
      }
    }
  }
}
