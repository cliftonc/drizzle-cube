/**
 * Presentational state views for AnalyticsPortlet: config-required, lazy-load
 * placeholder, loading, query error, and no-data. Extracted to keep the main
 * component flat. No behaviour change.
 */

import { type ReactNode, type Ref } from 'react'
import LoadingIndicator from '../LoadingIndicator.js'
import { DrillBreadcrumb } from '../DrillBreadcrumb.js'
import { useTranslation } from '../../hooks/useTranslation.js'
import type { ChartType } from '../../types.js'
import type { DrillPathEntry } from '../../types/drill.js'

type Height = string | number

export function PortletConfigRequired({ inViewRef, height }: { inViewRef: Ref<HTMLDivElement>; height: Height }) {
  const { t } = useTranslation()
  return (
    <div ref={inViewRef} className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
      <div className="dc:text-center">
        <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('portlet.configRequired')}</div>
        <div className="dc:text-xs text-dc-text-secondary">{t('portlet.configRequiredHint')}</div>
      </div>
    </div>
  )
}

export function PortletLazyPlaceholder({ inViewRef, height }: { inViewRef: Ref<HTMLDivElement>; height: Height }) {
  return (
    <div ref={inViewRef} className="dc:w-full dc:h-full" style={{ height }}>
      <div className="dc:w-full dc:h-full dc:animate-pulse bg-dc-surface-secondary dc:rounded" style={{ minHeight: '100px' }} />
    </div>
  )
}

export function PortletLoading({ inViewRef, height, loadingComponent }: { inViewRef: Ref<HTMLDivElement>; height: Height; loadingComponent?: ReactNode }) {
  return (
    <div ref={inViewRef} className="dc:flex dc:items-center dc:justify-center dc:w-full" style={{ height }}>
      {loadingComponent || <LoadingIndicator size="md" />}
    </div>
  )
}

interface PortletErrorProps {
  inViewRef: Ref<HTMLDivElement>
  height: Height
  error: { message?: string; toString: () => string }
  onRetry: () => void
  activeQuery: unknown
  query: string
  chartType: ChartType
  chartConfig: unknown
  displayConfig: unknown
}

export function PortletError({ inViewRef, height, error, onRetry, activeQuery, query, chartType, chartConfig, displayConfig }: PortletErrorProps) {
  const { t } = useTranslation()
  return (
    <div ref={inViewRef} className="dc:p-4 dc:border dc:rounded-sm" style={{ height, borderColor: 'var(--dc-border)', backgroundColor: 'var(--dc-surface)' }}>
      <div className="dc:mb-2">
        <div className="dc:flex dc:items-center dc:justify-between">
          <span className="dc:font-medium dc:text-sm" style={{ color: 'var(--dc-text)' }}>{`⚠️ ${t('portlet.queryError')}`}</span>
          <button
            onClick={onRetry}
            className="dc:px-2 dc:py-1 text-white dc:rounded-sm dc:text-xs"
            style={{ backgroundColor: 'var(--dc-primary)' }}
          >
            {t('common.actions.retry')}
          </button>
        </div>
      </div>

      <div className="dc:mb-3">
        <div className="dc:text-xs dc:p-2 dc:rounded-sm dc:border" style={{ color: 'var(--dc-text-secondary)', backgroundColor: 'var(--dc-surface)', borderColor: 'var(--dc-border)' }}>
          {error.message || error.toString()}
        </div>
      </div>

      <div className="dc:space-y-2 dc:text-xs">
        <details>
          <summary className="dc:cursor-pointer dc:font-medium" style={{ color: 'var(--dc-text-secondary)' }}>{t('portlet.queryWithFilters')}</summary>
          <pre className="dc:mt-1 dc:p-2 dc:rounded-sm dc:text-xs dc:overflow-auto dc:max-h-20" style={{ backgroundColor: 'rgba(var(--dc-primary-rgb), 0.1)' }}>
            {activeQuery ? JSON.stringify(activeQuery, null, 2) : query}
          </pre>
        </details>

        <details>
          <summary className="dc:cursor-pointer dc:font-medium" style={{ color: 'var(--dc-text-secondary)' }}>{t('portlet.chartConfig')}</summary>
          <pre className="dc:mt-1 dc:p-2 dc:rounded-sm dc:text-xs dc:overflow-auto dc:max-h-20" style={{ backgroundColor: 'rgba(var(--dc-primary-rgb), 0.05)' }}>
            {JSON.stringify({ chartType, chartConfig, displayConfig }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}

interface PortletNoDataProps {
  inViewRef: Ref<HTMLDivElement>
  height: Height
  drillPath: DrillPathEntry[]
  onNavigateBack: () => void
  onNavigateToLevel: (index: number) => void
}

export function PortletNoData({ inViewRef, height, drillPath, onNavigateBack, onNavigateToLevel }: PortletNoDataProps) {
  const isDrilledState = drillPath.length > 0
  return (
    <div ref={inViewRef} className="dc:flex dc:flex-col dc:w-full" style={{ height }}>
      {/* Show breadcrumb when drilling even if no data */}
      {isDrilledState && (
        <div className="dc:mb-2 dc:flex-shrink-0">
          <DrillBreadcrumb
            path={drillPath}
            onNavigate={onNavigateBack}
            onLevelClick={onNavigateToLevel}
          />
        </div>
      )}
      <div className="dc:flex dc:items-center dc:justify-center dc:flex-1 text-dc-text-muted">
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No data available</div>
          <div className="dc:text-xs text-dc-text-secondary">
            {isDrilledState
              ? 'No data points to display for the current filter'
              : 'Invalid query or no results'
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export type PortletStateKind = 'config-required' | 'lazy-placeholder' | 'loading' | 'error'

interface PortletStateViewProps {
  kind: PortletStateKind | 'no-data'
  inViewRef: Ref<HTMLDivElement>
  height: Height
  loadingComponent?: ReactNode
  // error
  error: { message?: string; toString: () => string } | null
  onRetry: () => void
  activeQuery: unknown
  query: string
  chartType: ChartType
  chartConfig: unknown
  displayConfig: unknown
  // no-data
  drillPath: DrillPathEntry[]
  onNavigateBack: () => void
  onNavigateToLevel: (index: number) => void
}

/**
 * Renders the appropriate non-chart state view for the given render kind.
 */
export function PortletStateView(props: PortletStateViewProps) {
  const { kind, inViewRef, height } = props

  if (kind === 'config-required') {
    return <PortletConfigRequired inViewRef={inViewRef} height={height} />
  }
  if (kind === 'lazy-placeholder') {
    return <PortletLazyPlaceholder inViewRef={inViewRef} height={height} />
  }
  if (kind === 'loading') {
    return <PortletLoading inViewRef={inViewRef} height={height} loadingComponent={props.loadingComponent} />
  }
  if (kind === 'error') {
    return (
      <PortletError
        inViewRef={inViewRef}
        height={height}
        error={props.error ?? { toString: () => '' }}
        onRetry={props.onRetry}
        activeQuery={props.activeQuery}
        query={props.query}
        chartType={props.chartType}
        chartConfig={props.chartConfig}
        displayConfig={props.displayConfig}
      />
    )
  }
  return (
    <PortletNoData
      inViewRef={inViewRef}
      height={height}
      drillPath={props.drillPath}
      onNavigateBack={props.onNavigateBack}
      onNavigateToLevel={props.onNavigateToLevel}
    />
  )
}
