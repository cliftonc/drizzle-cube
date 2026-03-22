/**
 * Charts CLI commands
 *
 * Provides scaffolding for custom chart plugins.
 */

import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'

// Built-in chart types with descriptions
const BUILT_IN_CHARTS: Record<string, string> = {
  bar: 'Bar chart — compare values across categories',
  line: 'Line chart — show trends over time',
  area: 'Area chart — line chart with filled areas',
  pie: 'Pie chart — show proportions of a whole',
  scatter: 'Scatter chart — show relationships between two measures',
  bubble: 'Bubble chart — scatter with size dimension',
  radar: 'Radar chart — multi-axis comparison',
  radialBar: 'Radial bar chart — circular bar chart',
  treemap: 'Treemap — hierarchical data as nested rectangles',
  table: 'Data table — sortable tabular display',
  activityGrid: 'Activity grid — GitHub-style contribution calendar',
  kpiNumber: 'KPI number — single metric display',
  kpiDelta: 'KPI delta — metric with change indicator',
  kpiText: 'KPI text — text-based metric',
  funnel: 'Funnel chart — conversion funnel visualization',
  sankey: 'Sankey diagram — flow visualization',
  sunburst: 'Sunburst chart — hierarchical pie chart',
  heatmap: 'Heatmap — color-coded matrix',
  boxPlot: 'Box plot — statistical distribution',
  waterfall: 'Waterfall chart — cumulative values',
  candlestick: 'Candlestick chart — financial OHLC data',
  gauge: 'Gauge — meter-style value display',
  measureProfile: 'Measure profile — detailed measure analysis',
}

/**
 * drizzle-cube charts list
 */
export function chartsList(): void {
  console.log('\nAvailable built-in chart types:\n')
  const maxLen = Math.max(...Object.keys(BUILT_IN_CHARTS).map(k => k.length))
  for (const [type, desc] of Object.entries(BUILT_IN_CHARTS)) {
    console.log(`  ${type.padEnd(maxLen + 2)} ${desc}`)
  }
  console.log(`\nUse --from <type> with 'charts init' to copy a built-in as starting point.`)
  console.log(`Example: npx drizzle-cube charts init --from bar\n`)
}

/**
 * drizzle-cube charts init
 */
export function chartsInit(): void {
  const { values } = parseArgs({
    options: {
      from: { type: 'string', short: 'f' },
      output: { type: 'string', short: 'o', default: './src/charts' },
      name: { type: 'string', short: 'n' },
    },
    strict: false,
  })

  const outputDir = values.output as string
  const fromBuiltIn = values.from as string | undefined
  const customName = values.name as string | undefined

  if (fromBuiltIn) {
    if (!BUILT_IN_CHARTS[fromBuiltIn]) {
      console.error(`\nUnknown chart type: "${fromBuiltIn}"`)
      console.error(`Run 'npx drizzle-cube charts list' to see available types.\n`)
      process.exit(1)
    }
    scaffoldFromBuiltIn(fromBuiltIn, outputDir, customName)
  } else {
    scaffoldExample(outputDir, customName)
  }
}

function scaffoldExample(outputDir: string, customName?: string): void {
  const name = customName || 'MyCustomChart'
  const chartType = camelCase(name)

  ensureDir(outputDir)

  // Write component
  const componentPath = path.join(outputDir, `${name}.tsx`)
  writeIfNotExists(componentPath, generateExampleComponent(name))

  // Write config
  const configPath = path.join(outputDir, `${name}.config.ts`)
  writeIfNotExists(configPath, generateExampleConfig(name, chartType))

  // Write registration example
  const indexPath = path.join(outputDir, 'index.ts')
  writeIfNotExists(indexPath, generateRegistrationExample(name, chartType))

  console.log(`
Chart plugin scaffolded in ${outputDir}/

Files created:
  ${componentPath}        — Chart component
  ${configPath}   — Chart configuration (drop zones, display options)
  ${indexPath}             — Registration example

Next steps:
  1. Edit ${name}.tsx to implement your chart rendering
  2. Configure drop zones in ${name}.config.ts
  3. Register in your app:

     import { customCharts } from '${outputDir}'

     <CubeProvider customCharts={customCharts} ...>
       <App />
     </CubeProvider>
`)
}

