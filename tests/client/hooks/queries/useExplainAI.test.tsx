import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import {
  createHookWrapper,
  server,
} from '../../../client-setup/test-utils'
import { useExplainAI } from '../../../../src/client/hooks/queries/useExplainAI'
import type { AIExplainAnalysis, ExplainResult } from '../../../../src/client/types'

describe('useExplainAI', () => {
  const explainResult: ExplainResult = {
    operations: [{ type: 'Seq Scan', table: 'employees', estimatedRows: 100, estimatedCost: 10.5 }],
    summary: {
      database: 'postgres',
      planningTime: 0.5,
      totalCost: 10.5,
      hasSequentialScans: true,
      usedIndexes: [],
    },
    raw: 'Seq Scan on employees (cost=0.00..10.50 rows=100 width=40)',
    sql: { sql: 'SELECT * FROM employees WHERE organisation_id = $1', params: [1] },
  }

  const query = { measures: ['Employees.count'] }

  const analysisFor = (endpoint: string): AIExplainAnalysis => ({
    summary: `analysed by ${endpoint}`,
    assessment: 'good',
    assessmentReason: 'Small table',
    queryUnderstanding: 'Counts employees',
    issues: [],
    recommendations: [],
  })

  let requestedPaths: string[]

  beforeEach(() => {
    requestedPaths = []
    server.resetHandlers()
    server.use(
      http.post('*/api/ai/explain/analyze', ({ request }) => {
        requestedPaths.push(new URL(request.url).pathname)
        return HttpResponse.json(analysisFor('default'))
      }),
      http.post('*/custom/ai/explain/analyze', ({ request }) => {
        requestedPaths.push(new URL(request.url).pathname)
        return HttpResponse.json(analysisFor('features'))
      }),
      http.post('*/hook/explain', ({ request }) => {
        requestedPaths.push(new URL(request.url).pathname)
        return HttpResponse.json(analysisFor('hook'))
      })
    )
  })

  it('should post to the default endpoint when no endpoint is configured', async () => {
    const { wrapper } = createHookWrapper()
    const { result } = renderHook(() => useExplainAI(), { wrapper })

    act(() => {
      result.current.analyze(explainResult, query)
    })

    await waitFor(() => expect(result.current.analysis).not.toBeNull())
    expect(result.current.analysis?.summary).toBe('analysed by default')
    expect(requestedPaths).toEqual(['/api/ai/explain/analyze'])
  })

  it('should post to features.aiExplainEndpoint when set on the provider', async () => {
    const { wrapper } = createHookWrapper({
      features: { enableAI: true, aiExplainEndpoint: '/custom/ai/explain/analyze' },
    })
    const { result } = renderHook(() => useExplainAI(), { wrapper })

    act(() => {
      result.current.analyze(explainResult, query)
    })

    await waitFor(() => expect(result.current.analysis).not.toBeNull())
    expect(result.current.analysis?.summary).toBe('analysed by features')
    expect(requestedPaths).toEqual(['/custom/ai/explain/analyze'])
  })

  it('should prefer the hook aiEndpoint option over features.aiExplainEndpoint', async () => {
    const { wrapper } = createHookWrapper({
      features: { enableAI: true, aiExplainEndpoint: '/custom/ai/explain/analyze' },
    })
    const { result } = renderHook(() => useExplainAI({ aiEndpoint: '/hook/explain' }), { wrapper })

    act(() => {
      result.current.analyze(explainResult, query)
    })

    await waitFor(() => expect(result.current.analysis).not.toBeNull())
    expect(result.current.analysis?.summary).toBe('analysed by hook')
    expect(requestedPaths).toEqual(['/hook/explain'])
  })

  it('should not send a request when AI is disabled', async () => {
    const { wrapper } = createHookWrapper({
      features: { enableAI: false, aiExplainEndpoint: '/custom/ai/explain/analyze' },
    })
    const { result } = renderHook(() => useExplainAI(), { wrapper })

    act(() => {
      result.current.analyze(explainResult, query)
    })

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error?.message).toBe('AI features are disabled')
    expect(requestedPaths).toEqual([])
  })
})
