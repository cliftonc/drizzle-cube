import { SemanticLayerCompiler } from '../compiler.js';
import { SecurityContext } from '../types/index.js';
import { AgentConfig, AgentSSEEvent, AgentHistoryMessage } from './types.js';
/**
 * Handle an agent chat request, yielding SSE events as the agent works.
 *
 * Uses the configured LLM provider with streaming for edge-runtime compatibility.
 * Implements a manual agentic loop: send messages → stream response → execute
 * tool calls → append results → repeat until the model stops requesting tools.
 */
export declare function handleAgentChat(options: {
    message: string;
    sessionId?: string;
    history?: AgentHistoryMessage[];
    semanticLayer: SemanticLayerCompiler;
    securityContext: SecurityContext;
    agentConfig: AgentConfig;
    apiKey: string;
    /** Per-request context appended to the system prompt (e.g. user info, tenant context) */
    systemContext?: string;
    /** Per-request overrides from client headers (take precedence over agentConfig) */
    providerOverride?: string;
    modelOverride?: string;
    baseURLOverride?: string;
}): AsyncGenerator<AgentSSEEvent>;
