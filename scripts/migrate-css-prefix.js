#!/usr/bin/env node

/**
 * CSS Prefix Migration Script
 *
 * Transforms unprefixed Tailwind utility classes to use the `dc:` prefix
 * for CSS isolation in the drizzle-cube client library.
 *
 * Usage:
 *   node scripts/migrate-css-prefix.js [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be changed without modifying files
 *
 * What it does:
 *   - Scans all TSX files in src/client/
 *   - Finds className attributes
 *   - Transforms unprefixed Tailwind utilities → dc: prefixed
 *   - Preserves already-prefixed dc-* theme classes
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const clientDir = join(rootDir, 'src', 'client')

const isDryRun = process.argv.includes('--dry-run')

// Statistics
const stats = {
  filesScanned: 0,
  filesModified: 0,
  classesTransformed: 0,
  errors: []
}

// ============================================================================
// Tailwind Utility Patterns
// ============================================================================

// Complete list of Tailwind utility prefixes that need migration
// This covers the vast majority of Tailwind's utility classes
const TAILWIND_UTILITY_PATTERNS = [
  // Layout
  /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|contents|flow-root|list-item|hidden)$/,
  /^(table|table-caption|table-cell|table-column|table-column-group|table-footer-group|table-header-group|table-row-group|table-row)$/,

  // Flexbox & Grid
  /^(flex-row|flex-row-reverse|flex-col|flex-col-reverse)$/,
  /^(flex-wrap|flex-wrap-reverse|flex-nowrap)$/,
  /^flex-(1|auto|initial|none)$/,
  /^(grow|grow-0|shrink|shrink-0|flex-grow|flex-grow-0|flex-shrink|flex-shrink-0)$/,
  /^(basis-|order-)/,
  /^(justify-|items-|content-|self-|place-)/,
  /^(gap-|gap-x-|gap-y-)/,
  /^(grid-cols-|grid-rows-|col-|row-|auto-cols-|auto-rows-|grid-flow-)/,

  // Spacing
  /^(p-|px-|py-|pt-|pr-|pb-|pl-|ps-|pe-)/,
  /^(m-|mx-|my-|mt-|mr-|mb-|ml-|ms-|me-|-m-|-mx-|-my-|-mt-|-mr-|-mb-|-ml-)/,
  /^space-(x-|y-)/,

  // Sizing
  /^(w-|h-|min-w-|max-w-|min-h-|max-h-|size-)/,

  // Typography
  /^(font-|text-xs|text-sm|text-base|text-lg|text-xl|text-2xl|text-3xl|text-4xl|text-5xl|text-6xl|text-7xl|text-8xl|text-9xl)$/,
  /^(italic|not-italic|font-thin|font-extralight|font-light|font-normal|font-medium|font-semibold|font-bold|font-extrabold|font-black)$/,
  /^(uppercase|lowercase|capitalize|normal-case)$/,
  /^(antialiased|subpixel-antialiased)$/,
  /^(leading-|tracking-|indent-)/,
  /^(align-|whitespace-|break-|hyphens-)/,
  /^(truncate|text-ellipsis|text-clip)$/,
  /^(underline|overline|line-through|no-underline)$/,
  /^(decoration-|underline-offset-)/,
  /^(list-|list-inside|list-outside)$/,

  // Backgrounds
  /^(bg-gradient-|from-|via-|to-)/,
  /^(bg-fixed|bg-local|bg-scroll)$/,
  /^(bg-clip-|bg-origin-)/,
  /^(bg-repeat|bg-no-repeat|bg-repeat-x|bg-repeat-y|bg-repeat-round|bg-repeat-space)$/,
  /^bg-(auto|cover|contain)$/,
  /^bg-(bottom|center|left|left-bottom|left-top|right|right-bottom|right-top|top)$/,

  // Borders
  /^(border|border-0|border-2|border-4|border-8|border-x|border-y|border-t|border-r|border-b|border-l|border-s|border-e)$/,
  /^border-(x-|y-|t-|r-|b-|l-|s-|e-)?[0248]$/,
  /^(rounded|rounded-none|rounded-sm|rounded-md|rounded-lg|rounded-xl|rounded-2xl|rounded-3xl|rounded-full)$/,
  /^rounded-(t|r|b|l|tl|tr|br|bl|ss|se|ee|es)-/,
  /^(border-solid|border-dashed|border-dotted|border-double|border-hidden|border-none)$/,
  /^divide-(x|y|x-reverse|y-reverse)/,
  /^(outline|outline-none|outline-dashed|outline-dotted|outline-double)$/,
  /^outline-(0|1|2|4|8)$/,
  /^outline-offset-/,
  /^(ring|ring-0|ring-1|ring-2|ring-4|ring-8|ring-inset)/,
  /^ring-offset-/,

  // Effects
  /^(shadow|shadow-sm|shadow-md|shadow-lg|shadow-xl|shadow-2xl|shadow-inner|shadow-none)$/,
  /^(opacity-)/,
  /^(mix-blend-|bg-blend-)/,

  // Filters
  /^(blur|blur-sm|blur-md|blur-lg|blur-xl|blur-2xl|blur-3xl|blur-none)$/,
  /^(brightness-|contrast-|grayscale|hue-rotate-|invert|saturate-|sepia)/,
  /^(drop-shadow|drop-shadow-sm|drop-shadow-md|drop-shadow-lg|drop-shadow-xl|drop-shadow-2xl|drop-shadow-none)$/,
  /^(backdrop-blur|backdrop-brightness-|backdrop-contrast-|backdrop-grayscale|backdrop-hue-rotate-|backdrop-invert|backdrop-opacity-|backdrop-saturate-|backdrop-sepia)/,

  // Tables
  /^(border-collapse|border-separate)$/,
  /^border-spacing-/,
  /^(table-auto|table-fixed)$/,
  /^caption-/,

  // Transitions & Animation
  /^(transition|transition-all|transition-colors|transition-opacity|transition-shadow|transition-transform|transition-none)$/,
  /^(duration-|ease-|delay-)/,
  /^(animate-none|animate-spin|animate-ping|animate-pulse|animate-bounce)$/,

  // Transforms
  /^(scale-|rotate-|translate-|skew-|origin-)/,
  /^(-scale-|-rotate-|-translate-|-skew-)/,
  /^(transform|transform-cpu|transform-gpu|transform-none)$/,

  // Interactivity
  /^(accent-|appearance-|cursor-|caret-)/,
  /^(pointer-events-none|pointer-events-auto)$/,
  /^(resize|resize-none|resize-y|resize-x)$/,
  /^(scroll-auto|scroll-smooth)$/,
  /^scroll-(m|p|mt|mr|mb|ml|ms|me|pt|pr|pb|pl|ps|pe)-/,
  /^snap-/,
  /^(touch-auto|touch-none|touch-pan-|touch-pinch-zoom|touch-manipulation)$/,
  /^(select-none|select-text|select-all|select-auto)$/,
  /^will-change-/,

  // SVG
  /^(fill-|stroke-|stroke-[0-2]$)/,

  // Accessibility
  /^(sr-only|not-sr-only)$/,
  /^(forced-color-adjust-auto|forced-color-adjust-none)$/,

  // Position
  /^(static|fixed|absolute|relative|sticky)$/,
  /^(inset-|inset-x-|inset-y-|top-|right-|bottom-|left-|start-|end-)/,
  /^(-inset-|-inset-x-|-inset-y-|-top-|-right-|-bottom-|-left-|-start-|-end-)/,
  /^z-/,
  /^-z-/,

  // Visibility
  /^(visible|invisible|collapse)$/,

  // Overflow
  /^(overflow-auto|overflow-hidden|overflow-clip|overflow-visible|overflow-scroll)$/,
  /^overflow-(x|y)-(auto|hidden|clip|visible|scroll)$/,

  // Overscroll
  /^(overscroll-auto|overscroll-contain|overscroll-none)$/,
  /^overscroll-(x|y)-(auto|contain|none)$/,

  // Float & Clear
  /^(float-start|float-end|float-right|float-left|float-none)$/,
  /^(clear-start|clear-end|clear-left|clear-right|clear-both|clear-none)$/,

  // Isolation
  /^(isolate|isolation-auto)$/,

  // Object Fit & Position
  /^(object-contain|object-cover|object-fill|object-none|object-scale-down)$/,
  /^object-(bottom|center|left|left-bottom|left-top|right|right-bottom|right-top|top)$/,

  // Aspect Ratio
  /^(aspect-auto|aspect-square|aspect-video)$/,
  /^aspect-\[/,

  // Columns
  /^columns-/,
  /^break-(after|before|inside)-/,

  // Box
  /^(box-border|box-content)$/,
  /^(box-decoration-clone|box-decoration-slice)$/,

  // Container
  /^container$/,

  // Group (for group-hover functionality)
  /^group$/,

  // Arbitrary values in brackets
  /^[a-z]+-\[.+\]$/,
]

// Patterns that should NOT be prefixed (already namespaced or not CSS classes)
const SKIP_PATTERNS = [
  // Our theme classes - already properly namespaced
  /^dc-/,
  /^bg-dc-/,
  /^text-dc-/,
  /^border-dc-/,
  /^ring-dc-/,
  /^hover:bg-dc-/,
  /^hover:text-dc-/,
  /^hover:border-dc-/,
  /^focus:ring-dc-/,
  /^focus:border-dc-/,
  /^placeholder-dc-/,

  // Already has dc: prefix
  /^dc:/,

  // Variant prefixes with dc-
  /^(hover|focus|active|group-hover|group-focus|focus-within|focus-visible|disabled|first|last|odd|even|dark|light|sm|md|lg|xl|2xl):.*dc-/,

  // State values that look like Tailwind classes but are not (used in comparisons)
  // e.g., activeView === 'table', layoutMode === 'grid'
  /^(table|grid|chart|rows|list|cards|compact|expanded|mobile|desktop)$/,
]

// Common Tailwind variant prefixes
const VARIANT_PREFIXES = [
  'hover:', 'focus:', 'active:', 'disabled:',
  'visited:', 'focus-within:', 'focus-visible:',
  'first:', 'last:', 'odd:', 'even:',
  'group-hover:', 'group-focus:', 'peer-hover:', 'peer-focus:',
  'sm:', 'md:', 'lg:', 'xl:', '2xl:',
  'dark:', 'light:',
  'motion-safe:', 'motion-reduce:',
  'print:', 'portrait:', 'landscape:',
  'ltr:', 'rtl:',
  'open:', 'closed:',
  'placeholder:', 'file:',
  'first-letter:', 'first-line:',
  'before:', 'after:',
  'selection:', 'marker:',
  'backdrop:',
]

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a class should be skipped (already namespaced)
 */
