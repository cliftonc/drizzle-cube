/**
 * Bridge MCP host CSS variables to drizzle-cube dc-* theme variables.
 *
 * MCP hosts provide variables like --color-background-primary.
 * Drizzle-cube charts use --dc-surface, --dc-text, etc.
 * This bridge maps between the two systems.
 */

import {
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
} from '@modelcontextprotocol/ext-apps'
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps'

/** Map MCP host CSS variables to drizzle-cube theme variables */
const HOST_TO_DC_MAP: Record<string, string> = {
  '--color-background-primary': '--dc-surface',
  '--color-background-secondary': '--dc-surface-secondary',
  '--color-text-primary': '--dc-text',
  '--color-text-secondary': '--dc-text-secondary',
  '--color-text-tertiary': '--dc-text-muted',
  '--color-border-primary': '--dc-border',
  '--color-border-secondary': '--dc-border',
  '--color-accent-primary': '--dc-accent',
  '--color-accent-secondary': '--dc-accent-hover',
  '--color-status-error': '--dc-error',
  '--color-status-success': '--dc-success',
  '--color-status-warning': '--dc-warning',
}

/**
 * Apply host context styling: theme, variables, fonts, safe area insets, and dc-* bridge
 */
export function applyHostContext(ctx: McpUiHostContext): void {
  if (ctx.theme) {
    applyDocumentTheme(ctx.theme)
  }

  if (ctx.styles?.variables) {
    applyHostStyleVariables(ctx.styles.variables)
    // Bridge host variables to dc-* variables
    bridgeHostVariables()
  }

  if (ctx.styles?.css?.fonts) {
    applyHostFonts(ctx.styles.css.fonts)
  }

  if (ctx.safeAreaInsets) {
    const { top, right, bottom, left } = ctx.safeAreaInsets
    document.body.style.padding = `${top}px ${right}px ${bottom}px ${left}px`
  }
}

function bridgeHostVariables(): void {
  const root = document.documentElement
  const computedStyle = getComputedStyle(root)

  for (const [hostVar, dcVar] of Object.entries(HOST_TO_DC_MAP)) {
    const value = computedStyle.getPropertyValue(hostVar).trim()
    if (value) {
      root.style.setProperty(dcVar, value)
    }
  }
}

/**
 * Set sensible dc-* fallback variables so charts render well even without a host
 */
export function applyFallbackTheme(): void {
  const root = document.documentElement
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (isDark) {
    root.style.setProperty('--dc-surface', '#1a1a2e')
    root.style.setProperty('--dc-surface-secondary', '#16213e')
    root.style.setProperty('--dc-text', '#e0e0e0')
    root.style.setProperty('--dc-text-secondary', '#a0a0a0')
    root.style.setProperty('--dc-text-muted', '#707070')
    root.style.setProperty('--dc-border', '#2a2a4a')
    root.style.setProperty('--dc-accent', '#6366f1')
  } else {
    root.style.setProperty('--dc-surface', '#ffffff')
    root.style.setProperty('--dc-surface-secondary', '#f8fafc')
    root.style.setProperty('--dc-text', '#1e293b')
    root.style.setProperty('--dc-text-secondary', '#64748b')
    root.style.setProperty('--dc-text-muted', '#94a3b8')
    root.style.setProperty('--dc-border', '#e2e8f0')
    root.style.setProperty('--dc-accent', '#6366f1')
  }
}
