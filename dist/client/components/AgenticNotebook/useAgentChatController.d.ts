import { ChatMessage as ChatMessageType } from '../../stores/notebookStore.js';
interface UseAgentChatControllerParams {
    agentEndpoint?: string;
    agentApiKey?: string;
    agentProvider?: string;
    agentModel?: string;
    agentProviderEndpoint?: string;
    onDashboardSaved?: (data: {
        title: string;
        description?: string;
        dashboardConfig: any;
    }) => void;
    messages: ChatMessageType[];
    isStreaming: boolean;
}
export declare function useAgentChatController({ agentEndpoint, agentApiKey, agentProvider, agentModel, agentProviderEndpoint, onDashboardSaved, messages, isStreaming, }: UseAgentChatControllerParams): {
    doSend: (content: string) => void;
    handleStop: () => void;
    abort: () => void;
    isThinking: boolean;
    setIsThinking: import('react').Dispatch<import('react').SetStateAction<boolean>>;
    lastTraceId: string | null;
    setLastTraceId: import('react').Dispatch<import('react').SetStateAction<string | null>>;
};
export {};
