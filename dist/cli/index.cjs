#!/usr/bin/env node
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let node_util = require("node:util");
let node_fs = require("node:fs");
node_fs = __toESM(node_fs, 1);
let node_path = require("node:path");
node_path = __toESM(node_path, 1);
//#region src/cli/commands/charts.ts
/**
* Charts CLI commands
*
* Provides scaffolding for custom chart plugins.
*/
/**
* Built-in charts the CLI can scaffold from, keyed by chart type.
*
* Deliberately the CLI's own table rather than something derived from
* `chartRegistry`: the CLI ships as a standalone CJS bundle (`build:cli`) and
* importing the registry at runtime would pull the whole chart-config graph —
* and its i18n keys, which this plain-text listing would then have to resolve —
* into it. The `BuiltInChartType` import is type-only, so the bundle stays clean
* while the record stays **exhaustive**: adding a chart type fails
* `npm run typecheck` here until it is either given an entry or explicitly
* marked `null`, which is the decision this table exists to force.
*
* `null` means "not offered as a scaffolding starting point"; give it a
* `ScaffoldableChart` to enable it.
*/
var BUILT_IN_CHARTS = {
	bar: {
		file: "BarChart",
		description: "Bar chart — compare values across categories"
	},
	line: {
		file: "LineChart",
		description: "Line chart — show trends over time"
	},
	area: {
		file: "AreaChart",
		description: "Area chart — line chart with filled areas"
	},
	pie: {
		file: "PieChart",
		description: "Pie chart — show proportions of a whole"
	},
	scatter: {
		file: "ScatterChart",
		description: "Scatter chart — show relationships between two measures"
	},
	bubble: {
		file: "BubbleChart",
		description: "Bubble chart — scatter with size dimension"
	},
	radar: {
		file: "RadarChart",
		description: "Radar chart — multi-axis comparison"
	},
	radialBar: {
		file: "RadialBarChart",
		description: "Radial bar chart — circular bar chart"
	},
	treemap: {
		file: "TreeMapChart",
		description: "Treemap — hierarchical data as nested rectangles"
	},
	table: {
		file: "DataTable",
		description: "Data table — sortable tabular display"
	},
	recordsTable: {
		file: "RecordsTable",
		description: "Records table — record listing with per-column formats and links"
	},
	activityGrid: {
		file: "ActivityGridChart",
		description: "Activity grid — GitHub-style contribution calendar"
	},
	kpiNumber: {
		file: "KpiNumber",
		description: "KPI number — single metric display"
	},
	kpiDelta: {
		file: "KpiDelta",
		description: "KPI delta — metric with change indicator"
	},
	kpiText: {
		file: "KpiText",
		description: "KPI text — text-based metric"
	},
	funnel: {
		file: "FunnelChart",
		description: "Funnel chart — conversion funnel visualization"
	},
	sankey: {
		file: "SankeyChart",
		description: "Sankey diagram — flow visualization"
	},
	sunburst: {
		file: "SunburstChart",
		description: "Sunburst chart — hierarchical pie chart"
	},
	heatmap: {
		file: "HeatMapChart",
		description: "Heatmap — color-coded matrix"
	},
	boxPlot: {
		file: "BoxPlotChart",
		description: "Box plot — statistical distribution"
	},
	dotStrip: {
		file: "DotStripChart",
		description: "Dot strip plot — individual values spread within categorical bands"
	},
	waterfall: {
		file: "WaterfallChart",
		description: "Waterfall chart — cumulative values"
	},
	candlestick: {
		file: "CandlestickChart",
		description: "Candlestick chart — financial OHLC data"
	},
	gauge: {
		file: "GaugeChart",
		description: "Gauge — meter-style value display"
	},
	measureProfile: {
		file: "MeasureProfileChart",
		description: "Measure profile — detailed measure analysis"
	},
	markdown: null,
	retentionHeatmap: null,
	retentionCombined: null,
	proportionBar: null
};
/** Resolve a `--from` argument (an arbitrary string) to a scaffoldable chart. */
function lookupScaffold(chartType) {
	return scaffoldableCharts().find(([type]) => type === chartType)?.[1] ?? null;
}
/** The subset that `charts list` / `charts init --from` actually offer. */
function scaffoldableCharts() {
	return Object.entries(BUILT_IN_CHARTS).filter((entry) => entry[1] !== null);
}
/**
* drizzle-cube charts list
*/
function chartsList() {
	console.log("\nAvailable built-in chart types:\n");
	const charts = scaffoldableCharts();
	const maxLen = Math.max(...charts.map(([type]) => type.length));
	for (const [type, chart] of charts) console.log(`  ${type.padEnd(maxLen + 2)} ${chart.description}`);
	console.log(`\nUse --from <type> with 'charts init' to copy a built-in as starting point.`);
	console.log(`Example: npx drizzle-cube charts init --from bar\n`);
}
/**
* drizzle-cube charts init
*/
function chartsInit() {
	const { values } = (0, node_util.parseArgs)({
		options: {
			from: {
				type: "string",
				short: "f"
			},
			output: {
				type: "string",
				short: "o",
				default: "./src/charts"
			},
			name: {
				type: "string",
				short: "n"
			}
		},
		strict: false
	});
	const outputDir = values.output;
	const fromBuiltIn = values.from;
	const customName = values.name;
	if (fromBuiltIn) {
		if (!lookupScaffold(fromBuiltIn)) {
			console.error(`\nUnknown chart type: "${fromBuiltIn}"`);
			console.error(`Run 'npx drizzle-cube charts list' to see available types.\n`);
			process.exit(1);
		}
		scaffoldFromBuiltIn(fromBuiltIn, outputDir, customName);
	} else scaffoldExample(outputDir, customName);
}
function scaffoldExample(outputDir, customName) {
	const name = customName || "MyCustomChart";
	const chartType = camelCase(name);
	ensureDir(outputDir);
	const componentPath = node_path.default.join(outputDir, `${name}.tsx`);
	writeIfNotExists(componentPath, generateExampleComponent(name));
	const configPath = node_path.default.join(outputDir, `${name}.config.ts`);
	writeIfNotExists(configPath, generateExampleConfig(name, chartType));
	const indexPath = node_path.default.join(outputDir, "index.ts");
	writeIfNotExists(indexPath, generateRegistrationExample(name, chartType));
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
`);
}
function scaffoldFromBuiltIn(chartType, outputDir, customName) {
	const pascalType = chartType.charAt(0).toUpperCase() + chartType.slice(1);
	const name = customName || `Custom${pascalType}Chart`;
	const customType = camelCase(name);
	const sourceDir = findPackageChartsDir();
	if (!sourceDir) {
		console.log(`
Could not find drizzle-cube chart source files.
Generating a template based on the ${chartType} chart instead.
`);
		scaffoldExample(outputDir, name);
		return;
	}
	const scaffold = lookupScaffold(chartType);
	if (!scaffold) {
		console.error(`No file mapping for chart type: ${chartType}`);
		scaffoldExample(outputDir, name);
		return;
	}
	const fileName = scaffold.file;
	const componentSource = node_path.default.join(sourceDir, `${fileName}.tsx`);
	const configSource = node_path.default.join(sourceDir, `${fileName}.config.ts`);
	ensureDir(outputDir);
	if (node_fs.default.existsSync(componentSource)) {
		const rewritten = rewriteImports(node_fs.default.readFileSync(componentSource, "utf-8"));
		writeIfNotExists(node_path.default.join(outputDir, `${name}.tsx`), rewritten);
	}
	if (node_fs.default.existsSync(configSource)) {
		const rewritten = rewriteImports(node_fs.default.readFileSync(configSource, "utf-8"));
		writeIfNotExists(node_path.default.join(outputDir, `${name}.config.ts`), rewritten);
	}
	writeIfNotExists(node_path.default.join(outputDir, "index.ts"), generateRegistrationFromBuiltIn(name, customType, chartType, fileName));
	console.log(`
Chart copied from built-in '${chartType}' to ${outputDir}/

Files created:
  ${node_path.default.join(outputDir, `${name}.tsx`)}        — Chart component (copied from ${fileName})
  ${node_path.default.join(outputDir, `${name}.config.ts`)}   — Chart configuration
  ${node_path.default.join(outputDir, "index.ts")}            — Registration example

The chart is registered as type '${customType}' (not '${chartType}'), so
the built-in is preserved. Change the type to '${chartType}' to override it.

Next steps:
  1. Customize the component and config
  2. Register in your app:

     import { customCharts } from '${outputDir}'

     <CubeProvider customCharts={customCharts} ...>
       <App />
     </CubeProvider>
`);
}
function generateExampleComponent(name) {
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
`;
}
function generateExampleConfig(name, chartType) {
	return `import type { ChartTypeConfig } from 'drizzle-cube/client'

/**
 * Configuration for ${name}
 *
 * - label: Display name in the chart type picker
 * - dropZones: Define which axes/fields the chart accepts
 * - displayOptionsConfig: Define visual configuration options
 */
export const ${chartType}Config: ChartTypeConfig = {
  label: '${name.replace(/([A-Z])/g, " $1").trim()}',
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
`;
}
function generateRegistrationExample(name, chartType) {
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
    label: '${name.replace(/([A-Z])/g, " $1").trim()}',
    config: ${chartType}Config,
    component: ${name},
  },
]
`;
}
function generateRegistrationFromBuiltIn(name, customType, _builtInType, fileName) {
	const configExportName = fileName.charAt(0).toLowerCase() + fileName.slice(1) + "Config";
	return `import type { ChartDefinition } from 'drizzle-cube/client'
