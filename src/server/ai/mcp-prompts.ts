/**
 * MCP Prompts for AI Agents
 *
 * These prompts provide guidance for AI agents using the Drizzle Cube MCP server.
 * They help prevent common query mistakes and ensure correct query construction.
 *
 * Structure: 3 focused prompts (down from 4 redundant ones):
 * - MCP_GUIDE_PROMPT: Workflow (discover -> validate -> load) + cross-cube joins
 * - QUERY_LANGUAGE_PROMPT: TS DSL reference (single source of truth from query-schema.ts)
 * - DATE_FILTERING_PROMPT: Decision tree for the #1 mistake
 *
 * QUERY_RULES_PROMPT and QUERY_BUILDING_PROMPT are kept as backward-compatible aliases.
 */

import { QUERY_LANGUAGE_REFERENCE } from './query-schema'

export interface MCPPrompt {
  name: string
  description: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: {
      type: 'text'
      text: string
    }
  }>
}

/**
 * Main workflow guide for using drizzle-cube MCP tools
 */
export const MCP_GUIDE_PROMPT: MCPPrompt = {
  name: 'drizzle-cube-mcp-guide',
  description: 'How to use drizzle-cube MCP tools to generate and run queries',
  messages: [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: [
          'You are an analyst agent using drizzle-cube MCP.',
          '',
          'Workflow:',
          '1) tools/call name=discover {topic|intent} - Find cubes and understand schema',
          '2) Construct your query using the schema from discover (see query language reference)',
          '3) tools/call name=validate {query} - Optional: fix schema issues',
          '4) tools/call name=load {query} - Execute and get results',
          '',
          'CROSS-CUBE JOINS:',
          'The "joins" property in discover results shows relationships between cubes.',
          'You can include dimensions from ANY related cube in your query — the system auto-joins.',
          'Example: If Productivity joins to Employees, query:',
          '{ "measures": ["Productivity.totalPullRequests"], "dimensions": ["Employees.name"] }',
          '',
          'Do NOT hallucinate cube/field names — always use discover first.'
        ].join('\n')
      }
    }
  ]
}

/**
 * Query language reference — imports the TypeScript DSL from query-schema.ts
 * Replaces both QUERY_RULES_PROMPT and QUERY_BUILDING_PROMPT
 */
export const QUERY_LANGUAGE_PROMPT: MCPPrompt = {
  name: 'drizzle-cube-query-language',
  description: 'CRITICAL: Complete query language reference — types, operators, analysis modes, and rules',
  messages: [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: QUERY_LANGUAGE_REFERENCE
      }
    }
  ]
}

/**
 * Critical guide specifically for date filtering vs time grouping — the #1 mistake
 */
export const DATE_FILTERING_PROMPT: MCPPrompt = {
  name: 'drizzle-cube-date-filtering',
  description: 'CRITICAL: How to correctly filter by date vs group by time period - the #1 source of query mistakes',
  messages: [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: [
          '# Date Filtering vs Time Grouping',
          '',
          '```',
          'User wants data over a time period?',
          '|- AGGREGATED TOTALS — no time breakdown in the output',
          '|  ("total sales last month", "top 5 customers this quarter")',
          '|  -> filters with inDateRange, NEVER timeDimensions',
          '|     Use this whenever the user does NOT want time in the result rows.',
          '|',
          '|- TIME SERIES — time breakdown in the output',
          '|  ("daily sales last month", "monthly breakdown for last quarter")',
          '|  -> timeDimensions with BOTH dateRange AND granularity',
          '|     ONE entry covers both filtering and grouping — do NOT also add an',
          '|     inDateRange filter on the same field (it duplicates the WHERE clause).',
          '```',
          '',
          '## NEVER duplicate date filtering on the same field',
          'Do NOT put both a `filters[].inDateRange` and a `timeDimensions[].dateRange` on the same field — the engine will emit the same WHERE clause twice. Pick ONE based on whether the user wants time in the output:',
          '- No time in output → `filters[].inDateRange` ONLY (no timeDimensions)',
          '- Time in output   → `timeDimensions[].dateRange + granularity` ONLY (no inDateRange filter on the same field)',
          '',
          'Only combine `filters` + `timeDimensions` when the filter is on a DIFFERENT field (e.g., "monthly trend for EU customers" → filter on region + timeDimension on date).',
          '',
          '## Aggregated Totals (most common)',
          'When: "last 3 months", "over the past year", "in Q1", "since January"',
          '```json',
          '{',
          '  "measures": ["Sales.totalRevenue"],',
          '  "dimensions": ["Products.category"],',
          '  "filters": [{ "member": "Sales.date", "operator": "inDateRange", "values": ["last 3 months"] }]',
          '}',
          '```',
          'Result: One row per category with TOTAL revenue.',
          '',
          '## Time Series',
          'When: "by month", "per week", "daily trend", "over time"',
          '```json',
          '{',
          '  "measures": ["Sales.totalRevenue"],',
          '  "timeDimensions": [{ "dimension": "Sales.date", "dateRange": "last 3 months", "granularity": "month" }]',
          '}',
          '```',
          'Result: One row per month.',
          '',
          '## Period-over-Period Comparison',
          'Use compareDateRange for side-by-side period analysis:',
          '```json',
          '{',
          '  "measures": ["Sales.totalRevenue"],',
          '  "timeDimensions": [{',
          '    "dimension": "Sales.date",',
          '    "granularity": "day",',
          '    "compareDateRange": ["last 30 days", ["2024-01-01", "2024-01-30"]]',
          '  }]',
          '}',
          '```',
          '',
          '## WRONG: timeDimensions without granularity',
          '```json',
          '// Returns ~90 rows (daily) instead of aggregates!',
          '{ "timeDimensions": [{ "dimension": "Sales.date", "dateRange": "last 3 months" }] }',
          '```',
          '',
          '## Date Range Values',
          '- Relative: "last 7 days", "last 3 months", "last year", "this week", "this month", "this quarter", "next week", "next month"',
          '- Absolute: ["2024-01-01", "2024-03-31"]',
          '',
          '| User Request | Approach |',
          '|---|---|',
          '| "total for last 3 months" | filters + inDateRange (no timeDimensions) |',
          '| "top 5 last quarter" | filters + inDateRange + order + limit (no timeDimensions) |',
          '| "monthly trend" | timeDimensions with dateRange + granularity |',
          '| "daily breakdown last week" | timeDimensions with dateRange + granularity |',
          '| "compare this month to last" | timeDimensions with compareDateRange + granularity |',
          '| "monthly trend for EU customers" | filters on region + timeDimensions with dateRange + granularity |'
        ].join('\n')
      }
    }
  ]
}

