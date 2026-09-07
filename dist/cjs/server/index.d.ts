import { DrizzleDatabase } from './types/index.js';
import { SemanticLayerCompiler } from './compiler.js';
/**
 * Drizzle Cube - Semantic Layer for Drizzle ORM
 * Drizzle ORM-first semantic layer with Cube.js compatibility
 */
export { SemanticLayerCompiler, BASE_CUBE_SET_ID, SINGLE_TENANT_CONTEXT } from './compiler.js';
export type { CubeSetRegistrationInfo, CubeSetStats } from './compiler.js';
export { QueryValidationError } from './query-validator.js';
export type { QueryValidationIssue, QueryValidationResult } from './query-validator.js';
export { buildAttributeDimensions } from './attribute-dimensions.js';
export type { AttributeDefinition, AttributeValueType, BuildAttributeDimensionsOptions } from './attribute-dimensions.js';
export { QueryExecutor } from './executor.js';
export { detectQueryMode, detectQueryModes, getActiveQueryModes, hasComparisonMode, hasFunnelMode, hasFlowMode, hasRetentionMode } from './query-modes.js';
export type { QueryMode, QueryModeFlags } from './query-modes.js';
export { LogicalPlanner } from './logical-plan/index.js';
export { DrizzleSqlBuilder } from './physical-plan/index.js';
export { CTEBuilder, ComparisonQueryBuilder, FunnelQueryBuilder, FlowQueryBuilder, RetentionQueryBuilder } from './builders/index.js';
export { CalculatedMeasureResolver, JoinPathResolver } from './resolvers/index.js';
export { LogicalPlanBuilder, IdentityOptimiser, OptimiserPipeline } from './logical-plan/index.js';
export type { LogicalNode, QueryNode, SimpleSource, CTEPreAggregate, CubeRef, MeasureRef, DimensionRef, LogicalPlanWithAnalysis, PlanOptimiser, OptimiserContext } from './logical-plan/index.js';
export { DrizzlePlanBuilder } from './physical-plan/index.js';
export { createDatabaseExecutor, createPostgresExecutor, createSQLiteExecutor, createMySQLExecutor, createDuckDBExecutor, createDatabendExecutor, createSnowflakeExecutor, BaseDatabaseExecutor, PostgresExecutor, SQLiteExecutor, MySQLExecutor, DuckDBExecutor, DatabendExecutor, SnowflakeExecutor } from './executors/index.js';
export { resolveSqlExpression, createMultiCubeContext, resolveCubeReference, getJoinType } from './cube-utils.js';
export { defineCube } from './cube-utils.js';
export { generateCacheKey, normalizeQuery, fnv1aHash, strongHash, getCubeInvalidationPattern } from './cache-utils.js';
export { MemoryCacheProvider } from './cache-providers/index.js';
export { STEP0_VALIDATION_PROMPT, SYSTEM_PROMPT_TEMPLATE, STEP1_SYSTEM_PROMPT, STEP2_SYSTEM_PROMPT, buildStep0Prompt, buildSystemPrompt, buildStep1Prompt, buildStep2Prompt, EXPLAIN_ANALYSIS_PROMPT, buildExplainAnalysisPrompt, formatCubeSchemaForExplain, formatExistingIndexes } from './prompts/index.js';
export type { Step0Result, PromptContext, DimensionValues, Step1Result } from './prompts/index.js';
export { handleAgentChat, getToolDefinitions, createToolExecutor, buildAgentSystemPrompt } from './agent/index.js';
export type { AgentChatRequest, AgentConfig, AgentObservabilityHooks, AgentSSEEvent, PortletBlockData, MarkdownBlockData, ToolExecutionResult } from './agent/index.js';
export { discoverCubes, findBestFieldMatch, suggestQuery, validateQuery as aiValidateQuery } from './ai/index.js';
export type { CubeDiscoveryResult, DiscoveryOptions, QuerySuggestion, ValidationResult as AIValidationResult, ValidationError as AIValidationError, ValidationWarning as AIValidationWarning } from './ai/index.js';
export type * from './types/index.js';
export type { SQL } from 'drizzle-orm';
/**
 * Create a new semantic layer instance with Drizzle integration.
 *
 * Use this when you need multiple isolated instances. To serve different cube
 * definitions to different tenants from one instance, prefer cube sets —
 * `new SemanticLayerCompiler({ contextToCubeSetId })` plus `registerCubeSet()`
 * per tenant — which shares the base cubes and keeps metadata and result caches
 * correctly partitioned.
 */
export declare function createDrizzleSemanticLayer(options: {
    drizzle: DrizzleDatabase;
    schema?: any;
}): SemanticLayerCompiler;
