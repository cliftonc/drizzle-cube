/**
 * Step 1: Query Shape Determination Prompt
 *
 * This prompt is used in the first stage of the multi-stage AI query generation flow.
 * It analyzes the user's request to determine:
 * 1. Whether this is a regular query or funnel query
 * 2. Which dimensions need actual values from the database
 *
 * The output of this step determines whether we need to fetch dimension values
 * from the database before generating the final query.
 *
 * @see https://github.com/cliftonc/drizzle-cube/blob/main/src/server/prompts/step1-shape-prompt.ts
 */
/**
 * System prompt for Step 1: Analyze query shape and identify dimensions needing values.
 *
 * Placeholders:
 * - {CUBE_SCHEMA} - JSON-formatted cube schema
 * - {USER_PROMPT} - User's natural language query
 */
export declare const STEP1_SYSTEM_PROMPT = "You are analyzing a data query request to determine its structure.\n\nGiven the cube schema and user query, determine:\n1. What type of query this is (regular query or funnel)\n2. What dimensions will need filtering with specific categorical values\n\nCUBE SCHEMA:\n{CUBE_SCHEMA}\n\nRESPONSE FORMAT:\nReturn JSON with:\n{\n  \"queryType\": \"query\" | \"funnel\",\n  \"dimensionsNeedingValues\": [\"CubeName.dimensionName\", ...],\n  \"reasoning\": \"Brief explanation of what dimensions need values and why\"\n}\n\nRULES:\n- For funnels, you'll typically need values for the event type dimension to define the steps\n- For regular queries with categorical filters, list those dimensions where you need to know valid values\n- Only list dimensions where you would otherwise have to guess the filter values\n- If no dimension values are needed (e.g., numeric filters, date ranges, simple aggregations), return empty array\n- Common dimensions needing values: status fields, type fields, category fields, event types\n- Do NOT list dimensions for: date ranges, numeric comparisons, name searches\n\nUSER QUERY:\n{USER_PROMPT}\n\nReturn ONLY valid JSON - no explanations or markdown:";
/**
 * Build the Step 1 prompt for query shape analysis
 *
 * @param cubeSchema - JSON-formatted cube schema
 * @param userPrompt - User's natural language query
 * @returns Complete prompt ready to send to AI
 */
export declare function buildStep1Prompt(cubeSchema: string, userPrompt: string): string;
