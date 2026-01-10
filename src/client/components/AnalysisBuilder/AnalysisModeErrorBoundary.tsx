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
  errorInfo: string | null
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
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || null,
    })

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
      errorInfo: null,
    })
  }

  handleSwitchToSafeMode = () => {
    this.handleReset()
    this.props.onSwitchToSafeMode?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center bg-dc-surface">
          <div className="h-10 w-10 mb-3 text-dc-warning">
            {WarningIcon && <WarningIcon className="w-10 h-10" />}
          </div>
          <h3 className="text-base font-semibold mb-2 text-dc-text">
            Mode Error
          </h3>
          <p className="text-sm text-dc-text-secondary mb-3 max-w-sm">
            There was a problem with the <strong>{this.props.analysisType}</strong> mode.
            This might be due to invalid configuration data.
          </p>

          {/* Error details (collapsible) */}
          <details className="w-full max-w-md mb-4 text-left">
            <summary className="cursor-pointer text-xs text-dc-text-muted hover:text-dc-text">
              Show error details
            </summary>
            <div className="mt-2 p-2 bg-dc-surface-secondary rounded text-xs font-mono text-dc-text-secondary overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </div>
          </details>

          <div className="flex gap-2">
            <button
              onClick={this.handleReset}
              className="px-3 py-1.5 border border-dc-border rounded text-sm text-dc-text hover:bg-dc-surface-hover transition-colors flex items-center gap-1"
            >
              {RefreshIcon && <RefreshIcon className="w-4 h-4" />}
              Try Again
            </button>
            {this.props.onSwitchToSafeMode && (
              <button
                onClick={this.handleSwitchToSafeMode}
                className="px-3 py-1.5 bg-dc-primary text-white rounded text-sm hover:opacity-90 transition-opacity"
              >
                Switch to Query Mode
              </button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AnalysisModeErrorBoundary
