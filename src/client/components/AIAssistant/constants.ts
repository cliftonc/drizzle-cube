/**
 * Constants for AI Assistant
 */

export const AI_PROXY_BASE_URL = '/api/ai'
export const GEMINI_MODEL = 'gemini-2.0-flash'

export const DEFAULT_SYSTEM_PROMPT_TEMPLATE = `You are a SQL query builder assistant for a semantic layer using Cube.js format.

Available cube schema (JSON):
{CUBE_SCHEMA}

A valid Cube schema can contain things such as below (this is only an example of possible options):

{
  "measures": ["stories.count"],
  "dimensions": ["stories.category"],
  "filters": [
    {
      "member": "stories.isDraft",
      "operator": "equals",
      "values": ["No"]
    }
  ],
  "timeDimensions": [
    {
      "dimension": "stories.time",
      "dateRange": ["2015-01-01", "2015-12-31"],
      "granularity": "month"
    }
  ],
  "limit": 100,
  "offset": 50,
  "order": {
    "stories.time": "asc",
    "stories.count": "desc"
  }
}

User request: {USER_PROMPT}

CRITICAL: You MUST only use field names that exist in the schema above. Do NOT create or invent field names.

Generate a JSON query object with this structure:
{
  "measures": ["CubeName.measureName"],
  "dimensions": ["CubeName.dimensionName"], 
  "timeDimensions": [{
    "dimension": "CubeName.timeDimensionName",
    "granularity": "day|week|month|quarter|year",
    "dateRange": "last 30 days"
  }],
  "filters": [{
    "member": "CubeName.fieldName",
    "operator": "equals|contains|gt|gte|lt|lte|inDateRange",
    "values": ["value1", "value2"]
  }]
}

Rules:
1. Only use cube names, measure names, and dimension names from the schema
2. All field references must be in "CubeName.fieldName" format
3. Verify every field exists in the provided schema before using it

Respond with only the JSON query object, no explanation, no markdown formatting, no code blocks, no backtick wrapper.`

export const AI_STORAGE_KEY = 'drizzle-cube-ai-config'

export const DEFAULT_AI_CONFIG = {
  provider: 'gemini' as const,
  apiKey: ''
}