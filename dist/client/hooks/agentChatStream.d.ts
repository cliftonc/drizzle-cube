import { PortletBlock, MarkdownBlock } from '../stores/notebookStore.js';
/** Clean up raw API errors into user-friendly messages */
export declare function formatUserFacingError(message: string): string;
export interface AgentSSEEvent {
    type: 'text_delta' | 'tool_use_start' | 'tool_use_result' | 'add_portlet' | 'update_portlet' | 'add_markdown' | 'dashboard_saved' | 'turn_complete' | 'done' | 'error';
    data: any;
}
/** Subset of the hook options that handleAgentEvent dispatches to. */
export interface AgentEventCallbacks {
    onAddPortlet: (data: PortletBlock) => void;
    onUpdatePortlet?: (data: PortletBlock) => void;
    onAddMarkdown: (data: MarkdownBlock) => void;
    onDashboardSaved?: (data: {
        title: string;
        description?: string;
        dashboardConfig: any;
    }) => void;
    onTextDelta: (text: string) => void;
    onToolStart: (id: string, name: string, input?: unknown) => void;
    onToolResult: (id: string, name: string, result?: unknown, isError?: boolean, input?: unknown) => void;
    onDone: (sessionId: string, traceId?: string) => void;
    onTurnComplete?: () => void;
    onError: (message: string) => void;
}
/** Dispatch a single decoded SSE event to the relevant callback. */
export declare function handleAgentEvent(event: AgentSSEEvent, cb: AgentEventCallbacks): void;
/**
 * Parse one block of SSE text (possibly multi-line) and dispatch each
 * `data: ` line. Malformed JSON lines are skipped silently.
 */
export declare function dispatchSSEBlock(block: string, dispatch: (event: AgentSSEEvent) => void): void;
export interface AgentRequestHeaderOptions {
    baseHeaders?: Record<string, string>;
    agentApiKey?: string;
    agentProvider?: string;
    agentModel?: string;
    agentProviderEndpoint?: string;
}
/** Build request headers matching CubeClient's auth pattern plus agent overrides. */
export declare function buildAgentHeaders(opts: AgentRequestHeaderOptions): Record<string, string>;
