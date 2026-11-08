import { CubeProvider, AnalyticsDashboard } from 'drizzle-cube/client'
import 'drizzle-cube/client/styles.css'

export const CHART_TYPES = [
  'bar', 'line', 'area', 'pie', 'scatter', 'bubble', 'radar', 'radialBar', 'treemap', 'table',
  'recordsTable', 'activityGrid', 'kpiNumber', 'kpiDelta', 'kpiText', 'markdown', 'heatmap', 'gauge',
  'waterfall', 'boxPlot', 'dotStrip', 'sunburst', 'proportionBar', 'measureProfile'
] as const

const query = JSON.stringify({ measures: ['Employees.count'], dimensions: ['Employees.name', 'Employees.departmentId'] })

const portlets = CHART_TYPES.map((chartType, i) => ({
  id: `p-${chartType}`,
  title: chartType,
  query,
  chartType,
  chartConfig: {
    xAxis: ['Employees.name'],
    yAxis: ['Employees.count'],
    series: [],
    valueField: ['Employees.count'],
    sizeField: 'Employees.count'
  },
  displayConfig: { content: '# Hello **markdown**' },
  x: (i % 4) * 3,
  y: Math.floor(i / 4) * 4,
  w: 3,
  h: 4
}))

export default function Dashboard() {
  return (
    <CubeProvider apiOptions={{ apiUrl: '/cubejs-api/v1' }}>
      <AnalyticsDashboard config={{ portlets }} editable onConfigChange={() => {}} />
    </CubeProvider>
  )
}
