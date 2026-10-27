/**
 * Header (title + action toolbar) for DashboardPortletCard. Extracted to keep
 * the card component flat.
 */

import React, { type CSSProperties } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import type { PortletConfig } from '../../types.js'
import DebugModal from '../DebugModal.js'
import { getIcon } from '../../icons/registry.js'
import type { PortletDebugDataEntry } from '../../stores/dashboardStore.js'
import EditActionButtons, { ICON_STYLE, type CardIcons } from './EditActionButtons.js'
import DataFreshnessIndicator, { type DataFreshnessIndicatorProps } from './DataFreshnessIndicator.js'
import type { MaxAgeOptions } from '../../client/maxAge.js'


interface PortletCardHeaderProps {
  portlet: PortletConfig
  className: string
  headerStyle?: CSSProperties
  restHeaderProps: Record<string, unknown>
  headerOnClick?: (event: React.MouseEvent<HTMLDivElement>) => void
  editable: boolean
  isEditMode: boolean
  isInSelectionMode: boolean
  debugData?: PortletDebugDataEntry
  copyAvailable: boolean
  copySuccess: boolean
  xlsExportAvailable: boolean
  exportInProgress: boolean
  showCacheBustIndicator: boolean
  /** Labels of mapped dashboard date filters that cannot narrow this portlet */
  unreachableDateFilterLabels?: string[]
  icons: CardIcons
  /** Whether the portlet is fetching; the refresh icon spins meanwhile */
  isFetching?: boolean
  /** Freshness indicator state; when absent (refresh feature off) the cache icon shows instead */
  freshness?: DataFreshnessIndicatorProps
  /** Per-portlet refresh pause toggle; shown when the portlet refreshes on an interval */
  refreshPause?: { isPaused: boolean; isDashboardPaused: boolean; onToggle: () => void }
  onRefresh: (options?: MaxAgeOptions) => void
  onHoverRefreshChange: (hovering: boolean) => void
  onCopyToClipboard: (event: React.MouseEvent | React.TouchEvent) => void
  onExportXlsx: (event: React.MouseEvent | React.TouchEvent) => void
  onOpenFilterConfig: () => void
  onDuplicate: () => void
  onEdit: () => void
  onDelete: () => void
  /** Shows the Expand button next to Refresh when set */
  onExpand?: () => void
}

/** Suppresses drag/touch propagation on header action containers. */
const STOP_HANDLERS = {
  onMouseDown: (event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
  },
  onClick: (event: React.MouseEvent) => event.stopPropagation(),
  onTouchStart: (event: React.TouchEvent) => {
    event.stopPropagation()
    event.preventDefault()
  },
  onTouchEnd: (event: React.TouchEvent) => event.stopPropagation()
}

