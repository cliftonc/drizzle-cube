/**
 * react-grid-layout is an optional peer: only grid-mode dashboards use it (row
 * mode does not). There is no static import of it, so an app without it still
 * builds. The import() sits lexically inside `try`, which webpack treats as
 * optional (a warning, not a build error), and Vite swaps in a stub that throws
 * here. Its stylesheet is inlined into drizzle-cube/client/styles.css at build.
 */
import { useEffect, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'

export type GridLayoutModule = typeof import('react-grid-layout')

let loadPromise: Promise<GridLayoutModule | null> | null = null
/** The settled result, so remounts render the grid synchronously. */
let settled: GridLayoutModule | null | undefined

export function loadGridLayout(): Promise<GridLayoutModule | null> {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        settled = await import('react-grid-layout')
      } catch (error) {
        console.warn(
          '[drizzle-cube] Failed to load react-grid-layout:',
          error instanceof Error ? error.message : error
        )
        settled = null
      }
      return settled
    })()
  }
  return loadPromise
}

/**
 * The react-grid-layout module: `undefined` while loading (or while not
 * `enabled`), `null` when it is not installed.
 */
export function useGridLayoutModule(enabled: boolean): GridLayoutModule | null | undefined {
  const [mod, setMod] = useState<GridLayoutModule | null | undefined>(settled)
  useEffect(() => {
    if (!enabled || mod !== undefined) return
    let cancelled = false
    void loadGridLayout().then(result => {
      if (!cancelled) setMod(result)
    })
    return () => { cancelled = true }
  }, [enabled, mod])
  return mod
}

/** Shown in place of a grid-mode dashboard when react-grid-layout is missing. */
export function MissingGridLayoutFallback() {
  const { t } = useTranslation()
  return (
    <div className="dc:flex dc:items-center dc:justify-center dc:p-8">
      <div className="dc:text-center dc:max-w-md">
        <h3 className="dc:text-lg dc:font-semibold text-dc-text dc:mb-2">
          {t('dashboard.missingGridLayout.title')}
        </h3>
        <p className="dc:text-sm text-dc-text-secondary dc:mb-4">
          {t('dashboard.missingGridLayout.description')}
        </p>
        <code className="dc:block dc:px-4 dc:py-2 dc:rounded-sm bg-dc-surface-secondary dc:text-sm dc:font-mono text-dc-text dc:border border-dc-border">
          npm install react-grid-layout
        </code>
      </div>
    </div>
  )
}
