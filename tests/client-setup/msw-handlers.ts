import { http, HttpResponse } from 'msw'

// Default mock metadata matching the structure from CubeProvider
export const mockMeta = {
  cubes: [
    {
      name: 'Employees',
      title: 'Employees',
      measures: [
        { name: 'Employees.count', type: 'number', title: 'Count', aggType: 'count' },
        { name: 'Employees.totalSalary', type: 'number', title: 'Total Salary', aggType: 'sum' },
        { name: 'Employees.avgSalary', type: 'number', title: 'Average Salary', aggType: 'avg' }
      ],
      dimensions: [
        { name: 'Employees.id', type: 'number', title: 'ID' },
        { name: 'Employees.name', type: 'string', title: 'Name' },
        { name: 'Employees.email', type: 'string', title: 'Email' },
        { name: 'Employees.departmentId', type: 'number', title: 'Department ID' },
        { name: 'Employees.createdAt', type: 'time', title: 'Created At' }
      ]
    },
    {
      name: 'Departments',
      title: 'Departments',
      measures: [
        { name: 'Departments.count', type: 'number', title: 'Count', aggType: 'count' },
        { name: 'Departments.totalBudget', type: 'number', title: 'Total Budget', aggType: 'sum' }
      ],
      dimensions: [
        { name: 'Departments.id', type: 'number', title: 'ID' },
        { name: 'Departments.name', type: 'string', title: 'Name' }
      ]
    }
  ]
}

// Default mock data for query responses
export const mockQueryData = [
  { 'Employees.count': 10, 'Employees.name': 'John Doe' },
  { 'Employees.count': 5, 'Employees.name': 'Jane Smith' }
]

// Helper to create mock annotation from query
function createAnnotation(query: { measures?: string[]; dimensions?: string[]; timeDimensions?: Array<{ dimension: string }> }) {
  const measures: Record<string, { title: string; type: string }> = {}
  const dimensions: Record<string, { title: string; type: string }> = {}
  const timeDimensions: Record<string, { title: string; type: string }> = {}

  query.measures?.forEach(m => {
    const name = m.split('.').pop() || m
    measures[m] = { title: name.charAt(0).toUpperCase() + name.slice(1), type: 'number' }
  })

  query.dimensions?.forEach(d => {
    const name = d.split('.').pop() || d
    dimensions[d] = { title: name.charAt(0).toUpperCase() + name.slice(1), type: 'string' }
  })

  query.timeDimensions?.forEach(td => {
    const name = td.dimension.split('.').pop() || td.dimension
    timeDimensions[td.dimension] = { title: name.charAt(0).toUpperCase() + name.slice(1), type: 'time' }
  })

  return { measures, dimensions, timeDimensions }
}

export const handlers = [
  // GET /meta - Cube metadata
  http.get('*/cubejs-api/v1/meta', () => {
    return HttpResponse.json(mockMeta)
  }),

  // GET /load - Execute query (query in URL params)
  http.get('*/cubejs-api/v1/load', ({ request }) => {
    const url = new URL(request.url)
    const queryParam = url.searchParams.get('query')
    const query = queryParam ? JSON.parse(queryParam) : {}

    return HttpResponse.json({
      data: mockQueryData,
      annotation: createAnnotation(query as { measures?: string[]; dimensions?: string[] }),
      query: query,
      requestId: `test-request-${Date.now()}`
    })
  }),

  // POST /load - Execute query (query in body)
  http.post('*/cubejs-api/v1/load', async ({ request }) => {
    const body = await request.json() as { query?: Record<string, unknown> }
    const query = body.query || body

    return HttpResponse.json({
      data: mockQueryData,
      annotation: createAnnotation(query as { measures?: string[]; dimensions?: string[] }),
      query: query,
      requestId: `test-request-${Date.now()}`
    })
  }),

  // POST /batch - Batch query execution (used by BatchCoordinator)
  http.post('*/cubejs-api/v1/batch', async ({ request }) => {
    const body = await request.json() as { queries: Array<Record<string, unknown>> }
    const queries = body.queries || []

    // Return results for each query in the batch
    const results = queries.map((query) => ({
      data: mockQueryData,
      annotation: createAnnotation(query as { measures?: string[]; dimensions?: string[] }),
      query: query,
      requestId: `test-request-${Date.now()}`
    }))

    return HttpResponse.json({ results })
  }),

  // POST /sql - Dry run (SQL preview)
  http.post('*/cubejs-api/v1/sql', async ({ request }) => {
    const body = await request.json() as { query?: Record<string, unknown> }
    const query = body.query || body

    return HttpResponse.json({
      sql: {
        sql: 'SELECT "employees"."id", COUNT(*) FROM "employees" GROUP BY 1',
        params: []
      },
      query: query
    })
  })
]

// Helper to create custom response handlers for specific test scenarios
export function createLoadHandler(data: unknown[], annotation?: Record<string, unknown>) {
  // Return array of handlers for both GET and POST
  return [
    http.get('*/cubejs-api/v1/load', ({ request }) => {
      const url = new URL(request.url)
      const queryParam = url.searchParams.get('query')
      const query = queryParam ? JSON.parse(queryParam) : {}

      return HttpResponse.json({
        data,
        annotation: annotation || createAnnotation(query as { measures?: string[]; dimensions?: string[] }),
        query: query,
        requestId: `test-request-${Date.now()}`
      })
    }),
    http.post('*/cubejs-api/v1/load', async ({ request }) => {
      const body = await request.json() as { query?: Record<string, unknown> }
      const query = body.query || body

      return HttpResponse.json({
        data,
        annotation: annotation || createAnnotation(query as { measures?: string[]; dimensions?: string[] }),
        query: query,
        requestId: `test-request-${Date.now()}`
      })
    })
  ]
}

export function createErrorHandler(statusCode: number, errorMessage: string) {
  // Return array of handlers for both GET and POST
  return [
    http.get('*/cubejs-api/v1/load', () => {
      return HttpResponse.json(
        { error: errorMessage },
        { status: statusCode }
      )
    }),
    http.post('*/cubejs-api/v1/load', () => {
      return HttpResponse.json(
        { error: errorMessage },
        { status: statusCode }
      )
    })
  ]
}

export function createMetaHandler(meta: typeof mockMeta) {
  return http.get('*/cubejs-api/v1/meta', () => {
    return HttpResponse.json(meta)
  })
}
