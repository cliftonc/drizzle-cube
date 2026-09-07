import { ReactNode } from 'react';
import { StoreApi } from 'zustand';
import { ChartType, ChartAxisConfig, ChartDisplayConfig } from '../types.js';
/**
 * A portlet block in the notebook
 */
export interface PortletBlock {
    id: string;
    type: 'portlet';
    title: string;
    query: string;
    chartType: ChartType;
    chartConfig?: ChartAxisConfig;
    displayConfig?: ChartDisplayConfig;
}
/**
 * A markdown text block in the notebook
 */
export interface MarkdownBlock {
    id: string;
    type: 'markdown';
    title?: string;
    content: string;
}
/**
 * A block in the notebook canvas
 */
export type NotebookBlock = PortletBlock | MarkdownBlock;
/**
 * A tool call record for display in chat messages
 */
export interface ToolCallRecord {
    id: string;
    name: string;
    input?: unknown;
    result?: unknown;
    status: 'running' | 'complete' | 'error';
}
/**
 * A chat message
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    error?: string;
    toolCalls?: ToolCallRecord[];
    timestamp: number;
}
/**
 * Serializable notebook config for save/load
 */
export interface NotebookConfig {
    blocks: NotebookBlock[];
    messages: ChatMessage[];
}
export interface NotebookStoreState {
    /** Ordered array of notebook blocks */
    blocks: NotebookBlock[];
    /** Chat message history */
    messages: ChatMessage[];
    /** Whether the agent is currently streaming a response */
    isStreaming: boolean;
    /** Agent SDK session ID for multi-turn conversations */
    sessionId: string | null;
    /** Chat input value */
    inputValue: string;
}
export interface NotebookStoreActions {
    addBlock: (block: NotebookBlock) => void;
    removeBlock: (id: string) => void;
    moveBlock: (id: string, direction: 'up' | 'down') => void;
    updateBlock: (id: string, updates: Partial<Omit<PortletBlock, 'id' | 'type'>>) => void;
    addMessage: (message: ChatMessage) => void;
    appendToLastAssistantMessage: (text: string) => void;
    setLastAssistantError: (error: string) => void;
    addToolCallToLastAssistant: (toolCall: ToolCallRecord) => void;
    updateLastToolCall: (update: Partial<ToolCallRecord>) => void;
    setIsStreaming: (streaming: boolean) => void;
    setSessionId: (id: string | null) => void;
    setInputValue: (value: string) => void;
    save: () => NotebookConfig;
    load: (config: NotebookConfig) => void;
    reset: () => void;
}
/**
 * Combined store type
 */
export type NotebookStore = NotebookStoreState & NotebookStoreActions;
/**
 * Create a new notebook store instance
 */
export declare function createNotebookStore(): Omit<Omit<StoreApi<NotebookStore>, "setState" | "devtools"> & {
    setState(partial: NotebookStore | Partial<NotebookStore> | ((state: NotebookStore) => NotebookStore | Partial<NotebookStore>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: NotebookStore | ((state: NotebookStore) => NotebookStore), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: NotebookStore, previousSelectedState: NotebookStore) => void): () => void;
        <U>(selector: (state: NotebookStore) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
            equalityFn?: ((a: U, b: U) => boolean) | undefined;
            fireImmediately?: boolean;
        } | undefined): () => void;
    };
};
export interface NotebookStoreProviderProps {
    children: ReactNode;
    /** Initial config to load */
    initialConfig?: NotebookConfig;
}
/**
 * Provider component that creates a store instance per AgenticNotebook
 */
export declare function NotebookStoreProvider({ children, initialConfig, }: NotebookStoreProviderProps): import("react").JSX.Element;
/**
 * Hook to access the notebook store from context
 * @throws Error if used outside of provider
 */
export declare function useNotebookStore<T>(selector: (state: NotebookStore) => T): T;
export declare const selectBlocks: (state: NotebookStore) => NotebookBlock[];
export declare const selectMessages: (state: NotebookStore) => ChatMessage[];
export declare const selectIsStreaming: (state: NotebookStore) => boolean;
export declare const selectSessionId: (state: NotebookStore) => string | null;
export declare const selectInputValue: (state: NotebookStore) => string;
export declare const selectChatState: (state: NotebookStore) => {
    messages: ChatMessage[];
    isStreaming: boolean;
    inputValue: string;
};
export declare const selectChatActions: (state: NotebookStore) => {
    addMessage: (message: ChatMessage) => void;
    appendToLastAssistantMessage: (text: string) => void;
    setLastAssistantError: (error: string) => void;
    addToolCallToLastAssistant: (toolCall: ToolCallRecord) => void;
    updateLastToolCall: (update: Partial<ToolCallRecord>) => void;
    setIsStreaming: (streaming: boolean) => void;
    setInputValue: (value: string) => void;
    setSessionId: (id: string | null) => void;
};
export declare const selectBlockActions: (state: NotebookStore) => {
    addBlock: (block: NotebookBlock) => void;
    removeBlock: (id: string) => void;
    moveBlock: (id: string, direction: "up" | "down") => void;
    updateBlock: (id: string, updates: Partial<Omit<PortletBlock, "id" | "type">>) => void;
};
