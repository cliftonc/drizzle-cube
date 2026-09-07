import { AgentSSEEvent, AgentHistoryMessage, AgentConfig } from './types.js';
import { ContentBlock, InternalMessage, ToolResult, LLMProvider } from './providers/types.js';
import { ToolExecutionResult } from './tools.js';
type AgentObservability = AgentConfig['observability'];
type ToolExecutorMap = Map<string, (input: Record<string, unknown>) => Promise<ToolExecutionResult>>;
/** Push provider-formatted tool results onto the message list (array or single). */
export declare function pushFormattedResults(messages: InternalMessage[], formatted: unknown): void;
/** Run an observability callback, swallowing any error (must never break the agent). */
export declare function safeObserve(fn: (() => void) | undefined): void;
/** Rebuild conversation messages from stored history (e.g. after notebook reload). */
export declare function rebuildMessagesFromHistory(history: AgentHistoryMessage[] | undefined, provider: LLMProvider): InternalMessage[];
/** Accumulated result of consuming one assistant generation stream. */
export interface ConsumedStream {
    contentBlocks: ContentBlock[];
    stopReason: string;
    inputTokens?: number;
    outputTokens?: number;
}
/**
 * Consume a provider's normalized stream, accumulating the assistant's content
 * blocks and yielding text/tool SSE events. Returns the accumulated blocks,
 * stop reason and token usage.
 */
export declare function consumeAssistantStream(provider: LLMProvider, stream: AsyncIterable<unknown>): AsyncGenerator<AgentSSEEvent, ConsumedStream>;
/** Context shared across tool executions within a single turn. */
export interface ToolExecContext {
    executor: ToolExecutorMap;
    observability: AgentObservability;
    traceId: string;
    turn: number;
}
/**
 * Execute all tool-use blocks in the assistant's response, yielding their SSE
 * events and returning the collected ToolResults.
 */
export declare function executeToolCalls(contentBlocks: ContentBlock[], ctx: ToolExecContext): AsyncGenerator<AgentSSEEvent, ToolResult[]>;
export {};
