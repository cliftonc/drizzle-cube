/**
 * AnalysisResultsHeader
 *
 * Presentational header for AnalysisResultsPanel: the status / row-count line,
 * the toolbar of action buttons (display limit, AI, palette, share, refresh,
 * clear, schema, debug) and the large-dataset performance warning. Extracted to
 * keep the panel's renderHeader flat. Behaviour and markup are identical to the
 * previous inline rendering.
 *
 * Props are grouped into cohesive named slices instead of a flat bag, and each
 * sub-component receives only the slice it needs:
 *   - `summary`  → results state / row-count line + debug-error indicator
 *   - `toolbar`  → action handlers and their transient state
 *   - `display`  → view / visibility flags driving which controls render
 */

import { getIcon } from '../../icons'
import ColorPaletteSelector from '../ColorPaletteSelector'
import { useTranslation } from '../../hooks/useTranslation'

const SuccessIcon = getIcon('success')
const ErrorIcon = getIcon('error')
const WarningIcon = getIcon('warning')
const CodeIcon = getIcon('codeBracket')
const ShareIcon = getIcon('share')
const CheckIcon = getIcon('check')
const TrashIcon = getIcon('delete')
const SparklesIcon = getIcon('sparkles')
const RefreshIcon = getIcon('arrowPath')
const SchemaGraphIcon = getIcon('schemaGraph')

type Row = Record<string, unknown>

/** Results state + row counts that drive the status line, warning and error dot. */
export interface ResultsSummary {
  executionResults: Row[] | null | undefined
  executionStatus: string
  totalRowCount: number | null
  resultsStale: boolean
  executionError: unknown
  debugDataPerQuery: Array<{ error?: unknown }>
}

/** Action handlers and their transient state for the toolbar buttons. */
export interface ResultsToolbarActions {
  displayLimit: number
  onDisplayLimitChange?: (limit: number) => void
  isAIOpen?: boolean
  onAIToggle?: () => void
  onColorPaletteChange?: (palette: string) => void
  currentPaletteName?: string
  onShareClick?: () => void
  shareButtonState: string
  canShare: boolean
  onRefreshClick?: (opts: { bustCache: boolean }) => void
  canRefresh: boolean
  isRefreshing: boolean
  showCacheBustIndicator: boolean
  setIsHoveringRefresh: (v: boolean) => void
  onClearClick?: () => void
  canClear: boolean
  setIsClearConfirmOpen: (v: boolean) => void
  setShowDebug: (v: boolean) => void
  setShowSchema: (v: boolean) => void
}

/** View / visibility flags deciding which controls render. */
export interface ResultsDisplayFlags {
  activeView: string
  showDebug: boolean
  showSchema: boolean
  enableAI?: boolean
  isFunnelMode: boolean
  showSchemaDiagram: boolean
}

export interface ResultsHeaderProps {
  summary: ResultsSummary
  toolbar: ResultsToolbarActions
  display: ResultsDisplayFlags
}

function ResultsHeaderStatus({
  summary,
  hasResults,
}: {
  summary: ResultsSummary
  hasResults: boolean
}) {
  const { t } = useTranslation()
  const { executionResults, executionStatus, totalRowCount, resultsStale } = summary
  return (
    <div className="dc:flex dc:items-center">
      {executionStatus === 'refreshing' ? (
        <div
          className="dc:w-4 dc:h-4 dc:mr-2 dc:rounded-full dc:border-b-2 dc:animate-spin"
          style={{ borderBottomColor: 'var(--dc-primary)' }}
        />
      ) : hasResults ? (
        <SuccessIcon className="dc:w-4 dc:h-4 text-dc-success dc:mr-2" />
      ) : executionStatus === 'error' ? (
        <ErrorIcon className="dc:w-4 dc:h-4 text-dc-error dc:mr-2" />
      ) : (
        <WarningIcon className="dc:w-4 dc:h-4 text-dc-text-muted dc:mr-2" />
      )}
      <span className="dc:text-sm text-dc-text-secondary">
        {hasResults ? (
          <>
            {executionResults!.length} {executionResults!.length !== 1 ? t('results.header.rows') : t('results.header.row')}
            {totalRowCount !== null && totalRowCount > executionResults!.length && (
              <span className="text-dc-text-muted"> of {totalRowCount.toLocaleString()}</span>
            )}
            {resultsStale && (
              <span className="text-dc-warning dc:ml-2">• {t('results.header.stale')}</span>
            )}
          </>
        ) : executionStatus === 'error' ? (
          t('results.header.failed')
        ) : executionStatus === 'loading' ? (
          t('results.header.executing')
        ) : (
          t('results.header.noResults')
        )}
      </span>
    </div>
  )
}

