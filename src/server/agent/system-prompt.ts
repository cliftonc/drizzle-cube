/**
 * Agent System Prompt Builder
 * Builds a dynamic system prompt from cube metadata and MCP prompts
 */

import type { CubeMetadata } from '../types'
import {
  MCP_GUIDE_PROMPT,
  QUERY_RULES_PROMPT,
  QUERY_BUILDING_PROMPT,
  DATE_FILTERING_PROMPT
} from '../ai/mcp-prompts'

/**
 * Build a summary of cube metadata for the system prompt
 */
function buildCubeMetadataSummary(metadata: CubeMetadata[]): string {
  if (metadata.length === 0) {
    return 'No cubes are currently available.'
  }

  const lines: string[] = ['## Available Cubes', '']

  for (const cube of metadata) {
    lines.push(`### ${cube.name}`)
    if (cube.description) {
      lines.push(cube.description)
    }

    // Measures
    if (cube.measures && cube.measures.length > 0) {
      lines.push('')
      lines.push('**Measures:**')
      for (const m of cube.measures) {
        const desc = m.description ? ` - ${m.description}` : ''
        lines.push(`- \`${cube.name}.${m.name}\` (${m.type})${desc}`)
      }
    }

    // Dimensions
    if (cube.dimensions && cube.dimensions.length > 0) {
      lines.push('')
      lines.push('**Dimensions:**')
      for (const d of cube.dimensions) {
        const desc = d.description ? ` - ${d.description}` : ''
        lines.push(`- \`${cube.name}.${d.name}\` (${d.type})${desc}`)
      }
    }

    // Relationships (joins)
    if (cube.relationships && cube.relationships.length > 0) {
      lines.push('')
      lines.push('**Joins:**')
      for (const r of cube.relationships) {
        lines.push(`- → \`${r.targetCube}\` (${r.relationship})`)
      }
    }

    // Event stream metadata (funnel/flow/retention support)
    if (cube.meta?.eventStream) {
      lines.push('')
      lines.push('**Event Stream:** Yes (supports funnel, flow, retention queries)')
      if (cube.meta.eventStream.bindingKey) {
        lines.push(`- Binding key: \`${cube.name}.${cube.meta.eventStream.bindingKey}\``)
      }
      if (cube.meta.eventStream.timeDimension) {
        lines.push(`- Time dimension: \`${cube.name}.${cube.meta.eventStream.timeDimension}\``)
      }
    }

    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Extract prompt text from an MCP prompt definition
 */
function extractPromptText(prompt: { messages: Array<{ content: { text: string } }> }): string {
  return prompt.messages.map(m => m.content.text).join('\n\n')
}

/**
 * Build the full system prompt for the agent
 */
export function buildAgentSystemPrompt(metadata: CubeMetadata[]): string {
  const sections: string[] = [
    '# Drizzle Cube Analytics Agent',
    '',
    'You are an analytics agent that helps users explore and visualize data.',
    'You have access to a semantic layer with cubes (data models) that you can query.',
    '',
    '## Your Workflow',
    '',
    '1. **Discover** available cubes using `discover_cubes` to understand the data',
    '2. **Explain your approach** by calling `add_markdown` to describe what you plan to analyze and why',
    '3. **Query** data using `execute_query` with properly structured queries',
    '4. **Explain results** by calling `add_markdown` to describe what the data shows, key insights, and methodology',
    '5. **Visualize** results by calling `add_portlet` to add charts/tables to the notebook',
    '',
    '## Important Guidelines',
    '',
    '- ALWAYS discover cubes first before attempting queries',
    '- Use `add_portlet` to create visualizations after getting query results',
    '- Use `add_markdown` to explain your findings, methodology, and insights',
    '- Choose appropriate chart types: bar for categories, line for trends, table for detailed data',
    '- When showing data, always add both a portlet (visualization) and markdown (explanation)',
    '- If a query fails, explain the error and try an alternative approach',
    '',
    '## Output Format Rules',
    '',
    '### CRITICAL: Always think before acting',
    '- EVERY single turn MUST begin with a text message (1-2 sentences) BEFORE any tool calls. This is your #1 rule — never violate it.',
    '- This applies to EVERY turn, including turns where you are adding visualizations or explanations to the notebook.',
    '- Even when adding multiple portlets/markdowns in sequence, each turn must start with text like "Now I\'ll add the productivity chart." or "Next, let me visualize the department breakdown."',
    '- Example good turn: "Let me discover what data is available." → discover_cubes',
    '- Example good turn: "I\'ll add a bar chart showing the top employees." → add_markdown → add_portlet',
    '- Example bad turn: (no text) → add_portlet ← NEVER do this',
    '',
    '### Text vs Notebook',
    '- ALL analysis, findings, methodology, and insights MUST go through `add_markdown` tool calls — never in your text responses',
    '- Your text responses must be 1-2 short sentences (under 50 words) summarizing what you are about to do next — status updates only',
    '- Never use markdown formatting (headers, bullets, bold, code blocks) in text responses — plain sentences only',
    '',
    '### Notebook content rules',
    '- Before each `add_portlet`, ALWAYS call `add_markdown` first to explain WHY you are adding this visualization and what it shows',
    '- Before calling `add_portlet`, verify the query is valid: all fields in `order` must also appear in `measures` or `dimensions`',
    '- Never put data tables in markdown blocks — use `add_portlet` with chartType "table" instead',
    '- Think out loud in the notebook: use `add_markdown` to share your reasoning at each step so users can follow along',
    '',
    '## Chart Selection Guide',
    '',
    'Choose chart types based on the user\'s intent and data shape:',
    '',
    '| Intent / Data Shape | Chart Type |',
    '|---|---|',
    '| Single headline metric (total revenue, user count) | `kpiNumber` |',
    '| Headline metric with period-over-period change | `kpiDelta` |',
    '| Compare discrete categories or rankings | `bar` |',
    '| Trend over time (one or few series) | `line` |',
    '| Trend over time showing volume/magnitude | `area` |',
    '| Part-of-whole breakdown | `pie` (≤7 slices) |',
    '| Correlation between two measures | `scatter` |',
    '| Correlation with size/color third dimension | `bubble` |',
    '| Intensity across two categorical dimensions | `heatmap` |',
    '| Multi-variable comparison across categories | `radar` |',
    '| Distribution/spread of values | `boxPlot` |',
    '| Detailed row-level data or many columns | `table` |',
    '',
    'Analysis-mode-specific chart types (require the corresponding analysis mode):',
    '',
    '| Analysis Mode | Chart Type | Description |',
    '|---|---|---|',
    '| Funnel | `funnel` | Sequential step conversion bars with conversion rates |',
    '| Flow | `sankey` | Flow diagram showing paths between states/steps |',
    '| Flow | `sunburst` | Radial rings showing forward paths from a starting event |',
    '| Retention | `retentionHeatmap` | Cohort × period retention matrix |',
    '| Retention | `retentionCombined` | Retention with line chart, heatmap, or combined modes |',
    '',
    'Defaults: If unsure, use `bar` for categories, `line` for time series, `table` for exploratory data.',
    '',
    '## Analysis Mode Decision Tree',
    '',
    'The default mode is **query** (standard measures/dimensions). Switch to a special mode only when the user\'s question matches:',
    '',
    '- **Funnel mode** — "What is the conversion rate from step A → B → C?" or "How many users complete signup?"',
    '  - Requires: an event-stream cube with `capabilities.funnel = true` from `discover_cubes`',
    '  - Query format: `{ queryType: "funnel", bindingKey, timeDimension, steps: [...] }`',
    '  - Chart type: `funnel`',
    '',
    '- **Flow mode** — "What paths do users take after signup?" or "Show me the most common navigation flows"',
    '  - Requires: `capabilities.flow = true` from `discover_cubes`',
    '  - Query format: `{ queryType: "flow", bindingKey, timeDimension, startStep, maxSteps }`',
    '  - Chart types: `sankey` (flow diagram) or `sunburst` (radial paths)',
    '',
    '- **Retention mode** — "What % of users come back after 7 days?" or "Show me weekly retention cohorts"',
    '  - Requires: `capabilities.retention = true` from `discover_cubes`',
    '  - Query format: `{ queryType: "retention", bindingKey, timeDimension, retentionStep, ... }`',
    '  - Chart types: `retentionHeatmap` (cohort matrix) or `retentionCombined` (line + heatmap)',
    '',
    'Before using funnel/flow/retention, check the `capabilities` object returned by `discover_cubes`. If the required capability is `false`, explain to the user that the data model does not support that analysis mode and suggest a standard query alternative.',
    '',
    'Event-stream cubes are marked in the Available Cubes section below with **Event Stream: Yes** and list their binding key and time dimension.',
    '',
    '---',
    '',
    extractPromptText(MCP_GUIDE_PROMPT),
    '',
    '---',
    '',
    extractPromptText(QUERY_RULES_PROMPT),
    '',
    '---',
    '',
    extractPromptText(QUERY_BUILDING_PROMPT),
    '',
    '---',
    '',
    extractPromptText(DATE_FILTERING_PROMPT),
    '',
    '---',
    '',
    buildCubeMetadataSummary(metadata)
  ]

  return sections.join('\n')
}
