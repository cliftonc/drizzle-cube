import { CubeQuery, CubeApiOptions, CubeResultSet, CubeValidationIssue, ExplainResult, ExplainOptions } from '../types.js';
/**
 * A failed query, carrying the server's structured validation detail when it
 * sent any. A caller can then react to one dead member — dropping a column for
 * a deleted attribute, say — instead of only seeing prose.
 */
export declare class CubeQueryError extends Error {
    readonly status?: number;
    readonly issues?: CubeValidationIssue[];
    constructor(message: string, status?: number, issues?: CubeValidationIssue[]);
}
export declare class CubeClient {
    private apiUrl;
    private headers;
    private credentials;
    constructor(token?: string, options?: CubeApiOptions);
    load(query: CubeQuery, options?: {
        bustCache?: boolean;
    }): Promise<CubeResultSet>;
    meta(): Promise<any>;
    sql(query: CubeQuery): Promise<any>;
    dryRun(query: CubeQuery): Promise<any>;
    /**
     * Execute EXPLAIN on a query to get the execution plan
     * Returns normalized plan across PostgreSQL, MySQL, and SQLite
     * Accepts standard queries, funnel queries ({ funnel: {...} }), or flow queries ({ flow: {...} })
     */
    explain(query: CubeQuery | unknown, options?: ExplainOptions): Promise<ExplainResult>;
    /**
     * Execute multiple queries in a single batch request
     * Used by BatchCoordinator to optimize network requests
     * Pass { bustCache: true } to bypass server-side cache
     */
    batchLoad(queries: CubeQuery[], options?: {
        bustCache?: boolean;
    }): Promise<CubeResultSet[]>;
}
/**
 * Factory function to create a cube client
 */
export declare function createCubeClient(token?: string, options?: CubeApiOptions): CubeClient;
export declare function cube(token?: string, options?: CubeApiOptions): CubeClient;
