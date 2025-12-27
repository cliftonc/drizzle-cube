/**
 * Default icon definitions using Iconify icon sets
 * Uses HeroIcons (outline/solid) and Tabler icons via Iconify
 */

// HeroIcons Outline
import xMark from '@iconify-icons/heroicons-outline/x-mark'
import plus from '@iconify-icons/heroicons-outline/plus'
import pencil from '@iconify-icons/heroicons-outline/pencil'
import trash from '@iconify-icons/heroicons-outline/trash'
import arrowPath from '@iconify-icons/heroicons-outline/arrow-path'
import clipboardDocument from '@iconify-icons/heroicons-outline/clipboard-document'
import documentDuplicate from '@iconify-icons/heroicons-outline/document-duplicate'
import cog from '@iconify-icons/heroicons-outline/cog'
import funnel from '@iconify-icons/heroicons-outline/funnel'
import share from '@iconify-icons/heroicons-outline/share'
import chevronUp from '@iconify-icons/heroicons-outline/chevron-up'
import chevronDown from '@iconify-icons/heroicons-outline/chevron-down'
import chevronLeft from '@iconify-icons/heroicons-outline/chevron-left'
import chevronRight from '@iconify-icons/heroicons-outline/chevron-right'
import magnifyingGlass from '@iconify-icons/heroicons-outline/magnifying-glass'
import bars3 from '@iconify-icons/heroicons-outline/bars-3'
import checkCircle from '@iconify-icons/heroicons-outline/check-circle'
import exclamationTriangle from '@iconify-icons/heroicons-outline/exclaimation-triangle'
import exclamationCircle from '@iconify-icons/heroicons-outline/exclamation-circle'
import sparkles from '@iconify-icons/heroicons-outline/sparkles'
import eye from '@iconify-icons/heroicons-outline/eye'
import eyeSlash from '@iconify-icons/heroicons-outline/eye-slash'
import adjustmentsHorizontal from '@iconify-icons/heroicons-outline/adjustments-horizontal'
import computerDesktop from '@iconify-icons/heroicons-outline/computer-desktop'
import tableCells from '@iconify-icons/heroicons-outline/table-cells'
import link from '@iconify-icons/heroicons-outline/link'
import arrowRight from '@iconify-icons/heroicons-outline/arrow-right'
import sun from '@iconify-icons/heroicons-outline/sun'
import moon from '@iconify-icons/heroicons-outline/moon'
import ellipsisHorizontal from '@iconify-icons/heroicons-outline/ellipsis-horizontal'
import documentText from '@iconify-icons/heroicons-outline/document-text'
import bookOpen from '@iconify-icons/heroicons-outline/book-open'
import codeBracket from '@iconify-icons/heroicons-outline/code-bracket'

// HeroIcons Solid (for field type indicators and measures)
import chartBarSolid from '@iconify-icons/heroicons-solid/chart-bar'
import tagSolid from '@iconify-icons/heroicons-solid/tag'
import calendarSolid from '@iconify-icons/heroicons-solid/calendar'
import rectangleGroupSolid from '@iconify-icons/heroicons-solid/rectangle-group'
import playSolid from '@iconify-icons/heroicons-solid/play'
import checkSolid from '@iconify-icons/heroicons-solid/check'
import scaleSolid from '@iconify-icons/heroicons-solid/scale'
import arrowDownCircleSolid from '@iconify-icons/heroicons-solid/arrow-down-circle'
import arrowUpCircleSolid from '@iconify-icons/heroicons-solid/arrow-up-circle'
import arrowTrendingUpSolid from '@iconify-icons/heroicons-solid/arrow-trending-up'
import beakerSolid from '@iconify-icons/heroicons-solid/beaker'
import bars3BottomLeftSolid from '@iconify-icons/heroicons-solid/bars-3-bottom-left'
import fingerPrintSolid from '@iconify-icons/heroicons-solid/finger-print'
import chartBarSquareSolid from '@iconify-icons/heroicons-solid/chart-bar-square'
import plusCircleSolid from '@iconify-icons/heroicons-solid/plus-circle'
import hashtagSolid from '@iconify-icons/heroicons-solid/hashtag'

// Tabler icons for chart types (already using these)
import chartBarTabler from '@iconify-icons/tabler/chart-bar'
import chartLine from '@iconify-icons/tabler/chart-line'
import chartAreaLine from '@iconify-icons/tabler/chart-area-line'
import chartPie from '@iconify-icons/tabler/chart-pie'
import chartDots2 from '@iconify-icons/tabler/chart-dots-2'
import chartBubble from '@iconify-icons/tabler/chart-bubble'
import chartRadar from '@iconify-icons/tabler/chart-radar'
import radar2 from '@iconify-icons/tabler/radar-2'
import chartTreemap from '@iconify-icons/tabler/chart-treemap'
import table from '@iconify-icons/tabler/table'
import calendarStats from '@iconify-icons/tabler/calendar-stats'
import number from '@iconify-icons/tabler/number'
import trendingUp from '@iconify-icons/tabler/trending-up'
import typography from '@iconify-icons/tabler/typography'
import fileText from '@iconify-icons/tabler/file-text'
import infoCircle from '@iconify-icons/tabler/info-circle'
import selector from '@iconify-icons/tabler/selector'

