import { CubeQuery } from '../../../types.js';
import { QueryAnalysis } from '../../../shared/types.js';
/**
 * Generate markdown representation of query execution plan.
 */
export declare function generateExecutionPlanMarkdown(analysis: QueryAnalysis, query: CubeQuery | null, sql?: {
    sql: string;
} | null): string;
