import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      include: ['src/client/**/*.ts', 'src/client/**/*.tsx'],
      tsconfigPath: './tsconfig.client.json'
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
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime'
        }
      }
    }
  }
})