/**
 * Agent Chat Handler — step helpers
 * Pure per-step / per-branch extractions for handleAgentChat. Each helper keeps
 * the exact behaviour and emitted output of the original inline code; the public
 * handler simply orchestrates them.
 */

import type { AgentSSEEvent, AgentHistoryMessage, AgentConfig } from './types'
import type { ContentBlock, InternalMessage, NormalizedEvent, ToolResult, LLMProvider } from './providers/types'
import type { ToolExecutionResult } from './tools'

type AgentObservability = AgentConfig['observability']
type ToolExecutorMap = Map<string, (input: Record<string, unknown>) => Promise<ToolExecutionResult>>

/** Push provider-formatted tool results onto the message list (array or single). */
export function pushFormattedResults(messages: InternalMessage[], formatted: unknown): void {
  if (Array.isArray(formatted)) {
    // OpenAI returns an array of messages (one per tool result)
    for (const r of formatted) {
      messages.push(r as InternalMessage)
    }
  } else {
    // Anthropic/Google return a single user message
    messages.push(formatted as InternalMessage)
  }
}

/** Run an observability callback, swallowing any error (must never break the agent). */
export function safeObserve(fn: (() => void) | undefined): void {
  if (!fn) return
  try {
    fn()
  } catch { /* observability must never break the agent */ }
}

/** Rebuild conversation messages from stored history (e.g. after notebook reload). */
export function rebuildMessagesFromHistory(
  history: AgentHistoryMessage[] | undefined,
  provider: LLMProvider
): InternalMessage[] {
  const messages: InternalMessage[] = []
  if (!history || history.length === 0) return messages

  for (const msg of history) {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.content })
      continue
    }
    if (msg.role !== 'assistant') continue

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
      pushFormattedResults(messages, provider.formatToolResults(toolResults))
    } else if (contentBlocks.length > 0) {
      messages.push({ role: 'assistant', content: msg.content })
    }
  }

  return messages
}

/** Accumulated result of consuming one assistant generation stream. */
export interface ConsumedStream {
  contentBlocks: ContentBlock[]
  stopReason: string
  inputTokens?: number
  outputTokens?: number
}

/** Finalize a tool_use block's input by parsing its accumulated JSON. */
function finalizeToolInput(block: ContentBlock | undefined, json: string): void {
  if (block?.type !== 'tool_use' || !json) return
  try {
    block.input = JSON.parse(json)
  } catch {
    block.input = {}
  }
}

/** Mutable accumulator state threaded through the per-event branch handlers. */
interface StreamAccumulator {
  contentBlocks: ContentBlock[]
  currentToolInputJson: string
  currentBlockIsToolUse: boolean
  stopReason: string
  inputTokens?: number
  outputTokens?: number
}

/** Append a text delta to the current text block (or open a new one). */
function applyTextDelta(acc: StreamAccumulator, text: string): void {
  const lastBlock = acc.contentBlocks[acc.contentBlocks.length - 1]
  if (lastBlock && lastBlock.type === 'text') {
    lastBlock.text = (lastBlock.text || '') + text
  } else {
    acc.contentBlocks.push({ type: 'text', text })
  }
}

/** Open a new tool_use block, finalizing any previous tool's accumulated input. */
function applyToolUseStart(acc: StreamAccumulator, e: Extract<NormalizedEvent, { type: 'tool_use_start' }>): void {
  // Finalize previous tool's input before starting a new one
  // (OpenAI can return multiple tool calls; the handler tracks a single accumulator)
  if (acc.currentBlockIsToolUse && acc.currentToolInputJson) {
    const prevBlock = acc.contentBlocks[acc.contentBlocks.length - 1]
    if (prevBlock?.type === 'tool_use') {
      try { prevBlock.input = JSON.parse(acc.currentToolInputJson) } catch { /* keep {} */ }
    }
  }
  acc.contentBlocks.push({ type: 'tool_use', id: e.id, name: e.name, input: {}, ...(e.metadata ? { metadata: e.metadata } : {}) })
  acc.currentToolInputJson = ''
  acc.currentBlockIsToolUse = true
}

/** Resolve a tool_use block's final input from provider-supplied or accumulated JSON. */
function applyToolUseEnd(acc: StreamAccumulator, e: Extract<NormalizedEvent, { type: 'tool_use_end' }>): void {
  // Provider-supplied parsed input (OpenAI includes it) — find block by ID
  if (e.id && e.input) {
    const block = acc.contentBlocks.find(b => b.type === 'tool_use' && b.id === e.id)
    if (block) block.input = e.input
  } else if (acc.currentBlockIsToolUse) {
    // Fallback: parse accumulated JSON for the current (last) tool_use block
    const block = acc.contentBlocks[acc.contentBlocks.length - 1]
    if (block?.type === 'tool_use' && acc.currentToolInputJson) {
      finalizeToolInput(block, acc.currentToolInputJson)
      acc.currentToolInputJson = ''
    }
    acc.currentBlockIsToolUse = false
  }
}

