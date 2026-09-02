/**
 * Agent Tool Definitions + Executor
 * JSON schema tool definitions and execution map for the agentic notebook.
 * Tool definitions are provider-agnostic — each provider wraps them in its own format.
 */

import type { BuiltInChartType } from '../../client/types.js'
import type { SemanticLayerCompiler } from '../compiler.js'
import type { SecurityContext } from '../types/index.js'
import type { AgentSSEEvent } from './types.js'
import type { ToolDefinition } from './providers/types.js'
import { handleDiscover, handleLoad, normalizeQueryFields } from '../query-handlers.js'
import { validateChartConfig, inferChartConfig, resolveChartTypeFallback, buildChartRequirementsDescription } from './chart-validation.js'
import { summariseDataShape, AGENT_RESULT_ROW_LIMIT } from './data-shape.js'
import {
  RECORDS_TABLE_CHART_CONFIG_SCHEMA,
  RECORDS_TABLE_DISPLAY_CONFIG_SCHEMA,
  FIELD_ZONE_CHART_CONFIG_SCHEMA,
  SCALE_DISPLAY_CONFIG_SCHEMA
} from '../ai/chart-schema.js'
import { QUERY_PARAMS_SCHEMA } from '../ai/query-schema.js'

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
 * Chart types the notebook agent may create — an explicit list, not a derived
 * one, so widening it stays a product decision. It now covers every
 * `BuiltInChartType`: the config each one needs is expressible through the
 * `add_portlet` chartConfig/displayConfig schema below, and a narrower list was
 * making the agent reach for `bar` and `table` for everything.
 *
 * Two carry caveats the system prompt spells out rather than the schema:
 * `gauge` needs an explicit `maxValue` (it otherwise scales to the data and
 * reads as 100%), and `candlestick` needs its measures in OHLC order, which
 * JSON Schema cannot express.
 *
 * Typed against `BuiltInChartType` (type-only import — no runtime dependency on
 * the client graph) so a renamed or removed chart type fails `npm run typecheck`
 * here instead of silently offering the model a type that no longer renders.
 */
