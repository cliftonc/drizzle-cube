import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      include: ['src/server/**/*.ts'],
      tsconfigPath: './tsconfig.server.json'
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
      external: ['drizzle-orm', 'yaml', 'fs'],
      output: {
        globals: {
          'drizzle-orm': 'DrizzleORM'
        }
      }
    }
  }
})