/**
 * MobileStackedLayout component
 * Simple vertical stack layout for mobile screens (<768px)
 * Read-only view with portlets sorted by grid position
 */

import { useMemo, useRef, useState, useCallback } from 'react'
import { getIcon } from '../icons/index.js'
import AnalyticsPortlet from './AnalyticsPortlet.js'

const RefreshIcon = getIcon('refresh')
import { ScrollContainerProvider } from '../providers/ScrollContainerContext.js'
import { useTranslation } from '../hooks/useTranslation.js'
import type { DashboardFilter, DashboardConfig, PortletConfig, PortletGroup } from '../types.js'
import type { ColorPalette } from '../utils/colorPalettes.js'
import { resolveMobilePortletDisplay } from './mobileStackedLayout/memberDisplay.js'
import { headerHasBottomRule, isAutoHeightMarkdownPortlet } from './rowManagedLayout/sections.js'
// Shared with DashboardCoordinator so both layouts detect the scroll container
// the same way - this was previously duplicated here and drifted.
import { findScrollableAncestor } from './dashboard/dashboardGridUtils.js'

type Block =
  | { kind: 'portlet'; sort: [number, number]; portlet: PortletConfig }
  | { kind: 'group'; sort: [number, number]; group: PortletGroup; portlets: PortletConfig[] }

/** Same banding as the desktop row layout - see `rowManagedLayout/sections.ts`. */
type MobileBand =
  | { kind: 'loose'; block: Block }
  | { kind: 'section'; header: Block; body: Block[] }

interface MobileStackedLayoutProps {
  config: DashboardConfig
  colorPalette?: ColorPalette
  dashboardFilters?: DashboardFilter[]
  onPortletRefresh?: (portletId: string) => void
}

/**
 * Mobile-optimized stacked layout for dashboard portlets
 * Renders portlets in a single column, sorted by grid position
 */
