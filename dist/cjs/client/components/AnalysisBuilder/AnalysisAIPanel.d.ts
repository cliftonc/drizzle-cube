/**
 * AnalysisAIPanel Component
 *
 * A collapsible panel for AI-powered query generation.
 * Appears above the results panel when activated.
 */
export interface AnalysisAIPanelProps {
    /** User's natural language prompt */
    userPrompt: string;
    /** Callback when prompt changes */
    onPromptChange: (prompt: string) => void;
    /** Whether a query is being generated */
    isGenerating: boolean;
    /** Error message from generation */
    error: string | null;
    /** Whether the AI has generated a query */
    hasGeneratedQuery: boolean;
    /** Callback to generate query */
    onGenerate: () => void;
    /** Callback to accept the generated query */
    onAccept: () => void;
    /** Callback to cancel and restore previous state */
    onCancel: () => void;
}
export default function AnalysisAIPanel({ userPrompt, onPromptChange, isGenerating, error, hasGeneratedQuery, onGenerate, onAccept, onCancel }: AnalysisAIPanelProps): import("react").JSX.Element;
