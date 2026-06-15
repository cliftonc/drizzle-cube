import React from 'react'
import { CHART_COLORS } from '../../utils/chartConstants'
import { formatAxisValue } from '../../utils/chartUtils'
import type { AxisFormatConfig, ChartAxisConfig, ColorPalette, CubeQuery } from '../../types'
import type { ChartDataPointClickEvent } from '../../types/drill'
import type { TreemapDatum } from './TreeMapChart.helpers'

interface TreeMapContentOptions {
  treemapData: TreemapDatum[]
  colorPalette?: ColorPalette
  hoveredIndex: number | null
  setHoveredIndex: (index: number | null) => void
  leftYAxisFormat?: AxisFormatConfig
  drillEnabled?: boolean
  onDataPointClick?: (event: ChartDataPointClickEvent) => void
  queryObject?: CubeQuery
  chartConfig?: ChartAxisConfig
}

/** Fill opacity for a treemap cell given the currently hovered index. */
function cellOpacity(hoveredIndex: number | null, index: number): number {
  if (hoveredIndex === null) return 0.8
  return hoveredIndex === index ? 1 : 0.6
}

/** Format the size label shown inside a treemap cell. */
function formatSize(size: unknown, format: AxisFormatConfig | undefined): string {
  if (format) return formatAxisValue(size as number, format)
  return typeof size === 'number' ? size.toLocaleString() : String(size)
}

/**
 * Build the Recharts `content` renderer for treemap cells.
 *
 * Encapsulates the per-cell rect + foreignObject overlay, hover state and drill
 * click handler that previously lived inline in TreeMapChart (the highest-
 * complexity hot spots). Behaviour is identical to the original.
 */
export function makeTreeMapContent({
  treemapData,
  colorPalette,
  hoveredIndex,
  setHoveredIndex,
  leftYAxisFormat,
  drillEnabled,
  onDataPointClick,
  queryObject,
  chartConfig,
}: TreeMapContentOptions) {
  return function CustomizedContent(props: any) {
    const { x, y, width, height, index, name, size } = props

    if (width < 20 || height < 20) return null // Skip very small cells

    const handleClick = (event: React.MouseEvent) => {
      event.stopPropagation()
      const cellData = treemapData[index]
      if (cellData && onDataPointClick) {
        // Use query measures for proper field name (chartConfig.yAxis may hold labels)
        const measureField = queryObject?.measures?.[0] || chartConfig?.yAxis?.[0] || ''
        onDataPointClick({
          dataPoint: cellData,
          clickedField: measureField,
          xValue: name,
          position: { x: event.clientX, y: event.clientY },
          nativeEvent: event
        })
      }
    }

    const fill =
      treemapData[index]?.fill ||
      ((colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) ||
        CHART_COLORS[index % CHART_COLORS.length])

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill,
            fillOpacity: cellOpacity(hoveredIndex, index),
            stroke: '#fff',
            strokeWidth: 2,
            cursor: drillEnabled ? 'pointer' : 'default',
            pointerEvents: 'all'
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={drillEnabled && onDataPointClick ? handleClick : undefined}
        />
        <foreignObject
          x={x}
          y={y}
          width={width}
          height={height}
          style={{ pointerEvents: 'none', overflow: 'visible' }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              boxSizing: 'border-box',
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              overflow: 'hidden'
            }}
          >
            {width > 40 && height > 30 && (
              <div
                style={{
                  fontSize: `${Math.max(10, Math.min(width / 8, height / 8, 16))}px`,
                  fontWeight: '600',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  marginBottom: width > 60 && height > 45 ? '4px' : '0',
                  wordBreak: 'break-word',
                  hyphens: 'auto'
                }}
              >
                {name}
              </div>
            )}
            {width > 60 && height > 45 && (
              <div
                style={{
                  fontSize: `${Math.max(8, Math.min(width / 10, height / 10, 14))}px`,
                  textAlign: 'center',
                  opacity: 0.9
                }}
              >
                {formatSize(size, leftYAxisFormat)}
              </div>
            )}
          </div>
        </foreignObject>
      </g>
    )
  }
}