function shouldSkipClass(className) {
  return SKIP_PATTERNS.some(pattern => pattern.test(className))
}

/**
 * Check if a base class (without variants) is a Tailwind utility
 */
function isTailwindUtility(baseClass) {
  return TAILWIND_UTILITY_PATTERNS.some(pattern => pattern.test(baseClass))
}

/**
 * Extract the base class and variants from a class name
 * e.g., "hover:focus:bg-red-500" -> { variants: ["hover:", "focus:"], base: "bg-red-500" }
 */
function parseClassVariants(className) {
  const variants = []
  let remaining = className

  // Keep extracting variants from the start
  let foundVariant = true
  while (foundVariant) {
    foundVariant = false
    for (const prefix of VARIANT_PREFIXES) {
      if (remaining.startsWith(prefix)) {
        variants.push(prefix)
        remaining = remaining.slice(prefix.length)
        foundVariant = true
        break
      }
    }
  }

  return { variants, base: remaining }
}

/**
 * Transform a single class name
 * Returns the transformed class or the original if no transformation needed
 *
 * Tailwind v4 REQUIRES prefix BEFORE variants:
 *   CORRECT: dc:lg:flex-row (prefix first)
 *   WRONG:   lg:dc:flex-row (v3 style)
 */
function transformClass(className) {
  // Skip if already namespaced correctly (dc: at start)
  if (shouldSkipClass(className)) {
    return className
  }

  // Phase 1: Fix wrongly-ordered classes (lg:dc:flex → dc:lg:flex)
  // Match pattern: variant(s):dc:utility
  const wrongOrderMatch = className.match(/^((?:(?:sm|md|lg|xl|2xl|hover|focus|active|disabled|group-hover|group-focus|peer-hover|peer-focus|focus-within|focus-visible|first|last|odd|even|dark|light|motion-safe|motion-reduce|print|portrait|landscape|ltr|rtl|open|closed|placeholder|file|first-letter|first-line|before|after|selection|marker|backdrop|visited):)+)dc:(.+)$/)
  if (wrongOrderMatch) {
    const [, variants, utility] = wrongOrderMatch
    stats.classesTransformed++
    // Move dc: to the front: lg:dc:flex → dc:lg:flex
    return 'dc:' + variants + utility
  }

  // Phase 2: Add dc: prefix to unprefixed utilities
  // Parse variants from the class
  const { variants, base } = parseClassVariants(className)

  // Check if base class is a Tailwind utility
  if (isTailwindUtility(base)) {
    // For Tailwind v4: prefix comes FIRST, then variants
    // dc:lg:flex-row (correct v4 style)
    stats.classesTransformed++
    return 'dc:' + variants.join('') + base
  }

  return className
}

