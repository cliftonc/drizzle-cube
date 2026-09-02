/**
 * Tests for Agent Tool Definitions + Executor
 * Tests getToolDefinitions() and createToolExecutor() from src/server/agent/tools.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getToolDefinitions, createToolExecutor } from '../../src/server/agent/tools'

// Mock the shared query handlers (used directly by the agent tools)
vi.mock('../../src/server/query-handlers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/server/query-handlers')>()
  return {
    handleDiscover: vi.fn(),
    handleLoad: vi.fn(),
    normalizeQueryFields: actual.normalizeQueryFields,
  }
})

import { handleDiscover, handleLoad } from '../../src/server/query-handlers'

const mockHandleDiscover = vi.mocked(handleDiscover)
const mockHandleLoad = vi.mocked(handleLoad)

// Mock semantic layer
function createMockSemanticLayer() {
  return {
    getMetadata: vi.fn().mockReturnValue([]),
    validateQuery: vi.fn(),
  } as any
}

const mockSecurityContext = { organisationId: 'org-test' }

// ============================================================================
// getToolDefinitions
// ============================================================================

describe('getToolDefinitions', () => {
  it('should return exactly 7 tools', () => {
    const tools = getToolDefinitions()
    expect(tools).toHaveLength(7)
  })

  it('should return tools with correct names', () => {
    const tools = getToolDefinitions()
    const names = tools.map((t) => t.name)
    expect(names).toEqual([
      'discover_cubes',
      'get_cube_metadata',
      'execute_query',
      'add_portlet',
      'update_portlet',
      'add_markdown',
      'save_as_dashboard',
    ])
  })

  it('should have valid JSON schema structure on each tool', () => {
    const tools = getToolDefinitions()
    for (const tool of tools) {
      expect(tool).toHaveProperty('name')
      expect(tool).toHaveProperty('description')
      expect(tool.description).toBeTruthy()
      expect(tool).toHaveProperty('parameters')
      expect(tool.parameters.type).toBe('object')
      expect(tool.parameters).toHaveProperty('properties')
    }
  })

  it('should require [title, query, chartType] for add_portlet', () => {
    const tools = getToolDefinitions()
    const addPortlet = tools.find((t) => t.name === 'add_portlet')!
    expect(addPortlet.parameters.required).toEqual(['title', 'query', 'chartType'])
  })

  it('should require [content] for add_markdown', () => {
    const tools = getToolDefinitions()
    const addMarkdown = tools.find((t) => t.name === 'add_markdown')!
    expect(addMarkdown.parameters.required).toEqual(['content'])
  })

  it('should include all supported chart types in add_portlet chartType enum', () => {
    const tools = getToolDefinitions()
    const addPortlet = tools.find((t) => t.name === 'add_portlet')!
    const chartTypeProp = addPortlet.parameters.properties.chartType as {
      enum: string[]
    }
    expect(chartTypeProp.enum).toContain('bar')
    expect(chartTypeProp.enum).toContain('line')
    expect(chartTypeProp.enum).toContain('area')
    expect(chartTypeProp.enum).toContain('pie')
    expect(chartTypeProp.enum).toContain('scatter')
    expect(chartTypeProp.enum).toContain('table')
    expect(chartTypeProp.enum).toContain('kpiNumber')
    expect(chartTypeProp.enum).toContain('funnel')
    expect(chartTypeProp.enum).toContain('sunburst')
    expect(chartTypeProp.enum).toContain('retentionHeatmap')
    expect(chartTypeProp.enum).toContain('retentionCombined')
    expect(chartTypeProp.enum).toContain('recordsTable')
  })

  // A records table is only readable when the model formats each column, so the
  // schema has to describe that shape rather than leave displayConfig opaque.
  it('should describe records-table columns and per-column formats in add_portlet', () => {
    const tools = getToolDefinitions()
    const addPortlet = tools.find((t) => t.name === 'add_portlet')!
    const chartConfig = addPortlet.parameters.properties.chartConfig as {
      properties: Record<string, unknown>
    }
    const displayConfig = addPortlet.parameters.properties.displayConfig as {
      properties: Record<string, { additionalProperties?: { properties?: Record<string, { enum?: string[] }> } }>
    }

    expect(Object.keys(chartConfig.properties)).toEqual(
      expect.arrayContaining(['columns', 'hiddenColumns'])
    )
    expect(Object.keys(displayConfig.properties)).toEqual(
      expect.arrayContaining(['columnFormats', 'rowLink', 'pageSize'])
    )
    expect(displayConfig.properties.columnFormats.additionalProperties?.properties?.kind?.enum)
      .toEqual(['text', 'number', 'date', 'badge', 'progress'])
  })

  it('should tell the model that recordsTable needs an ungrouped query', () => {
    const tools = getToolDefinitions()
    const addPortlet = tools.find((t) => t.name === 'add_portlet')!

    expect(addPortlet.description).toContain('recordsTable')
    expect(addPortlet.description).toContain('"ungrouped": true')
    // Chart descriptions are i18n keys on the registry entry — the agent must
    // be given the resolved text, not "chart.recordsTable.description".
    expect(addPortlet.description).not.toContain('chart.recordsTable.description')
  })

  it('should require [member, operator] on execute_query filter items', () => {
    const tools = getToolDefinitions()
    const executeQuery = tools.find((t) => t.name === 'execute_query')!
    const filtersProp = executeQuery.parameters.properties.filters as {
      items: { required: string[] }
    }
    expect(filtersProp.items.required).toEqual(['member', 'operator'])
  })

  it('should include funnel property on execute_query with required fields', () => {
    const tools = getToolDefinitions()
    const executeQuery = tools.find((t) => t.name === 'execute_query')!
    const funnelProp = executeQuery.parameters.properties.funnel as {
      type: string
      required: string[]
      properties: Record<string, unknown>
    }
    expect(funnelProp.type).toBe('object')
    expect(funnelProp.required).toEqual(['bindingKey', 'timeDimension', 'steps'])
    expect(funnelProp.properties).toHaveProperty('bindingKey')
    expect(funnelProp.properties).toHaveProperty('steps')
  })

  it('should include flow property on execute_query with required fields', () => {
    const tools = getToolDefinitions()
    const executeQuery = tools.find((t) => t.name === 'execute_query')!
    const flowProp = executeQuery.parameters.properties.flow as {
      type: string
      required: string[]
      properties: Record<string, unknown>
    }
    expect(flowProp.type).toBe('object')
    expect(flowProp.required).toEqual(['bindingKey', 'timeDimension', 'eventDimension', 'startingStep'])
    expect(flowProp.properties).toHaveProperty('eventDimension')
    expect(flowProp.properties).toHaveProperty('startingStep')
  })

  it('should include retention property on execute_query with required fields', () => {
    const tools = getToolDefinitions()
    const executeQuery = tools.find((t) => t.name === 'execute_query')!
    const retentionProp = executeQuery.parameters.properties.retention as {
      type: string
      required: string[]
      properties: Record<string, unknown>
    }
    expect(retentionProp.type).toBe('object')
    expect(retentionProp.required).toEqual(['timeDimension', 'bindingKey', 'dateRange', 'granularity', 'periods'])
    expect(retentionProp.properties).toHaveProperty('dateRange')
    expect(retentionProp.properties).toHaveProperty('retentionType')
  })

  it('should expose the field-zone and scale config the new chart types need', () => {
    const tools = getToolDefinitions()
    const addPortlet = tools.find((t) => t.name === 'add_portlet')!
    const chartConfig = addPortlet.parameters.properties.chartConfig as { properties: Record<string, unknown> }
    const displayConfig = addPortlet.parameters.properties.displayConfig as { properties: Record<string, unknown> }

    // heatmap and activityGrid have mandatory zones that are not axes; without
    // these the model cannot state them at all.
    expect(chartConfig.properties).toHaveProperty('valueField')
    expect(chartConfig.properties).toHaveProperty('dateField')
    expect(displayConfig.properties).toHaveProperty('minValue')
    expect(displayConfig.properties).toHaveProperty('maxValue')
    expect(displayConfig.properties).toHaveProperty('template')
  })

  it('should offer every built-in chart type to the agent', () => {
    const tools = getToolDefinitions()
    const addPortlet = tools.find((t) => t.name === 'add_portlet')!
    const chartTypeProp = addPortlet.parameters.properties.chartType as { enum: string[] }

    for (const t of ['treemap', 'waterfall', 'dotStrip', 'gauge', 'proportionBar', 'measureProfile', 'activityGrid', 'radialBar', 'kpiText', 'candlestick']) {
      expect(chartTypeProp.enum, `missing ${t}`).toContain(t)
    }
  })

  it('should mention funnel/flow/retention formats in add_portlet query description', () => {
    const tools = getToolDefinitions()
    const addPortlet = tools.find((t) => t.name === 'add_portlet')!
    const queryProp = addPortlet.parameters.properties.query as { description: string }
    expect(queryProp.description).toContain('Funnel')
    expect(queryProp.description).toContain('Flow')
    expect(queryProp.description).toContain('Retention')
  })
})

// ============================================================================
// createToolExecutor
// ============================================================================

describe('createToolExecutor', () => {
  let semanticLayer: ReturnType<typeof createMockSemanticLayer>

  beforeEach(() => {
    vi.clearAllMocks()
    semanticLayer = createMockSemanticLayer()
  })

  it('should return a Map with 7 entries matching tool names', () => {
    const executor = createToolExecutor({
      semanticLayer,
      securityContext: mockSecurityContext,
    })
    expect(executor.size).toBe(7)
    expect(executor.has('discover_cubes')).toBe(true)
    expect(executor.has('get_cube_metadata')).toBe(true)
    expect(executor.has('execute_query')).toBe(true)
    expect(executor.has('add_portlet')).toBe(true)
    expect(executor.has('update_portlet')).toBe(true)
    expect(executor.has('add_markdown')).toBe(true)
    expect(executor.has('save_as_dashboard')).toBe(true)
  })

  // --------------------------------------------------------------------------
  // discover_cubes
  // --------------------------------------------------------------------------
  describe('discover_cubes', () => {
    it('should call handleDiscover with topic/intent/limit/minScore', async () => {
      const mockResult = {
        cubes: [{
          cube: 'Employees',
          title: 'Employee Analytics',
          description: 'Employee data',
          relevanceScore: 1,
          suggestedMeasures: ['Employees.count'],
          suggestedDimensions: ['Employees.name'],
          capabilities: { query: true, funnel: false, flow: false, retention: false },
        }]
      }
      mockHandleDiscover.mockResolvedValue(mockResult as any)

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('discover_cubes')!
      const result = await fn({
        topic: 'sales',
        intent: 'analyze revenue',
        limit: 5,
        minScore: 0.5,
      })

      // handleDiscover now takes the request's security context, so discovery
      // sees only the cubes that context resolves to.
      expect(mockHandleDiscover).toHaveBeenCalledWith(semanticLayer, mockSecurityContext, {
        topic: 'sales',
        intent: 'analyze revenue',
        limit: 5,
        minScore: 0.5,
      })
      // Result is trimmed (no querySchemas/hints) and compact JSON with a reminder suffix
      expect(result.result).toContain('"cube":"Employees"')
      expect(result.result).toContain('"suggestedMeasures"')
      expect(result.result).not.toContain('querySchemas')
      expect(result.isError).toBeUndefined()
    })
  })

  // --------------------------------------------------------------------------
  // get_cube_metadata
  // --------------------------------------------------------------------------
  describe('get_cube_metadata', () => {
    it('should call semanticLayer.getMetadata() and return JSON', async () => {
      const metadata = [{ name: 'Employees', measures: [] }]
      semanticLayer.getMetadata.mockReturnValue(metadata)

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('get_cube_metadata')!
      const result = await fn({})

      expect(semanticLayer.getMetadata).toHaveBeenCalled()
      expect(result.result).toBe(JSON.stringify(metadata))
    })
  })

  // --------------------------------------------------------------------------
  // execute_query
  // --------------------------------------------------------------------------
  describe('execute_query', () => {
    it('should call handleLoad with assembled query and return rowCount + data', async () => {
      const mockData = {
        data: [{ 'Employees.count': 10 }],
        annotation: { measures: {} },
      }
      mockHandleLoad.mockResolvedValue(mockData as any)

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('execute_query')!
      const result = await fn({
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        limit: 10,
      })

      expect(mockHandleLoad).toHaveBeenCalledWith(
        semanticLayer,
        mockSecurityContext,
        {
          query: expect.objectContaining({
            measures: ['Employees.count'],
            dimensions: ['Employees.name'],
            limit: 10,
          }),
        }
      )

      // Result contains JSON followed by a reminder suffix for the agent
      expect(result.result).toContain('"rowCount":1')
      expect(result.result).toContain('"data"')
      expect(result.isError).toBeUndefined()
    })

    it('should return isError:true with message on failure', async () => {
      mockHandleLoad.mockRejectedValue(new Error('Query failed: unknown measure'))

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('execute_query')!
      const result = await fn({ measures: ['Bad.measure'] })

      expect(result.isError).toBe(true)
      expect(result.result).toContain('Query execution failed')
      expect(result.result).toContain('unknown measure')
    })

    it('should pass funnel config directly to handleLoad', async () => {
      const mockData = { data: [{ step: 'Signup', count: 100 }], annotation: {} }
      mockHandleLoad.mockResolvedValue(mockData as any)

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('execute_query')!
      const funnelConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        steps: [{ name: 'Signup' }, { name: 'Purchase' }],
      }
      const result = await fn({ funnel: funnelConfig })

      expect(mockHandleLoad).toHaveBeenCalledWith(
        semanticLayer,
        mockSecurityContext,
        { query: { funnel: funnelConfig } }
      )
      expect(result.isError).toBeUndefined()
      expect(result.result).toContain('"rowCount":1')
    })

    it('should pass flow config directly to handleLoad', async () => {
      const mockData = { data: [{ source: 'A', target: 'B', value: 10 }], annotation: {} }
      mockHandleLoad.mockResolvedValue(mockData as any)

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('execute_query')!
      const flowConfig = {
        bindingKey: 'Events.userId',
        timeDimension: 'Events.timestamp',
        eventDimension: 'Events.eventName',
        startingStep: { name: 'Signup' },
        stepsAfter: 3,
      }
      const result = await fn({ flow: flowConfig })

      expect(mockHandleLoad).toHaveBeenCalledWith(
        semanticLayer,
        mockSecurityContext,
        { query: { flow: flowConfig } }
      )
      expect(result.isError).toBeUndefined()
    })

    it('should pass retention config directly to handleLoad', async () => {
      const mockData = { data: [{ cohort: '2024-01', period: 0, retained: 100 }], annotation: {} }
      mockHandleLoad.mockResolvedValue(mockData as any)

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('execute_query')!
      const retentionConfig = {
        timeDimension: 'Events.timestamp',
        bindingKey: 'Events.userId',
        dateRange: { start: '2024-01-01', end: '2024-03-31' },
        granularity: 'week',
        periods: 8,
      }
      const result = await fn({ retention: retentionConfig })

      expect(mockHandleLoad).toHaveBeenCalledWith(
        semanticLayer,
        mockSecurityContext,
        { query: { retention: retentionConfig } }
      )
      expect(result.isError).toBeUndefined()
    })
  })

  // --------------------------------------------------------------------------
  // add_portlet
  // --------------------------------------------------------------------------
  describe('add_portlet', () => {
    it('should return isError for invalid JSON query', async () => {
      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('add_portlet')!
      const result = await fn({
        title: 'Test',
        query: 'not valid json{',
        chartType: 'bar',
      })

      expect(result.isError).toBe(true)
      expect(result.result).toContain('Invalid query')
      expect(result.result).toContain('could not parse JSON')
    })

    it('should return isError when validateQuery fails', async () => {
      semanticLayer.validateQuery.mockReturnValue({
        isValid: false,
        errors: ['Unknown measure: Bad.field'],
      })

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('add_portlet')!
      const result = await fn({
        title: 'Test',
        query: JSON.stringify({ measures: ['Bad.field'] }),
        chartType: 'bar',
      })

      expect(result.isError).toBe(true)
      expect(result.result).toContain('Invalid query')
      expect(result.result).toContain('Unknown measure: Bad.field')
    })

    it('should generate ID matching portlet-{timestamp}-{random} pattern', async () => {
      semanticLayer.validateQuery.mockReturnValue({ isValid: true, errors: [] })

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('add_portlet')!
      const result = await fn({
        title: 'My Chart',
        query: JSON.stringify({ measures: ['Employees.count'], dimensions: ['Employees.name'] }),
        chartType: 'bar',
      })

      expect(result.isError).toBeUndefined()
      expect(result.sideEffect).toBeDefined()
      expect(result.sideEffect!.type).toBe('add_portlet')
      const data = result.sideEffect!.data as { id: string }
      expect(data.id).toMatch(/^portlet-\d+-[a-z0-9]+$/)
    })

    it('should emit add_portlet sideEffect with correct data', async () => {
      semanticLayer.validateQuery.mockReturnValue({ isValid: true, errors: [] })

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('add_portlet')!
      const queryStr = JSON.stringify({ measures: ['Employees.count'], dimensions: ['Employees.name'] })
      const result = await fn({
        title: 'Employee Count',
        query: queryStr,
        chartType: 'bar',
      })

      expect(result.sideEffect).toMatchObject({
        type: 'add_portlet',
        data: {
          title: 'Employee Count',
          query: queryStr,
          chartType: 'bar',
        },
      })
    })

    // Validation and inference run against the normalised query, so the portlet
    // has to carry that one — otherwise the notebook renders something that was
    // never checked.
    it('should give the portlet the normalised query, not the raw string', async () => {
      semanticLayer.validateQuery.mockReturnValue({ isValid: true, errors: [] })

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('add_portlet')!
      const result = await fn({
        title: 'Headcount',
        // Double-prefixed field and an order key naming a field the query does
        // not select: both are corrected by normalisation.
        query: JSON.stringify({
          measures: ['Employees.Employees.count'],
          dimensions: ['Employees.department'],
          order: { 'Employees.salary': 'desc' },
        }),
        chartType: 'bar',
      })

      const data = result.sideEffect!.data as Record<string, unknown>
      const shipped = JSON.parse(data.query as string)

      expect(shipped.measures).toEqual(['Employees.count'])
      // The invalid order key is replaced by the documented fallback — and it
      // names the *corrected* measure, which the raw string could not.
      expect(shipped.order).toEqual({ 'Employees.count': 'desc' })
    })

    it('should skip chart config inference for funnel queries', async () => {
      semanticLayer.validateQuery.mockReturnValue({ isValid: true, errors: [] })

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('add_portlet')!
      const funnelQuery = JSON.stringify({
        funnel: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          steps: [{ name: 'Signup' }, { name: 'Purchase' }],
        },
      })
      const result = await fn({
        title: 'Signup Funnel',
        query: funnelQuery,
        chartType: 'funnel',
      })

      expect(result.isError).toBeUndefined()
      expect(result.sideEffect).toBeDefined()
      expect(result.sideEffect!.type).toBe('add_portlet')
      const data = result.sideEffect!.data as Record<string, unknown>
      expect(data.chartType).toBe('funnel')
      expect(data.chartConfig).toEqual({})
    })

    it('should skip chart config inference for flow queries', async () => {
      semanticLayer.validateQuery.mockReturnValue({ isValid: true, errors: [] })

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('add_portlet')!
      const flowQuery = JSON.stringify({
        flow: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
          eventDimension: 'Events.eventName',
          startingStep: { name: 'Signup' },
        },
      })
      const result = await fn({
        title: 'User Flow',
        query: flowQuery,
        chartType: 'sankey',
      })

      expect(result.isError).toBeUndefined()
      const data = result.sideEffect!.data as Record<string, unknown>
      expect(data.chartType).toBe('sankey')
      expect(data.chartConfig).toEqual({})
    })

    it('should skip chart config inference for retention queries', async () => {
      semanticLayer.validateQuery.mockReturnValue({ isValid: true, errors: [] })

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('add_portlet')!
      const retentionQuery = JSON.stringify({
        retention: {
          timeDimension: 'Events.timestamp',
          bindingKey: 'Events.userId',
          dateRange: { start: '2024-01-01', end: '2024-03-31' },
          granularity: 'week',
          periods: 8,
        },
      })
      const result = await fn({
        title: 'Weekly Retention',
        query: retentionQuery,
        chartType: 'retentionCombined',
      })

      expect(result.isError).toBeUndefined()
      const data = result.sideEffect!.data as Record<string, unknown>
      expect(data.chartType).toBe('retentionCombined')
      expect(data.chartConfig).toEqual({})
    })

    it('should pass through chartConfig and displayConfig', async () => {
      semanticLayer.validateQuery.mockReturnValue({ isValid: true, errors: [] })

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('add_portlet')!
      const chartConfig = { xAxis: ['Employees.name'], yAxis: ['Employees.count'] }
      const displayConfig = { showLegend: true, stacked: false }

      const result = await fn({
        title: 'Test',
        query: JSON.stringify({ measures: ['Employees.count'] }),
        chartType: 'bar',
        chartConfig,
        displayConfig,
      })

      const data = result.sideEffect!.data as Record<string, unknown>
      expect(data.chartConfig).toEqual(chartConfig)
      expect(data.displayConfig).toEqual(displayConfig)
    })
  })

  // --------------------------------------------------------------------------
  // add_markdown
  // --------------------------------------------------------------------------


  describe('execute_query result shaping', () => {
    it('caps the rows handed back and says so', async () => {
      const rows = Array.from({ length: 60 }, (_, i) => ({ 'E.name': `n${i}`, 'E.count': i }))
      mockHandleLoad.mockResolvedValue({
        data: rows,
        annotation: { dimensions: { 'E.name': { type: 'string' } }, measures: { 'E.count': { type: 'number' } } },
      } as any)

      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const result = await executor.get('execute_query')!({ measures: ['E.count'], dimensions: ['E.name'] })
      const payload = JSON.parse(result.result.split('\n[IMPORTANT')[0])

      // The portlet re-runs the query itself, so the model never needed all 60.
      expect(payload.rowCount).toBe(60)
      expect(payload.data).toHaveLength(25)
      expect(payload.truncated).toBe(true)
    })

    it('does not flag a small result as truncated', async () => {
      mockHandleLoad.mockResolvedValue({
        data: [{ 'E.count': 3 }],
        annotation: { measures: { 'E.count': { type: 'number' } } },
      } as any)

      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const result = await executor.get('execute_query')!({ measures: ['E.count'] })
      const payload = JSON.parse(result.result.split('\n[IMPORTANT')[0])

      expect(payload.truncated).toBe(false)
      expect(payload.data).toHaveLength(1)
    })

    it('summarises each field so the model can choose a chart without seeing the rows', async () => {
      mockHandleLoad.mockResolvedValue({
        data: [
          { 'E.region': 'EU', 'E.total': 10 },
          { 'E.region': 'US', 'E.total': 30 },
          { 'E.region': 'EU', 'E.total': null },
        ],
        annotation: {
          dimensions: { 'E.region': { type: 'string' } },
          measures: { 'E.total': { type: 'number' } },
        },
      } as any)

      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const result = await executor.get('execute_query')!({ measures: ['E.total'], dimensions: ['E.region'] })
      const payload = JSON.parse(result.result.split('\n[IMPORTANT')[0])

      const region = payload.dataShape.find((f: { field: string }) => f.field === 'E.region')
      const total = payload.dataShape.find((f: { field: string }) => f.field === 'E.total')

      expect(region).toMatchObject({ kind: 'dimension', distinctCount: 2, nullCount: 0 })
      expect(total).toMatchObject({ kind: 'measure', nullCount: 1, min: 10, max: 30 })
    })
  })

  describe('empty and unusable tool input', () => {
    it('add_markdown adds nothing when the model sends no arguments at all', async () => {
      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const result = await executor.get('add_markdown')!({})

      // A side effect here would put a blank card titled "Markdown" on the
      // canvas while telling the model it succeeded.
      expect(result.isError).toBe(true)
      expect(result.sideEffect).toBeUndefined()
      expect(result.result).toContain('content')
    })

    it('add_markdown rejects whitespace-only content', async () => {
      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const result = await executor.get('add_markdown')!({ content: '   \n  ' })

      expect(result.isError).toBe(true)
      expect(result.sideEffect).toBeUndefined()
    })

    it('add_markdown still accepts the `text` and `markdown` aliases', async () => {
      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })

      expect((await executor.get('add_markdown')!({ text: 'hi' })).sideEffect).toBeDefined()
      expect((await executor.get('add_markdown')!({ markdown: 'hi' })).sideEffect).toBeDefined()
    })
  })

  describe('bar chart fallback', () => {
    beforeEach(() => {
      semanticLayer.validateQuery.mockReturnValue({ isValid: true, errors: [] })
    })

    it('converts a multi-measure bar with no dimension into a table', async () => {
      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const result = await executor.get('add_portlet')!({
        title: 'Work item mix',
        query: JSON.stringify({ measures: ['Issues.features', 'Issues.bugs', 'Issues.chores'] }),
        chartType: 'bar',
      })

      expect(result.isError).toBeUndefined()
      expect((result.sideEffect!.data as { chartType: string }).chartType).toBe('table')
      expect(result.result).toContain('changed from "bar"')
    })

    it('converts a single-measure bar with no dimension into a KPI', async () => {
      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const result = await executor.get('add_portlet')!({
        title: 'Total',
        query: JSON.stringify({ measures: ['Issues.count'] }),
        chartType: 'bar',
      })

      expect((result.sideEffect!.data as { chartType: string }).chartType).toBe('kpiNumber')
    })

    it('leaves a bar with a dimension as a bar', async () => {
      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const result = await executor.get('add_portlet')!({
        title: 'By type',
        query: JSON.stringify({ dimensions: ['Issues.type'], measures: ['Issues.count'] }),
        chartType: 'bar',
      })

      expect((result.sideEffect!.data as { chartType: string }).chartType).toBe('bar')
      expect(result.result).not.toContain('changed from')
    })

    it('echoes the attempted config and query when chart config is still invalid', async () => {
      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const result = await executor.get('add_portlet')!({
        title: 'Records',
        query: JSON.stringify({ dimensions: ['Employees.name'], measures: ['Employees.salary'] }),
        chartType: 'recordsTable',
      })

      expect(result.isError).toBe(true)
      expect(result.result).toContain('chartType: recordsTable')
      expect(result.result).toContain('Attempted chartConfig')
      expect(result.result).toContain('Query:')
    })
  })

  describe('update_portlet', () => {
    beforeEach(() => {
      semanticLayer.validateQuery.mockReturnValue({ isValid: true, errors: [] })
    })

    it('amends a portlet added earlier in the same conversation', async () => {
      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const added = await executor.get('add_portlet')!({
        title: 'By type',
        query: JSON.stringify({ dimensions: ['Issues.type'], measures: ['Issues.count'] }),
        chartType: 'bar',
      })
      const { id } = added.sideEffect!.data as { id: string }

      const updated = await executor.get('update_portlet')!({ portletId: id, chartType: 'treemap', title: 'Mix' })

      expect(updated.isError).toBeUndefined()
      expect(updated.sideEffect!.type).toBe('update_portlet')
      expect(updated.sideEffect!.data).toMatchObject({ id, title: 'Mix', chartType: 'treemap' })
    })

    it('keeps fields the update did not mention', async () => {
      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const query = JSON.stringify({ dimensions: ['Issues.type'], measures: ['Issues.count'] })
      const added = await executor.get('add_portlet')!({ title: 'By type', query, chartType: 'bar' })
      const { id } = added.sideEffect!.data as { id: string }

      const updated = await executor.get('update_portlet')!({ portletId: id, title: 'Renamed' })
      const data = updated.sideEffect!.data as { title: string; chartType: string; query: string }

      expect(data.title).toBe('Renamed')
      expect(data.chartType).toBe('bar')
      expect(JSON.parse(data.query)).toMatchObject({ dimensions: ['Issues.type'] })
    })

    it('refuses a partial change to an id it has never seen', async () => {
      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const result = await executor.get('update_portlet')!({ portletId: 'portlet-from-last-turn', title: 'x' })

      expect(result.isError).toBe(true)
      expect(result.sideEffect).toBeUndefined()
      expect(result.result).toContain('full `query` and `chartType`')
    })

    it('updates a portlet from an earlier turn when the full fields are restated', async () => {
      // The executor is rebuilt per request, so a portlet the user asks to
      // change in a follow-up message is never in this map. Requiring a
      // restatement beats telling the model to add a duplicate chart.
      const executor = createToolExecutor({ semanticLayer, securityContext: mockSecurityContext })
      const result = await executor.get('update_portlet')!({
        portletId: 'portlet-from-last-turn',
        title: 'Work by type',
        query: JSON.stringify({ dimensions: ['Issues.type'], measures: ['Issues.count'] }),
        chartType: 'treemap',
      })

      expect(result.isError).toBeUndefined()
      expect(result.sideEffect!.type).toBe('update_portlet')
      expect(result.sideEffect!.data).toMatchObject({
        id: 'portlet-from-last-turn',
        title: 'Work by type',
        chartType: 'treemap',
      })
    })
  })

  describe('add_markdown', () => {
    it('should generate ID matching markdown-{timestamp}-{random} pattern', async () => {
      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('add_markdown')!
      const result = await fn({ content: 'Hello world' })

      expect(result.sideEffect).toBeDefined()
      expect(result.sideEffect!.type).toBe('add_markdown')
      const data = result.sideEffect!.data as { id: string }
      expect(data.id).toMatch(/^markdown-\d+-[a-z0-9]+$/)
    })

    it('should emit add_markdown sideEffect with content and optional title', async () => {
      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('add_markdown')!

      // With title
      const result = await fn({ content: '## Analysis', title: 'Findings' })
      expect(result.sideEffect).toMatchObject({
        type: 'add_markdown',
        data: {
          content: '## Analysis',
          title: 'Findings',
        },
      })

      // Without title
      const result2 = await fn({ content: 'Just text' })
      expect(result2.sideEffect!.data).toMatchObject({
        content: 'Just text',
      })
    })
  })

  describe('save_as_dashboard', () => {
    const recordsPortlet = (query: Record<string, unknown>) => ({
      id: 'portlet-1',
      title: 'Employee list',
      chartType: 'recordsTable',
      query: JSON.stringify(query),
      w: 12,
      h: 5,
      x: 0,
      y: 0,
    })

    // A dashboard must not be saveable with a portlet add_portlet would reject.
    it('rejects a records-table portlet over a grouped query', async () => {
      semanticLayer.validateQuery.mockReturnValue({ isValid: true, errors: [] })

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('save_as_dashboard')!
      const result = await fn({
        title: 'People',
        portlets: [recordsPortlet({ dimensions: ['Employees.name'], measures: ['Employees.salary'] })],
      })

      expect(result.isError).toBe(true)
      expect(result.result).toContain('"ungrouped": true')
    })

    it('saves an ungrouped records-table portlet with inferred columns', async () => {
      semanticLayer.validateQuery.mockReturnValue({ isValid: true, errors: [] })

      const executor = createToolExecutor({
        semanticLayer,
        securityContext: mockSecurityContext,
      })
      const fn = executor.get('save_as_dashboard')!
      const result = await fn({
        title: 'People',
        portlets: [
          recordsPortlet({
            dimensions: ['Employees.name'],
            measures: ['Employees.salary'],
            ungrouped: true,
          }),
        ],
      })

      expect(result.isError).toBeUndefined()
      const data = result.sideEffect!.data as Record<string, any>
      const chart = data.dashboardConfig.portlets[0].analysisConfig.charts.query

      expect(chart.chartType).toBe('recordsTable')
      expect(chart.chartConfig.columns).toEqual(['Employees.name', 'Employees.salary'])
    })
  })
})
