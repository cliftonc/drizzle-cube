import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { visualizer } from 'rollup-plugin-visualizer'

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
        utils: resolve(__dirname, 'src/client/utils.ts')
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
        'recharts'
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
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
          // Each chart component gets its own chunk for code splitting
          // Match patterns like /charts/BarChart.tsx or /charts/BarChart.config.tsx
          if (id.includes('/components/charts/') && !id.includes('index')) {
            // Extract chart name from path (e.g., BarChart, LineChart)
            const match = id.match(/\/charts\/([A-Za-z]+)(?:\.config)?\.tsx?$/)
            if (match) {
              const chartName = match[1].toLowerCase()
              // Config files go with their chart
              if (id.includes('.config.')) {
                return `chart-${chartName}-config`
              }
              return `chart-${chartName}`
            }
          }
          // Group chart-related external dependencies
          if (id.includes('recharts')) {
            return 'recharts'
          }
          // Group grid layout dependencies
          if (id.includes('react-grid-layout') || id.includes('react-resizable')) {
            return 'layout'
          }
          // Group icon dependencies
          if (id.includes('@heroicons') || id.includes('@iconify')) {
            return 'icons'
          }
        }
      }
    }
  }
})