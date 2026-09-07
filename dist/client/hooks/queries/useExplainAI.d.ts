import { ExplainResult, AIExplainAnalysis } from '../../types.js';
export interface UseExplainAIOptions {
    /**
     * Custom AI endpoint for explain analysis
     * @default '/api/ai/explain/analyze'
     */
    aiEndpoint?: string;
}
export interface UseExplainAIResult {
    /** The AI analysis result */
    analysis: AIExplainAnalysis | null;
    /** Whether AI analysis is in progress */
    isAnalyzing: boolean;
    /** Error if AI analysis failed */
    error: Error | null;
    /**
     * Trigger AI analysis of an explain result
     * @param explainResult - The EXPLAIN result to analyze
     * @param query - The original semantic query
     */
    analyze: (explainResult: ExplainResult, query: unknown) => void;
    /** Clear the analysis result */
    clearAnalysis: () => void;
}
/**
 * Query key for AI explain analysis
 */
export declare const EXPLAIN_AI_QUERY_KEY: readonly ["cube", "explain", "ai"];
/**
 * TanStack Query hook for AI analysis of EXPLAIN plans
 *
 * This hook uses useMutation to call the AI endpoint and analyze execution plans,
 * providing actionable recommendations for performance improvement.
 *
 * Recommendations focus on what users CAN control:
 * - Index creation (with CREATE INDEX statements)
 * - Table structure changes
 * - Cube definition improvements (segments, pre-aggregations, joins)
 *
 * Usage:
 * ```tsx
 * const { analysis, isAnalyzing, analyze } = useExplainAI()
 *
 * // After running EXPLAIN
 * if (explainResult) {
 *   <button onClick={() => analyze(explainResult, query)}>
 *     {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
 *   </button>
 * }
 *
 * // Display recommendations
 * {analysis?.recommendations.map(rec => (
 *   <div key={rec.title}>
 *     <h4>{rec.title}</h4>
 *     <p>{rec.description}</p>
 *     {rec.sql && <pre>{rec.sql}</pre>}
 *     {rec.cubeCode && <pre>{rec.cubeCode}</pre>}
 *   </div>
 * ))}
 * ```
 */
export declare function useExplainAI(options?: UseExplainAIOptions): UseExplainAIResult;
