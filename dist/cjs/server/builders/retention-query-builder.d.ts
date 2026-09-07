import { DatabaseAdapter } from '../adapters/base-adapter.js';
import { RetentionQueryConfig, RetentionResultRow } from '../types/retention.js';
import { Cube, QueryContext, SemanticQuery, AnalysisConfigValidationResult } from '../types/index.js';
export declare class RetentionQueryBuilder {
    private databaseAdapter;
    private filterBuilder;
    private dateTimeBuilder;
    constructor(databaseAdapter: DatabaseAdapter);
    /**
     * Check if query contains retention configuration
     */
    hasRetention(query: SemanticQuery): boolean;
    /**
     * Validate retention configuration against registered cubes
     */
    validateConfig(config: RetentionQueryConfig, cubes: Map<string, Cube>): AnalysisConfigValidationResult;
    /** Validate the retention time dimension (used for cohort entry and activity). */
    private validateTimeDimension;
    /** Validate the retention binding key (single member or per-cube mappings). */
    private validateBindingKey;
    /** Validate optional retention breakdown dimensions. */
    private validateBreakdownDimensions;
    /** Validate retention period bounds, granularity, and retention type. */
    private validatePeriodsAndEnums;
    /** Validate the (required) retention date range: presence, parseability, ordering. */
    private validateDateRange;
    /**
     * Build the retention SQL query using CTEs
     *
     * CTE Structure (Simplified Mixpanel-style):
     * 1. cohort_base - Users entering the cohort (first event in date range)
     *    - When breakdown is specified, includes breakdown_value
     * 2. activity_periods - All activity with period_number relative to cohort entry
     * 3. cohort_sizes - Aggregate cohort sizes (per breakdown value if applicable)
     * 4. retention_counts - Retained users per period (and breakdown value)
     * 5. Final SELECT - Join with retention rate calculation
     */
    buildRetentionQuery(config: RetentionQueryConfig, cubes: Map<string, Cube>, context: QueryContext): any;
    /**
     * Transform raw SQL results to RetentionResultRow[]
     */
    transformResult(rawResult: unknown[], config: RetentionQueryConfig): RetentionResultRow[];
    /**
     * Resolve retention configuration with SQL expressions
     * Same cube/dimension used for both cohort entry and activity detection
     */
    private resolveConfig;
    /**
     * Build filter conditions from config filters
     */
    private buildFilterConditions;
    /**
     * Build a single filter condition
     */
    private buildSingleFilterCondition;
    /**
     * Build cohort_base CTE
     * Groups users by their first activity (cohort entry) within the date range.
     * When breakdowns are specified, includes breakdown values for each dimension.
     */
    private buildCohortBaseCTE;
    /**
     * Build date range condition for WHERE clause
     * Filters records to those within the specified date range
     */
    private buildDateRangeCondition;
    /**
     * Build date range condition for HAVING clause
     * Used to filter aggregated cohort_period values
     */
    private buildDateRangeHavingCondition;
    /**
     * Build activity_periods CTE
     * Joins activity events to cohort_base and calculates period_number.
     * Includes breakdown values from cohort_base when breakdowns are specified.
     */
    private buildActivityPeriodsCTE;
    /**
     * Build cohort_sizes CTE
     * Aggregates the size of the cohort (or per breakdown combination if specified).
     */
    private buildCohortSizesCTE;
    /**
     * Build retention_counts CTE
     * Aggregates retained users per period (and breakdown combination if specified).
     */
    private buildRetentionCountsCTE;
    /**
     * Build rolling retention counts query
     * For rolling retention, a user is retained in period N if they were active
     * in period N or any later period
     */
    private buildRollingRetentionCountsQuery;
    /**
     * Build period number expression using database-specific DATE_DIFF
     */
    private buildPeriodNumberExpression;
}