function ShareButton({
  onShareClick,
  shareButtonState,
  canShare,
}: Pick<ResultsToolbarActions, 'onShareClick' | 'shareButtonState' | 'canShare'>) {
  const { t } = useTranslation()
  if (!onShareClick) return null
  return (
    <button
      onClick={onShareClick}
      className={`dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded dc:transition-colors ${
        shareButtonState === 'idle' && canShare
          ? 'text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg dc:border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg'
          : shareButtonState !== 'idle'
          ? 'text-dc-success dark:text-dc-success bg-dc-success-bg dark:bg-dc-success-bg dc:border border-dc-success dark:border-dc-success'
          : 'text-dc-text-muted bg-dc-surface-secondary dc:border border-dc-border dc:cursor-not-allowed'
      }`}
      title={shareButtonState === 'idle' ? 'Share this analysis' : 'Link copied!'}
      disabled={!canShare || shareButtonState !== 'idle'}
    >
      {shareButtonState === 'idle' ? (
        <>
          <ShareIcon className="dc:w-3 dc:h-3" />
          <span className="dc:hidden dc:sm:inline">{t('common.actions.share')}</span>
        </>
      ) : shareButtonState === 'copied' ? (
        <>
          <CheckIcon className="dc:w-3 dc:h-3" />
          <span className="dc:hidden dc:sm:inline">{t('results.share.copied')}</span>
        </>
      ) : (
        <>
          <CheckIcon className="dc:w-3 dc:h-3" />
          <span className="dc:hidden dc:sm:inline">{t('results.share.copied')}</span>
          <span className="dc:hidden dc:lg:inline dc:text-[10px] dc:opacity-75">{t('results.share.noChart')}</span>
        </>
      )}
    </button>
  )
}

function RefreshButton({
  onRefreshClick,
  canRefresh,
  isRefreshing,
  showCacheBustIndicator,
  setIsHoveringRefresh,
}: Pick<ResultsToolbarActions, 'onRefreshClick' | 'canRefresh' | 'isRefreshing' | 'showCacheBustIndicator' | 'setIsHoveringRefresh'>) {
  if (!onRefreshClick || !canRefresh) return null
  return (
    <button
      onClick={(e) => onRefreshClick({ bustCache: e.shiftKey })}
      onMouseEnter={() => setIsHoveringRefresh(true)}
      onMouseLeave={() => setIsHoveringRefresh(false)}
      disabled={isRefreshing}
      className={`dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded dc:transition-colors ${
        isRefreshing
          ? 'text-dc-text-muted bg-dc-surface-secondary dc:border border-dc-border dc:cursor-wait'
          : showCacheBustIndicator
            ? 'text-dc-warning bg-dc-warning-bg dc:border border-dc-warning dc:font-semibold'
            : 'text-dc-accent bg-dc-accent-bg dc:border border-dc-accent hover:bg-dc-accent-bg'
      }`}
      title={isRefreshing ? 'Refreshing...' : showCacheBustIndicator ? 'Click to refresh and bypass cache' : 'Refresh data (Shift+click to bypass cache)'}
    >
      <RefreshIcon className={`dc:w-3 dc:h-3 ${isRefreshing ? 'dc:animate-spin' : ''}`} />
      <span className="dc:hidden dc:sm:inline">{isRefreshing ? 'Refreshing' : 'Refresh'}</span>
    </button>
  )
}