/**
 * Transform a full className string
 */
function transformClassName(classNameStr) {
  // Split by whitespace, transform each class, rejoin
  const classes = classNameStr.split(/\s+/).filter(Boolean)
  const transformed = classes.map(transformClass)
  return transformed.join(' ')
}

/**
 * Process className in template literals
 * Handles: className={`foo ${condition ? 'bar' : 'baz'}`}
 * Preserves spaces and processes string literals inside ${} expressions
 */
function processTemplateLiteral(content) {
  let result = ''
  let i = 0

  while (i < content.length) {
    if (content[i] === '$' && content[i + 1] === '{') {
      // Find matching closing brace
      let depth = 1
      let j = i + 2
      while (j < content.length && depth > 0) {
        if (content[j] === '{') depth++
        else if (content[j] === '}') depth--
        j++
      }
      // Get the expression content and transform string literals within it
      const exprContent = content.slice(i + 2, j - 1)
      const transformedExpr = processExpressionStringLiterals(exprContent)
      result += '${' + transformedExpr + '}'
      i = j
    } else {
      // Static text - collect until next ${
      let end = content.indexOf('${', i)
      if (end === -1) end = content.length

      const staticPart = content.slice(i, end)
      // Transform each whitespace-separated segment, preserving whitespace
      result += transformPreservingWhitespace(staticPart)
      i = end
    }
  }

  return result
}

