/**
 * Agent Tool Definitions + Executor
 * JSON schema tool definitions and execution map for the agentic notebook.
 * Tool definitions are provider-agnostic — each provider wraps them in its own format.
 */

import type { SemanticLayerCompiler } from '../compiler'
import type { SecurityContext } from '../types'
import type { AgentSSEEvent } from './types'
import type { ToolDefinition } from './providers/types'
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

/** Chart types available to the agent */
const AGENT_ALLOWED_CHART_TYPES = [
  'bar', 'line', 'area', 'pie', 'scatter', 'radar', 'bubble', 'table',
  'kpiNumber', 'kpiDelta', 'funnel', 'heatmap', 'sankey', 'sunburst',
  'retentionHeatmap', 'retentionCombined', 'boxPlot', 'markdown'
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
      parameters: {
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
      parameters: {
        type: 'object',
        properties: {}
      }
    },

    // Tool 3: execute_query
    {
      name: 'execute_query',
      description:
        'Execute a semantic query and return data results. Supports standard queries (measures/dimensions) and analysis modes (funnel/flow/retention). Only provide ONE mode per call.',
      parameters: {
        type: 'object',
        properties: {
          measures: {
            type: 'array',
            items: { type: 'string', pattern: '^[A-Z][a-zA-Z0-9]*\\.[a-zA-Z][a-zA-Z0-9]*$' },
            description: 'Aggregation measures — MUST be "CubeName.measureName" format (e.g., ["PullRequests.count", "Issues.openCount"]). NEVER use just the cube name.'
          },
          dimensions: {
            type: 'array',
            items: { type: 'string', pattern: '^[A-Z][a-zA-Z0-9]*\\.[a-zA-Z][a-zA-Z0-9]*$' },
            description: 'Grouping dimensions — MUST be "CubeName.dimensionName" format (e.g., ["Teams.name", "Employees.department"]). NEVER use just the cube name.'
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
            description: 'Sort order. Keys MUST be a measure or dimension from this query in "CubeName.fieldName" format, values are "asc" or "desc". Example: {"Teams.count": "desc"}. WRONG: {"Teams_count": "desc"}'
          },
          limit: {
            type: 'number',
            description: 'Row limit'
          },
          funnel: {
            type: 'object',
            properties: {
              bindingKey: { type: 'string', description: 'Entity binding key (e.g., "Events.userId")' },
              timeDimension: { type: 'string', description: 'Time dimension (e.g., "Events.timestamp")' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    filter: {},
                    timeToConvert: { type: 'string', description: 'ISO 8601 duration (e.g., "P7D")' }
                  },
                  required: ['name']
                },
                description: 'Funnel steps (min 2)'
              },
              includeTimeMetrics: { type: 'boolean' },
              globalTimeWindow: { type: 'string' }
            },
            required: ['bindingKey', 'timeDimension', 'steps'],
            description: 'Funnel analysis config. When provided, measures/dimensions are ignored.'
          },
          flow: {
            type: 'object',
            properties: {
              bindingKey: { type: 'string' },
              timeDimension: { type: 'string' },
              eventDimension: { type: 'string', description: 'Dimension whose values become node labels' },
              startingStep: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  filter: {}
                },
                required: ['name']
              },
              stepsBefore: { type: 'number', description: 'Steps before starting step (0-5)' },
              stepsAfter: { type: 'number', description: 'Steps after starting step (0-5)' },
              entityLimit: { type: 'number' },
              outputMode: { type: 'string', enum: ['sankey', 'sunburst'] }
            },
            required: ['bindingKey', 'timeDimension', 'eventDimension', 'startingStep'],
            description: 'Flow analysis config. When provided, measures/dimensions are ignored.'
          },
          retention: {
            type: 'object',
            properties: {
              timeDimension: { type: 'string' },
              bindingKey: { type: 'string' },
              dateRange: {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'YYYY-MM-DD' },
                  end: { type: 'string', description: 'YYYY-MM-DD' }
                },
                required: ['start', 'end']
              },
              granularity: { type: 'string', enum: ['day', 'week', 'month'] },
              periods: { type: 'number' },
              retentionType: { type: 'string', enum: ['classic', 'rolling'] },
              cohortFilters: {},
              activityFilters: {},
              breakdownDimensions: { type: 'array', items: { type: 'string' } }
            },
            required: ['timeDimension', 'bindingKey', 'dateRange', 'granularity', 'periods'],
            description: 'Retention analysis config. When provided, measures/dimensions are ignored.'
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
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title for the visualization' },
          query: {
            type: 'string',
            description: 'JSON string of the query. Standard: {"measures":[...],"dimensions":[...]}. Funnel: {"funnel":{"bindingKey":"...","timeDimension":"...","steps":[...]}}. Flow: {"flow":{"bindingKey":"...","timeDimension":"...","eventDimension":"...","startingStep":{...}}}. Retention: {"retention":{"timeDimension":"...","bindingKey":"...","dateRange":{"start":"...","end":"..."},"granularity":"...","periods":N}}.'
          },
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
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Optional title for the text block' },
          content: { type: 'string', description: 'Markdown content to display' }
        },
        required: ['content']
      }
    },

    // Tool 6: save_as_dashboard
    {
      name: 'save_as_dashboard',
      description:
        'Convert the current notebook analysis into a persistent dashboard. '
        + 'Constructs a professional DashboardConfig with proper grid layout, section headers (markdown portlets), '
        + 'and dashboard-level filters. Call this when the user asks to save/export the notebook as a dashboard.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Dashboard title' },
          description: { type: 'string', description: 'Optional dashboard description' },
          portlets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Unique portlet ID' },
                title: { type: 'string', description: 'Portlet title' },
                chartType: {
                  type: 'string',
                  enum: AGENT_ALLOWED_CHART_TYPES,
                  description: 'Chart type. Use "markdown" for section headers.'
                },
                query: {
                  type: 'string',
                  description: 'JSON string of the query. Omit or leave empty for markdown portlets.'
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
                  description: 'Chart display configuration (for markdown: { content, hideHeader, transparentBackground, autoHeight })'
                },
                dashboardFilterMapping: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of dashboard filter IDs that apply to this portlet'
                },
                analysisType: {
                  type: 'string',
                  enum: ['query', 'funnel', 'flow', 'retention'],
                  description: 'Analysis type (default: "query")'
                },
                w: { type: 'number', description: 'Grid width (1-12)' },
                h: { type: 'number', description: 'Grid height in row units' },
                x: { type: 'number', description: 'Grid x position (0-11)' },
                y: { type: 'number', description: 'Grid y position' }
              },
              required: ['id', 'title', 'chartType', 'w', 'h', 'x', 'y']
            },
            description: 'Array of portlet configurations for the dashboard'
          },
          filters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Unique filter ID' },
                label: { type: 'string', description: 'Display label for the filter' },
                filter: {
                  type: 'object',
                  properties: {
                    member: { type: 'string' },
                    operator: { type: 'string' },
                    values: { type: 'array', items: {} }
                  },
                  required: ['member', 'operator'],
                  description: 'The filter definition'
                },
                isUniversalTime: { type: 'boolean', description: 'When true, applies to all time dimensions in portlets' }
              },
              required: ['id', 'label', 'filter']
            },
            description: 'Dashboard-level filters'
          },
          colorPalette: { type: 'string', description: 'Color palette name' }
        },
        required: ['title', 'portlets']
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

    // Trim verbose fields that are already in the system prompt or redundant for the agent
    const trimmed = {
      cubes: result.cubes.map(cube => ({
        cube: cube.cube,
        title: cube.title,
        description: cube.description,
        relevanceScore: cube.relevanceScore,
        suggestedMeasures: cube.suggestedMeasures,
        suggestedDimensions: cube.suggestedDimensions,
        capabilities: cube.capabilities,
        // Only include analysisConfig if advanced modes are available, and only the essentials
        ...(cube.capabilities.funnel || cube.capabilities.flow || cube.capabilities.retention
          ? {
            analysisConfig: {
              candidateBindingKeys: cube.analysisConfig?.candidateBindingKeys?.map(k => k.dimension) ?? [],
              candidateTimeDimensions: cube.analysisConfig?.candidateTimeDimensions?.map(k => k.dimension) ?? [],
              ...(cube.analysisConfig?.candidateEventDimensions?.length
                ? { candidateEventDimensions: cube.analysisConfig.candidateEventDimensions.map(k => k.dimension) }
                : {}),
            }
          }
          : {}),
        // querySchemas and hints are omitted — already in the system prompt
      }))
    }

    return { result: JSON.stringify(trimmed) + '\n[IMPORTANT: Your next response MUST start with a brief text message BEFORE any tool calls.]' }
  })

  // get_cube_metadata
  executors.set('get_cube_metadata', async () => {
    const metadata = semanticLayer.getMetadata()
    return { result: JSON.stringify(metadata) }
  })

  // Build a metadata lookup for field validation
  // Metadata names are already fully qualified: "CubeName.fieldName"
  const cubeMetadataMap = new Map<string, { measures: string[]; dimensions: string[] }>()
  for (const cube of semanticLayer.getMetadata()) {
    cubeMetadataMap.set(cube.name, {
      measures: (cube.measures || []).map(m => m.name),
      dimensions: (cube.dimensions || []).map(d => d.name),
    })
  }

  /** Format available fields for error hints (metadata names are already "Cube.field") */
  const formatAvailable = (cubeName: string, label: string): string => {
    const cubeMeta = cubeMetadataMap.get(cubeName)
    const available = label === 'measures' ? cubeMeta?.measures : cubeMeta?.dimensions
    if (!available || available.length === 0) return ''
    // Metadata names are already fully qualified (e.g. "Teams.count")
    return ` Available ${label}: ${available.slice(0, 5).map(m => `"${m}"`).join(', ')}`
  }

  // execute_query
  executors.set('execute_query', async (input) => {
    try {
      // Validate and auto-correct Cube.member format before executing
      const validateAndFixFields = (fields: unknown, label: string): string[] | undefined => {
        if (!Array.isArray(fields)) return undefined
        const errors: string[] = []
        const fixed: string[] = []

        for (const f of fields) {
          if (typeof f !== 'string') { fixed.push(f as string); continue }

          const parts = f.split('.')

          if (parts.length === 1) {
            // No dot at all — e.g. "TeamMembers"
            errors.push(`"${f}" is not valid — must be "CubeName.fieldName".${formatAvailable(f, label)}`)
            continue
          }

          if (parts.length === 3 && parts[0] === parts[1]) {
            // CubeName.CubeName.fieldName — e.g. "Teams.Teams.name" → auto-correct to "Teams.name"
            const corrected = `${parts[0]}.${parts[2]}`
            fixed.push(corrected)
            continue
          }

          if (parts.length === 2 && parts[0] === parts[1]) {
            // CubeName.CubeName — e.g. "TeamMembers.TeamMembers"
            errors.push(`"${f}" is WRONG — "${parts[0]}" is the cube name, not a ${label.replace(/s$/, '')}.${formatAvailable(parts[0], label)}`)
            continue
          }

          // Normal "CubeName.fieldName" — pass through
          fixed.push(f)
        }

        if (errors.length > 0) {
          throw new Error(`Invalid ${label}:\n${errors.join('\n')}`)
        }
        return fixed
      }
      input.measures = validateAndFixFields(input.measures, 'measures') ?? input.measures
      input.dimensions = validateAndFixFields(input.dimensions, 'dimensions') ?? input.dimensions

      // Auto-fix CubeName.CubeName.field → CubeName.field in filters and timeDimensions
      const fixDoublePrefixed = (field: string): string => {
        const parts = field.split('.')
        if (parts.length === 3 && parts[0] === parts[1]) {
          return `${parts[0]}.${parts[2]}`
        }
        return field
      }

      if (Array.isArray(input.filters)) {
        for (const filter of input.filters as Array<Record<string, unknown>>) {
          if (typeof filter.member === 'string') {
            filter.member = fixDoublePrefixed(filter.member)
          }
        }
      }

      if (Array.isArray(input.timeDimensions)) {
        for (const td of input.timeDimensions as Array<Record<string, unknown>>) {
          if (typeof td.dimension === 'string') {
            td.dimension = fixDoublePrefixed(td.dimension)
          }
        }
      }

      // Normalize order: OpenAI sometimes sends [{key: dir}] instead of {key: dir}
      if (Array.isArray(input.order)) {
        const merged: Record<string, unknown> = {}
        for (const entry of input.order) {
          if (entry && typeof entry === 'object') {
            Object.assign(merged, entry)
          }
        }
        input.order = merged
      }

      if (input.order && typeof input.order === 'object' && !Array.isArray(input.order)) {
        // Collect valid fields from the query for matching
        const queryFields = new Set([
          ...(Array.isArray(input.measures) ? input.measures as string[] : []),
          ...(Array.isArray(input.dimensions) ? input.dimensions as string[] : []),
        ])

        const fixedOrder: Record<string, unknown> = {}
        for (const [key, val] of Object.entries(input.order as Record<string, unknown>)) {
          const dpFixed = fixDoublePrefixed(key)
          if (queryFields.has(dpFixed)) {
            fixedOrder[dpFixed] = val
            continue
          }

          // Try normalizing underscores → dots (e.g. "Teams_Teams_count" → "Teams.Teams.count" → "Teams.count")
          if (!key.includes('.') && key.includes('_')) {
            const withDots = key.replace(/_/g, '.')
            const normalized = fixDoublePrefixed(withDots)
            if (queryFields.has(normalized)) {
              fixedOrder[normalized] = val
              continue
            }
            // Try matching by field suffix (e.g. key ends with "_count" → match "Teams.count")
            const match = [...queryFields].find(f => {
              const fieldName = f.split('.')[1]
              return fieldName && (key.endsWith(`_${fieldName}`) || key.endsWith(`.${fieldName}`))
            })
            if (match) {
              fixedOrder[match] = val
              continue
            }
          }

          // Drop order keys that aren't in the query's measures/dimensions — fall through to default
          if (queryFields.size > 0 && !queryFields.has(dpFixed)) {
            continue // silently drop invalid order key
          }

          fixedOrder[dpFixed] = val
        }

        // If all order keys were dropped, default to first measure desc
        if (Object.keys(fixedOrder).length === 0 && queryFields.size > 0) {
          const firstMeasure = Array.isArray(input.measures) ? (input.measures as string[])[0] : undefined
          if (firstMeasure) {
            fixedOrder[firstMeasure] = 'desc'
          }
        }

        input.order = fixedOrder
      }

      let query: Record<string, unknown>

      if (input.funnel) {
        query = { funnel: input.funnel }
      } else if (input.flow) {
        query = { flow: input.flow }
      } else if (input.retention) {
        query = { retention: input.retention }
      } else {
        query = {
          measures: input.measures as string[] | undefined,
          dimensions: input.dimensions as string[] | undefined,
          filters: input.filters as Array<{ member: string; operator: string; values?: unknown[] }> | undefined,
          timeDimensions: input.timeDimensions as Array<{ dimension: string; granularity?: string; dateRange?: unknown }> | undefined,
          order: input.order as Record<string, 'asc' | 'desc'> | undefined,
          limit: input.limit as number | undefined
        }
      }

      const result = await handleLoad(semanticLayer, securityContext, { query: query as any })
      return {
        result: JSON.stringify({
          rowCount: result.data.length,
          data: result.data,
          annotation: result.annotation
        }) + '\n[IMPORTANT: Your next response MUST start with a brief text message BEFORE any tool calls. Now call add_markdown and add_portlet to visualize these results.]'
      }
    } catch (error) {
      // Include the attempted query in the error so the agent (and developer) can debug
      const attemptedQuery = {
        measures: input.measures,
        dimensions: input.dimensions,
        filters: input.filters,
        timeDimensions: input.timeDimensions,
        order: input.order,
        limit: input.limit,
        ...(input.funnel ? { funnel: input.funnel } : {}),
        ...(input.flow ? { flow: input.flow } : {}),
        ...(input.retention ? { retention: input.retention } : {}),
      }
      return {
        result: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nAttempted query:\n${JSON.stringify(attemptedQuery, null, 2)}`,
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
        result: `Invalid query — fix these errors and retry:\n${validation.errors.join('\n')}\n\nAttempted query:\n${JSON.stringify(parsedQuery, null, 2)}`,
        isError: true
      }
    }

    // Chart config inference and validation — skip for analysis-mode queries
    // (funnel/sankey/sunburst/retention charts auto-configure from data)
    const isAnalysisMode = !!(parsedQuery.funnel || parsedQuery.flow || parsedQuery.retention)
    let finalChartConfig: Record<string, unknown>
    if (isAnalysisMode) {
      finalChartConfig = (input.chartConfig as Record<string, unknown>) ?? {}
    } else {
      const inferredConfig = inferChartConfig(resolvedChartType, input.chartConfig as Record<string, unknown> | undefined, parsedQuery)
      const configValidation = validateChartConfig(resolvedChartType, inferredConfig, parsedQuery)
      if (!configValidation.isValid) {
        return {
          result: `Chart config invalid — fix these errors and retry:\n${configValidation.errors.join('\n')}`,
          isError: true
        }
      }
      finalChartConfig = inferredConfig
    }

    const id = `portlet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const portletData = {
      id,
      title: input.title as string,
      query: input.query as string,
      chartType: resolvedChartType,
      chartConfig: finalChartConfig,
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
    // Normalize: some models send `text` or `markdown` instead of `content`
    const content = (input.content || input.text || input.markdown || '') as string
    const markdownData = {
      id,
      title: input.title as string | undefined,
      content,
    }

    return {
      result: `Markdown block added to notebook (id: ${id}). [Reminder: in your next response, start with a brief sentence about what you will do next BEFORE making any tool calls.]`,
      sideEffect: { type: 'add_markdown' as const, data: markdownData }
    }
  })

  // save_as_dashboard
  executors.set('save_as_dashboard', async (input) => {
    try {
      const portlets = input.portlets as Array<Record<string, unknown>>
      if (!portlets || portlets.length === 0) {
        return { result: 'Dashboard must contain at least one portlet.', isError: true }
      }

      // Validate each portlet's query (skip markdown portlets)
      const errors: string[] = []
      for (const portlet of portlets) {
        const chartType = portlet.chartType as string
        if (chartType === 'markdown') continue

        const queryStr = portlet.query as string | undefined
        if (!queryStr) {
          errors.push(`Portlet "${portlet.title}": missing query`)
          continue
        }

        let parsedQuery: Record<string, unknown>
        try {
          parsedQuery = JSON.parse(queryStr)
        } catch {
          errors.push(`Portlet "${portlet.title}": invalid JSON query`)
          continue
        }

        const validation = semanticLayer.validateQuery(parsedQuery as any)
        if (!validation.isValid) {
          errors.push(`Portlet "${portlet.title}": ${validation.errors.join(', ')}`)
        }
      }

      if (errors.length > 0) {
        return {
          result: `Dashboard has invalid portlets — fix these errors and retry:\n${errors.join('\n')}`,
          isError: true
        }
      }

      // Build DashboardConfig with proper analysisConfig for each portlet
      const dashboardConfig = {
        portlets: portlets.map((p) => {
          const chartType = p.chartType as string
          const isMarkdown = chartType === 'markdown'

          // Build analysisConfig in the canonical format (avoids legacy migration path)
          const analysisType = isMarkdown ? 'query'
            : (p.analysisType as string) || 'query'
          const modeKey = analysisType === 'funnel' ? 'funnel'
            : analysisType === 'flow' ? 'flow'
            : analysisType === 'retention' ? 'retention'
            : 'query'

          const queryStr = (p.query as string) || '{}'
          let parsedQuery: Record<string, unknown>
          try {
            parsedQuery = JSON.parse(queryStr)
          } catch {
            parsedQuery = {}
          }

          const analysisConfig = {
            version: 1 as const,
            analysisType: modeKey,
            activeView: 'chart' as const,
            charts: {
              [modeKey]: {
                chartType,
                chartConfig: (p.chartConfig as Record<string, unknown>) || {},
                displayConfig: (p.displayConfig as Record<string, unknown>) || {},
              },
            },
            query: isMarkdown ? {} : parsedQuery,
          }

          return {
            id: p.id as string,
            title: p.title as string,
            analysisConfig,
            dashboardFilterMapping: p.dashboardFilterMapping as string[] | undefined,
            w: p.w as number,
            h: p.h as number,
            x: p.x as number,
            y: p.y as number,
          }
        }),
        filters: input.filters as Array<Record<string, unknown>> | undefined,
        colorPalette: input.colorPalette as string | undefined,
      }

      const title = input.title as string
      const portletCount = dashboardConfig.portlets.length
      const filterCount = dashboardConfig.filters?.length || 0

      return {
        result: `Dashboard "${title}" created with ${portletCount} portlets and ${filterCount} filters.`,
        sideEffect: {
          type: 'dashboard_saved' as const,
          data: {
            title,
            description: input.description as string | undefined,
            dashboardConfig: dashboardConfig as any,
          }
        }
      }
    } catch (error) {
      return {
        result: `Failed to save dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isError: true
      }
    }
  })

  return executors
}
