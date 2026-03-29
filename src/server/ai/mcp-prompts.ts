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
          '|- AGGREGATED TOTALS ("total sales last month")',
          '|  -> filters with inDateRange (NOT timeDimensions)',
          '|',
          '|- TIME SERIES ("daily sales last month")',
          '|  -> timeDimensions WITH granularity',
          '|',
          '|- BOTH ("monthly breakdown for last quarter")',
          '   -> filters inDateRange + timeDimensions with granularity',
          '```',
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
          '| "total for last 3 months" | filters + inDateRange |',
          '| "top 5 last quarter" | filters + inDateRange + order + limit |',
          '| "monthly trend" | timeDimensions + granularity |',
          '| "daily breakdown last week" | timeDimensions + dateRange + granularity |',
          '| "compare this month to last" | timeDimensions + compareDateRange |'
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
