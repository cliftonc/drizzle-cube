/**
 * Tests for syntaxHighlighting utility
 * Covers lazy loading, highlighting functions, and state management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadSyntaxHighlighter,
  highlightCodeBlocks,
  highlightCodeBlock,
  isSyntaxHighlightingAvailable,
  getSyntaxHighlighter
} from '../../../src/client/utils/syntaxHighlighting'

// Mock the dynamic imports to avoid actual highlight.js loading
vi.mock('highlight.js/lib/core', () => ({
  default: {
    registerLanguage: vi.fn(),
    highlightElement: vi.fn()
  }
}))

vi.mock('highlight.js/lib/languages/javascript', () => ({
  default: vi.fn()
}))

vi.mock('highlight.js/lib/languages/sql', () => ({
  default: vi.fn()
}))

vi.mock('highlight.js/lib/languages/json', () => ({
  default: vi.fn()
}))

describe('syntaxHighlighting', () => {
  // Clean up between tests - need to reset internal state
  beforeEach(() => {
    // Reset document body
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('loadSyntaxHighlighter', () => {
    it('should load without errors', async () => {
      await expect(loadSyntaxHighlighter()).resolves.not.toThrow()
    })

    it('should handle concurrent calls', async () => {
      // Multiple concurrent calls should all resolve successfully
      const results = await Promise.all([
        loadSyntaxHighlighter(),
        loadSyntaxHighlighter(),
        loadSyntaxHighlighter()
      ])

      // All should resolve without errors
      expect(results.length).toBe(3)
      expect(isSyntaxHighlightingAvailable()).toBe(true)
    })

    it('should complete successfully', async () => {
      await loadSyntaxHighlighter()
      // After loading, should be available
      expect(isSyntaxHighlightingAvailable()).toBe(true)
    })
  })

  describe('isSyntaxHighlightingAvailable', () => {
    it('should return true after loading', async () => {
      await loadSyntaxHighlighter()
      expect(isSyntaxHighlightingAvailable()).toBe(true)
    })
  })

  describe('getSyntaxHighlighter', () => {
    it('should return the highlighter instance after loading', async () => {
      await loadSyntaxHighlighter()
      const highlighter = getSyntaxHighlighter()
      expect(highlighter).not.toBeNull()
    })

    it('should return an object with highlightElement method', async () => {
      await loadSyntaxHighlighter()
      const highlighter = getSyntaxHighlighter()
      expect(highlighter).toHaveProperty('highlightElement')
    })
  })

  describe('highlightCodeBlocks', () => {
    it('should not throw when no code blocks exist', async () => {
      await expect(highlightCodeBlocks()).resolves.not.toThrow()
    })

    it('should process code blocks in the document', async () => {
      // Add a code block to the document
      document.body.innerHTML = '<pre><code class="language-sql">SELECT * FROM users</code></pre>'

      await highlightCodeBlocks()

      // The highlighter should have been loaded and used
      expect(isSyntaxHighlightingAvailable()).toBe(true)
    })

    it('should skip already highlighted blocks', async () => {
      // Add an already-highlighted code block
      document.body.innerHTML = '<pre><code class="hljs">Already highlighted</code></pre>'

      await loadSyntaxHighlighter()
      const highlighter = getSyntaxHighlighter()
      const highlightSpy = vi.spyOn(highlighter, 'highlightElement')

      await highlightCodeBlocks()

      // Should not call highlightElement for already-highlighted blocks
      expect(highlightSpy).not.toHaveBeenCalled()
    })

    it('should highlight multiple code blocks', async () => {
      document.body.innerHTML = `
        <pre><code>Block 1</code></pre>
        <pre><code>Block 2</code></pre>
        <pre><code>Block 3</code></pre>
      `

      await loadSyntaxHighlighter()
      const highlighter = getSyntaxHighlighter()
      const highlightSpy = vi.spyOn(highlighter, 'highlightElement')

      await highlightCodeBlocks()

      expect(highlightSpy).toHaveBeenCalledTimes(3)
    })
  })

  describe('highlightCodeBlock', () => {
    it('should not throw for a valid element', async () => {
      const element = document.createElement('code')
      element.textContent = 'const x = 1'

      await expect(highlightCodeBlock(element)).resolves.not.toThrow()
    })

    it('should skip element with hljs class', async () => {
      const element = document.createElement('code')
      element.classList.add('hljs')
      element.textContent = 'Already highlighted'

      await loadSyntaxHighlighter()
      const highlighter = getSyntaxHighlighter()
      const highlightSpy = vi.spyOn(highlighter, 'highlightElement')

      await highlightCodeBlock(element)

      expect(highlightSpy).not.toHaveBeenCalled()
    })

    it('should highlight element without hljs class', async () => {
      const element = document.createElement('code')
      element.textContent = 'const x = 1'

      await loadSyntaxHighlighter()
      const highlighter = getSyntaxHighlighter()
      const highlightSpy = vi.spyOn(highlighter, 'highlightElement')

      await highlightCodeBlock(element)

      expect(highlightSpy).toHaveBeenCalledWith(element)
    })
  })
})
