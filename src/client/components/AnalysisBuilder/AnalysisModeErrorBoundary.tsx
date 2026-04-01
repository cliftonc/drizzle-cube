/**
 * AnalysisModeErrorBoundary Component (NEW - Phase 5)
 *
 * Error boundary specifically for mode switching in AnalysisBuilder.
 * Catches errors from adapter loading/validation and provides a recovery option.
 * This prevents a broken mode from crashing the entire AnalysisBuilder.
 */

import React, { Component, ReactNode } from 'react'
import { getIcon } from '../../icons'
import type { AnalysisType } from '../../types'
import { useTranslation } from '../../hooks/useTranslation'

const WarningIcon = getIcon('warning')
const RefreshIcon = getIcon('refresh')

interface Props {
  children: ReactNode
  /** Current analysis type (for error messages) */
  analysisType: AnalysisType
  /** Callback to switch to a safe mode (query) on error */
  onSwitchToSafeMode?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Functional wrapper that provides the `t` function to the class component.
 */
function ErrorBoundaryFallback({
  error,
  analysisType,
  onReset,
  onSwitchToSafeMode,
}: {
  error: Error | null
  analysisType: AnalysisType
  onReset: () => void
  onSwitchToSafeMode?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-6 dc:text-center bg-dc-surface">
      <div className="dc:h-10 dc:w-10 dc:mb-3 text-dc-warning">
        {WarningIcon && <WarningIcon className="dc:w-10 dc:h-10" />}
      </div>
      <h3 className="dc:text-base dc:font-semibold dc:mb-2 text-dc-text">
        {t('errorBoundary.modeError')}
      </h3>
      <p className="dc:text-sm text-dc-text-secondary dc:mb-3 dc:max-w-sm">
        {t('errorBoundary.modeErrorDescription', { mode: analysisType })}
      </p>

      {/* Error details (collapsible) */}
      <details className="dc:w-full dc:max-w-md dc:mb-4 dc:text-left">
        <summary className="dc:cursor-pointer dc:text-xs text-dc-text-muted hover:text-dc-text">
          {t('errorBoundary.showDetails')}
        </summary>
        <div className="dc:mt-2 dc:p-2 bg-dc-surface-secondary dc:rounded dc:text-xs dc:font-mono text-dc-text-secondary dc:overflow-auto dc:max-h-32">
          {error?.message || t('errorBoundary.unknownError')}
        </div>
      </details>

      <div className="dc:flex dc:gap-2">
        <button
          onClick={onReset}
          className="dc:px-3 dc:py-1.5 dc:border border-dc-border dc:rounded dc:text-sm text-dc-text hover:bg-dc-surface-hover dc:transition-colors dc:flex dc:items-center dc:gap-1"
        >
          {RefreshIcon && <RefreshIcon className="dc:w-4 dc:h-4" />}
          {t('errorBoundary.tryAgain')}
        </button>
        {onSwitchToSafeMode && (
          <button
            onClick={onSwitchToSafeMode}
            className="dc:px-3 dc:py-1.5 bg-dc-primary text-white dc:rounded dc:text-sm dc:hover:opacity-90 dc:transition-opacity"
          >
            {t('errorBoundary.switchToQuery')}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Error boundary for mode switching in AnalysisBuilder.
 * If an adapter throws during load/validate/save, this catches it
 * and offers to switch back to query mode.
 */
export class AnalysisModeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error })

    console.error(
      `[AnalysisModeErrorBoundary] Error in ${this.props.analysisType} mode:`,
      error,
      errorInfo
    )
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  handleSwitchToSafeMode = () => {
    this.handleReset()
    this.props.onSwitchToSafeMode?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          analysisType={this.props.analysisType}
          onReset={this.handleReset}
          onSwitchToSafeMode={this.props.onSwitchToSafeMode ? this.handleSwitchToSafeMode : undefined}
        />
      )
    }

    return this.props.children
  }
}

export default AnalysisModeErrorBoundary