import type { IconRegistry } from './types'

/**
 * Default icon registry with all icons used in drizzle-cube
 */
export const DEFAULT_ICONS: IconRegistry = {
  // Action icons
  close: { icon: xMark, category: 'action' },
  add: { icon: plus, category: 'action' },
  edit: { icon: pencil, category: 'action' },
  delete: { icon: trash, category: 'action' },
  refresh: { icon: arrowPath, category: 'action' },
  copy: { icon: clipboardDocument, category: 'action' },
  duplicate: { icon: documentDuplicate, category: 'action' },
  settings: { icon: cog, category: 'action' },
  filter: { icon: funnel, category: 'action' },
  share: { icon: share, category: 'action' },
  expand: { icon: chevronDown, category: 'action' },
  collapse: { icon: chevronUp, category: 'action' },
  search: { icon: magnifyingGlass, category: 'action' },
  menu: { icon: bars3, category: 'action' },
  run: { icon: playSolid, category: 'action' },
  check: { icon: checkSolid, category: 'action' },
  link: { icon: link, category: 'action' },
  eye: { icon: eye, category: 'action' },
  eyeOff: { icon: eyeSlash, category: 'action' },
  adjustments: { icon: adjustmentsHorizontal, category: 'action' },
  desktop: { icon: computerDesktop, category: 'action' },
  table: { icon: tableCells, category: 'action' },
  sun: { icon: sun, category: 'action' },
  moon: { icon: moon, category: 'action' },
  ellipsisHorizontal: { icon: ellipsisHorizontal, category: 'action' },
  documentText: { icon: documentText, category: 'action' },
  bookOpen: { icon: bookOpen, category: 'action' },
  codeBracket: { icon: codeBracket, category: 'action' },

  // Field type icons (solid for visual distinction)
  measure: { icon: chartBarSolid, category: 'field' },
  dimension: { icon: tagSolid, category: 'field' },
  timeDimension: { icon: calendarSolid, category: 'field' },
  segment: { icon: rectangleGroupSolid, category: 'field' },

  // Chart type icons (Tabler - keeping existing visuals)
  chartBar: { icon: chartBarTabler, category: 'chart' },
  chartLine: { icon: chartLine, category: 'chart' },
  chartArea: { icon: chartAreaLine, category: 'chart' },
  chartPie: { icon: chartPie, category: 'chart' },
  chartScatter: { icon: chartDots2, category: 'chart' },
  chartBubble: { icon: chartBubble, category: 'chart' },
  chartRadar: { icon: chartRadar, category: 'chart' },
  chartRadialBar: { icon: radar2, category: 'chart' },
  chartTreemap: { icon: chartTreemap, category: 'chart' },
  chartTable: { icon: table, category: 'chart' },
  chartActivityGrid: { icon: calendarStats, category: 'chart' },
  chartKpiNumber: { icon: number, category: 'chart' },
  chartKpiDelta: { icon: trendingUp, category: 'chart' },
  chartKpiText: { icon: typography, category: 'chart' },
  chartMarkdown: { icon: fileText, category: 'chart' },

  // Measure type icons (solid)
  measureCount: { icon: bars3BottomLeftSolid, category: 'measure' },
  measureCountDistinct: { icon: fingerPrintSolid, category: 'measure' },
  measureCountDistinctApprox: { icon: chartBarSquareSolid, category: 'measure' },
  measureSum: { icon: plusCircleSolid, category: 'measure' },
  measureAvg: { icon: scaleSolid, category: 'measure' },
  measureMin: { icon: arrowDownCircleSolid, category: 'measure' },
  measureMax: { icon: arrowUpCircleSolid, category: 'measure' },
  measureRunningTotal: { icon: arrowTrendingUpSolid, category: 'measure' },
  measureCalculated: { icon: beakerSolid, category: 'measure' },
  measureNumber: { icon: hashtagSolid, category: 'measure' },

  // State icons
  success: { icon: checkCircle, category: 'state' },
  warning: { icon: exclamationTriangle, category: 'state' },
  error: { icon: exclamationCircle, category: 'state' },
  info: { icon: infoCircle, category: 'state' },
  loading: { icon: arrowPath, category: 'state' },
  sparkles: { icon: sparkles, category: 'state' },

  // Navigation icons
  chevronUp: { icon: chevronUp, category: 'navigation' },
  chevronDown: { icon: chevronDown, category: 'navigation' },
  chevronLeft: { icon: chevronLeft, category: 'navigation' },
  chevronRight: { icon: chevronRight, category: 'navigation' },
  chevronUpDown: { icon: selector, category: 'navigation' },
  arrowUp: { icon: arrowUpCircleSolid, category: 'navigation' },
  arrowDown: { icon: arrowDownCircleSolid, category: 'navigation' },
  arrowRight: { icon: arrowRight, category: 'navigation' },
  arrowPath: { icon: arrowPath, category: 'navigation' },
}