import ${name} from './${name}'
import { ${configExportName} } from './${name}.config'

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
    type: '${customType}',
    label: ${configExportName}.label || '${name.replace(/([A-Z])/g, " $1").trim()}',
    config: ${configExportName},
    component: ${name},
  },
]
`;
}
function camelCase(name) {
	return name.charAt(0).toLowerCase() + name.slice(1);
}
function ensureDir(dir) {
	if (!node_fs.default.existsSync(dir)) node_fs.default.mkdirSync(dir, { recursive: true });
}
function writeIfNotExists(filePath, content) {
	if (node_fs.default.existsSync(filePath)) {
		console.warn(`  Skipping ${filePath} (already exists)`);
		return;
	}
	node_fs.default.writeFileSync(filePath, content, "utf-8");
}
/**
* Try to find the chart component source directory from the installed package.
*/
function findPackageChartsDir() {
	const candidates = [node_path.default.resolve(__dirname, "..", "..", "src", "client", "components", "charts"), node_path.default.resolve(__dirname, "..", "client", "components", "charts")];
	for (const candidate of candidates) if (node_fs.default.existsSync(candidate)) return candidate;
	try {
		const pkgPath = require.resolve("drizzle-cube/package.json");
		const pkgDir = node_path.default.dirname(pkgPath);
		const chartsDir = node_path.default.join(pkgDir, "src", "client", "components", "charts");
		if (node_fs.default.existsSync(chartsDir)) return chartsDir;
	} catch {}
	return null;
}
/**
* Rewrite internal drizzle-cube imports to use the public package imports.
*/
function rewriteImports(content) {
	return content.replace(/from\s+['"]\.\.\/\.\.\/charts\/chartConfigs['"]/g, "from 'drizzle-cube/client'").replace(/from\s+['"]\.\.\/\.\.\/charts\/[^'"]+['"]/g, "from 'drizzle-cube/client'").replace(/from\s+['"]\.\.\/\.\.\/types['"]/g, "from 'drizzle-cube/client'").replace(/from\s+['"]\.\.\/\.\.\/hooks\/[^'"]+['"]/g, "from 'drizzle-cube/client'").replace(/from\s+['"]\.\.\/\.\.\/icons['"]/g, "from 'drizzle-cube/client'").replace(/from\s+['"]\.\.\/\.\.\/icons\/[^'"]+['"]/g, "from 'drizzle-cube/client'").replace(/from\s+['"]\.\.\/\.\.\/utils\/[^'"]+['"]/g, "from 'drizzle-cube/client'").replace(/from\s+['"]\.\.\/\.\.\/shared\/[^'"]+['"]/g, "from 'drizzle-cube/client'").replace(/from\s+['"]\.\.\/\.\.\/providers\/[^'"]+['"]/g, "from 'drizzle-cube/client'").replace(/from\s+['"]\.\/([^'"]+)['"]/g, "from 'drizzle-cube/client'");
}
//#endregion
//#region src/cli/index.ts
/**
* drizzle-cube CLI
*
* Usage:
*   npx drizzle-cube charts init               # Scaffold an example custom chart
*   npx drizzle-cube charts init --from bar     # Copy a built-in chart as starting point
*   npx drizzle-cube charts init -o ./my-charts # Custom output directory
*   npx drizzle-cube charts list                # List available built-in chart types
*/
var { positionals } = (0, node_util.parseArgs)({
	allowPositionals: true,
	strict: false
});
var [command, subcommand] = positionals;
if (command === "charts") {
	if (subcommand === "init") chartsInit();
	else if (subcommand === "list") chartsList();
	else console.log(`
drizzle-cube charts

Commands:
  drizzle-cube charts init             Scaffold a custom chart
  drizzle-cube charts init --from bar  Copy a built-in chart as starting point
  drizzle-cube charts init -o <dir>    Set output directory (default: ./src/charts)
  drizzle-cube charts list             List available built-in chart types
`);
} else console.log(`
drizzle-cube CLI

Commands:
  drizzle-cube charts   Chart plugin scaffolding tools

Run 'drizzle-cube charts' for more info.
`);
//#endregion
