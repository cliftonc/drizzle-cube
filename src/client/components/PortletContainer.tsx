/**
 * Portlet Container Component
 * Simple wrapper for individual portlets
 */

import AnalyticsPortlet from './AnalyticsPortlet'
import type { PortletConfig } from '../types'

interface PortletContainerProps {
  portlet: PortletConfig
  editable?: boolean
  onEdit?: (portlet: PortletConfig) => void
  onDelete?: (portletId: string) => void
  onRefresh?: (portletId: string) => void
}

export default function PortletContainer({ 
  portlet, 
  editable = false,
  onEdit,
  onDelete,
  onRefresh
}: PortletContainerProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 flex-shrink-0 bg-gray-50 rounded-t-lg px-3 py-2 md:px-6 md:py-3">
        <h3 className="font-semibold text-sm truncate">{portlet.title}</h3>
        
        {editable && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onRefresh?.(portlet.id)}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
              title="Refresh"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => onEdit?.(portlet)}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
              title="Edit"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete?.(portlet.id)}
              className="p-1.5 hover:bg-red-100 rounded text-red-600"
              title="Delete"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-2 py-3 md:px-4 md:pt-6 md:pb-4 flex-1 min-h-0">
        <AnalyticsPortlet
          query={portlet.query}
          chartType={portlet.chartType}
          chartConfig={portlet.chartConfig}
          displayConfig={portlet.displayConfig}
          title={portlet.title}
          height="100%"
        />
      </div>
    </div>
  )
}