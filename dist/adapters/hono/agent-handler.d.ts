import { Context } from 'hono';
import { SemanticLayerCompiler } from '../../server/compiler.js';
import { SecurityContext } from '../../server/index.js';
import { AgentConfig } from '../../server/agent/types.js';
/**
 * Handle a `POST /agent/chat` request: validate input, resolve the API key and
 * overrides, then stream agent events as SSE. Mirrors the previous inline route.
 */
export declare function handleAgentChatRequest(c: Context, agentConfig: AgentConfig, semanticLayer: SemanticLayerCompiler, extractSecurityContext: (c: Context) => Promise<SecurityContext>): Promise<Response>;
