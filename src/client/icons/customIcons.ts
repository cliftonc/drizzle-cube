/**
 * Custom SVG icons for drizzle-cube
 * These are hand-crafted icons when existing icon libraries don't have good options
 */

import type { IconifyIcon } from '@iconify/types'

/**
 * Custom Flow/Sankey icon
 * Nodes connected by flowing S-curve paths representing user journey flows
 * Shows data flowing between stages with branching paths
 * 24x24 viewBox, stroke-width 1.5 for clean appearance
 */
export const flowIcon: IconifyIcon = {
  body: `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="5" height="3" rx="0.75"/>
    <rect x="16" y="4" width="5" height="3" rx="0.75"/>
    <rect x="16" y="10.5" width="5" height="3" rx="0.75"/>
    <rect x="16" y="17" width="5" height="3" rx="0.75"/>
    <path d="M8 5.5 C11 5.5, 13 5.5, 16 5.5"/>
    <path d="M8 5.5 C10 5.5, 11 7, 12 9 C13 11, 14 12, 16 12"/>
    <path d="M8 5.5 C10 5.5, 11 10, 12 14 C13 17, 14 18.5, 16 18.5"/>
  </g>`,
  width: 24,
  height: 24,
}

/**
 * Custom Funnel icon
 * Horizontal bars that progressively narrow, showing conversion stages
 * Connected by angled lines showing flow between stages
 * 24x24 viewBox, stroke-width 1.5 for clean appearance
 */
export const funnelIcon: IconifyIcon = {
  body: `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3" width="20" height="4" rx="1"/>
    <rect x="4" y="10" width="16" height="4" rx="1"/>
    <rect x="6" y="17" width="12" height="4" rx="1"/>
  </g>`,
  width: 24,
  height: 24,
}

/**
 * Custom Retention icon
 * Grid/heatmap pattern representing cohort retention matrix
 * Shows users tracked across time periods with varying intensity cells
 * 24x24 viewBox, stroke-width 1.5 for clean appearance
 */
export const retentionIcon: IconifyIcon = {
  body: `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <!-- Grid cells representing retention matrix -->
    <rect x="3" y="3" width="4" height="4" rx="0.5"/>
    <rect x="10" y="3" width="4" height="4" rx="0.5"/>
    <rect x="17" y="3" width="4" height="4" rx="0.5"/>
    <rect x="3" y="10" width="4" height="4" rx="0.5"/>
    <rect x="10" y="10" width="4" height="4" rx="0.5"/>
    <rect x="17" y="10" width="4" height="4" rx="0.5"/>
    <rect x="3" y="17" width="4" height="4" rx="0.5"/>
    <rect x="10" y="17" width="4" height="4" rx="0.5"/>
    <rect x="17" y="17" width="4" height="4" rx="0.5"/>
  </g>`,
  width: 24,
  height: 24,
}
