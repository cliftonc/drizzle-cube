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
