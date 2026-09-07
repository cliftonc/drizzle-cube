import { DimensionValues } from './types.js';
/**
 * System prompt for Step 2: Generate final query with actual dimension values.
 *
 * Placeholders:
 * - {CUBE_SCHEMA} - JSON-formatted cube schema
 * - {USER_PROMPT} - User's natural language query
 * - {DIMENSION_VALUES} - JSON object of dimension names to their actual values
 */
export declare const STEP2_SYSTEM_PROMPT = "Complete the data query using actual dimension values from the database.\n\nORIGINAL USER REQUEST: {USER_PROMPT}\n\nCUBE SCHEMA:\n{CUBE_SCHEMA}\n\nAVAILABLE DIMENSION VALUES (from the actual database):\n{DIMENSION_VALUES}\n\nComplete the query using ONLY the values listed above for any dimension filters.\nDo NOT invent or guess filter values - use exactly what's available.\nMatch user intent to the closest available values (e.g., if user says \"opened\" but only \"created\" exists, use \"created\").\n\nRESPONSE FORMAT (same as single-step):\n{\n  \"query\": { /* Cube.js query OR funnel query with actual filter values */ },\n  \"chartType\": \"line\"|\"bar\"|\"area\"|\"pie\"|\"scatter\"|\"bubble\"|\"table\"|\"funnel\",\n  \"chartConfig\": {\n    \"xAxis\": string[],\n    \"yAxis\": string[],\n    \"series\": string[],\n    \"sizeField\": string,\n    \"colorField\": string\n  }\n}\n\nFUNNEL QUERY STRUCTURE (if queryType was \"funnel\"):\n{\n  \"funnel\": {\n    \"bindingKey\": \"PREvents.prNumber\",\n    \"timeDimension\": \"PREvents.timestamp\",\n    \"steps\": [\n      {\n        \"name\": \"Created\",\n        \"filter\": [\n          { \"member\": \"PREvents.eventType\", \"operator\": \"equals\", \"values\": [\"created\"] },\n          { \"member\": \"PREvents.timestamp\", \"operator\": \"inDateRange\", \"values\": [\"last 6 months\"] }\n        ]\n      },\n      {\n        \"name\": \"Merged\",\n        \"filter\": { \"member\": \"PREvents.eventType\", \"operator\": \"equals\", \"values\": [\"merged\"] }\n      }\n    ],\n    \"includeTimeMetrics\": true\n  }\n}\n\nCRITICAL FILTER FORMAT RULES:\n- filter MUST be a flat array of filter objects: [{ member, operator, values }, ...]\n- filter MUST NOT be nested arrays: NOT [[{ member, operator, values }]]\n- For a single filter, use object format: { \"member\": \"...\", \"operator\": \"...\", \"values\": [...] }\n- For multiple filters on step 0, use flat array: [{ filter1 }, { filter2 }] (NOT [[filter1, filter2]])\n- The time filter (inDateRange) goes ONLY on step 0's filter, not on other steps.\n\nReturn ONLY valid JSON - no explanations or markdown:";
/**
 * Build the Step 2 prompt with actual dimension values from the database
 *
 * @param cubeSchema - JSON-formatted cube schema
 * @param userPrompt - User's natural language query
 * @param dimensionValues - Actual dimension values fetched from database
 * @returns Complete prompt ready to send to AI
 */
export declare function buildStep2Prompt(cubeSchema: string, userPrompt: string, dimensionValues: DimensionValues): string;
