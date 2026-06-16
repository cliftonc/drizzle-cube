import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Writes `dist/cjs/package.json` = `{ "type": "commonjs" }` so that every
 * declaration file mirrored into `dist/cjs/` (via vite-plugin-dts `outDirs`) is
 * interpreted by TypeScript and Node as a CommonJS declaration (the "package
 * scope" / subdir convention).
 *
 * This is what makes the `require.types` entries resolve as CJS instead of
 * masquerading as ESM (attw `FalseESM`). The mirrored `.d.ts` are byte-for-byte
 * copies of the ESM ones — their `./x.js` specifiers resolve to sibling CJS
 * declarations within `dist/cjs/`, so no specifier rewriting is needed. See #881.
 */
export function cjsTypesMarker(dir = 'dist/cjs'): Plugin {
  return {
    name: 'cjs-types-marker',
    closeBundle() {
      mkdirSync(resolve(dir), { recursive: true })
      writeFileSync(resolve(dir, 'package.json'), '{\n  "type": "commonjs"\n}\n')
    }
  }
}