/**
 * Consume a provider's normalized stream, accumulating the assistant's content
 * blocks and yielding text/tool SSE events. Returns the accumulated blocks,
 * stop reason and token usage.
 */
export async function* consumeAssistantStream(
  provider: LLMProvider,
  stream: AsyncIterable<unknown>
): AsyncGenerator<AgentSSEEvent, ConsumedStream> {
  const acc: StreamAccumulator = {
    contentBlocks: [],
    currentToolInputJson: '',
    currentBlockIsToolUse: false,
    stopReason: '',
  }

  for await (const event of provider.parseStreamEvents(stream)) {
    const e = event as NormalizedEvent
    switch (e.type) {
      case 'text_delta':
        applyTextDelta(acc, e.text)
        yield { type: 'text_delta', data: e.text }
        break
      case 'tool_use_start':
        applyToolUseStart(acc, e)
        yield { type: 'tool_use_start', data: { id: e.id, name: e.name, input: undefined } }
        break
      case 'tool_input_delta':
        acc.currentToolInputJson += e.json
        break
      case 'tool_use_end':
        applyToolUseEnd(acc, e)
        break
      case 'message_meta':
        if (e.inputTokens != null) acc.inputTokens = e.inputTokens
        if (e.outputTokens != null) acc.outputTokens = e.outputTokens
        if (e.stopReason) acc.stopReason = e.stopReason
        break
    }
  }

  return {
    contentBlocks: acc.contentBlocks,
    stopReason: acc.stopReason,
    inputTokens: acc.inputTokens,
    outputTokens: acc.outputTokens,
  }
}

/** Context shared across tool executions within a single turn. */
export interface ToolExecContext {
  executor: ToolExecutorMap
  observability: AgentObservability
  traceId: string
  turn: number
}

/**
 * Execute one tool-use block, yielding its SSE events and returning the ToolResult
 * to append for the next turn. Mirrors the original inline branch behaviour exactly.
 */
async function* executeToolBlock(
  block: ContentBlock,
  ctx: ToolExecContext
): AsyncGenerator<AgentSSEEvent, ToolResult> {
  const { executor, observability, traceId, turn } = ctx
  const toolName = block.name!
  const toolInput = (block.input || {}) as Record<string, unknown>
  const toolUseId = block.id!

  const executorFn = executor.get(toolName)
  if (!executorFn) {
    yield {
      type: 'tool_use_result',
      data: { id: toolUseId, name: toolName, result: `Unknown tool: ${toolName}`, isError: true }
    }
    return { toolUseId, toolName, content: `Unknown tool: ${toolName}`, isError: true }
  }

  const toolStart = Date.now()
  try {
    const execResult = await executorFn(toolInput)

    // Emit side-effect SSE event if present (add_portlet, add_markdown)
    if (execResult.sideEffect) {
      yield execResult.sideEffect
    }

    yield {
      type: 'tool_use_result',
      data: { id: toolUseId, name: toolName, result: execResult.result, ...(execResult.isError ? { isError: true } : {}) }
    }

    safeObserve(() => observability?.onToolEnd?.({
      traceId, turn, toolName, toolUseId,
      isError: !!execResult.isError,
      durationMs: Date.now() - toolStart,
    }))

    return {
      toolUseId,
      toolName,
      content: execResult.result,
      ...(execResult.isError ? { isError: true } : {})
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Tool execution failed'
    yield {
      type: 'tool_use_result',
      data: { id: toolUseId, name: toolName, result: errorMsg, isError: true }
    }

    safeObserve(() => observability?.onToolEnd?.({
      traceId, turn, toolName, toolUseId,
      isError: true,
      durationMs: Date.now() - toolStart,
    }))

    return { toolUseId, toolName, content: errorMsg, isError: true }
  }
}

/**
 * Execute all tool-use blocks in the assistant's response, yielding their SSE
 * events and returning the collected ToolResults.
 */
export async function* executeToolCalls(
  contentBlocks: ContentBlock[],
  ctx: ToolExecContext
): AsyncGenerator<AgentSSEEvent, ToolResult[]> {
  const toolResults: ToolResult[] = []
  for (const block of contentBlocks) {
    if (block.type !== 'tool_use') continue
    const result = yield* executeToolBlock(block, ctx)
    toolResults.push(result)
  }
  return toolResults
}
