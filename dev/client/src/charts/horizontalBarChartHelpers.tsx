/**
 * Co-located helpers for the example HorizontalBarChart plugin.
 *
 * Extracts the empty/placeholder state, data parsing, and per-row rendering so
 * the chart component stays a thin composition. Pure extraction — no behaviour
 * change.
 */

import React from 'react'

/** Centered muted message used for the empty / not-configured states. */
export function HorizontalBarMessage({
  height,
  children,
}: {
  height: number | string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: typeof height === 'number' ? `${height}px` : height,
        color: '#888',
        fontSize: '14px',
      }}
    >
      {children}
    </div>
  )
}

export interface HorizontalBarItem {
  label: string
  value: number
}

/** Resolve the category/value field names from a chart config. */
export function resolveBarFields(chartConfig: any): {
  categoryField: string | undefined
  valueField: string | undefined
} {
  return {
    categoryField: chartConfig?.xAxis?.[0],
    valueField: chartConfig?.yAxis?.[0],
  }
}

/**
 * Resolve the placeholder message (or null when ready to render) for the
 * empty-data and not-configured states.
 */
export function resolveBarPlaceholder(
  hasData: boolean,
  categoryField: string | undefined,
  valueField: string | undefined
): string | null {
  if (!hasData) return 'No data available'
  if (!categoryField || !valueField) return 'Configure X-Axis (category) and Y-Axis (value) fields'
  return null
}

/**
 * Parse raw rows into label/value items plus the max value (min 1). Returns an
 * empty result when data or field mapping is missing.
 */
export function parseBarItems(
  data: Record<string, any>[] | undefined,
  categoryField: string | undefined,
  valueField: string | undefined
): { items: HorizontalBarItem[]; maxValue: number } {
  if (!data || data.length === 0 || !categoryField || !valueField) {
    return { items: [], maxValue: 1 }
  }
  const items = data.map(row => ({
    label: String(row[categoryField] ?? ''),
    value: Number(row[valueField] ?? 0),
  }))
  const maxValue = Math.max(...items.map(d => d.value), 1)
  return { items, maxValue }
}

/** Resolve display options (colors, grid, values) from props with defaults. */
export function resolveBarDisplay(
  displayConfig: { showGrid?: boolean; showValues?: boolean } | undefined,
  colorPalette: { colors?: string[] } | undefined
): { colors: string[]; showGrid: boolean; showValues: boolean } {
  return {
    colors: colorPalette?.colors || ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'],
    showGrid: displayConfig?.showGrid !== false,
    showValues: displayConfig?.showValues !== false,
  }
}

/** Resolve a height prop to a CSS dimension string. */
export function resolveHeight(height: number | string): string {
  return typeof height === 'number' ? `${height}px` : height
}

/** Render the scrollable list of horizontal bars. */
export function HorizontalBarList({
  items,
  maxValue,
  height,
  colors,
  showGrid,
  showValues,
}: {
  items: HorizontalBarItem[]
  maxValue: number
  height: number | string
  colors: string[]
  showGrid: boolean
  showValues: boolean
}) {
  return (
    <div
      style={{
        height: resolveHeight(height),
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {items.map((item, i) => (
        <HorizontalBarRow
          key={i}
          item={item}
          color={colors[i % colors.length]}
          pct={(item.value / maxValue) * 100}
          showGrid={showGrid}
          showValues={showValues}
        />
      ))}
    </div>
  )
}

/** Render a single horizontal bar row (label, track/fill, optional value). */
export function HorizontalBarRow({
  item,
  color,
  pct,
  showGrid,
  showValues,
}: {
  item: HorizontalBarItem
  color: string
  pct: number
  showGrid: boolean
  showValues: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '28px' }}>
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
}
