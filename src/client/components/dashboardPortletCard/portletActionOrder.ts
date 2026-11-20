/**
 * Order of the view-mode actions of a dashboard card
 * (`features.portletActionOrder`). The card header and the hover strip of a
 * grouped card both use it, so the two places show the same order.
 */

import type { ReactNode } from 'react'
import type { PortletActionId } from '../../types.js'

/** A card action and what it renders. A hidden action renders nothing. */
export interface PortletActionElement {
  id: PortletActionId
  element: ReactNode
}

/** The order of the card actions when the host sets none */
export const DEFAULT_PORTLET_ACTION_ORDER: readonly PortletActionId[] = [
  'pauseRefresh',
  'refresh',
  'expand',
  'copy',
  'download'
]

/**
 * Sorts card actions by the host order. Listed actions come first, in the
 * listed order. The other actions follow in the default order. An action that
 * the host lists twice keeps its first position.
 */
export function orderPortletActions<T extends { id: PortletActionId }>(
  actions: readonly T[],
  order: readonly PortletActionId[] = []
): T[] {
  const rank = (id: PortletActionId) => {
    const listed = order.indexOf(id)
    return listed >= 0 ? listed : order.length + DEFAULT_PORTLET_ACTION_ORDER.indexOf(id)
  }
  return [...actions].sort((a, b) => rank(a.id) - rank(b.id))
}
