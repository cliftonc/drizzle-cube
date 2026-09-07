import { default as React, ReactNode } from 'react';
import { NotebookConfig } from '../../stores/notebookStore.js';
import { ColorPalette } from '../../types.js';
export interface AgenticNotebookProps {
    /** Initial config to restore (saved notebooks) */
    config?: NotebookConfig;
    /** Override default agent endpoint (default: apiUrl + '/agent/chat') */
    agentEndpoint?: string;
    /** Client-side API key (for demo/try-site use) */
    agentApiKey?: string;
    /** Override LLM provider (anthropic | openai | google) */
    agentProvider?: string;
    /** Override LLM model (e.g. 'gpt-4o', 'gemini-2.0-flash') */
    agentModel?: string;
    /** Override provider endpoint URL (for OpenAI-compatible services) */
    agentProviderEndpoint?: string;
    /** Callback when notebook state changes (for persistence) */
    onSave?: (config: NotebookConfig) => void | Promise<void>;
    /** Callback when dirty state changes */
    onDirtyStateChange?: (isDirty: boolean) => void;
    /** Color palette for charts */
    colorPalette?: ColorPalette;
    /** Called when the agent saves a dashboard. Presence enables the "Save as Dashboard" button. */
    onDashboardSaved?: (data: {
        title: string;
        description?: string;
        dashboardConfig: any;
    }) => void;
    /** Called when user submits feedback (thumbs up/down). Receives traceId from the last agent response. */
    onScore?: (data: {
        traceId: string;
        value: number;
        comment?: string;
    }) => void;
    /** Custom loading indicator for tool call spinners (defaults to LoadingIndicator) */
    loadingComponent?: ReactNode;
    /** Additional CSS class name */
    className?: string;
    /** Initial prompt to auto-send on mount */
    initialPrompt?: string;
}
/**
 * AgenticNotebook - AI-powered data analysis notebook
 *
 * @example
 * ```tsx
 * <CubeProvider apiOptions={{ apiUrl: '/api/cubejs-api/v1' }} token={token}>
 *   <AgenticNotebook
 *     agentApiKey="sk-..."
 *     onSave={(config) => saveToDatabase(config)}
 *   />
 * </CubeProvider>
 * ```
 */
declare const AgenticNotebook: React.MemoExoticComponent<({ config, colorPalette, ...props }: AgenticNotebookProps) => React.JSX.Element>;
export default AgenticNotebook;
