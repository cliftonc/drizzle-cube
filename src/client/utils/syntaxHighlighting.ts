/**
 * Syntax Highlighting Utility
 *
 * Lazy-loads highlight.js only when needed for syntax highlighting in debug panels.
 * This minimizes bundle size impact since syntax highlighting is not needed on initial load.
 *
 * Usage:
 *   await highlightCodeBlocks()
 */

let highlightJs: any = null
let loadingPromise: Promise<void> | null = null

/**
 * Lazy-loads highlight.js and registers supported languages.
 * Only loads once - subsequent calls return immediately.
 */
export async function loadSyntaxHighlighter(): Promise<void> {
  // Already loaded
  if (highlightJs) {
    return
  }

  // Loading in progress - wait for it
  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = (async () => {
    try {
      // Dynamic imports to enable code splitting
      const hljs = await import('highlight.js/lib/core')
      const javascript = await import('highlight.js/lib/languages/javascript')
      const sql = await import('highlight.js/lib/languages/sql')
      const json = await import('highlight.js/lib/languages/json')

      // Register languages we need
      hljs.default.registerLanguage('javascript', javascript.default)
      hljs.default.registerLanguage('sql', sql.default)
      hljs.default.registerLanguage('json', json.default)

      // Store the instance
      highlightJs = hljs.default
    } catch (err) {
      console.error('Failed to load syntax highlighter:', err)
      // Clear loading promise so it can be retried
      loadingPromise = null
    }
  })()

  return loadingPromise
}

/**
 * Highlights all code blocks on the page that haven't been highlighted yet.
 * Gracefully handles cases where highlight.js fails to load.
 */
export async function highlightCodeBlocks(): Promise<void> {
  // Load highlighter if not already loaded
  await loadSyntaxHighlighter()

  // If loading failed, return silently (code blocks remain unstyled)
  if (!highlightJs) {
    return
  }

  // Find all code blocks and highlight them
  document.querySelectorAll('pre code').forEach((block) => {
    // Skip if already highlighted
    if (!block.classList.contains('hljs')) {
      highlightJs.highlightElement(block)
    }
  })
}

/**
 * Highlights a specific code block element.
 * Useful for dynamically added content.
 *
 * @param element - The code block element to highlight
 */
export async function highlightCodeBlock(element: HTMLElement): Promise<void> {
  await loadSyntaxHighlighter()

  if (!highlightJs) {
    return
  }

  if (!element.classList.contains('hljs')) {
    highlightJs.highlightElement(element)
  }
}

/**
 * Returns whether syntax highlighting is available.
 * Useful for conditional rendering or feature detection.
 */
export function isSyntaxHighlightingAvailable(): boolean {
  return highlightJs !== null
}

/**
 * Returns the loaded highlight.js instance, if available.
 * Useful for custom highlighting flows that need direct access.
 */
export function getSyntaxHighlighter(): any | null {
  return highlightJs
}
