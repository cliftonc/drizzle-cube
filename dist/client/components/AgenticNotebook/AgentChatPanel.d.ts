import { default as React } from 'react';
interface AgentChatPanelProps {
    agentEndpoint?: string;
    agentApiKey?: string;
    agentProvider?: string;
    agentModel?: string;
    agentProviderEndpoint?: string;
    onClear?: () => void;
    /** Called when the agent saves a dashboard. Presence enables the "Save as Dashboard" button. */
    onDashboardSaved?: (data: {
        title: string;
        description?: string;
        dashboardConfig: any;
    }) => void;
    /** Called when user submits feedback (thumbs up/down) */
    onScore?: (data: {
        traceId: string;
        value: number;
        comment?: string;
    }) => void;
    /** Custom loading indicator for tool call spinners */
    loadingComponent?: React.ReactNode;
    /** Initial prompt to auto-send on mount */
    initialPrompt?: string;
}
declare const AgentChatPanel: React.MemoExoticComponent<({ agentEndpoint, agentApiKey, agentProvider, agentModel, agentProviderEndpoint, onClear, onDashboardSaved, onScore, loadingComponent, initialPrompt, }: AgentChatPanelProps) => React.JSX.Element>;
export default AgentChatPanel;
