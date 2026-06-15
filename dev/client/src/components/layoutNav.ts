/**
 * Navigation data + source-path resolution for the example app Layout.
 *
 * Extracted from Layout.tsx so the component body stays flat: the nav items are
 * data, and `getSourcePath` is a table lookup instead of an if/else chain.
 */

export interface NavItem {
  to: string
  label: string
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/dashboards', label: 'Dashboards' },
  { to: '/analysis-builder', label: 'Analysis Builder' },
  { to: '/notebooks', label: 'Notebooks' },
  { to: '/schema', label: 'Schema' },
  { to: '/data-browser', label: 'Data Browser' },
]

export const LOCALE_OPTIONS = [
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'nl-NL', label: 'Nederlands' },
  { value: 'crowdin', label: 'Crowdin In-Context' }
] as const

const SOURCE_BASE_PATH =
  'https://github.com/cliftonc/drizzle-cube/blob/main/examples/hono/client/src'

/**
 * A source-path resolver tests a pathname and, when it matches, returns the
 * source file (relative to the GitHub base path). Order matters: more specific
 * rules come first.
 */
const SOURCE_PATH_RULES: Array<{ match: (pathname: string) => boolean; file: string }> = [
  { match: p => p === '/', file: 'pages/HomePage.tsx' },
  { match: p => p.startsWith('/dashboards') && p !== '/dashboards', file: 'pages/DashboardViewPage.tsx' },
  { match: p => p === '/dashboards', file: 'pages/DashboardListPage.tsx' },
  { match: p => p === '/analysis-builder', file: 'pages/AnalysisBuilderPage.tsx' },
  { match: p => p.startsWith('/notebooks') && p !== '/notebooks', file: 'pages/NotebookViewPage.tsx' },
  { match: p => p === '/notebooks', file: 'pages/NotebooksListPage.tsx' },
  { match: p => p === '/schema', file: 'pages/SchemaPage.tsx' },
]

/** Map the current route to its source file on GitHub. */
export function getSourcePath(pathname: string): string {
  const rule = SOURCE_PATH_RULES.find(r => r.match(pathname))
  return `${SOURCE_BASE_PATH}/${rule ? rule.file : 'App.tsx'}`
}
