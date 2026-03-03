/**
 * Tests for Agent Tool Definitions + Executor
 * Tests getToolDefinitions() and createToolExecutor() from src/server/agent/tools.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getToolDefinitions, createToolExecutor } from '../../src/server/agent/tools'

// Mock the adapter utils
vi.mock('../../src/adapters/utils', () => ({
  handleDiscover: vi.fn(),
  handleLoad: vi.fn(),
}))

import { handleDiscover, handleLoad } from '../../src/adapters/utils'

const mockHandleDiscover = vi.mocked(handleDiscover)
const mockHandleLoad = vi.mocked(handleLoad)

// Mock semantic layer
function createMockSemanticLayer() {
  return {
    getMetadata: vi.fn(),
    validateQuery: vi.fn(),
  } as any
}

const mockSecurityContext = { organisationId: 'org-test' }

// ============================================================================
// getToolDefinitions
// ============================================================================

describe('getToolDefinitions', () => {
  it('should return exactly 5 tools', () => {
    const tools = getToolDefinitions()
    expect(tools).toHaveLength(5)
  })

  it('should return tools with correct names', () => {
    const tools = getToolDefinitions()
    const names = tools.map((t) => t.name)
    expect(names).toEqual([
      'discover_cubes',
      'get_cube_metadata',
      'execute_query',
      'add_portlet',
      'add_markdown',
    ])
  })

  it('should have valid Anthropic schema structure on each tool', () => {
    const tools = getToolDefinitions()
    for (const tool of tools) {
      expect(tool).toHaveProperty('name')
      expect(tool).toHaveProperty('description')
      expect(tool.description).toBeTruthy()
      expect(tool).toHaveProperty('input_schema')
      expect(tool.input_schema.type).toBe('object')
      expect(tool.input_schema).toHaveProperty('properties')
    }
  })

  it('should require [title, query, chartType] for add_portlet', () => {
    const tools = getToolDefinitions()
    const addPortlet = tools.find((t) => t.name === 'add_portlet')!
    expect(addPortlet.input_schema.required).toEqual(['title', 'query', 'chartType'])
  })

  it('should require [content] for add_markdown', () => {
    const tools = getToolDefinitions()
    const addMarkdown = tools.find((t) => t.name === 'add_markdown')!
    expect(addMarkdown.input_schema.required).toEqual(['content'])
  })

  it('should include all supported chart types in add_portlet chartType enum', () => {
    const tools = getToolDefinitions()
    const addPortlet = tools.find((t) => t.name === 'add_portlet')!
    const chartTypeProp = addPortlet.input_schema.properties.chartType as {
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
  })

  it('should require [member, operator] on execute_query filter items', () => {
    const tools = getToolDefinitions()
    const executeQuery = tools.find((t) => t.name === 'execute_query')!
    const filtersProp = executeQuery.input_schema.properties.filters as {
      items: { required: string[] }
    }
    expect(filtersProp.items.required).toEqual(['member', 'operator'])
  })

  it('should include funnel property on execute_query with required fields', () => {
    const tools = getToolDefinitions()
    const executeQuery = tools.find((t) => t.name === 'execute_query')!
    const funnelProp = executeQuery.input_schema.properties.funnel as {
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
    const flowProp = executeQuery.input_schema.properties.flow as {
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
    const retentionProp = executeQuery.input_schema.properties.retention as {
      type: string
      required: string[]
      properties: Record<string, unknown>
    }
    expect(retentionProp.type).toBe('object')
    expect(retentionProp.required).toEqual(['timeDimension', 'bindingKey', 'dateRange', 'granularity', 'periods'])
    expect(retentionProp.properties).toHaveProperty('dateRange')
    expect(retentionProp.properties).toHaveProperty('retentionType')
  })

  it('should mention funnel/flow/retention formats in add_portlet query description', () => {
    const tools = getToolDefinitions()
    const addPortlet = tools.find((t) => t.name === 'add_portlet')!
    const queryProp = addPortlet.input_schema.properties.query as { description: string }
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

  it('should return a Map with 5 entries matching tool names', () => {
    const executor = createToolExecutor({
      semanticLayer,
      securityContext: mockSecurityContext,
    })
    expect(executor.size).toBe(5)
    expect(executor.has('discover_cubes')).toBe(true)
    expect(executor.has('get_cube_metadata')).toBe(true)
    expect(executor.has('execute_query')).toBe(true)
    expect(executor.has('add_portlet')).toBe(true)
    expect(executor.has('add_markdown')).toBe(true)
  })

  // --------------------------------------------------------------------------
  // discover_cubes
  // --------------------------------------------------------------------------
  describe('discover_cubes', () => {
    it('should call handleDiscover with topic/intent/limit/minScore', async () => {
      const mockResult = { cubes: [{ name: 'Employees' }] }
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

      expect(mockHandleDiscover).toHaveBeenCalledWith(semanticLayer, {
        topic: 'sales',
        intent: 'analyze revenue',
        limit: 5,
        minScore: 0.5,
      })
      expect(result.result).toBe(JSON.stringify(mockResult, null, 2))
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
      expect(result.result).toBe(JSON.stringify(metadata, null, 2))
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

      const parsed = JSON.parse(result.result)
      expect(parsed.rowCount).toBe(1)
      expect(parsed.data).toEqual(mockData.data)
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
      const parsed = JSON.parse(result.result)
      expect(parsed.rowCount).toBe(1)
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
        query: JSON.stringify({ measures: ['Employees.count'] }),
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
      const queryStr = JSON.stringify({ measures: ['Employees.count'] })
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
})
