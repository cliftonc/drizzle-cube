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
import type { InternalMessage } from './providers/types'
import { buildAgentSystemPrompt } from './system-prompt'
import { getToolDefinitions, createToolExecutor } from './tools'
import { createProvider } from './providers/factory'
import type { ProviderName } from './providers/factory'
import {
  safeObserve,
  rebuildMessagesFromHistory,
  consumeAssistantStream,
  executeToolCalls,
  pushFormattedResults,
} from './handler-steps'

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
  safeObserve(() => observability?.onChatStart?.({
    traceId,
    sessionId,
    message,
    model,
    historyLength: history?.length ?? 0,
  }))

  // Conversation messages — rebuild from history if provided (e.g. after notebook reload)
  const messages: InternalMessage[] = rebuildMessagesFromHistory(history, provider)

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
      const generationStart = Date.now()
      const { contentBlocks, stopReason, inputTokens, outputTokens } =
        yield* consumeAssistantStream(provider, stream)

      // Notify observability that this generation (API call) has completed
      safeObserve(() => observability?.onGenerationEnd?.({
        traceId,
        turn,
        model,
        stopReason,
        inputTokens,
        outputTokens,
        durationMs: Date.now() - generationStart,
        input: messages,
        output: contentBlocks,
      }))

      // Push the complete assistant message into conversation history
      messages.push({ role: 'assistant', content: contentBlocks })

      // If the model didn't request tool use, we're done
      if (!provider.shouldContinue(stopReason)) {
        break
      }

      // Execute all tool calls and collect results (emits SSE events as it goes)
      const toolResults = yield* executeToolCalls(contentBlocks, {
        executor,
        observability,
        traceId,
        turn,
      })

      // Signal end of this turn before starting the next
      yield { type: 'turn_complete', data: {} as Record<string, never> }

      // Push tool results for the next turn (provider formats them)
      pushFormattedResults(messages, provider.formatToolResults(toolResults))
    }

    safeObserve(() => observability?.onChatEnd?.({
      traceId,
      sessionId,
      totalTurns: lastTurn,
      durationMs: Date.now() - chatStartTime,
    }))

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