function CacheIndicator({ cachedAt }: { cachedAt: string }) {
  return (
    <span
      className="dc:p-1 text-dc-text-muted dc:opacity-40"
      title={`Cached ${Math.round((Date.now() - new Date(cachedAt).getTime()) / 1000)}s ago`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      </svg>
    </span>
  )
}

function UnreachableDateFilterIndicator({ labels }: { labels: string[] }) {
  const { t } = useTranslation()
  const WarningIcon = getIcon('warning')
  const message = labels.map(label => t('portlet.dateFilterNotApplied', { label })).join('\n')
  return (
    <span
      className="dc:p-1 text-dc-warning dc:shrink-0"
      title={message}
      aria-label={message}
      role="img"
      data-testid="portlet-date-filter-not-applied"
    >
      <WarningIcon style={ICON_STYLE} />
    </span>
  )
}

export default function PortletCardHeader(props: PortletCardHeaderProps) {
  const {
    portlet, className, headerStyle, restHeaderProps, headerOnClick,
    editable, isEditMode, isInSelectionMode, debugData,
    copyAvailable, copySuccess, xlsExportAvailable, exportInProgress, showCacheBustIndicator,
    unreachableDateFilterLabels, icons, isFetching = false, freshness, refreshPause, onRefresh, onHoverRefreshChange, onCopyToClipboard, onExportXlsx,
    onOpenFilterConfig, onDuplicate, onEdit, onDelete, onExpand
  } = props
  const { t } = useTranslation()

  const CameraIcon = getIcon('camera')
  const CheckIcon = getIcon('check')
  const DownloadIcon = getIcon('download')
  const MaximizeIcon = getIcon('maximize')
  const refreshTitle = isFetching
    ? t('dashboard.portlet.action.refreshing')
    : showCacheBustIndicator ? t('dashboard.portlet.action.refreshBypassCache') : t('dashboard.portlet.action.refreshTitle')
  const PauseIcon = getIcon('pause')
  const PlayIcon = getIcon('play')
  const refreshPauseLabel = !refreshPause
    ? undefined
    : refreshPause.isDashboardPaused
      ? t('dashboard.portlet.freshness.pausedTitle')
      : refreshPause.isPaused ? t('dashboard.portlet.action.resumeRefresh') : t('dashboard.portlet.action.pauseRefresh')

  return (
    <div
      className={className}
      style={headerStyle}
      onClick={(event) => { headerOnClick?.(event) }}
      {...restHeaderProps}
    >
      <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0">
        <h3 className="dc:font-semibold dc:text-sm text-dc-text dc:truncate">{portlet.title}</h3>
        {unreachableDateFilterLabels && unreachableDateFilterLabels.length > 0 && (
          <UnreachableDateFilterIndicator labels={unreachableDateFilterLabels} />
        )}
        {editable && isEditMode && debugData && (
          <div {...STOP_HANDLERS}>
            <DebugModal
              chartConfig={debugData.chartConfig}
              displayConfig={debugData.displayConfig}
              queryObject={debugData.queryObject}
              data={debugData.data}
              chartType={debugData.chartType}
              cacheInfo={debugData.cacheInfo as { hit: true; cachedAt: string; ttlMs: number; ttlRemainingMs: number } | undefined}
            />
          </div>
        )}
      </div>
      <div className="dc:flex dc:items-center dc:gap-1 dc:shrink-0 dc:ml-4 dc:-mr-2" {...STOP_HANDLERS}>
        {/* Freshness indicator when refresh is on; otherwise the cache icon on a cache hit */}
        {freshness
          ? <DataFreshnessIndicator {...freshness} />
          : debugData?.cacheInfo && <CacheIndicator cachedAt={debugData.cacheInfo.cachedAt} />}
        {refreshPause && !isInSelectionMode && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              refreshPause.onToggle()
            }}
            onTouchEnd={(event) => {
              event.stopPropagation()
              event.preventDefault()
              if (!refreshPause.isDashboardPaused) refreshPause.onToggle()
            }}
            disabled={refreshPause.isDashboardPaused}
            className={`dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:transition-colors ${
              refreshPause.isDashboardPaused ? 'dc:opacity-50 dc:cursor-default' : 'dc:cursor-pointer hover:bg-dc-surface-hover'
            }`}
            title={refreshPauseLabel}
            aria-label={refreshPauseLabel}
            aria-pressed={refreshPause.isPaused}
            data-testid="portlet-refresh-pause"
          >
            {refreshPause.isPaused ? <PlayIcon style={ICON_STYLE} /> : <PauseIcon style={ICON_STYLE} />}
          </button>
        )}
        <button
          onClick={(event) => {
            event.stopPropagation()
            onRefresh({ bustCache: event.shiftKey })
          }}
          onTouchEnd={(event) => {
            event.stopPropagation()
            event.preventDefault()
            onRefresh()
          }}
          onMouseEnter={() => onHoverRefreshChange(true)}
          onMouseLeave={() => onHoverRefreshChange(false)}
          disabled={isInSelectionMode}
          className={`dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:transition-colors ${
            isInSelectionMode
              ? 'dc:cursor-not-allowed dc:opacity-50 text-dc-text-secondary'
              : showCacheBustIndicator
                ? 'dc:cursor-pointer text-dc-warning bg-dc-warning-bg'
                : 'dc:cursor-pointer text-dc-text-secondary hover:bg-dc-surface-hover'
          }`}
          title={refreshTitle}
          aria-busy={isFetching}
          data-testid="portlet-refresh"
        >
          <icons.RefreshIcon style={ICON_STYLE} className={isFetching ? 'dc:animate-spin' : undefined} />
        </button>

        {/* Expand button - the host decides what it opens; never disabled, so
            a loading, failed, or empty card can still be expanded */}
        {onExpand && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onExpand()
            }}
            onTouchEnd={(event) => {
              event.stopPropagation()
              event.preventDefault()
              onExpand()
            }}
            className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer text-dc-text-secondary hover:bg-dc-surface-hover dc:transition-colors"
            title={t('dashboard.portlet.action.expand')}
            aria-label={t('dashboard.portlet.action.expand')}
          >
            <MaximizeIcon style={ICON_STYLE} />
          </button>
        )}

        {/* Copy to clipboard button - visible when thumbnail feature is enabled and capability is available */}
        {copyAvailable && !isInSelectionMode && (
          <button
            onClick={onCopyToClipboard}
            onTouchEnd={(event) => {
              event.preventDefault()
              onCopyToClipboard(event)
            }}
            className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
            title={copySuccess ? 'Copied!' : 'Copy chart to clipboard'}
          >
            {copySuccess ? <CheckIcon style={ICON_STYLE} /> : <CameraIcon style={ICON_STYLE} />}
          </button>
        )}

        {/* XLSX export button - visible when xlsExport feature is enabled, exceljs is installed, and portlet has data */}
        {xlsExportAvailable && !isInSelectionMode && debugData && (
          <button
            onClick={onExportXlsx}
            onTouchEnd={(event) => {
              event.preventDefault()
              onExportXlsx(event)
            }}
            disabled={exportInProgress}
            className={`dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:transition-colors ${
              exportInProgress
                ? 'dc:opacity-50 dc:cursor-wait text-dc-text-secondary'
                : 'text-dc-text-secondary dc:cursor-pointer dc:hover:bg-dc-surface-hover'
            }`}
            title={exportInProgress ? 'Exporting...' : 'Download data as XLSX'}
          >
            <DownloadIcon style={ICON_STYLE} />
          </button>
        )}

        {editable && isEditMode && !isInSelectionMode && (
          <EditActionButtons
            portlet={portlet}
            icons={icons}
            onOpenFilterConfig={onOpenFilterConfig}
            onDuplicate={onDuplicate}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  )
}
