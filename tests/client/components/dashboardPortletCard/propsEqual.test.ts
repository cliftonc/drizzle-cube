/**
 * Tests for the DashboardPortletCard memo comparator.
 *
 * The comparator drives React.memo, so a prop that is missing from its key
 * lists is silently invisible: the card would keep rendering its old chrome.
 * `variant` is the live example - a portlet dragged into a group must re-render
 * frameless, which only happens if the comparator notices the change.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  arePropsEqual,
  shallowEqualObjects,
  type DashboardPortletCardProps
} from '../../../../src/client/components/dashboardPortletCard/propsEqual'
import type { PortletConfig } from '../../../../src/client/types'

const portlet: PortletConfig = {
  id: 'p1',
  title: 'Test Portlet',
  query: JSON.stringify({ measures: ['Test.count'] }),
  chartType: 'bar',
  x: 0,
  y: 0,
  w: 6,
  h: 4
}

const NullIcon = () => null

const callbacks = {
  onToggleFilter: vi.fn(),
  onRefresh: vi.fn(),
  onDuplicate: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onOpenFilterConfig: vi.fn()
}

const icons = {
  RefreshIcon: NullIcon,
  EditIcon: NullIcon,
  DeleteIcon: NullIcon,
  CopyIcon: NullIcon,
  FilterIcon: NullIcon
}

const base: DashboardPortletCardProps = {
  portlet,
  editable: true,
  layoutMode: 'rows',
  variant: 'standalone',
  configEagerLoad: false,
  containerProps: { className: 'container' },
  headerProps: { className: 'header' },
  setPortletRef: vi.fn(),
  setPortletComponentRef: vi.fn(),
  callbacks,
  icons
}

describe('shallowEqualObjects', () => {
  it('should treat the same reference as equal', () => {
    const obj = { a: 1 }
    expect(shallowEqualObjects(obj, obj)).toBe(true)
  })

  it('should compare own values one level deep', () => {
    expect(shallowEqualObjects({ a: 1 }, { a: 1 })).toBe(true)
    expect(shallowEqualObjects({ a: 1 }, { a: 2 })).toBe(false)
    expect(shallowEqualObjects({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it('should handle undefined operands', () => {
    expect(shallowEqualObjects(undefined, undefined)).toBe(true)
    expect(shallowEqualObjects({ a: 1 }, undefined)).toBe(false)
    expect(shallowEqualObjects(undefined, { a: 1 })).toBe(false)
  })
})

describe('arePropsEqual', () => {
  it('should return true for the same object reference', () => {
    expect(arePropsEqual(base, base)).toBe(true)
  })

  it('should return true for distinct objects with identical props', () => {
    expect(arePropsEqual({ ...base }, { ...base })).toBe(true)
  })

  it('should return false when only variant differs', () => {
    // Guards the SCALAR_KEYS list: without `variant` there, a portlet dragged
    // into a group keeps its standalone border and header.
    expect(
      arePropsEqual({ ...base }, { ...base, variant: 'groupChild' })
    ).toBe(false)
  })

  it('should return false in both directions when variant changes', () => {
    expect(
      arePropsEqual({ ...base, variant: 'groupChild' }, { ...base, variant: 'standalone' })
    ).toBe(false)
  })

  it('should return false when variant goes from undefined to groupChild', () => {
    const withoutVariant: DashboardPortletCardProps = { ...base, variant: undefined }
    expect(
      arePropsEqual(withoutVariant, { ...base, variant: 'groupChild' })
    ).toBe(false)
  })

  it('should return false when other scalar props differ', () => {
    expect(arePropsEqual({ ...base }, { ...base, editable: false })).toBe(false)
    expect(arePropsEqual({ ...base }, { ...base, layoutMode: 'grid' })).toBe(false)
    expect(arePropsEqual({ ...base }, { ...base, configEagerLoad: true })).toBe(false)
  })

  it('should return false when a reference prop is recreated', () => {
    expect(arePropsEqual({ ...base }, { ...base, portlet: { ...portlet } })).toBe(false)
    expect(arePropsEqual({ ...base }, { ...base, callbacks: { ...callbacks } })).toBe(false)
  })

  it('should ignore containerProps / headerProps recreation when their values match', () => {
    expect(
      arePropsEqual(
        { ...base, containerProps: { className: 'container' }, headerProps: { className: 'header' } },
        { ...base, containerProps: { className: 'container' }, headerProps: { className: 'header' } }
      )
    ).toBe(true)
  })

  it('should return false when containerProps values actually change', () => {
    expect(
      arePropsEqual({ ...base }, { ...base, containerProps: { className: 'other' } })
    ).toBe(false)
  })

  it('should return false when headerProps values actually change', () => {
    expect(
      arePropsEqual({ ...base }, { ...base, headerProps: { className: 'other' } })
    ).toBe(false)
  })
})
