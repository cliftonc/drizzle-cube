import React from 'react'

interface KpiCompactLayoutProps {
  /** Resolved measure label, rendered small and uppercase. */
  label: string
  /** Optional adornment next to the label (e.g. the incomplete-period info icon). */
  labelAdornment?: React.ReactNode
  /** Pre-formatted main value. */
  value: string
  /** Colour for the main value; falls back to the themed text colour. */
  valueColor?: string
  /** Unit rendered next to the value at a smaller size. */
  suffix?: string
  /**
   * Rendered immediately after the value — used for the coloured delta so the
   * headline number keeps its usual meaning.
   */
  valueAdornment?: React.ReactNode
  /** Quiet sub-line — a before/after pair, a target comparison, etc. */
  detail?: React.ReactNode
  /** Forwarded so callers can keep measuring the container if they need to. */
  containerRef?: React.Ref<HTMLDivElement>
}

/**
 * Dense KPI presentation shared by KpiNumber and KpiDelta.
 *
 * Unlike the default layout, nothing here scales with the container: the type
 * sizes are fixed so that a row of KPI portlets reads as a consistent metric
 * strip rather than a wall of differently-sized numbers.
 */
const KpiCompactLayout = React.memo(function KpiCompactLayout({
  label,
  labelAdornment,
  value,
  valueColor,
  suffix,
  valueAdornment,
  detail,
  containerRef
}: KpiCompactLayoutProps) {
  return (
    <div
      ref={containerRef}
      className="dc:flex dc:flex-col dc:justify-center dc:w-full dc:h-full dc:px-4 dc:py-3 dc:gap-1.5 dc:overflow-hidden"
      // Always fill the parent box. The `height` prop charts receive is a pixel
      // value that can exceed the visible panel, which would push this short
      // content below the fold once centred.
      style={{ height: '100%', minHeight: '80px' }}
    >
      {/* Matches the default KPI layout's label (bold, 14px, secondary) so
          compact and auto KPIs sitting on one dashboard read as a set. Only
          the alignment differs. */}
      <div
        className="dc:flex dc:items-center dc:gap-1 dc:font-bold text-dc-text-secondary"
        style={{ fontSize: '14px', lineHeight: 1.2 }}
      >
        <span className="dc:truncate">{label}</span>
        {labelAdornment}
      </div>

      <div className="dc:flex dc:items-baseline dc:gap-1.5">
        <span
          className="dc:font-semibold dc:leading-none dc:truncate"
          style={{ fontSize: '30px', color: valueColor || 'var(--dc-text)' }}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-dc-text-muted dc:truncate" style={{ fontSize: '14px' }}>
            {suffix}
          </span>
        )}
        {valueAdornment}
      </div>

      {detail && (
        <div className="text-dc-text-muted dc:truncate" style={{ fontSize: '12px', lineHeight: 1.4 }}>
          {detail}
        </div>
      )}
    </div>
  )
})

export default KpiCompactLayout
