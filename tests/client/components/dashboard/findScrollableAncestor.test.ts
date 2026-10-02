/**
 * Tests for findScrollableAncestor.
 *
 * This runs from a ref callback at mount, so it must not depend on how much
 * content happens to exist yet. Requiring the ancestor to already overflow made
 * it return null ("use viewport") for hosts that scroll inside a div, which
 * silently disabled drag auto-scroll and left the floating toolbar's visibility
 * listener bound to a window that never scrolls.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { findScrollableAncestor } from '../../../../src/client/components/dashboard/dashboardGridUtils'

/** Build an ancestor chain and return the innermost node. */
function buildChain(specs: Array<{ overflowY?: string; scrollH?: number; clientH?: number }>) {
  let parent: HTMLElement = document.body
  const nodes: HTMLElement[] = []
  for (const spec of specs) {
    const el = document.createElement('div')
    if (spec.overflowY) el.style.overflowY = spec.overflowY
    // jsdom always reports 0 for these, so define them explicitly
    Object.defineProperty(el, 'scrollHeight', { value: spec.scrollH ?? 0, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: spec.clientH ?? 0, configurable: true })
    parent.appendChild(el)
    nodes.push(el)
    parent = el
  }
  const leaf = document.createElement('div')
  parent.appendChild(leaf)
  return { leaf, nodes }
}

afterEach(() => { document.body.innerHTML = '' })

describe('findScrollableAncestor', () => {
  it('returns an ancestor that both declares scrolling and currently overflows', () => {
    const { leaf, nodes } = buildChain([{ overflowY: 'auto', scrollH: 5000, clientH: 900 }])
    expect(findScrollableAncestor(leaf)).toBe(nodes[0])
  })

  it('still finds the scroller before any content has made it overflow', () => {
    // The regression: at mount the dashboard has not rendered yet, so the
    // container declares overflow-y:auto but does not overflow.
    const { leaf, nodes } = buildChain([{ overflowY: 'auto', scrollH: 0, clientH: 0 }])
    expect(findScrollableAncestor(leaf)).toBe(nodes[0])
  })

  it('prefers the ancestor that is actually scrolling over a nearer declared one', () => {
    const { leaf, nodes } = buildChain([
      { overflowY: 'auto', scrollH: 8000, clientH: 900 }, // outer, actually scrolling
      { overflowY: 'auto', scrollH: 0, clientH: 0 },      // inner, only declared
    ])
    expect(findScrollableAncestor(leaf)).toBe(nodes[0])
  })

  it('returns null for viewport scrolling when nothing declares overflow', () => {
    const { leaf } = buildChain([{ overflowY: 'visible' }, { overflowY: 'hidden' }])
    expect(findScrollableAncestor(leaf)).toBeNull()
  })

  it('ignores overflow:hidden ancestors', () => {
    const { leaf } = buildChain([{ overflowY: 'hidden', scrollH: 5000, clientH: 100 }])
    expect(findScrollableAncestor(leaf)).toBeNull()
  })

  it('returns null for a null element', () => {
    expect(findScrollableAncestor(null)).toBeNull()
  })
})
