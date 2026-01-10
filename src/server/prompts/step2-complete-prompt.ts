/**
 * Step 2: Complete Query with Actual Dimension Values
 *
 * This prompt is used in the second stage of the multi-stage AI query generation flow.
 * It receives actual dimension values fetched from the database (with security context)
 * and uses them to generate the final query.
 *
 * This ensures filter values match actual data in the database, preventing
 * hallucinated or incorrect filter values.
 *
 * @see https://github.com/cliftonc/drizzle-cube/blob/main/src/server/prompts/step2-complete-prompt.ts
 */

import type { DimensionValues } from './types.js'

/**
 * System prompt for Step 2: Generate final query with actual dimension values.
 *
 * Placeholders:
 * - {CUBE_SCHEMA} - JSON-formatted cube schema
 * - {USER_PROMPT} - User's natural language query
 * - {DIMENSION_VALUES} - JSON object of dimension names to their actual values
 */
export const STEP2_SYSTEM_PROMPT = `Complete the data query using actual dimension values from the database.

ORIGINAL USER REQUEST: {USER_PROMPT}

CUBE SCHEMA:
{CUBE_SCHEMA}

AVAILABLE DIMENSION VALUES (from the actual database):
{DIMENSION_VALUES}

Complete the query using ONLY the values listed above for any dimension filters.
Do NOT invent or guess filter values - use exactly what's available.
Match user intent to the closest available values (e.g., if user says "opened" but only "created" exists, use "created").

RESPONSE FORMAT (same as single-step):
{
  "query": { /* Cube.js query OR funnel query with actual filter values */ },
  "chartType": "line"|"bar"|"area"|"pie"|"scatter"|"bubble"|"table"|"funnel",
  "chartConfig": {
    "xAxis": string[],
    "yAxis": string[],
    "series": string[],
    "sizeField": string,
    "colorField": string
  }
}

FUNNEL QUERY STRUCTURE (if queryType was "funnel"):
{
  "funnel": {
    "bindingKey": "PREvents.prNumber",
    "timeDimension": "PREvents.timestamp",
    "steps": [
      {
        "name": "Created",
        "filter": [
          { "member": "PREvents.eventType", "operator": "equals", "values": ["created"] },
          { "member": "PREvents.timestamp", "operator": "inDateRange", "values": ["last 6 months"] }
        ]
      },
      {
        "name": "Merged",
        "filter": { "member": "PREvents.eventType", "operator": "equals", "values": ["merged"] }
      }
    ],
    "includeTimeMetrics": true
  }
}

CRITICAL FILTER FORMAT RULES:
- filter MUST be a flat array of filter objects: [{ member, operator, values }, ...]
- filter MUST NOT be nested arrays: NOT [[{ member, operator, values }]]
- For a single filter, use object format: { "member": "...", "operator": "...", "values": [...] }
- For multiple filters on step 0, use flat array: [{ filter1 }, { filter2 }] (NOT [[filter1, filter2]])
- The time filter (inDateRange) goes ONLY on step 0's filter, not on other steps.

Return ONLY valid JSON - no explanations or markdown:`

/**
 * Build the Step 2 prompt with actual dimension values from the database
 *
 * @param cubeSchema - JSON-formatted cube schema
 * @param userPrompt - User's natural language query
 * @param dimensionValues - Actual dimension values fetched from database
 * @returns Complete prompt ready to send to AI
 */
export function buildStep2Prompt(
  cubeSchema: string,
  userPrompt: string,
  dimensionValues: DimensionValues
): string {
  const valuesJson = JSON.stringify(dimensionValues, null, 2)

  return STEP2_SYSTEM_PROMPT
    .replace('{CUBE_SCHEMA}', cubeSchema)
    .replace('{USER_PROMPT}', userPrompt)
    .replace('{DIMENSION_VALUES}', valuesJson)
}
