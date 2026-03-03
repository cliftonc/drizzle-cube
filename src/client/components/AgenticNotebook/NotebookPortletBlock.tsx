/**
 * NotebookPortletBlock - Wraps AnalyticsPortlet for notebook display
 *
 * Uses the same header pattern as DashboardPortletCard for consistency:
 * - Title on the left with DebugModal inline
 * - Action buttons on the right (move, edit, delete)
 */

import React, { useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import type { PortletBlock } from '../../stores/notebookStore'
import type { ChartAxisConfig, ChartDisplayConfig, ChartType } from '../../types'
import type { FlowChartData } from '../../types/flow'
import type { RetentionChartData } from '../../types/retention'
import { getIcon } from '../../icons/registry'
import AnalyticsPortlet from '../AnalyticsPortlet'
import DebugModal from '../DebugModal'

const ICON_STYLE: CSSProperties = { width: '16px', height: '16px', color: 'currentColor' }

interface DebugData {
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
  queryObject: unknown
  data: unknown[] | FlowChartData | RetentionChartData
  chartType: ChartType
  cacheInfo?: { hit: true; cachedAt: string; ttlMs: number; ttlRemainingMs: number } | null
  drillState?: unknown
}

interface NotebookPortletBlockProps {
  block: PortletBlock
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onEdit: (block: PortletBlock) => void
  isFirst: boolean
  isLast: boolean
}

const ChevronUpIcon = getIcon('chevronUp')
const ChevronDownIcon = getIcon('chevronDown')
const EditIcon = getIcon('edit')
const DeleteIcon = getIcon('delete')

const NotebookPortletBlock = React.memo(function NotebookPortletBlock({
  block,
  onRemove,
  onMoveUp,
  onMoveDown,
  onEdit,
  isFirst,
  isLast,
}: NotebookPortletBlockProps) {
  const [debugData, setDebugData] = useState<DebugData | null>(null)

  const handleDebugDataReady = useCallback((data: DebugData) => {
    setDebugData(data)
  }, [])

  return (
    <div className="dc:relative dc:mb-4 bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:flex dc:flex-col">
      {/* Header - same pattern as DashboardPortletCard */}
      <div className="dc:flex dc:items-center dc:justify-between dc:px-3 dc:py-1.5 dc:border-b border-dc-border dc:shrink-0 bg-dc-surface-secondary dc:rounded-t-lg">
        <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0">
          <h3 className="dc:font-semibold dc:text-sm text-dc-text dc:truncate">
            {block.title || 'Untitled'}
          </h3>
          {debugData && (
            <DebugModal
              chartConfig={debugData.chartConfig}
              displayConfig={debugData.displayConfig}
              queryObject={debugData.queryObject}
              data={debugData.data}
              chartType={debugData.chartType}
              cacheInfo={debugData.cacheInfo ?? undefined}
            />
          )}
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
            onClick={() => onEdit(block)}
            className="dc:p-1 dc:bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover dc:transition-colors"
            title="Edit visualization"
          >
            <EditIcon style={ICON_STYLE} />
          </button>
          <button
            onClick={() => onRemove(block.id)}
            className="dc:p-1 dc:mr-0.5 dc:bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer dc:hover:bg-dc-danger-bg text-dc-danger dc:transition-colors"
            title="Remove"
          >
            <DeleteIcon style={ICON_STYLE} />
          </button>
        </div>
      </div>

      {/* Portlet body */}
      <div className="dc:flex-1 dc:min-h-0">
        <AnalyticsPortlet
          query={block.query}
          chartType={block.chartType}
          chartConfig={block.chartConfig}
          displayConfig={block.displayConfig}
          height={400}
          eagerLoad={true}
          onDebugDataReady={handleDebugDataReady}
        />
      </div>
    </div>
  )
})

export default NotebookPortletBlock
