import React, { useMemo } from 'react'
import Markdown from 'markdown-to-jsx'
import type { ChartProps } from '../../types'

const MarkdownChart = React.memo(function MarkdownChart({
  displayConfig = {},
  height = "100%",
  colorPalette
}: ChartProps) {
  const content = displayConfig.content || ''
  const accentColorIndex = displayConfig.accentColorIndex ?? 0
  const fontSize = displayConfig.fontSize || 'medium'
  const alignment = displayConfig.alignment || 'left'
  const transparentBackground = !!displayConfig.transparentBackground
  const accentBorder = displayConfig.accentBorder || 'none'

  // Get accent color from palette
  const accentColor = useMemo(() => {
    if (colorPalette?.colors && accentColorIndex < colorPalette.colors.length) {
      return colorPalette.colors[accentColorIndex]
    }
    return '#8884d8'
  }, [colorPalette, accentColorIndex])

  // Font size mapping
  const fontSizeClasses: Record<string, string> = {
    small: 'dc:text-sm',
    medium: 'dc:text-lg',
    large: 'dc:text-xl'
  }

  // Alignment mapping
  const alignmentClasses: Record<string, string> = {
    left: 'dc:text-left',
    center: 'dc:text-center',
    right: 'dc:text-right'
  }

  // Header size classes per fontSize setting
  const headerSizes: Record<string, Record<number, string>> = {
    small: { 1: 'dc:text-lg', 2: 'dc:text-base', 3: 'dc:text-sm' },
    medium: { 1: 'dc:text-3xl', 2: 'dc:text-2xl', 3: 'dc:text-xl' },
    large: { 1: 'dc:text-5xl', 2: 'dc:text-4xl', 3: 'dc:text-3xl' }
  }

  const headerMargins: Record<number, string> = { 1: 'dc:mb-4', 2: 'dc:mb-3', 3: 'dc:mb-2' }

  // Build markdown-to-jsx options with dynamic accent color
  const markdownOptions = useMemo(() => ({
    overrides: {
      h1: {
        props: {
          className: `dc:font-bold ${headerSizes[fontSize]?.[1] || 'dc:text-3xl'} ${headerMargins[1]}`,
          style: { color: accentColor }
        }
      },
      h2: {
        props: {
          className: `dc:font-bold ${headerSizes[fontSize]?.[2] || 'dc:text-2xl'} ${headerMargins[2]}`,
          style: { color: accentColor }
        }
      },
      h3: {
        props: {
          className: `dc:font-bold ${headerSizes[fontSize]?.[3] || 'dc:text-xl'} ${headerMargins[3]}`,
          style: { color: accentColor }
        }
      },
      p: { props: { className: 'dc:mb-3 dc:leading-relaxed text-dc-text' } },
      strong: { props: { className: 'dc:font-bold text-dc-text' } },
      em: { props: { className: 'dc:italic text-dc-text' } },
      a: {
        props: {
          className: 'dc:hover:underline dc:transition-colors',
          target: '_blank',
          rel: 'nofollow noopener noreferrer',
          style: { color: accentColor }
        }
      },
      code: { props: { className: 'dc:px-1 dc:py-0.5 dc:rounded dc:text-xs bg-dc-surface-secondary text-dc-accent dc:font-mono' } },
      pre: { props: { className: 'dc:rounded-lg dc:p-3 dc:my-2 dc:overflow-x-auto dc:text-xs bg-dc-surface-secondary text-dc-text dc:font-mono' } },
      ul: { props: { className: 'dc:list-disc dc:ml-6 dc:mb-3 text-dc-text dc:space-y-1' } },
      ol: { props: { className: 'dc:list-decimal dc:ml-6 dc:mb-3 text-dc-text dc:space-y-1' } },
      li: { props: { className: 'dc:mb-1 text-dc-text' } },
      blockquote: { props: { className: 'dc:border-l-4 border-dc-accent dc:pl-3 dc:my-2 dc:italic text-dc-text-secondary' } },
      hr: {
        props: {
          className: 'dc:my-4 dc:border-none',
          style: { height: '2px', backgroundColor: accentColor, opacity: 0.3 }
        }
      },
      table: { props: { className: 'dc:w-full dc:border-collapse dc:my-3 dc:text-sm' } },
      thead: { props: { className: 'bg-dc-surface-secondary' } },
      th: { props: { className: 'dc:px-3 dc:py-2 dc:text-left dc:font-semibold dc:text-xs text-dc-text-secondary dc:uppercase dc:tracking-wider border-dc-border dc:border-b' } },
      td: { props: { className: 'dc:px-3 dc:py-2 text-dc-text border-dc-border dc:border-b' } },
      tr: { props: { className: 'dc:hover:opacity-80' } },
    },
  }), [accentColor, fontSize])

  if (!content.trim()) {
    if (transparentBackground) return null

    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full"
        style={{
          height: height === "100%" ? "100%" : height,
        }}
      >
        <div className="dc:text-center text-dc-text-muted">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No content</div>
          <div className="dc:text-xs text-dc-text-secondary">Add markdown content in the chart configuration</div>
        </div>
      </div>
    )
  }

  // Build accent border styles
  const accentBorderStyle: React.CSSProperties = {}
  if (accentBorder !== 'none') {
    const borderProp = `border${accentBorder.charAt(0).toUpperCase() + accentBorder.slice(1)}` as 'borderLeft' | 'borderTop' | 'borderBottom'
    accentBorderStyle[borderProp] = `4px solid ${accentColor}`
    if (transparentBackground) {
      const paddingProp = `padding${accentBorder.charAt(0).toUpperCase() + accentBorder.slice(1)}` as 'paddingLeft' | 'paddingTop' | 'paddingBottom'
      if (accentBorder === 'left') accentBorderStyle[paddingProp] = '12px'
    }
  }

  return (
    <div
      className={`dc:w-full dc:overflow-auto ${transparentBackground ? '' : 'dc:p-4 '}${fontSizeClasses[fontSize] || 'dc:text-lg'} ${alignmentClasses[alignment] || 'dc:text-left'}`}
      style={{
        height: height === "100%" ? "100%" : height,
        ...accentBorderStyle
      }}
    >
      <Markdown options={markdownOptions}>
        {content}
      </Markdown>
    </div>
  )
})

export default MarkdownChart
