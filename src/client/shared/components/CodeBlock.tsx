/**
 * CodeBlock Component
 * Displays syntax-highlighted code with copy-to-clipboard functionality
 */

import React, { useState, useEffect, useRef } from 'react'
import { getIcon } from '../../icons'
import { getSyntaxHighlighter, loadSyntaxHighlighter } from '../../utils/syntaxHighlighting'
import './CodeBlock.css'

interface CodeBlockProps {
  code: string
  language: 'json' | 'sql'
  title?: string
  maxHeight?: string
  height?: string
  className?: string
  /** Additional content to render on the right side of the header (before Copy button) */
  headerRight?: React.ReactNode
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  title,
  maxHeight = '16rem',
  height,
  className = '',
  headerRight
}) => {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)
  const CopyIcon = getIcon('copy')
  const CheckIcon = getIcon('check')

  // Apply syntax highlighting
  useEffect(() => {
    if (!codeRef.current) return
    const element = codeRef.current
    let isActive = true

    element.textContent = code

    loadSyntaxHighlighter()
      .then(() => {
        if (!isActive) return
        const hljs = getSyntaxHighlighter()
        if (!hljs) return
        element.innerHTML = hljs.highlight(code, { language }).value
      })
      .catch(() => {
        if (isActive) {
          element.textContent = code
        }
      })

    return () => {
      isActive = false
    }
  }, [code, language])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
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
    <div className={`dc:relative ${className}`}>
      {/* Header with title, optional extra controls, and copy button */}
      <div className="dc:flex dc:items-center dc:justify-between dc:mb-2 dc:gap-2">
        {title && (
          <h4 className="dc:text-sm dc:font-semibold text-dc-text">{title}</h4>
        )}
        <div className="dc:flex dc:items-center dc:gap-2 dc:ml-auto">
          {headerRight}
          <button
            onClick={handleCopy}
            className="dc:px-2 dc:py-1 dc:text-xs dc:rounded hover:bg-dc-surface-secondary dc:border border-dc-border dc:transition-colors dc:flex dc:items-center dc:gap-1.5"
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? (
              <>
                <CheckIcon className="dc:w-3.5 dc:h-3.5 text-dc-success" />
                <span className="text-dc-success">Copied</span>
              </>
            ) : (
              <>
                <CopyIcon className="dc:w-3.5 dc:h-3.5 text-dc-text-secondary" />
                <span className="text-dc-text-secondary">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code block with syntax highlighting */}
      <div
        className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:overflow-auto"
        style={height ? { height, minHeight: height, maxHeight: height } : { maxHeight }}
      >
        <pre className="dc:p-3 dc:text-xs dc:m-0">
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
