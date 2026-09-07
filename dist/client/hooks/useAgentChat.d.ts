import { PortletBlock, MarkdownBlock } from '../stores/notebookStore.js';
export interface UseAgentChatOptions {
    /** Override default agent endpoint (default: apiUrl + '/agent/chat') */
    agentEndpoint?: string;
    /** Client-side API key for demo/try-site use */
    agentApiKey?: string;
    /** Override LLM provider (anthropic | openai | google) */
    agentProvider?: string;
    /** Override LLM model (e.g. 'gpt-4o', 'gemini-2.0-flash') */
    agentModel?: string;
    /** Override provider endpoint URL (for OpenAI-compatible services) */
    agentProviderEndpoint?: string;
    /** Called when agent adds a portlet to the notebook */
    onAddPortlet: (data: PortletBlock) => void;
    onUpdatePortlet?: (data: PortletBlock) => void;
    /** Called when agent adds a markdown block to the notebook */
    onAddMarkdown: (data: MarkdownBlock) => void;
    /** Called when the agent saves a dashboard configuration */
    onDashboardSaved?: (data: {
        title: string;
        description?: string;
        dashboardConfig: any;
    }) => void;
    /** Called when streaming text arrives */
    onTextDelta: (text: string) => void;
    /** Called when a tool call starts */
    onToolStart: (id: string, name: string, input?: unknown) => void;
    /** Called when a tool call completes */
    onToolResult: (id: string, name: string, result?: unknown, isError?: boolean) => void;
    /** Called when the agent completes with session ID and optional trace ID */
    onDone: (sessionId: string, traceId?: string) => void;
    /** Called when a turn completes (between agentic turns) */
    onTurnComplete?: () => void;
    /** Called on error */
    onError: (message: string) => void;
}
/** Simplified message format for sending conversation history */
export interface AgentHistoryMessage {
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: Array<{
        id: string;
        name: string;
        input?: unknown;
        result?: unknown;
        status: 'running' | 'complete' | 'error';
    }>;
}
export interface UseAgentChatResult {
    /** Send a message to the agent, optionally with prior conversation history */
    sendMessage: (content: string, sessionId?: string | null, history?: AgentHistoryMessage[]) => Promise<void>;
    /** Whether the agent is currently streaming */
    isStreaming: boolean;
    /** Abort the current stream */
    abort: () => void;
}
/**
 * Hook for streaming chat with the agentic notebook backend.
 * Uses fetch() with ReadableStream to consume SSE events.
 */
export declare function useAgentChat(options: UseAgentChatOptions): UseAgentChatResult;