function scaffoldFromBuiltIn(chartType: string, outputDir: string, customName?: string): void {
  const pascalType = chartType.charAt(0).toUpperCase() + chartType.slice(1)
  const name = customName || `Custom${pascalType}Chart`
  const customType = camelCase(name)

  // Find the source files
  const sourceDir = findPackageChartsDir()
  if (!sourceDir) {
    console.log(`
Could not find drizzle-cube chart source files.
Generating a template based on the ${chartType} chart instead.
`)
    scaffoldExample(outputDir, name)
    return
  }

  // Map chart type to file names
  const fileMap: Record<string, string> = {
    bar: 'BarChart', line: 'LineChart', area: 'AreaChart', pie: 'PieChart',
    scatter: 'ScatterChart', bubble: 'BubbleChart', radar: 'RadarChart',
    radialBar: 'RadialBarChart', treemap: 'TreeMapChart', table: 'DataTable',
    activityGrid: 'ActivityGridChart', kpiNumber: 'KpiNumber', kpiDelta: 'KpiDelta',
    kpiText: 'KpiText', funnel: 'FunnelChart', sankey: 'SankeyChart',
    sunburst: 'SunburstChart', heatmap: 'HeatMapChart', boxPlot: 'BoxPlotChart',
    waterfall: 'WaterfallChart', candlestick: 'CandlestickChart',
    gauge: 'GaugeChart', measureProfile: 'MeasureProfileChart',
  }

  const fileName = fileMap[chartType]
  if (!fileName) {
    console.error(`No file mapping for chart type: ${chartType}`)
    scaffoldExample(outputDir, name)
    return
  }

  const componentSource = path.join(sourceDir, `${fileName}.tsx`)
  const configSource = path.join(sourceDir, `${fileName}.config.ts`)

  ensureDir(outputDir)

  // Copy and rewrite component
  if (fs.existsSync(componentSource)) {
    const content = fs.readFileSync(componentSource, 'utf-8')
    const rewritten = rewriteImports(content)
    const componentPath = path.join(outputDir, `${name}.tsx`)
    writeIfNotExists(componentPath, rewritten)
  }

  // Copy and rewrite config
  if (fs.existsSync(configSource)) {
    const content = fs.readFileSync(configSource, 'utf-8')
    const rewritten = rewriteImports(content)
    const configPath = path.join(outputDir, `${name}.config.ts`)
    writeIfNotExists(configPath, rewritten)
  }

  // Write registration example
  const indexPath = path.join(outputDir, 'index.ts')
  writeIfNotExists(indexPath, generateRegistrationFromBuiltIn(name, customType, chartType, fileName))

  console.log(`
Chart copied from built-in '${chartType}' to ${outputDir}/

Files created:
  ${path.join(outputDir, `${name}.tsx`)}        — Chart component (copied from ${fileName})
  ${path.join(outputDir, `${name}.config.ts`)}   — Chart configuration
  ${path.join(outputDir, 'index.ts')}            — Registration example

The chart is registered as type '${customType}' (not '${chartType}'), so
the built-in is preserved. Change the type to '${chartType}' to override it.

Next steps:
  1. Customize the component and config
  2. Register in your app:

     import { customCharts } from '${outputDir}'

     <CubeProvider customCharts={customCharts} ...>
       <App />
     </CubeProvider>
`)
}

// ---------------------------------------------------------------------------
// Template generators
// ---------------------------------------------------------------------------

function generateExampleComponent(name: string): string {
  return `import React from 'react'
import type { ChartProps } from 'drizzle-cube/client'

/**
 * ${name} — Custom chart component
 *
 * Receives the same ChartProps as all drizzle-cube charts:
 * - data: raw query result rows
 * - chartConfig: axis mapping (xAxis, yAxis, series fields)
 * - displayConfig: visual options (colors, legend, etc.)
 * - queryObject: the original CubeQuery
 * - height: container height
 * - colorPalette: theme color palette
 * - onDataPointClick: drill-down handler
 * - drillEnabled: whether drill-down is active
 */
const ${name} = React.memo(function ${name}({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: typeof height === 'number' ? \`\${height}px\` : height,
          color: '#888', fontSize: '14px',
        }}
      >
        No data available
      </div>
    )
  }

  const xField = chartConfig?.xAxis?.[0]
  const yField = chartConfig?.yAxis?.[0]

  return (
    <div style={{ height: typeof height === 'number' ? \`\${height}px\` : height, overflow: 'auto' }}>
      {/* Replace this with your chart rendering logic */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {xField && <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #eee' }}>{xField}</th>}
            {yField && <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #eee' }}>{yField}</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {xField && <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{String(row[xField] ?? '')}</td>}
              {yField && <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{String(row[yField] ?? '')}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

export default ${name}
`
}

function generateExampleConfig(name: string, chartType: string): string {
  return `import type { ChartTypeConfig } from 'drizzle-cube/client'

/**
 * Configuration for ${name}
 *
 * - label: Display name in the chart type picker
 * - dropZones: Define which axes/fields the chart accepts
 * - displayOptionsConfig: Define visual configuration options
 */
export const ${chartType}Config: ChartTypeConfig = {
  label: '${name.replace(/([A-Z])/g, ' $1').trim()}',
  description: 'A custom chart type',
  useCase: 'Use this chart when you need ...',

  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis (Categories)',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop dimensions here',
    },
    {
      key: 'yAxis',
      label: 'Y-Axis (Values)',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop measures here',
    },
  ],

  displayOptionsConfig: [
    {
      key: 'showLegend',
      label: 'Show Legend',
      type: 'boolean',
      defaultValue: true,
    },
  ],
}
`
}

