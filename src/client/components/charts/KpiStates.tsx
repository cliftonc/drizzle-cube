import React from 'react'

type KpiStateVariant = 'muted' | 'danger' | 'warning'

const VARIANT_STYLE: Record<KpiStateVariant, React.CSSProperties> = {
  muted: {},
  danger: {
    backgroundColor: 'var(--dc-danger-bg)',
    color: 'var(--dc-danger)',
    borderColor: 'var(--dc-danger-border)'
  },
  warning: {
    backgroundColor: 'var(--dc-warning-bg)',
    color: 'var(--dc-warning)',
    borderColor: 'var(--dc-warning-border)'
  }
}

/** Resolve the shared `height`/`minHeight` style used by every KPI card state. */
export function kpiHeightStyle(height: string | number): React.CSSProperties {
  return {
    height: height === '100%' ? '100%' : height,
    minHeight: height === '100%' ? '200px' : undefined
  }
}

/**
 * Centred KPI state card (no-data / config-error / insufficient-data).
 *
 * Owns the duplicated centred flex wrapper shared by KpiNumber and KpiDelta.
 * Callers supply already-resolved title/hint text (i18n resolved at the call
 * site) plus an optional colour variant and extra children.
 */
export function KpiCenteredState({
  height,
  title,
  hint,
  variant = 'muted',
  children
}: {
  height: string | number
  title: React.ReactNode
  hint?: React.ReactNode
  variant?: KpiStateVariant
  children?: React.ReactNode
}) {
  return (
    <div
      className="dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full"
      style={{ ...kpiHeightStyle(height), ...VARIANT_STYLE[variant] }}
    >
      <div className={`dc:text-center${variant === 'muted' ? ' text-dc-text-muted' : ''}`}>
        <div className="dc:text-sm dc:font-semibold dc:mb-1">{title}</div>
        {hint != null && (
          <div className={`dc:text-xs${variant === 'muted' ? ' text-dc-text-secondary' : ''}`}>{hint}</div>
        )}
        {children}
      </div>
    </div>
  )
}
