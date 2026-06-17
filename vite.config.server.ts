import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { cjsTypesMarker } from './vite.cjs-marker'

export default defineConfig({
  plugins: [
    dts({
      // Emit one .d.ts per source file (NOT a bundled rollup) so declarations
      // resolve under moduleResolution: nodenext/node16. entryRoot keeps the
      // output flat at dist/server/* matching package.json#exports. See #877.
      // outDirs mirrors the same declarations into dist/cjs/server for the
      // require.types condition (CJS via the dist/cjs/package.json marker). #881.
      insertTypesEntry: true,
      include: ['src/server/**/*.ts'],
      tsconfigPath: './tsconfig.server.json',
      entryRoot: 'src/server',
      outDirs: ['dist/server', 'dist/cjs/server']
    }),
    cjsTypesMarker()
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