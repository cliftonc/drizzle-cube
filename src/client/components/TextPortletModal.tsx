/**
 * TextPortletModal - Simplified modal for creating/editing markdown portlets
 *
 * Layout: large content textarea at top, display options and live preview below.
 * No query configuration needed — markdown is content-only.
 */

import { useState, useMemo, useCallback } from 'react'
import { getIcon } from '../icons'
import AnalysisDisplayConfigPanel from './AnalysisBuilder/AnalysisDisplayConfigPanel'
import MarkdownChart from './charts/MarkdownChart'
import { ensureAnalysisConfig } from '../utils/configMigration'
import type { PortletConfig, ChartDisplayConfig } from '../types'
import type { AnalysisConfig } from '../types/analysisConfig'
import type { ColorPalette } from '../utils/colorPalettes'

const CloseIcon = getIcon('close')

interface TextPortletModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (portlet: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => void
  portlet?: PortletConfig | null
  colorPalette?: ColorPalette
  existingTitles?: string[]
}

export default function TextPortletModal({
  isOpen,
  onClose,
  onSave,
  portlet,
  colorPalette,
  existingTitles = [],
}: TextPortletModalProps) {
  // Initialize displayConfig from existing portlet or defaults
  const initialDisplayConfig = useMemo(() => {
    if (portlet) {
      const normalized = ensureAnalysisConfig(portlet)
      const chartConfig = normalized.analysisConfig.charts.query
      return chartConfig?.displayConfig ?? {}
    }
    return {
      content: '',
      hideHeader: true,
      fontSize: 'medium' as const,
      alignment: 'left' as const,
      accentColorIndex: 0,
      transparentBackground: false,
      accentBorder: 'none' as const,
    }
  }, [portlet])

  const [displayConfig, setDisplayConfig] = useState<ChartDisplayConfig>(initialDisplayConfig)
  const [title, setTitle] = useState(() => portlet?.title ?? '')
  const [titleTouched, setTitleTouched] = useState(false)

  // Reset state when modal opens with a different portlet
  const [prevPortlet, setPrevPortlet] = useState(portlet)
  if (portlet !== prevPortlet) {
    setPrevPortlet(portlet)
    setTitleTouched(false)
    if (portlet) {
      const normalized = ensureAnalysisConfig(portlet)
      const chartConfig = normalized.analysisConfig.charts.query
      setDisplayConfig(chartConfig?.displayConfig ?? {})
      setTitle(portlet.title ?? '')
    } else {
      setDisplayConfig({
        content: '',
        hideHeader: true,
        fontSize: 'medium',
        alignment: 'left',
        accentColorIndex: 0,
        transparentBackground: false,
        accentBorder: 'none',
      })
      setTitle('')
    }
  }

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value)
    setTitleTouched(true)
  }, [])

  // Resolve title: respect user edits (including clearing). Auto-generate only for new portlets.
  const resolvedTitle = useMemo(() => {
    if (titleTouched) return title
    if (portlet?.title) return portlet.title
    // Auto-generate for new portlets
    let candidate = 'Text'
    let counter = 2
    while (existingTitles.includes(candidate)) {
      candidate = `Text ${counter}`
      counter++
    }
    return candidate
  }, [title, titleTouched, portlet, existingTitles])

  // Tie hideHeader to transparentBackground — show header when card has visible chrome
  const handleDisplayConfigChange = useCallback((config: ChartDisplayConfig) => {
    setDisplayConfig({
      ...config,
      hideHeader: config.transparentBackground ? true : false,
    })
  }, [])

  const handleSave = useCallback(() => {
    // Hide header when transparent OR when title is empty
    const finalDisplayConfig = {
      ...displayConfig,
      hideHeader: !!displayConfig.transparentBackground || !resolvedTitle.trim(),
    }

    const analysisConfig: AnalysisConfig = {
      version: 1,
      analysisType: 'query',
      activeView: 'chart',
      charts: {
        query: {
          chartType: 'markdown',
          chartConfig: {},
          displayConfig: finalDisplayConfig,
        },
      },
      query: {},
    }

    if (portlet) {
      // Editing existing
      onSave({
        ...portlet,
        title: resolvedTitle,
        analysisConfig,
      })
    } else {
      // Adding new
      onSave({
        title: resolvedTitle,
        analysisConfig,
        w: 12,
        h: 3,
      })
    }
  }, [displayConfig, portlet, resolvedTitle, onSave])

  const handleContentChange = useCallback((content: string) => {
    setDisplayConfig(prev => ({ ...prev, content }))
  }, [])

  if (!isOpen) return null

  return (
    <div
      className="dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="dc:absolute dc:inset-0 dc:bg-black/50" />

      {/* Modal */}
      <div
        className="dc:relative dc:w-full dc:max-w-5xl dc:mx-4 dc:max-h-[85vh] dc:flex dc:flex-col bg-dc-surface dc:rounded-lg dc:border border-dc-border"
        style={{ boxShadow: 'var(--dc-shadow-xl)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dc:flex dc:items-center dc:justify-between dc:px-6 dc:py-4 dc:border-b border-dc-border dc:shrink-0">
          <h2 className="dc:text-lg dc:font-semibold text-dc-text">
            {portlet ? 'Edit Text' : 'Add Text'}
          </h2>
          <button
            onClick={onClose}
            className="dc:p-1 dc:rounded-md text-dc-text-secondary dc:hover:bg-dc-surface-hover dc:transition-colors"
          >
            <CloseIcon className="dc:w-5 dc:h-5" />
          </button>
        </div>

        {/* Content area — two columns: left (textarea + preview), right (display options) */}
        <div className="dc:flex-1 dc:min-h-0 dc:overflow-y-auto dc:p-6">
          <div className="dc:flex dc:gap-6 dc:h-full">
            {/* Left column: title + textarea + preview */}
            <div className="dc:flex-1 dc:min-w-0 dc:flex dc:flex-col dc:gap-4">
              {/* Optional title — visible when not transparent */}
              {!displayConfig.transparentBackground && (
                <div>
                  <label className="dc:block dc:text-sm dc:font-medium text-dc-text dc:mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Text"
                    className="dc:w-full dc:rounded-md dc:border border-dc-border bg-dc-surface dc:px-3 dc:py-2 dc:text-sm text-dc-text focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent"
                  />
                </div>
              )}

              {/* Content textarea */}
              <div>
                <label className="dc:block dc:text-sm dc:font-medium text-dc-text dc:mb-1.5">
                  Markdown Content
                </label>
                <textarea
                  value={displayConfig.content || ''}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={'# Welcome\n\nAdd your **markdown** content here:\n\n- Lists with bullets\n- [Links](https://example.com)\n- *Italic* and **bold** text\n\n---\n\nUse --- for horizontal rules.'}
                  className="dc:w-full dc:rounded-md dc:border border-dc-border bg-dc-surface dc:px-3 dc:py-2 dc:text-sm text-dc-text dc:font-mono dc:resize-y focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent"
                  style={{ minHeight: '140px' }}
                  rows={7}
                />
                <p className="dc:mt-1 dc:text-xs text-dc-text-muted">
                  Supports headers (#), bold (**text**), italic (*text*), links ([text](url)), lists (- item), and horizontal rules (---).
                </p>
              </div>

              {/* Live preview */}
              <div className="dc:flex-1 dc:min-h-0">
                <div className="dc:text-xs dc:font-medium dc:uppercase dc:tracking-wider text-dc-text-muted dc:mb-2">
                  Preview
                </div>
                <div
                  className="dc:border border-dc-border dc:rounded-lg dc:overflow-hidden"
                  style={{ minHeight: '200px' }}
                >
                  <MarkdownChart
                    data={[]}
                    displayConfig={displayConfig}
                    colorPalette={colorPalette}
                    height="auto"
                  />
                </div>
              </div>
            </div>

            {/* Right column: display options */}
            <div className="dc:w-72 dc:shrink-0">
              <AnalysisDisplayConfigPanel
                chartType="markdown"
                displayConfig={displayConfig}
                colorPalette={colorPalette}
                onDisplayConfigChange={handleDisplayConfigChange}
                excludeKeys={['content', 'hideHeader']}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="dc:flex dc:items-center dc:justify-end dc:gap-3 dc:px-6 dc:py-4 dc:border-t border-dc-border dc:shrink-0">
          <button
            onClick={onClose}
            className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:border border-dc-border text-dc-text-secondary dc:hover:bg-dc-surface-hover dc:transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:text-white dc:transition-colors"
            style={{ backgroundColor: 'var(--dc-primary)' }}
          >
            {portlet ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