export const AGENT_ALLOWED_CHART_TYPES: BuiltInChartType[] = [
  'bar', 'line', 'area', 'pie', 'scatter', 'radar', 'bubble', 'table',
  'kpiNumber', 'kpiDelta', 'kpiText', 'funnel', 'heatmap', 'sankey', 'sunburst',
  'retentionHeatmap', 'retentionCombined', 'boxPlot', 'markdown', 'recordsTable',
  'treemap', 'radialBar', 'proportionBar', 'dotStrip', 'waterfall',
  'measureProfile', 'activityGrid', 'gauge', 'candlestick'
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

    // Tool 3: execute_query — uses shared schema from query-schema.ts
    {
      name: 'execute_query',
      description:
        'Execute a semantic query and return data results. Supports standard queries (measures/dimensions) and analysis modes (funnel/flow/retention). Only provide ONE mode per call.',
      parameters: {
        type: 'object',
        properties: QUERY_PARAMS_SCHEMA
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
              colorField: { type: 'string' },
              yAxisAssignment: {
                type: 'object',
                description: 'Dual Y-axis: map measure fields to "left" or "right" axis. Only for bar, line, area charts with 2+ measures of different scales. Example: {"Sales.revenue": "left", "Sales.conversionRate": "right"}'
              },
              ...RECORDS_TABLE_CHART_CONFIG_SCHEMA,
              ...FIELD_ZONE_CHART_CONFIG_SCHEMA
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
              orientation: { type: 'string', enum: ['horizontal', 'vertical'] },
              ...RECORDS_TABLE_DISPLAY_CONFIG_SCHEMA,
              ...SCALE_DISPLAY_CONFIG_SCHEMA
            },
            description: 'Chart display configuration'
          }
        },
        required: ['title', 'query', 'chartType']
      }
    },

    // Tool 5: update_portlet
    {
      name: 'update_portlet',
      description:
        'Amend a visualization you already added in this conversation, in place. '
        + 'Use this instead of add_portlet when a chart came back wrong or the user asks to change one — '
        + 'adding a second chart of the same data clutters the notebook. '
        + 'Only the fields you pass are changed; the rest are kept. The same validation as add_portlet applies. '
        + 'For a portlet added earlier in the conversation rather than this turn, pass the full `query` and `chartType` as well as the fields you are changing.',
      parameters: {
        type: 'object',
        properties: {
          portletId: { type: 'string', description: 'The id returned by add_portlet' },
          title: { type: 'string', description: 'New title' },
          query: { type: 'string', description: 'Replacement query, as a JSON string (same shape as add_portlet)' },
          chartType: {
            type: 'string',
            enum: AGENT_ALLOWED_CHART_TYPES,
            description: 'Replacement chart type'
          },
          chartConfig: { type: 'object', description: 'Replacement chart axis configuration (replaces, does not merge)' },
          displayConfig: { type: 'object', description: 'Replacement chart display configuration (replaces, does not merge)' }
        },
        required: ['portletId']
      }
    },

    // Tool 6: add_markdown
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

    // Tool 7: save_as_dashboard
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
                    colorField: { type: 'string' },
                    ...RECORDS_TABLE_CHART_CONFIG_SCHEMA,
                    ...FIELD_ZONE_CHART_CONFIG_SCHEMA
                  },
                  description: 'Chart axis configuration'
                },
                displayConfig: {
                  type: 'object',
                  description: 'Chart display configuration (for markdown: { content, hideHeader, transparentBackground, autoHeight })',
                  properties: { ...RECORDS_TABLE_DISPLAY_CONFIG_SCHEMA, ...SCALE_DISPLAY_CONFIG_SCHEMA }
                },
                dashboardFilterMapping: {
                  type: 'array',
                  items: {
                    anyOf: [
                      { type: 'string' },
                      {
                        type: 'object',
                        properties: {
                          filterId: { type: 'string', description: 'Dashboard filter ID' },
                          member: { type: 'string', description: 'Optional field to remap the filter to for this portlet (e.g. "Invoices.customerId")' }
                        },
                        required: ['filterId']
                      }
                    ]
                  },
                  description: 'Dashboard filters that apply to this portlet: filter IDs, or { filterId, member } entries to remap a filter to a different field for this portlet'
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
/** A portlet's fields, as `add_portlet` and `update_portlet` both build them. */
interface PreparedPortlet {
  query: string
  chartType: string
  chartConfig: Record<string, unknown>
  displayConfig?: Record<string, unknown>
}

export function createToolExecutor(options: {
  semanticLayer: SemanticLayerCompiler
  securityContext: SecurityContext
}): Map<string, (input: Record<string, unknown>) => Promise<ToolExecutionResult>> {
  const { semanticLayer, securityContext } = options

  const executors = new Map<string, (input: Record<string, unknown>) => Promise<ToolExecutionResult>>()

  // Portlets added during this request, so `update_portlet` has a merge base.
  const sessionPortlets = new Map<string, { id: string; title: string } & PreparedPortlet>()

  // discover_cubes
  executors.set('discover_cubes', async (input) => {
    const result = await handleDiscover(semanticLayer, securityContext, {
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
        // Only present when a suggested field's name doesn't say what it is
        // (EAV attributes), so it costs nothing on ordinary cubes.
        ...(cube.fieldTitles ? { fieldTitles: cube.fieldTitles } : {}),
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
    const metadata = semanticLayer.getMetadata(securityContext)
    return { result: JSON.stringify(metadata) }
  })

  // Build a metadata lookup for field validation. The executor is created per
  // chat request and closes over that request's security context, so this
  // lookup is the caller's cube set — not a shared, base-set snapshot.
  // Metadata names are already fully qualified: "CubeName.fieldName"
  const cubeMetadataMap = new Map<string, { measures: string[]; dimensions: string[] }>()
  for (const cube of semanticLayer.getMetadata(securityContext)) {
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
  // Note: Field normalization (double-prefix fix, order normalization, underscore->dot)
  // is handled by normalizeQueryFields() in the shared handleLoad path.
  // The agent adds field-level validation with helpful error hints before reaching handleLoad.
  executors.set('execute_query', async (input) => {
    try {
      // Agent-specific: validate field format and provide helpful error hints
      const validateFieldFormat = (fields: unknown, label: string): void => {
        if (!Array.isArray(fields)) return
        const errors: string[] = []

        for (const f of fields) {
          if (typeof f !== 'string') continue
          const parts = f.split('.')

          if (parts.length === 1) {
            errors.push(`"${f}" is not valid — must be "CubeName.fieldName".${formatAvailable(f, label)}`)
          } else if (parts.length === 2 && parts[0] === parts[1]) {
            errors.push(`"${f}" is WRONG — "${parts[0]}" is the cube name, not a ${label.replace(/s$/, '')}.${formatAvailable(parts[0], label)}`)
          }
        }

        if (errors.length > 0) {
          throw new Error(`Invalid ${label}:\n${errors.join('\n')}`)
        }
      }
      validateFieldFormat(input.measures, 'measures')
      validateFieldFormat(input.dimensions, 'dimensions')

      // Assemble the query object — normalization happens in handleLoad
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
          limit: input.limit as number | undefined,
          offset: input.offset as number | undefined,
          ungrouped: input.ungrouped as boolean | undefined,
        }
      }

      const result = await handleLoad(semanticLayer, securityContext, { query: query as any })
      // Hand back a bounded sample plus a shape summary rather than the whole
      // result set: the portlet re-runs the query itself, so the model never
      // needed every row, and a large one crowded out its own output budget.
      const rows = result.data.slice(0, AGENT_RESULT_ROW_LIMIT)
      return {
        result: JSON.stringify({
          rowCount: result.data.length,
          data: rows,
          truncated: result.data.length > rows.length,
          dataShape: summariseDataShape(rows, result.annotation),
          annotation: result.annotation
        }) + '\n[IMPORTANT: Your next response MUST start with a brief text message BEFORE any tool calls. Now call add_markdown and add_portlet to visualize these results.]'
      }
    } catch (error) {
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

  /**
   * Run the shared query + chart-config pipeline for a portlet.
   * Returns the prepared fields, or the model-facing error to hand straight back.
   */
  function preparePortlet(fields: {
    query: string
    chartType: string
    chartConfig?: Record<string, unknown>
    displayConfig?: Record<string, unknown>
  }): { portlet: PreparedPortlet; note?: string } | { error: string } {
    // Resolve chart type aliases (backwards compat for common LLM mistakes)
    const CHART_TYPE_ALIASES: Record<string, string> = {
      'number': 'kpiNumber',
      'retention': 'retentionHeatmap',
    }
    const resolvedChartType = CHART_TYPE_ALIASES[fields.chartType] ?? fields.chartType

    let parsedQuery: Record<string, unknown>
    try {
      parsedQuery = JSON.parse(fields.query)
    } catch {
      return { error: 'Invalid query: could not parse JSON string. Ensure `query` is a valid JSON string.' }
    }

    // Normalize before validation (fix double-prefixed fields, order keys, etc.)
    parsedQuery = normalizeQueryFields(parsedQuery)

    const validation = semanticLayer.validateQuery(parsedQuery as any, securityContext)
    if (!validation.isValid) {
      return { error: `Invalid query — fix these errors and retry:\n${validation.errors.join('\n')}\n\nAttempted query:\n${JSON.stringify(parsedQuery, null, 2)}` }
    }

    // Chart config inference and validation — skip for analysis-mode queries
    // (funnel/sankey/sunburst/retention charts auto-configure from data)
    const isAnalysisMode = !!(parsedQuery.funnel || parsedQuery.flow || parsedQuery.retention)
    let finalChartConfig: Record<string, unknown>
    let effectiveChartType = resolvedChartType
    let fallbackNote: string | undefined
    if (isAnalysisMode) {
      finalChartConfig = fields.chartConfig ?? {}
    } else {
      // Resolve the fallback BEFORE inference: inference fills mandatory drop
      // zones per chart type, so it has to see the type that will render.
      const fallback = resolveChartTypeFallback(resolvedChartType, fields.chartConfig, parsedQuery)
      effectiveChartType = fallback.chartType
      fallbackNote = fallback.note
      const inferredConfig = inferChartConfig(effectiveChartType, fields.chartConfig, parsedQuery)
      const configValidation = validateChartConfig(effectiveChartType, inferredConfig, parsedQuery)
      if (!configValidation.isValid) {
        return {
          error: `Chart config invalid — fix these errors and retry:\n${configValidation.errors.join('\n')}\n\n`
            + `chartType: ${effectiveChartType}\n`
            + `Attempted chartConfig:\n${JSON.stringify(inferredConfig, null, 2)}\n\n`
            + `Query:\n${JSON.stringify(parsedQuery, null, 2)}`
        }
      }
      finalChartConfig = inferredConfig
    }

    return {
      portlet: {
        // The normalised query, not the raw string the model sent: validation and
        // chart-config inference both ran against this one, so shipping the raw
        // string would put a portlet on the notebook that was never the thing
        // checked — a dropped bad order key or an uncorrected double-prefixed
        // field would surface as a runtime error at render time instead.
        query: JSON.stringify(parsedQuery),
        chartType: effectiveChartType,
        chartConfig: finalChartConfig,
        displayConfig: fields.displayConfig,
      },
      ...(fallbackNote ? { note: fallbackNote } : {}),
    }
  }

  // add_portlet
  executors.set('add_portlet', async (input) => {
    const prepared = preparePortlet({
      query: input.query as string,
      chartType: input.chartType as string,
      chartConfig: input.chartConfig as Record<string, unknown> | undefined,
      displayConfig: input.displayConfig as Record<string, unknown> | undefined,
    })
    if ('error' in prepared) return { result: prepared.error, isError: true }

    const id = `portlet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const portletData = { id, title: input.title as string, ...prepared.portlet }
    // Remembered so `update_portlet` can merge a partial change against it.
    sessionPortlets.set(id, portletData)

    return {
      result: `Portlet "${input.title}" added to notebook (id: ${id}, chart: ${portletData.chartType}).`
        + (prepared.note ? `\n${prepared.note}` : '')
        + ' [Reminder: in your next response, start with a brief sentence about what you will do next BEFORE making any tool calls.]',
      sideEffect: { type: 'add_portlet' as const, data: portletData as any }
    }
  })

  // update_portlet
  executors.set('update_portlet', async (input) => {
    const portletId = input.portletId as string | undefined
    // Portlets added in an earlier message are not in this request's map — the
    // executor is built per request. That is the common case (the user asks for
    // a change in a follow-up), so a full restatement is accepted instead of a
    // merge. Replayed history carries real tool arguments now, so the model can
    // see what it originally sent.
    const existing = portletId ? sessionPortlets.get(portletId) : undefined
    const query = (input.query as string | undefined) ?? existing?.query
    const chartType = (input.chartType as string | undefined) ?? existing?.chartType
    if (!portletId || !query || !chartType) {
      return {
        result: `Cannot update portlet "${portletId ?? ''}": it was not added in this conversation, so there is nothing to merge your change into. `
          + 'Call update_portlet again with the same portletId plus the full `query` and `chartType` for the chart you want.',
        isError: true
      }
    }

    const prepared = preparePortlet({
      query,
      chartType,
      // A supplied chartConfig replaces rather than merges: half-updated axes
      // are harder to reason about than a restated set.
      chartConfig: (input.chartConfig as Record<string, unknown> | undefined) ?? existing?.chartConfig,
      displayConfig: (input.displayConfig as Record<string, unknown> | undefined) ?? existing?.displayConfig,
    })
    if ('error' in prepared) return { result: prepared.error, isError: true }

    const title = (input.title as string | undefined) ?? existing?.title ?? 'Untitled'
    const portletData = { id: portletId, title, ...prepared.portlet }
    sessionPortlets.set(portletId, portletData)

    return {
      result: `Portlet "${title}" updated (id: ${portletId}, chart: ${portletData.chartType}).`
        + (prepared.note ? `\n${prepared.note}` : '')
        + ' [Reminder: in your next response, start with a brief sentence about what you will do next BEFORE making any tool calls.]',
      sideEffect: { type: 'update_portlet' as const, data: portletData as any }
    }
  })

  // add_markdown
  executors.set('add_markdown', async (input) => {
    // Normalize: some models send `text` or `markdown` instead of `content`
    const content = (input.content || input.text || input.markdown || '') as string
    // Never emit a side effect for empty content: the block would render as a
    // blank card titled "Markdown" while the model was told it succeeded, so it
    // would never retry.
    if (typeof content !== 'string' || content.trim() === '') {
      return {
        result: 'add_markdown was called with no content, so no block was added. '
          + 'Call add_markdown again with the explanation text in the `content` field.',
        isError: true
      }
    }
    const id = `markdown-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
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
      // Chart configs completed during validation, reused when the dashboard is
      // built so a saved portlet gets the same inference `add_portlet` applies.
      const inferredChartConfigs = new Map<Record<string, unknown>, Record<string, unknown>>()
      const resolvedChartTypes = new Map<Record<string, unknown>, string>()
      for (const portlet of portlets) {
        const declaredChartType = portlet.chartType as string
        if (declaredChartType === 'markdown') continue

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

        // Normalize before validation (fix double-prefixed fields, etc.)
        parsedQuery = normalizeQueryFields(parsedQuery)

        const validation = semanticLayer.validateQuery(parsedQuery as any, securityContext)
        if (!validation.isValid) {
          errors.push(`Portlet "${portlet.title}": ${validation.errors.join(', ')}`)
          continue
        }

        // The same chart checks `add_portlet` runs, so a dashboard cannot be
        // saved with a portlet the notebook would have rejected — a records
        // table over a grouped query would list aggregates, not records. The
        // same bar fallback applies too, so a portlet auto-switched in the
        // notebook is not rejected on the way into a dashboard.
        const chartType = resolveChartTypeFallback(
          declaredChartType,
          portlet.chartConfig as Record<string, unknown> | undefined,
          parsedQuery
        ).chartType
        const inferredConfig = inferChartConfig(
          chartType,
          portlet.chartConfig as Record<string, unknown> | undefined,
          parsedQuery
        )
        const configValidation = validateChartConfig(chartType, inferredConfig, parsedQuery)
        if (!configValidation.isValid) {
          errors.push(`Portlet "${portlet.title}": ${configValidation.errors.join(', ')}`)
          continue
        }
        inferredChartConfigs.set(portlet, inferredConfig)
        resolvedChartTypes.set(portlet, chartType)
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
          const chartType = resolvedChartTypes.get(p) ?? (p.chartType as string)
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
                chartConfig: inferredChartConfigs.get(p) ?? (p.chartConfig as Record<string, unknown>) ?? {},
                displayConfig: (p.displayConfig as Record<string, unknown>) || {},
              },
            },
            query: isMarkdown ? {} : parsedQuery,
          }

          return {
            id: p.id as string,
            title: p.title as string,
            analysisConfig,
            dashboardFilterMapping: p.dashboardFilterMapping as Array<string | { filterId: string; member?: string }> | undefined,
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
