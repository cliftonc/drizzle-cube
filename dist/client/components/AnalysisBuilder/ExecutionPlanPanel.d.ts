import { ExplainResult, AIExplainAnalysis } from '../../types.js';
interface ExecutionPlanPanelProps {
    /** The generated SQL to display */
    sql: {
        sql: string;
        params?: unknown[];
    } | null | undefined;
    /** Whether SQL is loading */
    sqlLoading?: boolean;
    /** Error loading SQL */
    sqlError?: Error | null;
    /** Placeholder text when no SQL */
    sqlPlaceholder?: string;
    /** EXPLAIN plan result */
    explainResult: ExplainResult | null;
    /** Whether EXPLAIN is running */
    explainLoading?: boolean;
    /** Whether EXPLAIN has been run at least once */
    explainHasRun?: boolean;
    /** Error running EXPLAIN */
    explainError?: Error | null;
    /** Run EXPLAIN with options */
    runExplain: (options: {
        analyze: boolean;
    }) => void;
    /** AI analysis result */
    aiAnalysis?: AIExplainAnalysis | null;
    /** Whether AI analysis is in progress */
    aiAnalysisLoading?: boolean;
    /** Error from AI analysis */
    aiAnalysisError?: Error | null;
    /** Run AI analysis */
    runAIAnalysis?: (explainResult: ExplainResult, query: unknown) => void;
    /** Clear AI analysis (unused but kept for interface compatibility) */
    clearAIAnalysis?: () => void;
    /** Whether AI is enabled */
    enableAI?: boolean;
    /** The query object for AI context */
    query?: unknown;
    /** Title for the SQL block */
    title?: string;
    /** Height for the SQL block */
    height?: string;
}
/**
 * ExecutionPlanPanel - Displays SQL, EXPLAIN results, and AI analysis
 */
export declare const ExecutionPlanPanel: import('react').MemoExoticComponent<({ sql, sqlLoading, sqlError, sqlPlaceholder, explainResult, explainLoading, explainHasRun, explainError, runExplain, aiAnalysis, aiAnalysisLoading, aiAnalysisError, runAIAnalysis, clearAIAnalysis: _clearAIAnalysis, enableAI, query, title, height, }: ExecutionPlanPanelProps) => import("react").JSX.Element>;
export default ExecutionPlanPanel;