function ResultsHeaderToolbar({
  summary,
  toolbar,
  display,
  hasResults,
}: ResultsHeaderProps & { hasResults: boolean }) {
  const { t } = useTranslation()
  const {
    displayLimit,
    onDisplayLimitChange,
    isAIOpen,
    onAIToggle,
    onColorPaletteChange,
    currentPaletteName,
    onClearClick,
    canClear,
    setIsClearConfirmOpen,
    setShowDebug,
    setShowSchema,
  } = toolbar
  const { activeView, showDebug, showSchema, enableAI, isFunnelMode, showSchemaDiagram } = display
  const { executionError, debugDataPerQuery } = summary

  return (
    <div className="dc:flex dc:items-center dc:gap-2">
      {/* Display Limit (only for table view) */}
      {hasResults && activeView === 'table' && !showDebug && onDisplayLimitChange && (
        <select
          value={displayLimit}
          onChange={(e) => onDisplayLimitChange(Number(e.target.value))}
          className="dc:text-xs dc:border border-dc-border dc:rounded dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
        >
          <option value={50}>50 {t('results.header.rows')}</option>
          <option value={100}>100 {t('results.header.rows')}</option>
          <option value={250}>250 {t('results.header.rows')}</option>
          <option value={500}>500 {t('results.header.rows')}</option>
        </select>
      )}

      {/* AI Button - positioned before palette selector */}
      {enableAI && onAIToggle && (
        <button
          onClick={onAIToggle}
          className={`dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded dc:transition-colors ${
            isAIOpen
              ? 'text-white bg-dc-accent dc:border border-dc-accent'
              : 'text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg dc:border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg'
          }`}
          title={isAIOpen ? 'Close AI assistant' : 'Analyse with AI'}
        >
          <SparklesIcon className="dc:w-3 dc:h-3" />
          <span className="dc:hidden dc:sm:inline">{t('results.ai.button')}</span>
        </button>
      )}

      {/* Color Palette Selector (only when callback is provided, i.e., standalone mode) */}
      {onColorPaletteChange && hasResults && (
        <ColorPaletteSelector
          currentPalette={currentPaletteName || 'default'}
          onPaletteChange={onColorPaletteChange}
        />
      )}

      {/* Share Button */}
      <ShareButton
        onShareClick={toolbar.onShareClick}
        shareButtonState={toolbar.shareButtonState}
        canShare={toolbar.canShare}
      />

      {/* Refresh Button - Shift+click bypasses cache */}
      <RefreshButton
        onRefreshClick={toolbar.onRefreshClick}
        canRefresh={toolbar.canRefresh}
        isRefreshing={toolbar.isRefreshing}
        showCacheBustIndicator={toolbar.showCacheBustIndicator}
        setIsHoveringRefresh={toolbar.setIsHoveringRefresh}
      />

      {/* Clear Button */}
      {onClearClick && canClear && (
        <button
          onClick={() => setIsClearConfirmOpen(true)}
          className="dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium text-dc-text-secondary hover:text-dc-text bg-dc-surface hover:bg-dc-surface-hover dc:border border-dc-border dc:rounded dc:transition-colors"
          title={isFunnelMode ? 'Clear funnel' : 'Clear all query data'}
        >
          <TrashIcon className="dc:w-3 dc:h-3" />
          <span className="dc:hidden dc:sm:inline">{t('common.actions.clear')}</span>
        </button>
      )}

      {/* Schema Visualization Toggle Button */}
      {showSchemaDiagram && (
        <button
          onClick={() => {
            setShowSchema(!showSchema)
            if (!showSchema) setShowDebug(false)
          }}
          className={`dc:p-1.5 dc:rounded dc:transition-colors dc:relative ${
            showSchema
              ? 'bg-dc-primary text-white'
              : 'text-dc-text-secondary hover:text-dc-text hover:bg-dc-surface-hover'
          }`}
          title={showSchema ? 'Hide schema diagram' : 'Show schema diagram'}
        >
          <SchemaGraphIcon className="dc:w-4 dc:h-4" />
        </button>
      )}

      {/* Debug Toggle Button */}
      <button
        onClick={() => {
          setShowDebug(!showDebug)
          if (!showDebug) setShowSchema(false)
        }}
        className={`dc:p-1.5 dc:rounded dc:transition-colors dc:relative ${
          showDebug
            ? 'bg-dc-primary text-white'
            : 'text-dc-text-secondary hover:text-dc-text hover:bg-dc-surface-hover'
        }`}
        title={showDebug ? 'Hide debug info' : 'Show debug info'}
      >
        <CodeIcon className="dc:w-4 dc:h-4" />
        {/* Error indicator dot - show if ANY query has an error */}
        {(executionError || debugDataPerQuery.some(d => d.error)) && !showDebug && (
          <span className="dc:absolute dc:-top-0.5 dc:-right-0.5 dc:w-2 dc:h-2 bg-dc-danger-bg0 dc:rounded-full" />
        )}
      </button>
    </div>
  )
}

export default function ResultsHeader({ summary, toolbar, display }: ResultsHeaderProps) {
  const { t } = useTranslation()
  const { executionResults, totalRowCount } = summary
  const hasResults = !!executionResults && executionResults.length > 0

  return (
    <div className="dc:px-4 dc:py-2 dc:border-b border-dc-border bg-dc-surface-secondary dc:flex-shrink-0">
      <div className="dc:flex dc:items-center dc:justify-between">
        {/* Left side: Status and row count */}
        <ResultsHeaderStatus summary={summary} hasResults={hasResults} />

        {/* Right side: Display limit (table only) and Debug toggle */}
        <ResultsHeaderToolbar summary={summary} toolbar={toolbar} display={display} hasResults={hasResults} />
      </div>

      {/* Performance Warning */}
      {hasResults && totalRowCount !== null && totalRowCount > 1000 && (
        <div className="dc:mt-2 bg-dc-warning-bg dc:border border-dc-warning dc:rounded-lg dc:p-2 dc:flex dc:items-start">
          <WarningIcon className="dc:w-4 dc:h-4 text-dc-warning dc:mr-2 dc:shrink-0 dc:mt-0.5" />
          <div className="dc:text-xs text-dc-warning">
            <span className="dc:font-semibold">{t('results.warning.largeDataset')}</span> {totalRowCount.toLocaleString()} {t('results.header.rows')}.
            {t('results.warning.filterHint')}
          </div>
        </div>
      )}
    </div>
  )
}
