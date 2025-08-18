import { AnalyticsPortlet } from 'drizzle-cube/client'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'

const testData = [
  { name: 'A', value: 10 },
  { name: 'B', value: 20 }
]

export default function SimpleChartTest() {
  // Simple test query matching our API data structure (using cube joins)
  const testQuery = JSON.stringify({
    measures: ['Employees.count'],
    dimensions: ['Departments.name'],
    cubes: ['Employees', 'Departments']
  })

  const chartConfig = {
    x: 'Departments.name',
    y: ['Employees.count']
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Simple Chart Test</h3>
      
      {/* Test native Recharts directly */}
      <div style={{ height: '200px', border: '2px solid blue', padding: '10px', marginBottom: '20px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', color: 'blue' }}>Native Recharts Test:</h4>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={testData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Test through drizzle-cube */}
      <div style={{ height: '300px', border: '1px solid #ccc', padding: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', color: 'red' }}>Drizzle-Cube Test:</h4>
        <AnalyticsPortlet
          query={testQuery}
          chartType="bar"
          chartConfig={chartConfig}
          displayConfig={{ showLegend: true }}
          title="Test Chart"
          height={250}
        />
      </div>
    </div>
  )
}