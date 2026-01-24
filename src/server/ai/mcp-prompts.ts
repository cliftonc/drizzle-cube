/**
 * MCP Prompts for AI Agents
 *
 * These prompts provide guidance for AI agents using the Drizzle Cube MCP server.
 * They help prevent common query mistakes and ensure correct query construction.
 */

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
          '2) Construct your query using the schema from discover (see cross-cube joins below)',
          '3) tools/call name=validate {query} - Optional: fix schema issues',
          '4) tools/call name=load {query} - Execute and get results',
          '',
          'CRITICAL - CROSS-CUBE JOINS:',
          'The "joins" property in discover results shows relationships between cubes.',
          'You can include dimensions from ANY related cube in your query!',
          'Example: If Productivity joins to Employees, query:',
          '{ "measures": ["Productivity.totalPullRequests"], "dimensions": ["Employees.name"] }',
          'The system automatically joins the cubes for you.',
          '',
          'Query shapes:',
          '- Regular: { measures, dimensions, filters[], timeDimensions[], order, limit, offset }',
          '- Funnel: { funnel: { bindingKey, timeDimension, steps[], includeTimeMetrics? } }',
          '- Flow: { flow: { bindingKey, eventDimension, steps?, window? } }',
          '- Retention: { retention: { bindingKey, timeDimension, periods, granularity, retentionType, breakdownDimensions } }',
          '',
          'Time handling:',
          '- For AGGREGATED TOTALS (e.g., "last 3 months"): use filters with inDateRange, NOT timeDimensions',
          '- For TIME SERIES (e.g., "by month"): use timeDimensions with granularity',
          '- You can combine both when needed',
          '',
          'Filters: flat arrays of { member, operator, values }. Do not nest arrays.',
          'Do NOT hallucinate cube/field names—always use discover first.'
        ].join('\n')
      }
    }
  ]
}

/**
 * Quick reference rules for query generation
 */
export const QUERY_RULES_PROMPT: MCPPrompt = {
  name: 'drizzle-cube-query-rules',
  description: 'Key generation rules aligned with Gemini single-step prompt',
  messages: [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: [
          'Rules (keep JSON only):',
          '- Use only measures/dimensions/timeDimensions from schema.',
          '- timeDimensions: include granularity when grouping; use inDateRange filter for relative windows; combine when both requested.',
          '- Funnel detection keywords: funnel, conversion, journey, drop off, step by step; use funnel format only if eventStream metadata exists.',
          '- Funnel rules: bindingKey/timeDimension from cube metadata; include time filter on step 0 (default last 6 months) using inDateRange; steps ordered; flat filters.',
          '- Chart selection: line/area for time trends; bar for categories; scatter for 2-measure correlations; bubble for 3-measure correlations; funnel for funnels.',
          '- Correlation keywords (correlation/relationship/vs/compare) -> scatter/bubble, never line.',
          '- Prefer .name fields over .id; avoid Id dimensions unless requested.',
          '- Filters: flat array of {member, operator, values}; operators equals, notEquals, contains, notContains, gt, gte, lt, lte, inDateRange, set, notSet.'
        ].join('\n')
      }
    }
  ]
}

/**
 * Comprehensive guide for building valid queries of all types
 */
