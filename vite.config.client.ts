import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

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
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/client/index.ts'),
      name: 'DrizzleCubeClient',
      formats: ['es'],
      fileName: 'index'
    },
    outDir: 'dist/client',
    cssCodeSplit: false,
    rollupOptions: {
      external: [
        'react', 
        'react-dom', 
        'react/jsx-runtime',
        'react-grid-layout',
        'react-resizable'
      ],
      input: {
        index: resolve(__dirname, 'src/client/index.ts')
      },
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'styles.css'
          }
          return assetInfo.name
        }
      }
    }
  }
})