/**
 * Backward-compatible alias — now references the unified query language prompt
 */
export const QUERY_RULES_PROMPT: MCPPrompt = QUERY_LANGUAGE_PROMPT

/**
 * Backward-compatible alias — now references the unified query language prompt
 */
export const QUERY_BUILDING_PROMPT: MCPPrompt = QUERY_LANGUAGE_PROMPT

/**
 * All MCP prompts for the Drizzle Cube server
 */
export const MCP_PROMPTS: MCPPrompt[] = [
  MCP_GUIDE_PROMPT,
  QUERY_LANGUAGE_PROMPT,
  DATE_FILTERING_PROMPT
]

/**
 * Get all default MCP prompts
 */
export function getDefaultMCPPrompts(): MCPPrompt[] {
  return MCP_PROMPTS
}

/**
 * Default instructions returned in the MCP `initialize` result.
 *
 * Per the MCP spec (InitializeResult.instructions), this string is the only
 * server-authored guidance that clients are expected to surface to the model
 * (e.g. by adding it to the system prompt). `prompts/*` and `resources/*` are
 * pull-based and are usually invoked by the *user* (slash commands) — not by
 * the model — so we cannot rely on them for correctness.
 *
 * The instructions therefore:
 *  1. Mandate the discover → (validate) → load workflow.
 *  2. Tell the model that the `discover` tool response itself contains the
 *     full query language reference (`queryLanguageReference`) and the date
 *     filtering decision tree (`dateFilteringGuide`). The model MUST read
 *     those fields before constructing any query — they are the source of
 *     truth for syntax, operators, and analysis modes.
 *  3. Inline the single most-violated rule (aggregated totals vs time
 *     series) so that even a model that ignores the discover payload still
 *     sees it once in its system prompt.
 *
 * Keep this body short (< ~2 KB) — long instructions get truncated or
 * deprioritised by some clients.
 */
export const DEFAULT_MCP_INSTRUCTIONS: string = [
  'You are an analyst agent connected to a Drizzle Cube semantic layer.',
  '',
  '## Mandatory workflow',
  '1. CALL `discover` FIRST. Always. Even if you think you know the schema.',
  '   The discover response contains TWO things you MUST read before writing any query:',
  '   - `cubes`: the available cubes, their measures, dimensions, and join relationships.',
  '   - `queryLanguageReference`: the COMPLETE query language reference (TypeScript DSL,',
  '     filter operators, analysis modes, and rules). This is the source of truth — do',
  '     NOT construct queries from memory or guess syntax.',
  '   - `dateFilteringGuide`: the decision tree for date filtering vs time grouping.',
  '     Read this whenever the user asks about a time period.',
  '2. Construct your query using ONLY field names that appear in the discover response,',
  '   in exact `CubeName.fieldName` form (two parts, one dot).',
  '3. Optionally call `validate` to auto-correct schema issues.',
  '4. Call `load` to execute the query and return data.',
  '',
  '## The #1 mistake to avoid (read `dateFilteringGuide` for the full rules)',
  'When the user asks for AGGREGATED TOTALS over a time period ("total sales last 6 months",',
  '"top customers this quarter"), you MUST filter with `inDateRange` and you MUST NOT use',
  '`timeDimensions`. Using `timeDimensions` without a granularity returns daily rows and is',
  'almost always wrong; using it WITH a granularity returns a time series, not a total.',
  '',
  'Aggregated totals → `filters: [{ member, operator: "inDateRange", values: ["last 6 months"] }]`',
  'Time series      → `timeDimensions: [{ dimension, dateRange, granularity: "month" }]`',
  '',
  '## Field naming',
  'Fields are EXACTLY `CubeName.fieldName`. Copy verbatim from discover.',
  'WRONG: `Sales.Sales.count` (double-prefixed), `Sales` (bare cube), `Sales_count` (underscore).',
  'RIGHT: `Sales.count`, `Customers.region`.',
  '',
  '## Cross-cube joins',
  'The `joins` property in each discover result lists related cubes. You can include',
  'dimensions from any related cube in the same query — the system auto-joins them.',
  '',
  'If you skip `discover` and guess, your query will fail or return wrong results. Always discover first.'
].join('\n')

/**
 * Get the default MCP instructions string returned in the `initialize` result.
 * Exposed as a function (not just a const) so consumers can wrap or extend it
 * via the `instructions` resolver in `MCPOptions`.
 */
export function getDefaultMcpInstructions(): string {
  return DEFAULT_MCP_INSTRUCTIONS
}