export const QUERY_BUILDING_PROMPT: MCPPrompt = {
  name: 'drizzle-cube-query-building',
  description: 'CRITICAL: Complete guide for building valid queries of all types with examples',
  messages: [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: [
          '# Drizzle Cube Query Building Guide',
          '',
          '## CRITICAL: Cross-Cube Joins',
          '',
          'You can combine measures from one cube with dimensions from RELATED cubes!',
          'Check the "joins" property in discover results to see relationships.',
          '',
          'Example: "Top 5 employees by pull requests last 3 months"',
          '- Productivity cube has: measures (totalPullRequests), dimensions (date)',
          '- Productivity joins to Employees (via employeeId)',
          '- Employees cube has: dimensions (name, department)',
          '',
          'Query combining BOTH cubes:',
          '```json',
          '{',
          '  "measures": ["Productivity.totalPullRequests"],',
          '  "dimensions": ["Employees.name"],',
          '  "filters": [',
          '    { "member": "Productivity.date", "operator": "inDateRange", "values": ["last 3 months"] }',
          '  ],',
          '  "order": { "Productivity.totalPullRequests": "desc" },',
          '  "limit": 5',
          '}',
          '```',
          'The system AUTOMATICALLY joins Productivity to Employees for you!',
          '',
          '---',
          '',
          '## Date Filtering vs Time Grouping',
          '',
          '### For AGGREGATED TOTALS (no time breakdown)',
          'Use `filters` with `inDateRange` operator. Do NOT use timeDimensions.',
          '',
          '```json',
          '{',
          '  "measures": ["Productivity.totalPullRequests"],',
          '  "dimensions": ["Employees.name"],',
          '  "filters": [{ "member": "Productivity.date", "operator": "inDateRange", "values": ["last 3 months"] }],',
          '  "order": { "Productivity.totalPullRequests": "desc" },',
          '  "limit": 5',
          '}',
          '```',
          'Result: 5 rows total, one per employee, with SUMMED pull requests.',
          '',
          '### For TIME SERIES (grouped by period)',
          'Use `timeDimensions` WITH `granularity`.',
          '',
          '```json',
          '{',
          '  "measures": ["Productivity.totalPullRequests"],',
          '  "timeDimensions": [{ "dimension": "Productivity.date", "dateRange": "last 3 months", "granularity": "month" }]',
          '}',
          '```',
          'Result: 3 rows (one per month) with pull request totals.',
          '',
          '### WRONG: timeDimensions without granularity',
          '```json',
          '// DON\'T DO THIS - groups by DAY, returns ~90 rows!',
          '{ "timeDimensions": [{ "dimension": "X.date", "dateRange": "last 3 months" }] }',
          '```',
          '',
          '---',
          '',
          '## Regular Query Structure',
          '',
          '```json',
          '{',
          '  "measures": ["Cube.measure1", "Cube.measure2"],',
          '  "dimensions": ["Cube.dimension1", "RelatedCube.dimension"],',
          '  "filters": [',
          '    { "member": "Cube.field", "operator": "equals", "values": ["value"] },',
          '    { "member": "Cube.date", "operator": "inDateRange", "values": ["last 30 days"] }',
          '  ],',
          '  "timeDimensions": [],',
          '  "order": { "Cube.measure1": "desc" },',
          '  "limit": 100,',
          '  "offset": 0',
          '}',
          '```',
          '',
          '### Filter Operators',
          '- String: equals, notEquals, contains, notContains, startsWith, endsWith',
          '- Numeric: gt, gte, lt, lte',
          '- Null: set, notSet',
          '- Date: inDateRange, beforeDate, afterDate',
          '',
          '### Date Range Values',
          '- Relative: "last 7 days", "last 3 months", "last year", "this week", "this month"',
          '- Absolute: ["2024-01-01", "2024-03-31"]',
          '',
          '---',
          '',
          '## Funnel Query Structure',
          '',
          'Use when: conversion analysis, user journeys, step-by-step analysis',
          'Requires: Cube with eventStream metadata',
          '',
          '```json',
          '{',
          '  "funnel": {',
          '    "bindingKey": "Events.userId",',
          '    "timeDimension": "Events.timestamp",',
          '    "steps": [',
          '      {',
          '        "name": "Step 1",',
          '        "filter": [',
          '          { "member": "Events.eventType", "operator": "equals", "values": ["signup"] },',
          '          { "member": "Events.timestamp", "operator": "inDateRange", "values": ["last 6 months"] }',
          '        ]',
          '      },',
          '      {',
          '        "name": "Step 2",',
          '        "filter": [',
          '          { "member": "Events.eventType", "operator": "equals", "values": ["purchase"] }',
          '        ],',
          '        "timeToConvert": { "value": 7, "unit": "day" }',
          '      }',
          '    ],',
          '    "includeTimeMetrics": true',
          '  }',
          '}',
          '```',
          '',
          'IMPORTANT: Put time filter (inDateRange) ONLY on step 0!',
          '',
          '---',
          '',
          '## Flow Query Structure',
          '',
          'Use when: analyzing event sequences, path analysis',
          '',
          '```json',
          '{',
          '  "flow": {',
          '    "bindingKey": "Events.sessionId",',
          '    "eventDimension": "Events.eventType",',
          '    "timeDimension": "Events.timestamp",',
          '    "stepsBefore": 2,',
          '    "stepsAfter": 2,',
          '    "startingStep": "checkout"',
          '  }',
          '}',
          '```',
          '',
          '---',
          '',
          '## Retention Query Structure',
          '',
          'Use when: cohort analysis, user retention tracking',
          '',
          '```json',
          '{',
          '  "retention": {',
          '    "bindingKey": "Users.id",',
          '    "timeDimension": "Events.timestamp",',
          '    "periods": 8,',
          '    "granularity": "week",',
          '    "retentionType": "rolling",',
          '    "breakdownDimensions": ["Events.country"]',
          '  }',
          '}',
          '```',
          '',
          '---',
          '',
          '## Common Mistakes to Avoid',
          '',
          '1. Using timeDimensions when you want aggregated totals → Use filters with inDateRange instead',
          '2. Omitting granularity in timeDimensions → Results in day-level grouping',
          '3. Guessing field names → Always use discover first to get actual schema',
          '4. Nested filter arrays → Filters must be flat: [{ member, operator, values }]',
          '5. Missing date filter for "last N" queries → Always add inDateRange filter'
        ].join('\n')
      }
    }
  ]
}

