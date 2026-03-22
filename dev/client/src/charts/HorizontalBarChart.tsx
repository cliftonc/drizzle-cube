/**
 * Example Custom Chart Plugin: Horizontal Bar Chart
 *
 * A simple CSS-based horizontal bar chart with no external dependencies.
 * Demonstrates how to build a custom chart that integrates with drizzle-cube's
 * chart plugin system, including:
 * - Reading from chartConfig (xAxis/yAxis field mapping)
 * - Reading from displayConfig (visual options)
 * - Handling empty data
 * - Using the colorPalette
 */

import React, { useMemo } from 'react'
import type { ChartProps } from '@drizzle-cube/client'

const HorizontalBarChart = React.memo(function HorizontalBarChart({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
  colorPalette,
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: typeof height === 'number' ? `${height}px` : height,
          color: '#888', fontSize: '14px',
        }}
      >
        No data available
      </div>
    )
  }

  const categoryField = chartConfig?.xAxis?.[0]
  const valueField = chartConfig?.yAxis?.[0]

  if (!categoryField || !valueField) {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: typeof height === 'number' ? `${height}px` : height,
          color: '#888', fontSize: '14px',
        }}
      >
        Configure X-Axis (category) and Y-Axis (value) fields
      </div>
    )
  }

  const { items, maxValue } = useMemo(() => {
    const parsed = data.map(row => ({
      label: String(row[categoryField] ?? ''),
      value: Number(row[valueField] ?? 0),
    }))
    const max = Math.max(...parsed.map(d => d.value), 1)
    return { items: parsed, maxValue: max }
  }, [data, categoryField, valueField])

  const showValues = displayConfig?.showValues !== false
  const showGrid = displayConfig?.showGrid !== false
  const colors = colorPalette?.colors || ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd']

  return (
    <div
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {items.map((item, i) => {
        const pct = (item.value / maxValue) * 100
        const color = colors[i % colors.length]

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '28px' }}>
            {/* Label */}
            <div style={{
              width: '120px', flexShrink: 0, fontSize: '13px',
              color: '#555', textAlign: 'right', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.label}
            </div>

            {/* Bar track */}
            <div style={{
              flex: 1, height: '24px', borderRadius: '4px',
              backgroundColor: showGrid ? '#f3f4f6' : 'transparent',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Bar fill */}
              <div
                style={{
                  width: `${pct}%`, height: '100%', borderRadius: '4px',
                  backgroundColor: color,
                  transition: 'width 0.4s ease-out',
                  minWidth: pct > 0 ? '4px' : '0',
                }}
              />
            </div>

            {/* Value label */}
            {showValues && (
              <div style={{
                width: '60px', flexShrink: 0, fontSize: '13px',
                fontWeight: 600, color: '#333', textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {item.value.toLocaleString()}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

export default HorizontalBarChart
