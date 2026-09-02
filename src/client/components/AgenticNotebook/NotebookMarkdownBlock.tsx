/**
 * NotebookMarkdownBlock - Renders a markdown text block in the notebook
 * Uses markdown-to-jsx for full GFM support including tables
 *
 * Header matches NotebookPortletBlock pattern for visual consistency.
 */

import React from 'react'
import type { CSSProperties } from 'react'
import Markdown from 'markdown-to-jsx'
import type { MarkdownBlock } from '../../stores/notebookStore.js'
import { getIcon } from '../../icons/registry.js'
import { NOTEBOOK_MARKDOWN_OPTIONS } from '../markdownOverrides.js'

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
        <Markdown options={NOTEBOOK_MARKDOWN_OPTIONS}>
          {block.content}
        </Markdown>
      </div>
    </div>
  )
})

export default NotebookMarkdownBlock
