import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      bundleTypes: true,
      include: ['src/server/**/*.ts'],
      tsconfigPath: './tsconfig.server.json',
      outDir: 'dist/server',
      entryRoot: 'src/server'
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/server/index.ts'),
      name: 'DrizzleCubeServer',
      formats: ['es', 'cjs'],
      fileName: 'index'
    },
    outDir: 'dist/server',
    rollupOptions: {
      external: ['drizzle-orm', 'yaml', 'fs', '@anthropic-ai/sdk'],
      output: {
        globals: {
          'drizzle-orm': 'DrizzleORM'
        }
      }
    }
  }
})