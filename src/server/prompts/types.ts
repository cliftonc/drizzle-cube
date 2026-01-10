/**
 * Types for AI prompt building
 *
 * These types define the structure of data passed between the multi-stage
 * AI query generation flow.
 *
 * @see https://github.com/cliftonc/drizzle-cube/blob/main/src/server/prompts/types.ts
 */

/**
 * Context required to build any AI prompt
 */
export interface PromptContext {
  /** JSON-formatted cube schema with measures, dimensions, and relationships */
  cubeSchema: string
  /** The user's natural language query */
  userPrompt: string
}

/**
 * Actual dimension values fetched from the database
 * Used in Step 2 to provide real values for filter generation
 */
export interface DimensionValues {
  /** Map of dimension name to array of distinct values */
  [dimensionName: string]: string[]
}

/**
 * Result from Step 1: Query shape analysis
 * Determines what type of query to generate and what dimension values are needed
 */
export interface Step1Result {
  /** Type of query to generate */
  queryType: 'query' | 'funnel'
  /** Dimensions that need actual values from the database for filters */
  dimensionsNeedingValues: string[]
  /** AI's reasoning for why these dimensions need values */
  reasoning: string
}
