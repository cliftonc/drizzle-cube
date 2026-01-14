import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { visualizer } from 'rollup-plugin-visualizer'

const chartModuleNames = new Set([
  'ActivityGridChart',
  'AreaChart',
  'BarChart',
  'BubbleChart',
  'DataTable',
  'FunnelChart',
  'HeatMapChart',
  'KpiDelta',
  'KpiNumber',
  'KpiText',
  'LineChart',
  'MarkdownChart',
  'PieChart',
  'RadarChart',
  'RadialBarChart',
  'SankeyChart',
  'ScatterChart',
  'SunburstChart',
  'TreeMapChart'
])

const vendorModuleMatchers = [
  /[\\/]node_modules[\\/]@tanstack[\\/]/,
  /[\\/]node_modules[\\/]zustand[\\/]/,
  /[\\/]node_modules[\\/]react-router-dom[\\/]/,
  /[\\/]node_modules[\\/]react-intersection-observer[\\/]/,
  /[\\/]node_modules[\\/]lz-string[\\/]/
]

function isVendorModule(id: string): boolean {
  return vendorModuleMatchers.some((matcher) => matcher.test(id))
}

function toChunkName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/-chart$/, '')
}

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: false,
      include: ['src/client/**/*.ts', 'src/client/**/*.tsx'],
      tsconfigPath: './tsconfig.client.json',
      outDir: 'dist/client',
      entryRoot: 'src/client'
    }),
    visualizer({
      filename: 'dist/client-bundle-stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
      sourcemap: true
    })
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/client/index.ts'),
        charts: resolve(__dirname, 'src/client/charts.ts'),
        hooks: resolve(__dirname, 'src/client/hooks.ts'),
        providers: resolve(__dirname, 'src/client/providers.ts'),
        components: resolve(__dirname, 'src/client/components.ts'),
        utils: resolve(__dirname, 'src/client/utils.ts'),
        icons: resolve(__dirname, 'src/client/icons/index.ts')
      },
      formats: ['es']
    },
    outDir: 'dist/client',
    cssCodeSplit: false,
    sourcemap: true,
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      },
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-grid-layout',
        'react-resizable',
        'recharts',
        '@nivo/heatmap',
        'd3'
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: (chunkInfo) => {
          const facadeId = chunkInfo.facadeModuleId || ''
          if (facadeId.endsWith('/components/AnalysisBuilder/index.tsx')) {
            return 'chunks/analysis-builder-[hash].js'
          }
          if (chunkInfo.name === 'funnelValidation') {
            return 'chunks/analysis-builder-shared-[hash].js'
          }
          return 'chunks/[name]-[hash].js'
        },
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'react-grid-layout': 'ReactGridLayout',
          recharts: 'Recharts'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css' || assetInfo.name?.endsWith('.css')) {
            return 'styles.css'
          }
          return assetInfo.name
        },
        manualChunks(id) {
          const configMatch = id.match(/\/components\/charts\/([^/]+)\.config\.tsx?$/)
          if (configMatch) {
            const baseName = configMatch[1]
            if (chartModuleNames.has(baseName)) {
              return `chart-config-${toChunkName(baseName)}`
            }
          }

          const chartMatch = id.match(/\/components\/charts\/([^/]+)\.tsx?$/)
          if (chartMatch) {
            const baseName = chartMatch[1]
            if (chartModuleNames.has(baseName)) {
              return `chart-${toChunkName(baseName)}`
            }
          }

          // Group icon dependencies
          if (id.includes('@iconify')) {
            return 'icons'
          }

          if (isVendorModule(id)) {
            return 'vendor'
          }
        }
      }
    }
  }
})
