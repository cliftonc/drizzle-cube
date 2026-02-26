/**
 * NotebookMarkdownBlock - Renders a markdown text block in the notebook
 * Uses markdown-to-jsx for full GFM support including tables
 */

import React from 'react'
import Markdown from 'markdown-to-jsx'
import type { MarkdownBlock } from '../../stores/notebookStore'

interface NotebookMarkdownBlockProps {
  block: MarkdownBlock
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  isFirst: boolean
  isLast: boolean
}

/** markdown-to-jsx options with dc: themed overrides */
const markdownOptions = {
  overrides: {
    h1: { props: { className: 'dc:text-lg dc:font-bold text-dc-text dc:mb-2 dc:mt-3' } },
    h2: { props: { className: 'dc:text-base dc:font-semibold text-dc-text dc:mb-2 dc:mt-3' } },
    h3: { props: { className: 'dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:mt-3' } },
    p: { props: { className: 'dc:text-sm dc:leading-relaxed text-dc-text dc:mb-2' } },
    strong: { props: { className: 'dc:font-semibold' } },
    a: { props: { className: 'text-dc-accent dc:hover:underline', target: '_blank', rel: 'noopener noreferrer' } },
    code: { props: { className: 'dc:px-1 dc:py-0.5 dc:rounded dc:text-xs bg-dc-surface-secondary text-dc-accent dc:font-mono' } },
    pre: { props: { className: 'dc:rounded-lg dc:p-3 dc:my-2 dc:overflow-x-auto dc:text-xs bg-dc-surface-secondary text-dc-text dc:font-mono' } },
    ul: { props: { className: 'dc:list-disc dc:ml-5 dc:mb-2 dc:text-sm text-dc-text dc:space-y-1' } },
    ol: { props: { className: 'dc:list-decimal dc:ml-5 dc:mb-2 dc:text-sm text-dc-text dc:space-y-1' } },
    li: { props: { className: 'dc:text-sm text-dc-text' } },
    hr: { props: { className: 'dc:my-3 border-dc-border' } },
    blockquote: { props: { className: 'dc:border-l-4 border-dc-accent dc:pl-3 dc:my-2 dc:italic text-dc-text-secondary dc:text-sm' } },
    table: { props: { className: 'dc:w-full dc:border-collapse dc:my-2 dc:text-sm' } },
    thead: { props: { className: 'bg-dc-surface-secondary' } },
    th: { props: { className: 'dc:px-3 dc:py-2 dc:text-left dc:font-semibold dc:text-xs text-dc-text-secondary dc:uppercase dc:tracking-wider border-dc-border dc:border-b' } },
    td: { props: { className: 'dc:px-3 dc:py-2 dc:text-sm text-dc-text border-dc-border dc:border-b' } },
    tr: { props: { className: 'dc:hover:opacity-80' } },
  },
}

const NotebookMarkdownBlock = React.memo(function NotebookMarkdownBlock({
  block,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: NotebookMarkdownBlockProps) {
  return (
    <div className="dc:group dc:relative dc:mb-4">
      {/* Hover toolbar */}
      <div className="dc:absolute dc:right-2 dc:top-2 dc:z-10 dc:flex dc:gap-1 dc:opacity-0 dc:group-hover:opacity-100 dc:transition-opacity">
        {!isFirst && (
          <button
            onClick={() => onMoveUp(block.id)}
            className="dc:p-1 dc:rounded dc:text-xs bg-dc-surface text-dc-text-secondary dc:hover:opacity-80 border-dc-border dc:border"
            title="Move up"
          >
            &#x25B2;
          </button>
        )}
        {!isLast && (
          <button
            onClick={() => onMoveDown(block.id)}
            className="dc:p-1 dc:rounded dc:text-xs bg-dc-surface text-dc-text-secondary dc:hover:opacity-80 border-dc-border dc:border"
            title="Move down"
          >
            &#x25BC;
          </button>
        )}
        <button
          onClick={() => onRemove(block.id)}
          className="dc:p-1 dc:rounded dc:text-xs text-dc-error dc:hover:opacity-80 bg-dc-surface border-dc-border dc:border"
          title="Remove"
        >
          &#x2715;
        </button>
      </div>

      {/* Title */}
      {block.title && (
        <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2 dc:px-1">
          {block.title}
        </h4>
      )}

      {/* Markdown content */}
      <div className="dc:rounded-lg dc:p-4 bg-dc-surface border-dc-border dc:border">
        <Markdown options={markdownOptions}>
          {block.content}
        </Markdown>
      </div>
    </div>
  )
})

export default NotebookMarkdownBlock
