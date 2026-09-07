import { CubeMetadata } from '../types/metadata.js';
import { QUERY_SCHEMAS } from './schemas.js';
/**
 * Discovery result for a cube
 */
export interface CubeDiscoveryResult {
    cube: string;
    title: string;
    description?: string;
    relevanceScore: number;
    matchedOn: ('name' | 'title' | 'description' | 'exampleQuestions' | 'measures' | 'dimensions')[];
    suggestedMeasures: string[];
    suggestedDimensions: string[];
    /**
     * Titles for suggested fields whose name does not say what they are — chiefly
     * user-defined (EAV) attributes, addressed as `attr_<id>`. Keyed by field name
     * so the names above stay copyable verbatim. Omitted when nothing needs it.
     */
    fieldTitles?: Record<string, string>;
    capabilities: {
        query: true;
        funnel: boolean;
        flow: boolean;
        retention: boolean;
    };
    analysisConfig?: {
        candidateBindingKeys: Array<{
            dimension: string;
            description?: string;
        }>;
        candidateTimeDimensions: Array<{
            dimension: string;
            description?: string;
        }>;
        candidateEventDimensions: Array<{
            dimension: string;
            description?: string;
        }>;
    };
    hints?: string[];
    querySchemas?: typeof QUERY_SCHEMAS;
}
/**
 * Discovery request options
 */
export interface DiscoveryOptions {
    /** Topic or intent to search for */
    topic?: string;
    /** Natural language intent */
    intent?: string;
    /** Maximum number of results */
    limit?: number;
    /** Minimum relevance score (0-1) */
    minScore?: number;
}
/**
 * Calculate Levenshtein distance between two strings
 */
export declare function levenshteinDistance(a: string, b: string): number;
/**
 * Discover relevant cubes based on topic or intent
 */
export declare function discoverCubes(metadata: CubeMetadata[], options?: DiscoveryOptions): CubeDiscoveryResult[];
/**
 * Find the best matching field across all cubes
 */
export declare function findBestFieldMatch(metadata: CubeMetadata[], fieldName: string, fieldType?: 'measure' | 'dimension'): {
    field: string;
    cube: string;
    score: number;
    type: 'measure' | 'dimension';
} | null;
