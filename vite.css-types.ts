import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Copies the `.d.css.ts` stub that sits beside a source stylesheet into the
 * build output.
 *
 * TypeScript 7 rejects a side-effect import whose specifier has no type
 * declarations (TS2882), so a consumer following the documented
 * `import 'drizzle-cube/client/styles.css'` fails to compile unless the
 * package ships a declaration for it. Under `allowArbitraryExtensions` the
 * declaration for `styles.css` is `styles.d.css.ts` next to it; the
 * `./client/styles.css` export also points its `types` condition here so the
 * lookup works through the exports map. See #1016.
 */
export function cssTypeStubs(entries: { from: string; to: string }[]): Plugin {
  return {
    name: 'css-type-stubs',
    closeBundle() {
      for (const { from, to } of entries) {
        const target = resolve(to)
        mkdirSync(dirname(target), { recursive: true })
        copyFileSync(resolve(from), target)
      }
    }
  }
}