export default function MobileStackedLayout({
  config,
  colorPalette,
  dashboardFilters,
  onPortletRefresh
}: MobileStackedLayoutProps) {
  const { t } = useTranslation()
  const portletComponentRefs = useRef<{ [key: string]: { refresh: () => void } | null }>({})

  // Scroll container detection for lazy loading
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
    if (node) {
      setScrollContainer(findScrollableAncestor(node))
    }
  }, [])

  // Group portlets stay together as one block so a KPI strip reads as a unit on
  // mobile too; everything else is a lone portlet. Blocks are ordered by grid
  // position so reading order matches the desktop layout.
  const blocks = useMemo(() => {
    const byId = new Map(config.portlets.map(portlet => [portlet.id, portlet]))
    const grouped = new Set<string>()

    const result: Block[] = []

    for (const group of config.groups ?? []) {
      const members = group.cells
        .flatMap(cell => cell.portletIds)
        .map(id => byId.get(id))
        .filter((portlet): portlet is PortletConfig => Boolean(portlet))
      if (members.length === 0) continue

      members.forEach(portlet => grouped.add(portlet.id))
      const top = Math.min(...members.map(portlet => portlet.y))
      const left = Math.min(...members.map(portlet => portlet.x))
      result.push({ kind: 'group', sort: [top, left], group, portlets: members })
    }

    for (const portlet of config.portlets) {
      if (grouped.has(portlet.id)) continue
      result.push({ kind: 'portlet', sort: [portlet.y, portlet.x], portlet })
    }

    return result.sort((a, b) =>
      a.sort[0] !== b.sort[0] ? a.sort[0] - b.sort[0] : a.sort[1] - b.sort[1]
    )
  }, [config.groups, config.portlets])

  /**
   * A section header is a lone full-width markdown block. Blocks are already
   * grouped by grid row via `sort[0]`, so "sole block on its row" stands in for
   * full width here: `portlet.w` is only re-derived from the rows on save, so it
   * can be stale, while the y-grouping cannot.
   *
   * Banding is a rows-mode idea, but this component renders grid-mode
   * dashboards too - hence the layoutMode gate.
   */
  const bands = useMemo<MobileBand[] | null>(() => {
    if (config.layoutMode !== 'rows') return null

    const blocksPerRow = new Map<number, number>()
    blocks.forEach(block => {
      blocksPerRow.set(block.sort[0], (blocksPerRow.get(block.sort[0]) ?? 0) + 1)
    })
    const isHeader = (block: Block) =>
      block.kind === 'portlet' &&
      blocksPerRow.get(block.sort[0]) === 1 &&
      isAutoHeightMarkdownPortlet(block.portlet)

    const result: MobileBand[] = []
    let index = 0
    while (index < blocks.length) {
      if (!isHeader(blocks[index])) {
        result.push({ kind: 'loose', block: blocks[index] })
        index += 1
        continue
      }
      const header = blocks[index]
      const body: Block[] = []
      index += 1
      while (index < blocks.length && !isHeader(blocks[index])) {
        body.push(blocks[index])
        index += 1
      }
      // A header with nothing under it is a note, not an empty section card.
      result.push(body.length === 0 ? { kind: 'loose', block: header } : { kind: 'section', header, body })
    }

    return result.some(band => band.kind === 'section') ? result : null
  }, [blocks, config.layoutMode])

  const handlePortletRefresh = (portletId: string) => {
    // Refresh the specific portlet component
    portletComponentRefs.current[portletId]?.refresh()
    // Also call external handler if provided
    onPortletRefresh?.(portletId)
  }

  /**
   * One portlet: header (unless hidden) plus its chart at an explicit height,
   * since charts need one to render. `framed` is false inside a group, where
   * the group card supplies the border.
   */
  const renderPortlet = (portlet: PortletConfig, framed: boolean, memberCount = 1, inSection = false) => {
    const display = resolveMobilePortletDisplay({ portlet, framed, memberCount })
    const { isTransparent, isAutoHeight, shouldHideHeader, contentHeight } = display
    // A section child stays `framed` so it keeps its title - unlike a group
    // child, the section card has no title of its own to carry it - but the
    // section draws the frame, so the card itself is bare.
    const bare = isTransparent || !framed || inSection

    return (
      <div
        key={portlet.id}
        data-portlet-id={portlet.id}
        className={
          bare
            ? 'dc:flex dc:flex-col'
            : 'bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:flex dc:flex-col'
        }
        style={{
          height: isAutoHeight ? 'auto' : display.height,
          boxShadow: bare ? 'none' : 'var(--dc-shadow-sm)',
          borderColor: isTransparent ? 'transparent' : undefined,
          borderWidth: isTransparent ? '0' : undefined,
          backgroundColor: isTransparent ? 'transparent' : undefined,
        }}
      >
        {/* Portlet Header - Simplified for mobile (no edit controls) */}
        {!shouldHideHeader && (
          <div className={`dc:flex dc:items-center dc:justify-between dc:px-3 dc:shrink-0${
            inSection
              ? ' dc:py-3'
              : ' dc:py-2 dc:border-b border-dc-border bg-dc-surface-secondary dc:rounded-t-lg'
          }`}>
            <h3 className="dc:font-semibold dc:text-sm text-dc-text dc:truncate dc:flex-1">
              {portlet.title}
            </h3>
            <div className="dc:flex dc:items-center dc:gap-1 dc:shrink-0 dc:ml-2">
              <button
                onClick={() => handlePortletRefresh(portlet.id)}
                className="dc:p-1 bg-transparent dc:border-none dc:rounded-sm text-dc-text-secondary dc:cursor-pointer hover:bg-dc-surface-hover dc:transition-colors"
                title={t('dashboard.portlet.action.refresh')}
              >
                <RefreshIcon style={{ width: '16px', height: '16px', color: 'currentColor' }} />
              </button>
            </div>
          </div>
        )}

        {/* Portlet Content - explicit height for charts to render */}
        <div
          className={`dc-portlet-card-body dc:overflow-visible dc:flex dc:flex-col${isTransparent && !inSection ? '' : ' dc:px-2 dc:py-3'}`}
          style={{ height: isAutoHeight ? 'auto' : contentHeight }}
        >
          <AnalyticsPortlet
            ref={el => { portletComponentRefs.current[portlet.id] = el }}
            query={display.query}
            chartType={display.chartType}
            chartConfig={display.chartConfig}
            displayConfig={display.displayConfig}
            dashboardFilters={dashboardFilters}
            dashboardFilterMapping={portlet.dashboardFilterMapping}
            eagerLoad={portlet.eagerLoad ?? config.eagerLoad ?? false}
            title={portlet.title}
            height={isAutoHeight ? 'auto' : contentHeight}
            colorPalette={colorPalette}
          />
        </div>
      </div>
    )
  }

  /** Identifies a band for React; groups and portlets share the key space. */
  const blockKey = (block: Block) => block.kind === 'group' ? block.group.id : block.portlet.id

  /** One block, framed on its own or bare inside a section card. */
  const renderBlock = (block: Block, inSection: boolean) => {
    if (block.kind === 'portlet') return renderPortlet(block.portlet, true, 1, inSection)

    // A group keeps its single frame on mobile; its members stack
    // vertically inside it whatever the group's desktop direction was.
    return (
      <div
        key={block.group.id}
        data-group-id={block.group.id}
        className={`dc:flex dc:flex-col${inSection ? '' : ' bg-dc-surface dc:border border-dc-border dc:rounded-lg'}`}
        style={{ boxShadow: inSection ? 'none' : 'var(--dc-shadow-sm)' }}
      >
        {block.group.title && block.group.title.trim() && (
          <div className="dc:flex dc:items-center dc:px-3 dc:py-2 dc:border-b border-dc-border dc:shrink-0 bg-dc-surface-secondary dc:rounded-t-lg">
            <h3 className="dc:font-semibold dc:text-sm text-dc-text dc:truncate">
              {block.group.title}
            </h3>
          </div>
        )}
        <div className="dc:flex dc:flex-col dc:p-1 dc:gap-1">
          {block.portlets.map(portlet =>
            renderPortlet(portlet, false, block.portlets.length)
          )}
        </div>
      </div>
    )
  }

  return (
    <ScrollContainerProvider value={scrollContainer}>
      <div ref={setContainerRef} className="mobile-stacked-layout dc:space-y-4 dc:px-2">
        {bands
          ? bands.map(band => (
              band.kind === 'loose'
                ? renderBlock(band.block, false)
                : (
                  <div
                    className={`dc-dashboard-section${
                      band.header.kind === 'portlet' && headerHasBottomRule(band.header.portlet)
                        ? ' dc-dashboard-section-ruled'
                        : ''
                    }`}
                    key={`section-${blockKey(band.header)}`}
                  >
                    {renderBlock(band.header, true)}
                    {band.body.map(block => renderBlock(block, true))}
                  </div>
                )
            ))
          : blocks.map(block => renderBlock(block, false))}
      </div>
    </ScrollContainerProvider>
  )
}
