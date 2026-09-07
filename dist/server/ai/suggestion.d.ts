import { CubeMetadata } from '../types/metadata.js';
import { SemanticQuery } from '../types/query.js';
/**
 * Suggested query result
 */
export interface QuerySuggestion {
    query: Partial<SemanticQuery>;
    confidence: number;
    reasoning: string[];
    warnings?: string[];
    /** Detected analysis mode */
    analysisMode: 'query' | 'funnel' | 'flow' | 'retention';
    /** Next steps when mode != 'query' */
    nextSteps?: string[];
}
export declare function suggestQuery(metadata: CubeMetadata[], naturalLanguage: string, targetCube?: string): QuerySuggestion;
