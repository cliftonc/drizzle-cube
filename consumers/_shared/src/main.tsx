// The client surface a typical app uses. Imports every entry that reaches an
// optional peer, so a bundler that cannot do without one fails here.
import { createRoot } from 'react-dom/client'
import { CubeProvider, AnalyticsDashboard, AnalysisBuilder } from 'drizzle-cube/client'
import { useCubeLoadQuery } from 'drizzle-cube/client/hooks'
import { SchemaVisualization } from 'drizzle-cube/client/schema'
import 'drizzle-cube/client/styles.css'

export function useRevenue() {
  return useCubeLoadQuery({ measures: ['Sales.revenue'] })
}

createRoot(document.getElementById('root')!).render(
  <CubeProvider apiOptions={{ apiUrl: '/cubejs-api/v1' }}>
    <AnalyticsDashboard config={{ portlets: [] }} />
    <AnalysisBuilder />
    <SchemaVisualization />
  </CubeProvider>
)
