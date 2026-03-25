# Agent (Agentic Notebook)

Streaming agentic chat handler that connects LLM providers to drizzle-cube's semantic layer via tool use. The agent receives natural-language messages, calls tools (discover cubes, execute queries, render charts), and streams SSE events back to the client. **This module uses LLMs** — contrast with `../ai/` which provides heuristic-only utilities with no LLM calls.

## Directory Layout

```
src/server/agent/
├── index.ts              Public exports
├── handler.ts            handleAgentChat — streaming agentic loop (async generator)
├── tools.ts              getToolDefinitions, createToolExecutor — 6 agent tools
├── chart-validation.ts   validateChartConfig, inferChartConfig — chart drop-zone validation
├── system-prompt.ts      buildAgentSystemPrompt — dynamic prompt from cube metadata
├── types.ts              AgentChatRequest, AgentConfig, AgentSSEEvent, etc.
│
└── providers/            Multi-provider LLM abstraction
    ├── index.ts           Re-exports
    ├── types.ts           LLMProvider interface, ToolDefinition, ContentBlock, NormalizedEvent
    ├── factory.ts         createProvider factory, ProviderName type
    ├── anthropic.ts       AnthropicProvider — Claude API (streaming)
    ├── openai.ts          OpenAIProvider — OpenAI/compatible API (streaming)
    └── google.ts          GoogleProvider — Gemini API (streaming)
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `handleAgentChat` | `handler.ts` | Core async generator — runs the agentic loop: prompt → stream → tool calls → repeat |
| `getToolDefinitions` | `tools.ts` | Returns provider-agnostic tool schemas for the 6 tools |
| `createToolExecutor` | `tools.ts` | Factory returning a function that executes tool calls against the semantic layer |
| `buildAgentSystemPrompt` | `system-prompt.ts` | Assembles system prompt from cube metadata + MCP prompt templates |
| `validateChartConfig` | `chart-validation.ts` | Validates chart config against drop-zone requirements from the chart registry |
| `inferChartConfig` | `chart-validation.ts` | Auto-fills missing chart config fields from query structure |
| `createProvider` | `providers/factory.ts` | Factory: `ProviderName` → `LLMProvider` instance |

## Agent Tools

| Tool Name | Purpose |
|-----------|---------|
| `discover_cubes` | List available cubes with their measures and dimensions |
| `get_cube_metadata` | Get detailed metadata for a specific cube |
| `execute_query` | Run a semantic query and return results |
| `add_portlet` | Add a chart/visualization portlet to the notebook |
| `add_markdown` | Add a markdown text block to the notebook |
| `save_as_dashboard` | Save the current notebook as a reusable dashboard |

## Guard Rails

1. All LLM calls go through the `LLMProvider` abstraction — never call provider APIs directly
2. Tool execution is sandboxed through the semantic layer compiler with security context
3. The agentic loop has a max-iterations guard to prevent runaway tool-use cycles
4. SSE events follow the `AgentSSEEvent` discriminated union — no ad-hoc event shapes
5. Provider selection supports runtime overrides via request headers (provider, model, baseURL)
