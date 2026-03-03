/**
 * Agent Tool Definitions + Executor
 * JSON schema tool definitions and execution map for the Anthropic Messages API
 */

import type { SemanticLayerCompiler } from '../compiler'
import type { SecurityContext } from '../types'
import type { AgentSSEEvent } from './types'
import { handleDiscover, handleLoad } from '../../adapters/utils'
import { validateChartConfig, inferChartConfig, buildChartRequirementsDescription } from './chart-validation'

/**
 * Result of executing a tool call
 */
export interface ToolExecutionResult {
  /** String content to return as tool_result */
  result: string
  /** Whether the tool call errored */
  isError?: boolean
  /** Optional SSE event to emit as a side effect (add_portlet, add_markdown) */
  sideEffect?: AgentSSEEvent
}

/**
 * Anthropic API tool definition (JSON schema format)
 */
interface ToolDefinition {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

/** Chart types available to the agent */
const AGENT_ALLOWED_CHART_TYPES = [
  'bar', 'line', 'area', 'pie', 'scatter', 'radar', 'bubble', 'table',
  'kpiNumber', 'kpiDelta', 'funnel', 'heatmap', 'sankey', 'sunburst',
  'retentionHeatmap', 'retentionCombined', 'boxPlot'
]

/**
 * Returns the array of tool definitions for the Anthropic Messages API.
 * Plain JSON schema — no Zod dependency.
 */
export function getToolDefinitions(): ToolDefinition[] {
  return [
    // Tool 1: discover_cubes
    {
      name: 'discover_cubes',
      description:
        'Search for available data cubes by topic or intent. Call this FIRST to understand what data is available. Returns cube names, measures, dimensions, and relationships.',
      input_schema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Keyword to search (e.g., "sales", "employees")' },
          intent: { type: 'string', description: 'Natural language goal (e.g., "analyze productivity trends")' },
          limit: { type: 'number', description: 'Max results (default: 10)' },
          minScore: { type: 'number', description: 'Min relevance 0-1 (default: 0.1)' }
        }
      }
    },

    // Tool 2: get_cube_metadata
    {
      name: 'get_cube_metadata',
      description:
        'Get full metadata for all registered cubes including all measures, dimensions, types, and relationships. Use this for detailed schema information.',
      input_schema: {
        type: 'object',
        properties: {}
      }
    },

    // Tool 3: execute_query
    {
      name: 'execute_query',
      description:
        'Execute a semantic query and return data results. The query follows the Cube.js query format with measures, dimensions, filters, timeDimensions, order, and limit.',
      input_schema: {
        type: 'object',
        properties: {
          measures: {
            type: 'array',
            items: { type: 'string' },
            description: 'Aggregation measures (e.g., ["Employees.count"])'
          },
          dimensions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Grouping dimensions (e.g., ["Employees.name"])'
          },
          filters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                member: { type: 'string' },
                operator: { type: 'string' },
                values: { type: 'array', items: {} }
              },
              required: ['member', 'operator']
            },
            description: 'Filter conditions'
          },
          timeDimensions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dimension: { type: 'string' },
                granularity: { type: 'string' },
                dateRange: {}
              },
              required: ['dimension']
            },
            description: 'Time dimensions with optional granularity'
          },
          order: {
            type: 'object',
            description: 'Sort order (e.g., {"Employees.count": "desc"})'
          },
          limit: {
            type: 'number',
            description: 'Row limit'
          }
        }
      }
    },

    // Tool 4: add_portlet
    {
      name: 'add_portlet',
      description:
        'Add a chart visualization to the notebook.\n'
        + buildChartRequirementsDescription(AGENT_ALLOWED_CHART_TYPES)
        + '\nThe query is validated before adding. The portlet fetches its own data.',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title for the visualization' },
          query: { type: 'string', description: 'JSON string of the CubeQuery to visualize' },
          chartType: {
            type: 'string',
            enum: AGENT_ALLOWED_CHART_TYPES,
            description: 'Chart type to render'
          },
          chartConfig: {
            type: 'object',
            properties: {
              xAxis: { type: 'array', items: { type: 'string' } },
              yAxis: { type: 'array', items: { type: 'string' } },
              series: { type: 'array', items: { type: 'string' } },
              sizeField: { type: 'string' },
              colorField: { type: 'string' }
            },
            description: 'Chart axis configuration'
          },
          displayConfig: {
            type: 'object',
            properties: {
              showLegend: { type: 'boolean' },
              showGrid: { type: 'boolean' },
              showTooltip: { type: 'boolean' },
              stacked: { type: 'boolean' },
              orientation: { type: 'string', enum: ['horizontal', 'vertical'] }
            },
            description: 'Chart display configuration'
          }
        },
        required: ['title', 'query', 'chartType']
      }
    },

    // Tool 5: add_markdown
    {
      name: 'add_markdown',
      description:
        'Add an explanation or analysis text block to the notebook. Use markdown formatting. Use this to explain findings, methodology, and insights alongside visualizations.',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Optional title for the text block' },
          content: { type: 'string', description: 'Markdown content to display' }
        },
        required: ['content']
      }
    }
  ]
}