function generateRegistrationExample(name: string, chartType: string): string {
  return `import type { ChartDefinition } from 'drizzle-cube/client'
import ${name} from './${name}'
import { ${chartType}Config } from './${name}.config'

/**
 * Custom chart definitions to pass to CubeProvider.
 *
 * Usage:
 *   import { customCharts } from './charts'
 *
 *   <CubeProvider customCharts={customCharts} ...>
 *     <App />
 *   </CubeProvider>
 */
export const customCharts: ChartDefinition[] = [
  {
    type: '${chartType}',
    label: '${name.replace(/([A-Z])/g, ' $1').trim()}',
    config: ${chartType}Config,
    component: ${name},
  },
]
`
}

function generateRegistrationFromBuiltIn(name: string, customType: string, _builtInType: string, fileName: string): string {
  // Try to guess the config export name from the file name
  const configExportName = fileName.charAt(0).toLowerCase() + fileName.slice(1) + 'Config'

  return `import type { ChartDefinition } from 'drizzle-cube/client'
import ${name} from './${name}'
import { ${configExportName} } from './${name}.config'

/**
 * Custom chart definitions to pass to CubeProvider.
 *
 * Usage:
 *   import { customCharts } from './charts'
 *
 *   <CubeProvider customCharts={customCharts} ...>
 *     <App />
 *   </CubeProvider>
 */
export const customCharts: ChartDefinition[] = [
  {
    type: '${customType}',
    label: ${configExportName}.label || '${name.replace(/([A-Z])/g, ' $1').trim()}',
    config: ${configExportName},
    component: ${name},
  },
]
`
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function camelCase(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1)
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function writeIfNotExists(filePath: string, content: string): void {
  if (fs.existsSync(filePath)) {
    console.warn(`  Skipping ${filePath} (already exists)`)
    return
  }
  fs.writeFileSync(filePath, content, 'utf-8')
}

/**
 * Try to find the chart component source directory from the installed package.
 */
function findPackageChartsDir(): string | null {
  // Try to find the source files relative to this CLI script
  const candidates = [
    // When running from the package's dist/cli directory
    path.resolve(__dirname, '..', '..', 'src', 'client', 'components', 'charts'),
    // When running from node_modules
    path.resolve(__dirname, '..', 'client', 'components', 'charts'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  // Try to resolve from node_modules
  try {
    const pkgPath = require.resolve('drizzle-cube/package.json')
    const pkgDir = path.dirname(pkgPath)
    const chartsDir = path.join(pkgDir, 'src', 'client', 'components', 'charts')
    if (fs.existsSync(chartsDir)) {
      return chartsDir
    }
  } catch {
    // Not installed as dependency
  }

  return null
}

/**
 * Rewrite internal drizzle-cube imports to use the public package imports.
 */
function rewriteImports(content: string): string {
  return content
    // Chart utility imports
    .replace(/from\s+['"]\.\.\/\.\.\/charts\/chartConfigs['"]/g, "from 'drizzle-cube/client'")
    .replace(/from\s+['"]\.\.\/\.\.\/charts\/[^'"]+['"]/g, "from 'drizzle-cube/client'")
    // Type imports
    .replace(/from\s+['"]\.\.\/\.\.\/types['"]/g, "from 'drizzle-cube/client'")
    // Hooks
    .replace(/from\s+['"]\.\.\/\.\.\/hooks\/[^'"]+['"]/g, "from 'drizzle-cube/client'")
    // Icons
    .replace(/from\s+['"]\.\.\/\.\.\/icons['"]/g, "from 'drizzle-cube/client'")
    .replace(/from\s+['"]\.\.\/\.\.\/icons\/[^'"]+['"]/g, "from 'drizzle-cube/client'")
    // Utils
    .replace(/from\s+['"]\.\.\/\.\.\/utils\/[^'"]+['"]/g, "from 'drizzle-cube/client'")
    // Shared
    .replace(/from\s+['"]\.\.\/\.\.\/shared\/[^'"]+['"]/g, "from 'drizzle-cube/client'")
    // Providers
    .replace(/from\s+['"]\.\.\/\.\.\/providers\/[^'"]+['"]/g, "from 'drizzle-cube/client'")
    // Relative chart component imports (e.g., from './ChartTooltip')
    .replace(/from\s+['"]\.\/([^'"]+)['"]/g, "from 'drizzle-cube/client'")
}
