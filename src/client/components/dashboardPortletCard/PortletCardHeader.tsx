/**
 * Header (title + action toolbar) for DashboardPortletCard. Extracted to keep
 * the card component flat.
 */

import React, { type CSSProperties, type ComponentType } from 'react'
import type { PortletConfig } from '../../types.js'
import DebugModal from '../DebugModal.js'
import { getIcon } from '../../icons/registry.js'
import type { PortletDebugDataEntry } from '../../stores/dashboardStore.js'

const ICON_STYLE: CSSProperties = { width: '16px', height: '16px', color: 'currentColor' }

type IconComponent = ComponentType<{ className?: string; style?: CSSProperties }>

interface CardIcons {
  RefreshIcon: IconComponent
  EditIcon: IconComponent
  DeleteIcon: IconComponent
  CopyIcon: IconComponent
  FilterIcon: IconComponent
}

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
  icons: CardIcons
  onRefresh: (options?: { bustCache?: boolean }) => void
  onHoverRefreshChange: (hovering: boolean) => void
  onCopyToClipboard: (event: React.MouseEvent | React.TouchEvent) => void
  onExportXlsx: (event: React.MouseEvent | React.TouchEvent) => void
  onOpenFilterConfig: () => void
  onDuplicate: () => void
  onEdit: () => void
  onDelete: () => void
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

/** Edit-mode action buttons: filter config, duplicate, edit, delete. */
function EditActionButtons({
  portlet,
  icons,
  onOpenFilterConfig,
  onDuplicate,
  onEdit,
  onDelete
}: {
  portlet: PortletConfig
  icons: CardIcons
  onOpenFilterConfig: () => void
  onDuplicate: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const mappingCount = portlet.dashboardFilterMapping?.length ?? 0

  const stop = (handler: () => void) => (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation()
    if ('preventDefault' in event && event.type === 'touchend') event.preventDefault()
    handler()
  }

  return (
    <>
      <button
        onClick={stop(onOpenFilterConfig)}
        onTouchEnd={stop(onOpenFilterConfig)}
        className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors dc:relative"
        title={`Configure dashboard filters${mappingCount > 0 ? ` (${mappingCount} active)` : ''}`}
        style={{ color: mappingCount > 0 ? 'var(--dc-primary)' : 'var(--dc-text-secondary)' }}
      >
        <icons.FilterIcon style={ICON_STYLE} />
      </button>

      <button
        onClick={stop(onDuplicate)}
        onTouchEnd={stop(onDuplicate)}
        className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
        title="Duplicate portlet"
      >
        <icons.CopyIcon style={ICON_STYLE} />
      </button>
      <button
        onClick={stop(onEdit)}
        onTouchEnd={stop(onEdit)}
        className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
        title="Edit portlet"
      >
        <icons.EditIcon style={ICON_STYLE} />
      </button>
      <button
        onClick={stop(onDelete)}
        onTouchEnd={stop(onDelete)}
        className="dc:p-1 dc:mr-0.5 bg-transparent dc:border-none dc:rounded-sm dc:cursor-pointer hover:bg-dc-danger-bg text-dc-danger dc:transition-colors"
        title="Delete portlet"
      >
        <icons.DeleteIcon style={ICON_STYLE} />
      </button>
    </>
  )
}

export default function PortletCardHeader(props: PortletCardHeaderProps) {
  const {
    portlet, className, headerStyle, restHeaderProps, headerOnClick,
    editable, isEditMode, isInSelectionMode, debugData,
    copyAvailable, copySuccess, xlsExportAvailable, exportInProgress, showCacheBustIndicator,
    icons, onRefresh, onHoverRefreshChange, onCopyToClipboard, onExportXlsx,
    onOpenFilterConfig, onDuplicate, onEdit, onDelete
  } = props

  const CameraIcon = getIcon('camera')
  const CheckIcon = getIcon('check')
  const DownloadIcon = getIcon('download')

  return (
    <div
      className={className}
      style={headerStyle}
      onClick={(event) => { headerOnClick?.(event) }}
      {...restHeaderProps}
    >
      <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0">
        <h3 className="dc:font-semibold dc:text-sm text-dc-text dc:truncate">{portlet.title}</h3>
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
        {/* Cache indicator - show when result was served from cache */}
        {debugData?.cacheInfo && <CacheIndicator cachedAt={debugData.cacheInfo.cachedAt} />}
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
          title={showCacheBustIndicator ? 'Click to refresh and bypass cache' : 'Refresh portlet data (Shift+click to bypass cache)'}
        >
          <icons.RefreshIcon style={ICON_STYLE} />
        </button>

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