/**
 * Create a tool executor map that closes over the semantic layer and security context.
 * Returns a Map<toolName, handler> where each handler takes parsed input and returns a result.
 */
export function createToolExecutor(options: {
  semanticLayer: SemanticLayerCompiler
  securityContext: SecurityContext
}): Map<string, (input: Record<string, unknown>) => Promise<ToolExecutionResult>> {
  const { semanticLayer, securityContext } = options

  const executors = new Map<string, (input: Record<string, unknown>) => Promise<ToolExecutionResult>>()

  // discover_cubes
  executors.set('discover_cubes', async (input) => {
    const result = await handleDiscover(semanticLayer, {
      topic: input.topic as string | undefined,
      intent: input.intent as string | undefined,
      limit: input.limit as number | undefined,
      minScore: input.minScore as number | undefined
    })
    return { result: JSON.stringify(result, null, 2) }
  })

  // get_cube_metadata
  executors.set('get_cube_metadata', async () => {
    const metadata = semanticLayer.getMetadata()
    return { result: JSON.stringify(metadata, null, 2) }
  })

  // execute_query
  executors.set('execute_query', async (input) => {
    try {
      const query = {
        measures: input.measures as string[] | undefined,
        dimensions: input.dimensions as string[] | undefined,
        filters: input.filters as Array<{ member: string; operator: string; values?: unknown[] }> | undefined,
        timeDimensions: input.timeDimensions as Array<{ dimension: string; granularity?: string; dateRange?: unknown }> | undefined,
        order: input.order as Record<string, 'asc' | 'desc'> | undefined,
        limit: input.limit as number | undefined
      }
      const result = await handleLoad(semanticLayer, securityContext, { query: query as any })
      return {
        result: JSON.stringify({
          rowCount: result.data.length,
          data: result.data,
          annotation: result.annotation
        }, null, 2)
      }
    } catch (error) {
      return {
        result: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true
      }
    }
  })

  // add_portlet
  executors.set('add_portlet', async (input) => {
    // Resolve chart type aliases (backwards compat for common LLM mistakes)
    const CHART_TYPE_ALIASES: Record<string, string> = {
      'number': 'kpiNumber',
      'retention': 'retentionHeatmap',
    }
    const resolvedChartType = CHART_TYPE_ALIASES[input.chartType as string] ?? input.chartType as string

    // Validate the query before adding the portlet
    let parsedQuery: Record<string, unknown>
    try {
      parsedQuery = JSON.parse(input.query as string)
    } catch {
      return {
        result: 'Invalid query: could not parse JSON string. Ensure `query` is a valid JSON string.',
        isError: true
      }
    }

    const validation = semanticLayer.validateQuery(parsedQuery as any)
    if (!validation.isValid) {
      return {
        result: `Invalid query — fix these errors and retry:\n${validation.errors.join('\n')}`,
        isError: true
      }
    }

    // Validate and infer chart config against drop zone requirements
    const inferredConfig = inferChartConfig(resolvedChartType, input.chartConfig as Record<string, unknown> | undefined, parsedQuery)
    const configValidation = validateChartConfig(resolvedChartType, inferredConfig, parsedQuery)
    if (!configValidation.isValid) {
      return {
        result: `Chart config invalid — fix these errors and retry:\n${configValidation.errors.join('\n')}`,
        isError: true
      }
    }

    const id = `portlet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const portletData = {
      id,
      title: input.title as string,
      query: input.query as string,
      chartType: resolvedChartType,
      chartConfig: inferredConfig,
      displayConfig: input.displayConfig as Record<string, unknown> | undefined
    }

    return {
      result: `Portlet "${input.title}" added to notebook (id: ${id}, chart: ${resolvedChartType}). [Reminder: in your next response, start with a brief sentence about what you will do next BEFORE making any tool calls.]`,
      sideEffect: { type: 'add_portlet' as const, data: portletData as any }
    }
  })

  // add_markdown
  executors.set('add_markdown', async (input) => {
    const id = `markdown-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const markdownData = {
      id,
      title: input.title as string | undefined,
      content: input.content as string
    }

    return {
      result: `Markdown block added to notebook (id: ${id}). [Reminder: in your next response, start with a brief sentence about what you will do next BEFORE making any tool calls.]`,
      sideEffect: { type: 'add_markdown' as const, data: markdownData }
    }
  })

  return executors
}
