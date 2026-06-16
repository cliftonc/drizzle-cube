/**
 * Agent Module - Public Exports
 * Agentic AI notebook handler for drizzle-cube
 */

export { handleAgentChat } from './handler.js'
export { getToolDefinitions, createToolExecutor } from './tools.js'
export type { ToolExecutionResult } from './tools.js'
export { buildAgentSystemPrompt } from './system-prompt.js'
export { createProvider } from './providers/index.js'
export type { LLMProvider, ProviderName } from './providers/index.js'
export type {
  AgentChatRequest,
  AgentConfig,
  AgentObservabilityHooks,
  AgentSSEEvent,
  AgentHistoryMessage,
  AgentHistoryToolCall,
  PortletBlockData,
  MarkdownBlockData,
  DashboardSavedData
} from './types.js'