/**
 * Transform class names while preserving original whitespace
 */
function transformPreservingWhitespace(str) {
  // Match tokens (non-whitespace) and whitespace separately
  const tokens = str.match(/\S+|\s+/g) || []
  return tokens.map(token => {
    if (/^\s+$/.test(token)) {
      return token // Preserve whitespace as-is
    }
    return transformClass(token)
  }).join('')
}

/**
 * Process string literals inside JavaScript expressions
 * Transforms class names inside 'string' and "string" within ${} expressions
 */
function processExpressionStringLiterals(expr) {
  let result = ''
  let i = 0

  while (i < expr.length) {
    const char = expr[i]

    if (char === "'" || char === '"') {
      // Found a string literal
      const quote = char
      let j = i + 1
      let stringContent = ''

      // Find the closing quote (handling escapes)
      while (j < expr.length) {
        if (expr[j] === '\\' && j + 1 < expr.length) {
          stringContent += expr[j] + expr[j + 1]
          j += 2
        } else if (expr[j] === quote) {
          break
        } else {
          stringContent += expr[j]
          j++
        }
      }

      // Transform the string content
      const transformedContent = transformPreservingWhitespace(stringContent)
      result += quote + transformedContent + quote
      i = j + 1
    } else if (char === '`') {
      // Nested template literal - process recursively
      let j = i + 1
      let depth = 1
      let templateContent = ''

      while (j < expr.length && depth > 0) {
        if (expr[j] === '`' && expr[j - 1] !== '\\') {
          depth--
          if (depth === 0) break
        } else if (expr[j] === '$' && expr[j + 1] === '{') {
          // Find matching }
          let braceDepth = 1
          templateContent += '${'
          j += 2
          while (j < expr.length && braceDepth > 0) {
            if (expr[j] === '{') braceDepth++
            else if (expr[j] === '}') braceDepth--
            if (braceDepth > 0) templateContent += expr[j]
            j++
          }
          templateContent += '}'
          continue
        } else {
          templateContent += expr[j]
        }
        j++
      }

      const transformedTemplate = processTemplateLiteral(templateContent)
      result += '`' + transformedTemplate + '`'
      i = j + 1
    } else {
      result += char
      i++
    }
  }

  return result
}

/**
 * Process a file and transform className attributes
 */
function processFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  let modified = content
  let hasChanges = false

  // Pattern 1: className="..."
  modified = modified.replace(/className="([^"]*)"/g, (match, classes) => {
    const transformed = transformClassName(classes)
    if (transformed !== classes) {
      hasChanges = true
      return `className="${transformed}"`
    }
    return match
  })

  // Pattern 2: className='...'
  modified = modified.replace(/className='([^']*)'/g, (match, classes) => {
    const transformed = transformClassName(classes)
    if (transformed !== classes) {
      hasChanges = true
      return `className='${transformed}'`
    }
    return match
  })

  // Pattern 3: className={`...`} (template literals)
  modified = modified.replace(/className=\{`([^`]*)`\}/g, (match, content) => {
    const transformed = processTemplateLiteral(content)
    if (transformed !== content) {
      hasChanges = true
      return `className={\`${transformed}\`}`
    }
    return match
  })

  // Pattern 4: className={clsx(...)} or className={cn(...)} - process string arguments
  // This handles: cn('foo', condition && 'bar', 'baz')
  modified = modified.replace(/className=\{(clsx|cn|classNames?)\(([\s\S]*?)\)\}/g, (match, fn, args) => {
    let transformedArgs = args
    let innerHasChanges = false

    // Transform string literals within the function call
    transformedArgs = args.replace(/'([^']*)'/g, (m, classes) => {
      const transformed = transformClassName(classes)
      if (transformed !== classes) {
        innerHasChanges = true
        return `'${transformed}'`
      }
      return m
    })

    transformedArgs = transformedArgs.replace(/"([^"]*)"/g, (m, classes) => {
      const transformed = transformClassName(classes)
      if (transformed !== classes) {
        innerHasChanges = true
        return `"${transformed}"`
      }
      return m
    })

    if (innerHasChanges) {
      hasChanges = true
      return `className={${fn}(${transformedArgs})}`
    }
    return match
  })

  // Pattern 5: Ternary expressions in className
  // className={condition ? 'foo' : 'bar'}
  modified = modified.replace(/className=\{([^`{}]+\?[^{}]+:[^{}]+)\}/g, (match, expr) => {
    let transformedExpr = expr
    let innerHasChanges = false

    // Transform string literals
    transformedExpr = expr.replace(/'([^']*)'/g, (m, classes) => {
      const transformed = transformClassName(classes)
      if (transformed !== classes) {
        innerHasChanges = true
        return `'${transformed}'`
      }
      return m
    })

    transformedExpr = transformedExpr.replace(/"([^"]*)"/g, (m, classes) => {
      const transformed = transformClassName(classes)
      if (transformed !== classes) {
        innerHasChanges = true
        return `"${transformed}"`
      }
      return m
    })

    if (innerHasChanges) {
      hasChanges = true
      return `className={${transformedExpr}}`
    }
    return match
  })

  return { modified, hasChanges }
}

/**
 * Recursively find all TSX files in a directory
 */
function findTsxFiles(dir, files = []) {
  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      findTsxFiles(fullPath, files)
    } else if (entry.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }

  return files
}

// ============================================================================
// Main Execution
// ============================================================================

function main() {
  console.log('CSS Prefix Migration Script')
  console.log('===========================')
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`)
  console.log(`Scanning: ${clientDir}`)
  console.log('')

  const tsxFiles = findTsxFiles(clientDir)
  console.log(`Found ${tsxFiles.length} TSX files to process`)
  console.log('')

  for (const filePath of tsxFiles) {
    stats.filesScanned++
    const relativePath = relative(rootDir, filePath)

    try {
      const { modified, hasChanges } = processFile(filePath)

      if (hasChanges) {
        stats.filesModified++
        console.log(`[MODIFIED] ${relativePath}`)

        if (!isDryRun) {
          writeFileSync(filePath, modified, 'utf-8')
        }
      }
    } catch (error) {
      stats.errors.push({ file: relativePath, error: error.message })
      console.error(`[ERROR] ${relativePath}: ${error.message}`)
    }
  }

  // Print summary
  console.log('')
  console.log('Summary')
  console.log('-------')
  console.log(`Files scanned: ${stats.filesScanned}`)
  console.log(`Files modified: ${stats.filesModified}`)
  console.log(`Classes transformed: ${stats.classesTransformed}`)

  if (stats.errors.length > 0) {
    console.log(`Errors: ${stats.errors.length}`)
    for (const { file, error } of stats.errors) {
      console.log(`  - ${file}: ${error}`)
    }
  }

  if (isDryRun) {
    console.log('')
    console.log('This was a dry run. No files were modified.')
    console.log('Run without --dry-run to apply changes.')
  }
}

main()
