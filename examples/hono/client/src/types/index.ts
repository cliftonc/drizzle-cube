// Re-export types from drizzle-cube client
export type {
  PortletConfig,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
  DashboardConfig,
  CubeQuery
} from 'drizzle-cube/client'

// Import DashboardConfig for use in interfaces
import type { DashboardConfig } from 'drizzle-cube/client'

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