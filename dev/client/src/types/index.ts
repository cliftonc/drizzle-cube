// Re-export types from drizzle-cube client
export type {
  PortletConfig,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
  DashboardConfig,
  CubeQuery
} from '@drizzle-cube/client'

// Import DashboardConfig for use in interfaces
import type { DashboardConfig } from '@drizzle-cube/client'

// Additional types for the React app
export interface AnalyticsPage {
  id: number
  name: string
  description?: string
  organisationId: number
  config: DashboardConfig
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAnalyticsPageRequest {
  name: string
  description?: string
  config: DashboardConfig
  order?: number
}

export interface UpdateAnalyticsPageRequest {
  name?: string
  description?: string
  config?: DashboardConfig
  order?: number
}

// Notebook types
export interface NotebookConfig {
  blocks: Array<{
    id: string
    type: 'portlet' | 'markdown'
    title?: string
    content?: string
    query?: string
    chartType?: string
    chartConfig?: Record<string, unknown>
    displayConfig?: Record<string, unknown>
  }>
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    toolCalls?: Array<{ name: string; status: string; result?: unknown }>
    timestamp: number
  }>
}

export interface Notebook {
  id: number
  name: string
  description?: string
  organisationId: number
  config: NotebookConfig | null
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateNotebookRequest {
  name: string
  description?: string
  config?: NotebookConfig
  order?: number
}

export interface UpdateNotebookRequest {
  name?: string
  description?: string
  config?: NotebookConfig
  order?: number
}