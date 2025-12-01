/**
 * Utility functions for drizzle-cube client
 */

import type { PortletConfig, DashboardConfig } from '../types'

// Re-export chart utilities
export * from './chartUtils'
export * from './chartConstants'
export * from './measureIcons'
export * from './periodUtils'

/**
 * Create a dashboard layout from portlet configurations
 */
export function createDashboardLayout(portlets: PortletConfig[]): DashboardConfig {
  const layouts = generateResponsiveLayouts(portlets)
  
  return {
    portlets,
    layouts
  }
}

/**
 * Generate responsive layouts for different breakpoints
 */
export function generateResponsiveLayouts(portlets: PortletConfig[]) {
  const gridLayout = portlets.map(portlet => ({
    i: portlet.id,
    x: portlet.x,
    y: portlet.y,
    w: portlet.w,
    h: portlet.h,
    minW: 3,
    minH: 3
  }))

  return {
    lg: gridLayout,
    md: gridLayout.map(item => ({ ...item, w: Math.min(item.w, 8) })),
    sm: gridLayout.map(item => ({ ...item, w: Math.min(item.w, 6) })),
    xs: gridLayout.map(item => ({ ...item, w: Math.min(item.w, 4) })),
    xxs: gridLayout.map(item => ({ ...item, w: 2 }))
  }
}

/**
 * Format chart data for display
 */
export function formatChartData(data: any[], options: {
  formatNumbers?: boolean
  precision?: number
} = {}): any[] {
  const { formatNumbers = true, precision = 2 } = options

  if (!formatNumbers) return data

  return data.map(row => {
    const formattedRow: any = {}
    
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'number') {
        formattedRow[key] = Number(value.toFixed(precision))
      } else {
        formattedRow[key] = value
      }
    }
    
    return formattedRow
  })
}

/**
 * Generate a unique ID for new portlets
 */
export function generatePortletId(): string {
  return `portlet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Find the next available position in a grid
 */
export function findNextPosition(existingPortlets: PortletConfig[], _w: number = 6, _h: number = 4): { x: number; y: number } {
  if (existingPortlets.length === 0) {
    return { x: 0, y: 0 }
  }

  // Find the maximum Y position and height
  const maxY = Math.max(...existingPortlets.map(p => p.y + p.h))
  
  return { x: 0, y: maxY }
}

/**
 * Validate a cube query JSON string
 */
export function validateCubeQuery(queryString: string): { valid: boolean; error?: string; query?: any } {
  try {
    const query = JSON.parse(queryString)
    
    // Basic validation
    if (typeof query !== 'object' || query === null) {
      return { valid: false, error: 'Query must be a JSON object' }
    }

    // Check for required fields
    if (!query.measures && !query.dimensions) {
      return { valid: false, error: 'Query must have at least measures or dimensions' }
    }

    return { valid: true, query }
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' }
  }
}

/**
 * Create a sample portlet configuration
 */
export function createSamplePortlet(): Omit<PortletConfig, 'id'> {
  return {
    title: 'Sample Chart',
    query: JSON.stringify({
      measures: ['count'],
      dimensions: ['category']
    }, null, 2),
    chartType: 'bar',
    chartConfig: {
      x: 'category',
      y: ['count']
    },
    displayConfig: {
      showLegend: true,
      showGrid: true,
      showTooltip: true
    },
    w: 6,
    h: 4,
    x: 0,
    y: 0
  }
}