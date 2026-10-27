/**
 * Portlet visibility for lazy loading and refresh.
 *
 * A portlet loads the first time it comes near the viewport and keeps its
 * data after it scrolls away. Before the first view its queries are disabled
 * (not skipped), so a refresh made then applies to the first fetch. An
 * interval-refreshed portlet's queries are also disabled while it is
 * scrolled away: TanStack keeps their data, a refresh only records its
 * max-age and marks the query stale, and scrolling back refetches whatever is
 * stale with the max-age it recorded.
 */

import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useScrollContainer } from '../../providers/ScrollContainerContext.js'

export interface PortletVisibility {
  /** Attach to the portlet's root element */
  inViewRef: (node?: Element | null) => void
  /** Whether the portlet's queries exist (in view now or before, or eager) */
  isVisible: boolean
  /** Whether the portlet scrolled away after being in view; its queries are disabled */
  isScrolledAway: boolean
}

export function usePortletVisibility(eagerLoad: boolean): PortletVisibility {
  // Get scroll container from context (null = viewport, element = container scroll)
  const scrollContainer = useScrollContainer()
  const { ref: inViewRef, inView } = useInView({
    root: scrollContainer,
    rootMargin: '500px',      // Start loading 500px before entering viewport (about half screen)
    initialInView: false,     // Start as not visible, let observer determine actual state
    skip: eagerLoad           // Skip observation entirely if eagerLoad is true
  })

  // Once visible, stay "visible" (don't unload data)
  const [hasBeenInView, setHasBeenInView] = useState(false)
  useEffect(() => {
    if (inView) setHasBeenInView(true)
  }, [inView])

  return {
    inViewRef,
    isVisible: eagerLoad || inView || hasBeenInView,
    isScrolledAway: !eagerLoad && hasBeenInView && !inView
  }
}
