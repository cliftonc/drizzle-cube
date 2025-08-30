import React, { Component, ReactNode } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  portletTitle?: string
  portletConfig?: any
  cubeQuery?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

export default class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state with error details
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || null
    })

    // Log the error for debugging
    console.error('Chart Error Boundary caught a rendering error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error display
      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center border-2 border-dashed border-red-300 rounded-lg bg-red-50">
          <div className="h-12 w-12 text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            {this.props.portletTitle ? `Rendering Error in ${this.props.portletTitle}` : 'Chart Rendering Error'}
          </h3>
          <p className="text-sm text-gray-600 mb-4 max-w-md">
            There was an error rendering this chart component. This is different from query errors. The error details are shown below.
          </p>
          
          {/* Error details */}
          <div className="w-full max-w-2xl mb-4">
            <div className="bg-gray-100 rounded-lg p-3 text-left">
              <div className="text-xs font-mono text-red-600 mb-2">
                <strong>Error:</strong> {this.state.error?.message}
              </div>
              {this.state.error?.name && (
                <div className="text-xs font-mono text-gray-600 mb-2">
                  <strong>Type:</strong> {this.state.error.name}
                </div>
              )}
              
              {/* Portlet Config Debug Info */}
              {this.props.portletConfig && (
                <details className="text-xs font-mono text-gray-600 mb-2">
                  <summary className="cursor-pointer">Portlet Configuration</summary>
                  <pre className="mt-2 whitespace-pre-wrap bg-blue-50 p-2 rounded-sm overflow-auto max-h-32">
                    {JSON.stringify(this.props.portletConfig, null, 2)}
                  </pre>
                </details>
              )}
              
              {/* Cube Query Debug Info */}
              {this.props.cubeQuery && (
                <details className="text-xs font-mono text-gray-600 mb-2">
                  <summary className="cursor-pointer">Cube Query</summary>
                  <pre className="mt-2 whitespace-pre-wrap bg-green-50 p-2 rounded-sm overflow-auto max-h-32">
                    {typeof this.props.cubeQuery === 'string' 
                      ? JSON.stringify(JSON.parse(this.props.cubeQuery), null, 2)
                      : JSON.stringify(this.props.cubeQuery, null, 2)
                    }
                  </pre>
                </details>
              )}
              
              {this.state.errorInfo && (
                <details className="text-xs font-mono text-gray-600">
                  <summary className="cursor-pointer">Component Stack</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.errorInfo}</pre>
                </details>
              )}
            </div>
          </div>

          {/* Reset button */}
          <button
            onClick={this.handleReset}
            className="px-3 py-1 bg-blue-500 text-white rounded-sm text-sm hover:bg-blue-600"
          >
            <ArrowPathIcon style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}