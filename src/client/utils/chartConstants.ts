// Default color palette for charts - used as fallback when no dashboard palette is specified
// These are now part of the 'default' palette in the unified color palette system
export const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
]

// Default gradient colors for continuous numeric scales - used as fallback
// These are now part of the 'default' palette in the unified color palette system
export const CHART_COLORS_GRADIENT = [
  '#440154', // dark purple
  '#414487', // purple-blue
  '#2a788e', // teal
  '#22a884', // green-teal  
  '#7ad151', // green
  '#fde725', // yellow
]

// Colors for positive/negative values
export const POSITIVE_COLOR = '#10b981' // green
export const NEGATIVE_COLOR = '#ef4444' // red

export const CHART_MARGINS = {
  top: 5,
  right: 30,
  left: 20,
  bottom: 5
}

export const RESPONSIVE_CHART_MARGINS = {
  top: 5,
  right: 30,
  left: 20,
  bottom: 60 // Extra space for rotated labels
}