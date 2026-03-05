/**
 * NotebookMarkdownBlock - Renders a markdown text block in the notebook
 * Uses markdown-to-jsx for full GFM support including tables
 *
 * Header matches NotebookPortletBlock pattern for visual consistency.
 */

import React from 'react'
import type { CSSProperties } from 'react'
import Markdown from 'markdown-to-jsx'
import type { MarkdownBlock } from '../../stores/notebookStore'
import { getIcon } from '../../icons/registry'

const ICON_STYLE: CSSProperties = { width: '16px', height: '16px', color: 'currentColor' }

const DocumentTextIcon = getIcon('documentText')
const ChevronUpIcon = getIcon('chevronUp')
const ChevronDownIcon = getIcon('chevronDown')
const DeleteIcon = getIcon('delete')

interface NotebookMarkdownBlockProps {
  block: MarkdownBlock
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  isFirst: boolean
  isLast: boolean
}

/** Scrollable table wrapper so wide tables don't overflow the block */
function ScrollableTable({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="dc:overflow-x-auto dc:my-2">
      <table {...props}>{children}</table>
    </div>
  )
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
    table: { component: ScrollableTable, props: { className: 'dc:w-full dc:border-collapse dc:text-sm' } },
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
    <div className="dc:relative dc:mb-4 bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:flex dc:flex-col">
      {/* Header - same pattern as NotebookPortletBlock / DashboardPortletCard */}
      <div className="dc:flex dc:items-center dc:justify-between dc:px-3 dc:py-1.5 dc:border-b border-dc-border dc:shrink-0 bg-dc-surface-secondary dc:rounded-t-lg">
        <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0">
          <DocumentTextIcon style={ICON_STYLE} />
          <h3 className="dc:font-semibold dc:text-sm text-dc-text dc:truncate">
            {block.title || 'Markdown'}
          </h3>
        </div>
        <div className="dc:flex dc:items-center dc:gap-1 dc:shrink-0 dc:ml-4 dc:-mr-2">
          {!isFirst && (
            <button
              onClick={() => onMoveUp(block.id)}
              className="dc:p-1 dc:bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors"
              title="Move up"
            >
              <ChevronUpIcon style={ICON_STYLE} />
            </button>
          )}
          {!isLast && (
            <button
              onClick={() => onMoveDown(block.id)}
              className="dc:p-1 dc:bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors"
              title="Move down"
            >
              <ChevronDownIcon style={ICON_STYLE} />
            </button>
          )}
          <button
            onClick={() => onRemove(block.id)}
            className="dc:p-1 dc:mr-0.5 dc:bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer dc:hover:bg-dc-danger-bg text-dc-danger dc:transition-colors"
            title="Remove"
          >
            <DeleteIcon style={ICON_STYLE} />
          </button>
        </div>
      </div>

      {/* Markdown content */}
      <div className="dc:p-4 dc:min-w-0 dc:overflow-hidden">
        <Markdown options={markdownOptions}>
          {block.content}
        </Markdown>
      </div>
    </div>
  )
})

export default NotebookMarkdownBlock
