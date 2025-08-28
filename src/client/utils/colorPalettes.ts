/**
 * Unified Color Palette System
 * Each palette contains coordinated series and gradient colors that work well together
 */

export interface ColorPalette {
  name: string
  label: string
  colors: string[]      // For series-based charts (bar, line, pie, area, scatter, radar, etc.)
  gradient: string[]    // For gradient-based charts (bubble, activity grid)
}

// Predefined color palettes with visually coordinated series and gradient colors
export const COLOR_PALETTES: ColorPalette[] = [
  {
    name: 'default',
    label: 'Default',
    colors: [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // yellow
      '#ef4444', // red
      '#8b5cf6', // purple
      '#f97316', // orange
      '#06b6d4', // cyan
      '#84cc16', // lime
    ],
    gradient: [
      '#440154', // dark purple
      '#414487', // purple-blue
      '#2a788e', // teal
      '#22a884', // green-teal  
      '#7ad151', // green
      '#fde725', // yellow
    ]
  },
  {
    name: 'ocean',
    label: 'Ocean',
    colors: [
      '#1e3a8a', // deep blue
      '#1e40af', // blue
      '#2563eb', // bright blue
      '#3b82f6', // light blue
      '#06b6d4', // cyan
      '#0891b2', // dark cyan
      '#0e7490', // teal
      '#0f766e', // dark teal
    ],
    gradient: [
      '#0c4a6e', // very dark blue
      '#075985', // dark blue
      '#0369a1', // medium blue
      '#0284c7', // bright blue
      '#0ea5e9', // light blue
      '#38bdf8', // cyan blue
    ]
  },
  {
    name: 'sunset',
    label: 'Sunset',
    colors: [
      '#dc2626', // red
      '#ea580c', // orange-red
      '#f59e0b', // orange
      '#eab308', // yellow-orange
      '#d97706', // amber
      '#b45309', // dark amber
      '#92400e', // brown
      '#7c2d12', // dark brown
    ],
    gradient: [
      '#7c2d12', // dark brown
      '#92400e', // brown
      '#b45309', // dark amber
      '#d97706', // amber
      '#f59e0b', // orange
      '#fbbf24', // light orange
    ]
  },
  {
    name: 'forest',
    label: 'Forest',
    colors: [
      '#166534', // dark green
      '#15803d', // green
      '#16a34a', // bright green
      '#22c55e', // light green
      '#4ade80', // lighter green
      '#65a30d', // lime green
      '#84cc16', // lime
      '#a3e635', // light lime
    ],
    gradient: [
      '#14532d', // very dark green
      '#166534', // dark green
      '#15803d', // green
      '#16a34a', // bright green
      '#22c55e', // light green
      '#4ade80', // lighter green
    ]
  },
  {
    name: 'purple',
    label: 'Purple',
    colors: [
      '#581c87', // dark purple
      '#7c3aed', // purple
      '#8b5cf6', // bright purple
      '#a855f7', // light purple
      '#c084fc', // lighter purple
      '#e879f9', // magenta
      '#f0abfc', // light magenta
      '#fbbf24', // accent yellow
    ],
    gradient: [
      '#4c1d95', // very dark purple
      '#581c87', // dark purple
      '#6d28d9', // medium purple
      '#7c3aed', // purple
      '#8b5cf6', // bright purple
      '#a855f7', // light purple
    ]
  },
  {
    name: 'monochrome',
    label: 'Monochrome',
    colors: [
      '#1f2937', // very dark gray
      '#374151', // dark gray
      '#4b5563', // medium gray
      '#6b7280', // gray
      '#9ca3af', // light gray
      '#d1d5db', // lighter gray
      '#e5e7eb', // very light gray
      '#f3f4f6', // almost white
    ],
    gradient: [
      '#111827', // black
      '#1f2937', // very dark gray
      '#374151', // dark gray
      '#4b5563', // medium gray
      '#6b7280', // gray
      '#9ca3af', // light gray
    ]
  },
  {
    name: 'pastel',
    label: 'Pastel',
    colors: [
      '#93c5fd', // light blue
      '#86efac', // light green
      '#fde047', // light yellow
      '#fca5a5', // light red
      '#c4b5fd', // light purple
      '#fdba74', // light orange
      '#67e8f9', // light cyan
      '#bef264', // light lime
    ],
    gradient: [
      '#bfdbfe', // very light blue
      '#a7f3d0', // very light green
      '#fef08a', // very light yellow
      '#fecaca', // very light red
      '#ddd6fe', // very light purple
      '#fed7aa', // very light orange
    ]
  },
  {
    name: 'vibrant',
    label: 'Vibrant',
    colors: [
      '#0000ff', // pure blue
      '#00ff00', // pure green
      '#ffff00', // pure yellow
      '#ff0000', // pure red
      '#ff00ff', // pure magenta
      '#ff8000', // pure orange
      '#00ffff', // pure cyan
      '#8000ff', // pure violet
    ],
    gradient: [
      '#4000ff', // blue-violet
      '#0080ff', // blue
      '#00ffff', // cyan
      '#00ff80', // green
      '#80ff00', // lime
      '#ffff00', // yellow
    ]
  },
  {
    name: 'd3Category10',
    label: 'D3 Category 10',
    colors: [
      '#1f77b4', // blue
      '#ff7f0e', // orange
      '#2ca02c', // green
      '#d62728', // red
      '#9467bd', // purple
      '#8c564b', // brown
      '#e377c2', // pink
      '#7f7f7f', // gray
      '#bcbd22', // olive
      '#17becf', // cyan
    ],
    gradient: [
      '#1f77b4', // blue
      '#2ca02c', // green
      '#bcbd22', // olive
      '#ff7f0e', // orange
      '#d62728', // red
      '#9467bd', // purple
    ]
  },
  {
    name: 'd3Tableau10',
    label: 'D3 Tableau 10',
    colors: [
      '#4e79a7', // blue
      '#f28e2c', // orange
      '#e15759', // red
      '#76b7b2', // teal
      '#59a14f', // green
      '#edc949', // yellow
      '#af7aa1', // purple
      '#ff9da7', // pink
      '#9c755f', // brown
      '#bab0ab', // gray
    ],
    gradient: [
      '#4e79a7', // blue
      '#76b7b2', // teal
      '#59a14f', // green
      '#edc949', // yellow
      '#f28e2c', // orange
      '#e15759', // red
    ]
  },
  {
    name: 'colorBrewerSet1',
    label: 'ColorBrewer Set 1',
    colors: [
      '#e41a1c', // red
      '#377eb8', // blue
      '#4daf4a', // green
      '#984ea3', // purple
      '#ff7f00', // orange
      '#ffff33', // yellow
      '#a65628', // brown
      '#f781bf', // pink
      '#999999', // gray
    ],
    gradient: [
      '#377eb8', // blue
      '#4daf4a', // green
      '#ffff33', // yellow
      '#ff7f00', // orange
      '#e41a1c', // red
      '#984ea3', // purple
    ]
  },
  {
    name: 'colorBrewerSet2',
    label: 'ColorBrewer Set 2',
    colors: [
      '#66c2a5', // teal
      '#fc8d62', // orange
      '#8da0cb', // blue
      '#e78ac3', // pink
      '#a6d854', // lime
      '#ffd92f', // yellow
      '#e5c494', // tan
      '#b3b3b3', // gray
    ],
    gradient: [
      '#8da0cb', // blue
      '#66c2a5', // teal
      '#a6d854', // lime
      '#ffd92f', // yellow
      '#fc8d62', // orange
      '#e78ac3', // pink
    ]
  },
  {
    name: 'colorBrewerDark2',
    label: 'ColorBrewer Dark 2',
    colors: [
      '#1b9e77', // dark teal
      '#d95f02', // dark orange
      '#7570b3', // dark blue
      '#e7298a', // dark pink
      '#66a61e', // dark green
      '#e6ab02', // dark yellow
      '#a6761d', // dark brown
      '#666666', // dark gray
    ],
    gradient: [
      '#7570b3', // dark blue
      '#1b9e77', // dark teal
      '#66a61e', // dark green
      '#e6ab02', // dark yellow
      '#d95f02', // dark orange
      '#e7298a', // dark pink
    ]
  },
  {
    name: 'colorBrewerPaired',
    label: 'ColorBrewer Paired',
    colors: [
      '#a6cee3', // light blue
      '#1f78b4', // blue
      '#b2df8a', // light green
      '#33a02c', // green
      '#fb9a99', // light red
      '#e31a1c', // red
      '#fdbf6f', // light orange
      '#ff7f00', // orange
      '#cab2d6', // light purple
      '#6a3d9a', // purple
      '#ffff99', // light yellow
      '#b15928', // brown
    ],
    gradient: [
      '#1f78b4', // blue
      '#33a02c', // green
      '#ffff99', // light yellow
      '#ff7f00', // orange
      '#e31a1c', // red
      '#6a3d9a', // purple
    ]
  },
  {
    name: 'viridis',
    label: 'Viridis',
    colors: [
      '#440154', // dark purple
      '#482677', // purple
      '#3f4a8a', // blue-purple
      '#31678e', // blue
      '#26838f', // teal
      '#1f9d8a', // green-teal
      '#6cce5a', // green
      '#b6de2b', // yellow-green
    ],
    gradient: [
      '#440154', // dark purple
      '#482677', // purple
      '#3f4a8a', // blue-purple
      '#31678e', // blue
      '#26838f', // teal
      '#1f9d8a', // green-teal
      '#6cce5a', // green
      '#b6de2b', // yellow-green
    ]
  },
  {
    name: 'plasma',
    label: 'Plasma',
    colors: [
      '#0c0786', // dark blue
      '#5c01a6', // purple
      '#900da4', // magenta
      '#bf3984', // pink
      '#e16462', // coral
      '#f99b45', // orange
      '#fcce25', // yellow
      '#f0f921', // bright yellow
    ],
    gradient: [
      '#0c0786', // dark blue
      '#5c01a6', // purple
      '#900da4', // magenta
      '#bf3984', // pink
      '#e16462', // coral
      '#f99b45', // orange
      '#fcce25', // yellow
      '#f0f921', // bright yellow
    ]
  },
  {
    name: 'inferno',
    label: 'Inferno',
    colors: [
      '#000003', // black
      '#1f0c47', // dark blue
      '#550f6d', // purple
      '#88226a', // magenta
      '#a83655', // red
      '#cc4f39', // orange-red
      '#e6862a', // orange
      '#fec228', // yellow
    ],
    gradient: [
      '#000003', // black
      '#1f0c47', // dark blue
      '#550f6d', // purple
      '#88226a', // magenta
      '#a83655', // red
      '#cc4f39', // orange-red
      '#e6862a', // orange
      '#fec228', // yellow
    ]
  },
  {
    name: 'magma',
    label: 'Magma',
    colors: [
      '#000003', // black
      '#140b34', // dark purple
      '#3b0f6f', // purple
      '#641a80', // magenta
      '#8b2981', // pink
      '#b63679', // coral
      '#de4968', // red
      '#fd9f6c', // orange
    ],
    gradient: [
      '#000003', // black
      '#140b34', // dark purple
      '#3b0f6f', // purple
      '#641a80', // magenta
      '#8b2981', // pink
      '#b63679', // coral
      '#de4968', // red
      '#fd9f6c', // orange
    ]
  },
  {
    name: 'cividis',
    label: 'Cividis',
    colors: [
      '#00204c', // dark blue
      '#003f5c', // blue
      '#2c4b7a', // blue
      '#51576f', // blue-gray
      '#7f6874', // gray
      '#a8786e', // brown
      '#d2906d', // orange
      '#ffb570', // yellow
    ],
    gradient: [
      '#00204c', // dark blue
      '#003f5c', // blue
      '#2c4b7a', // blue
      '#51576f', // blue-gray
      '#7f6874', // gray
      '#a8786e', // brown
      '#d2906d', // orange
      '#ffb570', // yellow
    ]
  },
  {
    name: 'turbo',
    label: 'Turbo',
    colors: [
      '#30123b', // purple
      '#4454c4', // blue
      '#1dd3c0', // cyan
      '#42f465', // green
      '#b2df22', // lime
      '#faba39', // yellow
      '#f66c19', // orange
      '#c42e02', // red
    ],
    gradient: [
      '#30123b', // purple
      '#4454c4', // blue
      '#1dd3c0', // cyan
      '#42f465', // green
      '#b2df22', // lime
      '#faba39', // yellow
      '#f66c19', // orange
      '#c42e02', // red
    ]
  },
  {
    name: 'warm',
    label: 'Warm',
    colors: [
      '#8b0000', // dark red
      '#b22222', // red
      '#cd5c5c', // light red
      '#ff6347', // tomato
      '#ff8c00', // dark orange
      '#ffa500', // orange
      '#ffd700', // gold
      '#ffff00', // yellow
    ],
    gradient: [
      '#8b0000', // dark red
      '#b22222', // red
      '#ff6347', // tomato
      '#ff8c00', // dark orange
      '#ffa500', // orange
      '#ffd700', // gold
    ]
  },
  {
    name: 'cool',
    label: 'Cool',
    colors: [
      '#000080', // navy
      '#0000ff', // blue
      '#4169e1', // royal blue
      '#00bfff', // deep sky blue
      '#00ffff', // cyan
      '#40e0d0', // turquoise
      '#20b2aa', // light sea green
      '#008b8b', // dark cyan
    ],
    gradient: [
      '#000080', // navy
      '#0000ff', // blue
      '#4169e1', // royal blue
      '#00bfff', // deep sky blue
      '#00ffff', // cyan
      '#40e0d0', // turquoise
    ]
  },
  {
    name: 'earth',
    label: 'Earth',
    colors: [
      '#8b4513', // saddle brown
      '#a0522d', // sienna
      '#cd853f', // peru
      '#daa520', // goldenrod
      '#d2691e', // chocolate
      '#bc8f8f', // rosy brown
      '#f4a460', // sandy brown
      '#deb887', // burlywood
    ],
    gradient: [
      '#8b4513', // saddle brown
      '#a0522d', // sienna
      '#cd853f', // peru
      '#daa520', // goldenrod
      '#d2691e', // chocolate
      '#f4a460', // sandy brown
    ]
  },
  {
    name: 'autumn',
    label: 'Autumn',
    colors: [
      '#8b0000', // dark red
      '#a0522d', // sienna
      '#cd853f', // peru
      '#daa520', // goldenrod
      '#ff8c00', // dark orange
      '#ff4500', // orange red
      '#dc143c', // crimson
      '#b22222', // fire brick
    ],
    gradient: [
      '#8b0000', // dark red
      '#a0522d', // sienna
      '#cd853f', // peru
      '#daa520', // goldenrod
      '#ff8c00', // dark orange
      '#ff4500', // orange red
    ]
  },
  {
    name: 'spring',
    label: 'Spring',
    colors: [
      '#32cd32', // lime green
      '#98fb98', // pale green
      '#90ee90', // light green
      '#ffb6c1', // light pink
      '#ffc0cb', // pink
      '#ffffe0', // light yellow
      '#f0fff0', // honeydew
      '#e0ffff', // light cyan
    ],
    gradient: [
      '#32cd32', // lime green
      '#98fb98', // pale green
      '#ffffe0', // light yellow
      '#ffb6c1', // light pink
      '#ffc0cb', // pink
      '#e0ffff', // light cyan
    ]
  },
  {
    name: 'winter',
    label: 'Winter',
    colors: [
      '#191970', // midnight blue
      '#4682b4', // steel blue
      '#87ceeb', // sky blue
      '#b0e0e6', // powder blue
      '#e0ffff', // light cyan
      '#f0f8ff', // alice blue
      '#c0c0c0', // silver
      '#708090', // slate gray
    ],
    gradient: [
      '#191970', // midnight blue
      '#4682b4', // steel blue
      '#87ceeb', // sky blue
      '#b0e0e6', // powder blue
      '#e0ffff', // light cyan
      '#f0f8ff', // alice blue
    ]
  },
  {
    name: 'neon',
    label: 'Neon',
    colors: [
      '#ff0080', // neon pink
      '#00ff80', // neon green
      '#8000ff', // neon purple
      '#ff8000', // neon orange
      '#0080ff', // neon blue
      '#80ff00', // neon lime
      '#ff0040', // neon red
      '#40ff00', // bright green
    ],
    gradient: [
      '#8000ff', // neon purple
      '#0080ff', // neon blue
      '#00ff80', // neon green
      '#80ff00', // neon lime
      '#ff8000', // neon orange
      '#ff0080', // neon pink
    ]
  },
  {
    name: 'retro',
    label: 'Retro',
    colors: [
      '#ff69b4', // hot pink
      '#ffd700', // gold
      '#32cd32', // lime green
      '#00ced1', // dark turquoise
      '#ff6347', // tomato
      '#9370db', // medium purple
      '#ffa500', // orange
      '#20b2aa', // light sea green
    ],
    gradient: [
      '#9370db', // medium purple
      '#ff69b4', // hot pink
      '#ff6347', // tomato
      '#ffd700', // gold
      '#32cd32', // lime green
      '#00ced1', // dark turquoise
    ]
  },
  {
    name: 'corporate',
    label: 'Corporate',
    colors: [
      '#003366', // dark blue
      '#0066cc', // blue
      '#336699', // steel blue
      '#6699cc', // light blue
      '#4d4d4d', // dark gray
      '#808080', // gray
      '#b3b3b3', // light gray
      '#cccccc', // very light gray
    ],
    gradient: [
      '#003366', // dark blue
      '#0066cc', // blue
      '#336699', // steel blue
      '#6699cc', // light blue
      '#808080', // gray
      '#b3b3b3', // light gray
    ]
  },
  {
    name: 'material',
    label: 'Material Design',
    colors: [
      '#f44336', // red
      '#e91e63', // pink
      '#9c27b0', // purple
      '#673ab7', // deep purple
      '#3f51b5', // indigo
      '#2196f3', // blue
      '#03a9f4', // light blue
      '#00bcd4', // cyan
    ],
    gradient: [
      '#673ab7', // deep purple
      '#3f51b5', // indigo
      '#2196f3', // blue
      '#00bcd4', // cyan
      '#03a9f4', // light blue
      '#e91e63', // pink
    ]
  }
]

/**
 * Get a color palette by name, with fallback to default
 */
export function getColorPalette(paletteName?: string): ColorPalette {
  if (!paletteName) {
    return COLOR_PALETTES[0] // default palette
  }
  
  const palette = COLOR_PALETTES.find(p => p.name === paletteName)
  return palette || COLOR_PALETTES[0] // fallback to default
}

/**
 * Get just the series colors for a palette
 */
export function getSeriesColors(paletteName?: string): string[] {
  return getColorPalette(paletteName).colors
}

/**
 * Get just the gradient colors for a palette
 */
export function getGradientColors(paletteName?: string): string[] {
  return getColorPalette(paletteName).gradient
}

/**
 * Chart types that use series colors (discrete categories)
 */
export const SERIES_CHART_TYPES = [
  'bar', 'line', 'area', 'pie', 'scatter', 'radar', 'radialBar', 'treeMap'
] as const

/**
 * Chart types that use gradient colors (continuous values)
 */
export const GRADIENT_CHART_TYPES = [
  'bubble', 'activityGrid'
] as const

/**
 * Determine if a chart type uses gradient colors
 */
export function usesGradientColors(chartType: string): boolean {
  return GRADIENT_CHART_TYPES.includes(chartType as any)
}