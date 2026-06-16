import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const distDir = 'dist'

function walk(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    const stat = statSync(path)
    return stat.isDirectory() ? walk(path) : [path]
  })
}

function toCjsDeclaration(source: string): string {
  // .d.cts files are interpreted as CommonJS declarations. Relative imports
  // ending in .js must point at sibling .d.cts declarations instead of ESM
  // .d.ts files, otherwise Node16/NodeNext consumers hit TS1479.
  return source.replace(/((?:from|import)\s*\(?\s*['"]\.\.?[^'"]*)\.js(['"])/g, '$1.cjs$2')
}

const declarations = walk(distDir).filter((path) => path.endsWith('.d.ts'))

for (const declaration of declarations) {
  const cjsDeclaration = declaration.replace(/\.d\.ts$/, '.d.cts')
  const source = readFileSync(declaration, 'utf8')
  writeFileSync(cjsDeclaration, toCjsDeclaration(source))
}

// Vite emits CJS runtime chunks with hashed .cjs names. Declarations can import
// generated chunks only for types; CJS declaration files need matching .d.cts
// siblings when TypeScript follows rewritten .cjs specifiers.
for (const declaration of declarations) {
  if (extname(declaration) === '.ts') continue
}

console.log(`Generated ${declarations.length} CommonJS declaration files`)