/**
 * Critical guide specifically for date filtering vs time grouping
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
          '# Date Filtering vs Time Grouping - CRITICAL GUIDE',
          '',
          'This is the most common mistake when building queries. These are TWO DIFFERENT operations.',
          '',
          '## Quick Decision Tree',
          '',
          '```',
          'User wants data over a time period?',
          '├── Wants AGGREGATED TOTALS (e.g., "total sales last month")',
          '│   └── Use: filters with inDateRange operator',
          '│',
          '└── Wants TIME SERIES breakdown (e.g., "daily sales last month")',
          '    └── Use: timeDimensions with granularity',
          '```',
          '',
          '## For Aggregated Totals (MOST COMMON)',
          '',
          'When user says: "last 3 months", "over the past year", "in Q1", "since January"',
          '',
          '```json',
          '{',
          '  "measures": ["Sales.totalRevenue"],',
          '  "dimensions": ["Products.category"],',
          '  "filters": [',
          '    { "member": "Sales.date", "operator": "inDateRange", "values": ["last 3 months"] }',
          '  ]',
          '}',
          '```',
          '',
          'Result: One row per category with TOTAL revenue over the 3-month period.',
          '',
          '## For Time Series (Trend Analysis)',
          '',
          'When user says: "by month", "per week", "daily trend", "over time"',
          '',
          '```json',
          '{',
          '  "measures": ["Sales.totalRevenue"],',
          '  "timeDimensions": [',
          '    { "dimension": "Sales.date", "dateRange": "last 3 months", "granularity": "month" }',
          '  ]',
          '}',
          '```',
          '',
          'Result: Multiple rows, one per month.',
          '',
          '## WRONG: timeDimensions Without Granularity',
          '',
          '```json',
          '// This returns ~90 rows (daily) instead of aggregates!',
          '{',
          '  "timeDimensions": [{ "dimension": "Sales.date", "dateRange": "last 3 months" }]',
          '}',
          '```',
          '',
          '## Both: Filter AND Group',
          '',
          'When user wants: "monthly breakdown for last quarter"',
          '',
          '```json',
          '{',
          '  "measures": ["Sales.totalRevenue"],',
          '  "filters": [',
          '    { "member": "Sales.date", "operator": "inDateRange", "values": ["last quarter"] }',
          '  ],',
          '  "timeDimensions": [',
          '    { "dimension": "Sales.date", "granularity": "month" }',
          '  ]',
          '}',
          '```',
          '',
          '## Summary Table',
          '',
          '| User Request | Use | Example |',
          '|-------------|-----|---------|',
          '| "total for last 3 months" | filters + inDateRange | { filters: [{ operator: "inDateRange", values: ["last 3 months"] }] } |',
          '| "top 5 last quarter" | filters + inDateRange | Same as above + order + limit |',
          '| "monthly trend" | timeDimensions + granularity | { timeDimensions: [{ granularity: "month" }] } |',
          '| "daily breakdown last week" | timeDimensions | { timeDimensions: [{ dateRange: "last week", granularity: "day" }] } |'
        ].join('\n')
      }
    }
  ]
}

/**
 * All MCP prompts for the Drizzle Cube server
 */
export const MCP_PROMPTS: MCPPrompt[] = [
  MCP_GUIDE_PROMPT,
  QUERY_RULES_PROMPT,
  QUERY_BUILDING_PROMPT,
  DATE_FILTERING_PROMPT
]

/**
 * Get all default MCP prompts
 */
export function getDefaultMCPPrompts(): MCPPrompt[] {
  return MCP_PROMPTS
}
