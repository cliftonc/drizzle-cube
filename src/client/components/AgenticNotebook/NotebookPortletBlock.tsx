/**
 * NotebookPortletBlock - Wraps AnalyticsPortlet for notebook display
 */

import React from 'react'
import type { PortletBlock } from '../../stores/notebookStore'
import AnalyticsPortlet from '../AnalyticsPortlet'

interface NotebookPortletBlockProps {
  block: PortletBlock
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  isFirst: boolean
  isLast: boolean
}

const NotebookPortletBlock = React.memo(function NotebookPortletBlock({
  block,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: NotebookPortletBlockProps) {
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

      {/* Portlet */}
      <div className="dc:rounded-lg dc:overflow-hidden border-dc-border dc:border bg-dc-surface">
        <AnalyticsPortlet
          query={block.query}
          chartType={block.chartType}
          chartConfig={block.chartConfig}
          displayConfig={block.displayConfig}
          height={400}
          eagerLoad={true}
        />
      </div>
    </div>
  )
})

export default NotebookPortletBlock
