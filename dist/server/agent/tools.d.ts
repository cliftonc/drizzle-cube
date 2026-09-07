import { BuiltInChartType } from '../../client/types.js';
import { SemanticLayerCompiler } from '../compiler.js';
import { SecurityContext } from '../types/index.js';
import { AgentSSEEvent } from './types.js';
import { ToolDefinition } from './providers/types.js';
/**
 * Result of executing a tool call
 */
export interface ToolExecutionResult {
    /** String content to return as tool_result */
    result: string;
    /** Whether the tool call errored */
    isError?: boolean;
    /** Optional SSE event to emit as a side effect (add_portlet, add_markdown) */
    sideEffect?: AgentSSEEvent;
}
/**
 * Chart types the notebook agent may create — an explicit list, not a derived
 * one, so widening it stays a product decision. It now covers every
 * `BuiltInChartType`: the config each one needs is expressible through the
 * `add_portlet` chartConfig/displayConfig schema below, and a narrower list was
 * making the agent reach for `bar` and `table` for everything.
 *
 * Two carry caveats the system prompt spells out rather than the schema:
 * `gauge` needs an explicit `maxValue` (it otherwise scales to the data and
 * reads as 100%), and `candlestick` needs its measures in OHLC order, which
 * JSON Schema cannot express.
 *
 * Typed against `BuiltInChartType` (type-only import — no runtime dependency on
 * the client graph) so a renamed or removed chart type fails `npm run typecheck`
 * here instead of silently offering the model a type that no longer renders.
 */
export declare const AGENT_ALLOWED_CHART_TYPES: BuiltInChartType[];
/**
 * Returns the array of tool definitions for the Anthropic Messages API.
 * Plain JSON schema — no Zod dependency.
 */
export declare function getToolDefinitions(): ToolDefinition[];
export declare function createToolExecutor(options: {
    semanticLayer: SemanticLayerCompiler;
    securityContext: SecurityContext;
}): Map<string, (input: Record<string, unknown>) => Promise<ToolExecutionResult>>;
