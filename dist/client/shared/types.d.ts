import { CubeQuery } from '../types.js';
export interface MetaField {
    name: string;
    title: string;
    shortTitle: string;
    type: string;
    description?: string;
}
export interface MetaCubeRelationship {
    targetCube: string;
    relationship: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany';
    joinFields?: Array<{
        sourceField: string;
        targetField: string;
    }>;
}
export interface MetaCube {
    name: string;
    title: string;
    description: string;
    measures: MetaField[];
    dimensions: MetaField[];
    segments: MetaField[];
    relationships?: MetaCubeRelationship[];
}
export interface MetaResponse {
    cubes: MetaCube[];
}
/**
 * Severity level for query warnings
 */
export type QueryWarningSeverity = 'info' | 'warning' | 'error';
/**
 * Warning emitted during query planning or execution
 * Provides user-facing feedback about potential query issues
 */
export interface QueryWarning {
    /** Unique code for programmatic handling (e.g., 'FAN_OUT_NO_DIMENSIONS') */
    code: string;
    /** Human-readable warning message */
    message: string;
    /** Severity level for UI styling */
    severity: QueryWarningSeverity;
    /** Cubes involved in the warning (if applicable) */
    cubes?: string[];
    /** Measures involved in the warning (if applicable) */
    measures?: string[];
    /** Actionable suggestion for the user */
    suggestion?: string;
}
export type PrimaryCubeSelectionReason = 'most_dimensions' | 'most_connected' | 'alphabetical_fallback' | 'single_cube';
export interface PrimaryCubeCandidate {
    cubeName: string;
    dimensionCount: number;
    joinCount: number;
    canReachAll: boolean;
}
export interface PrimaryCubeAnalysis {
    selectedCube: string;
    reason: PrimaryCubeSelectionReason;
    explanation: string;
    candidates?: PrimaryCubeCandidate[];
}
export interface JoinPathStep {
    fromCube: string;
    toCube: string;
    relationship: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany';
    joinType: 'inner' | 'left' | 'right' | 'full';
    joinColumns: Array<{
        sourceColumn: string;
        targetColumn: string;
    }>;
    junctionTable?: {
        tableName: string;
        sourceColumns: string[];
        targetColumns: string[];
    };
}
export interface JoinPathAnalysis {
    targetCube: string;
    pathFound: boolean;
    path?: JoinPathStep[];
    pathLength?: number;
    error?: string;
    visitedCubes?: string[];
    selection?: {
        strategy: 'shortest' | 'preferred' | 'fallbackShortest';
        preferredCubes?: string[];
        selectedRank?: number;
        selectedScore?: number;
        candidates?: Array<{
            rank: number;
            score: number;
            usesPreferredJoin: boolean;
            preferredCubesInPath: number;
            usesProcessed: boolean;
            scoreBreakdown: {
                preferredJoinBonus: number;
                preferredCubeBonus: number;
                lengthPenalty: number;
            };
            path: JoinPathStep[];
        }>;
    };
}
/**
 * Reason why a cube requires a CTE
 */
export type CTEReason = 'hasMany' | 'fanOutPrevention';
export interface PreAggregationAnalysis {
    cubeName: string;
    cteAlias: string;
    /** Why this cube needs a CTE (human-readable explanation) */
    reason: string;
    /** Typed reason for programmatic use */
    reasonType?: CTEReason;
    measures: string[];
    joinKeys: Array<{
        sourceColumn: string;
        targetColumn: string;
    }>;
}
export interface QuerySummary {
    queryType: 'single_cube' | 'multi_cube_join' | 'multi_cube_cte';
    measureStrategy?: 'simple' | 'keysDeduplication' | 'ctePreAggregateFallback' | 'multiFactMerge';
    joinCount: number;
    cteCount: number;
    hasPreAggregation: boolean;
}
export interface QueryAnalysis {
    timestamp: string;
    cubeCount: number;
    cubesInvolved: string[];
    primaryCube: PrimaryCubeAnalysis;
    joinPaths: JoinPathAnalysis[];
    preAggregations: PreAggregationAnalysis[];
    querySummary: QuerySummary;
    warnings?: string[];
    planningTrace?: {
        steps: Array<{
            phase: 'cube_usage' | 'primary_cube_selection' | 'join_planning' | 'cte_planning' | 'measure_strategy' | 'warnings';
            decision: string;
            details?: Record<string, unknown>;
        }>;
    };
}
export interface ValidationResult {
    valid?: boolean;
    error?: string;
    query?: CubeQuery;
    sql?: {
        sql: string[];
        params: any[];
    };
    queryType?: string;
    normalizedQueries?: any[];
    queryOrder?: string[];
    transformedQueries?: any[];
    pivotQuery?: any;
    complexity?: string;
    cubesUsed?: string[];
    joinType?: string;
    analysis?: QueryAnalysis;
}
export type { FilterOperatorMeta } from './filters/operators.js';
export { FILTER_OPERATORS } from './filters/operators.js';
export type DateRangeType = 'custom' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'last_7_days' | 'last_30_days' | 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'last_12_months' | 'last_n_days' | 'last_n_weeks' | 'last_n_months' | 'last_n_quarters' | 'last_n_years';
export interface DateRangeOption {
    value: DateRangeType;
    label: string;
}
export declare const DATE_RANGE_OPTIONS: DateRangeOption[];
export declare const TIME_GRANULARITIES: {
    value: string;
    label: string;
}[];
export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
