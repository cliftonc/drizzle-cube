/**
 * Charts CLI commands
 *
 * Provides scaffolding for custom chart plugins.
 */

import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import type { BuiltInChartType } from '../../client/types.js'

// Built-in chart types with descriptions.
// Typed against BuiltInChartType so adding a chart fails typecheck until it is
// listed here — this catalogue drifted out of date once already.
const BUILT_IN_CHARTS: Record<BuiltInChartType, string> = {
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
  markdown: 'Markdown — rich text block',
  funnel: 'Funnel chart — conversion funnel visualization',
  sankey: 'Sankey diagram — flow visualization',
  sunburst: 'Sunburst chart — hierarchical pie chart',
  heatmap: 'Heatmap — color-coded matrix',
  retentionHeatmap: 'Retention heatmap — cohort retention matrix',
  retentionCombined: 'Retention combined — retention curve plus cohort matrix',
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
  console.log(`\nUse --from <type> with 'charts init' to start from a built-in.`)
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
    if (!Object.hasOwn(BUILT_IN_CHARTS, fromBuiltIn)) {
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

/**
 * Scaffold a custom chart that starts out as a built-in.
 *
 * The scaffold *wraps* the built-in through the public API rather than copying
 * its source: built-in charts import internals (`useTranslation`, `pivotUtils`,
 * per-chart sibling helpers) that `drizzle-cube/client` does not export, and the
 * published package ships `dist/` only — so a copy would neither be available
 * nor compile. Wrapping renders the real chart from day one and leaves the user
 * a component body to replace at their own pace.
 */
function scaffoldFromBuiltIn(chartType: string, outputDir: string, customName?: string): void {
  const pascalType = chartType.charAt(0).toUpperCase() + chartType.slice(1)
  const name = customName || `Custom${pascalType}Chart`
  const customType = camelCase(name)

  ensureDir(outputDir)

  const componentPath = path.join(outputDir, `${name}.tsx`)
  writeIfNotExists(componentPath, generateBuiltInWrapper(name, chartType))

  const configPath = path.join(outputDir, `${name}.config.ts`)
  writeIfNotExists(configPath, generateBuiltInConfig(name, customType, chartType))

  const indexPath = path.join(outputDir, 'index.ts')
  writeIfNotExists(indexPath, generateRegistrationExample(name, customType))

  console.log(`
Chart plugin based on built-in '${chartType}' scaffolded in ${outputDir}/

Files created:
  ${componentPath}        — Chart component (renders the built-in '${chartType}')
  ${configPath}   — Chart configuration (starts from the built-in's)
  ${indexPath}            — Registration example

The chart is registered as type '${customType}' (not '${chartType}'), so
the built-in is preserved. Change the type to '${chartType}' to override it.

Next steps:
  1. Replace the <LazyChart> body in ${name}.tsx with your own rendering
  2. Adjust drop zones / display options in ${name}.config.ts
  3. Register in your app:

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
 *   import { customCharts } from './charts.js'
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

function generateBuiltInWrapper(name: string, builtInType: string): string {
  return `import React from 'react'
import { LazyChart } from 'drizzle-cube/client'
import type { ChartProps } from 'drizzle-cube/client'

/**
 * ${name} — starts out rendering the built-in '${builtInType}' chart.
 *
 * Built-in charts are not copied into your project: they depend on internals
 * that are not part of the public API. Instead this delegates to the real
 * '${builtInType}' chart, so it works as-is. Customize by wrapping it (extra
 * chrome, transformed \`data\`/\`chartConfig\`) or by replacing the body entirely
 * with your own rendering — the ChartProps contract stays the same either way.
 */
const ${name} = React.memo(function ${name}(props: ChartProps) {
  return <LazyChart chartType="${builtInType}" {...props} />
})

export default ${name}
`
}

function generateBuiltInConfig(name: string, chartType: string, builtInType: string): string {
  return `import { getBuiltInChartConfig } from 'drizzle-cube/client'
import type { ChartTypeConfig } from 'drizzle-cube/client'

/**
 * Configuration for ${name}.
 *
 * Starts from the built-in '${builtInType}' config so the drop zones and display
 * options match the chart being rendered. Override any field below, or drop the
 * spread and declare your own \`dropZones\` / \`displayOptionsConfig\` once this
 * chart diverges from the built-in.
 */
export const ${chartType}Config: ChartTypeConfig = {
  ...getBuiltInChartConfig('${builtInType}'),
  label: '${name.replace(/([A-Z])/g, ' $1').trim()}',
  description: 'A custom chart based on the built-in ${builtInType} chart',
}
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

