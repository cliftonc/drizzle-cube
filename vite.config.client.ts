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
          // Group all chart components and configs together
          if (id.includes('/components/charts/') && !id.includes('index')) {
            return 'charts'
          }
          // Group icon dependencies
          if (id.includes('@iconify')) {
            return 'icons'
          }
        }
      }
    }
  }
})