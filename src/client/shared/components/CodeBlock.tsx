/**
 * CodeBlock Component
 * Displays syntax-highlighted code with copy-to-clipboard functionality
 */

import { useState, useEffect, useRef } from 'react'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import sql from 'highlight.js/lib/languages/sql'
import { getIcon } from '../../icons'
import './CodeBlock.css'

// Register languages
hljs.registerLanguage('json', json)
hljs.registerLanguage('sql', sql)

interface CodeBlockProps {
  code: string
  language: 'json' | 'sql'
  title?: string
  maxHeight?: string
  className?: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  title,
  maxHeight = '16rem',
  className = ''
}) => {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)
  const CopyIcon = getIcon('copy')
  const CheckIcon = getIcon('check')

  // Apply syntax highlighting
  useEffect(() => {
    if (codeRef.current && code) {
      codeRef.current.innerHTML = hljs.highlight(code, { language }).value
    }
  }, [code, language])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = code
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header with title and copy button */}
      <div className="flex items-center justify-between mb-2">
        {title && (
          <h4 className="text-sm font-semibold text-dc-text">{title}</h4>
        )}
        <button
          onClick={handleCopy}
          className="ml-auto px-2 py-1 text-xs rounded hover:bg-dc-surface-secondary border border-dc-border transition-colors flex items-center gap-1.5"
          title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5 text-dc-success" />
              <span className="text-dc-success">Copied</span>
            </>
          ) : (
            <>
              <CopyIcon className="w-3.5 h-3.5 text-dc-text-secondary" />
              <span className="text-dc-text-secondary">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code block with syntax highlighting */}
      <div
        className="bg-dc-surface-secondary border border-dc-border rounded overflow-auto"
        style={{ maxHeight }}
      >
        <pre className="p-3 text-xs m-0">
          <code
            ref={codeRef}
            className={`hljs language-${language}`}
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  )
}

export default CodeBlock
