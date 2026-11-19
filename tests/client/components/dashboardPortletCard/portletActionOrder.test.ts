/**
 * Tests for orderPortletActions, the sort behind features.portletActionOrder.
 */

import { describe, it, expect } from 'vitest'
import {
  DEFAULT_PORTLET_ACTION_ORDER,
  orderPortletActions
} from '../../../../src/client/components/dashboardPortletCard/portletActionOrder'
import type { PortletActionId } from '../../../../src/client/types'

const allActions = DEFAULT_PORTLET_ACTION_ORDER.map((id) => ({ id }))
const ids = (actions: { id: PortletActionId }[]) => actions.map((action) => action.id)

describe('orderPortletActions', () => {
  it('should keep the default order when the host sets no order', () => {
    expect(ids(orderPortletActions(allActions))).toEqual(['pauseRefresh', 'refresh', 'expand', 'copy', 'download'])
  })

  it('should keep the default order for an empty host order', () => {
    expect(ids(orderPortletActions(allActions, []))).toEqual(['pauseRefresh', 'refresh', 'expand', 'copy', 'download'])
  })

  it('should follow a host order that lists every action', () => {
    const order: PortletActionId[] = ['copy', 'download', 'pauseRefresh', 'refresh', 'expand']

    expect(ids(orderPortletActions(allActions, order))).toEqual(order)
  })

  it('should put the listed actions first and the others after them in the default order', () => {
    expect(ids(orderPortletActions(allActions, ['download', 'expand']))).toEqual([
      'download',
      'expand',
      'pauseRefresh',
      'refresh',
      'copy'
    ])
  })

  it('should keep the first position of an action that the host lists twice', () => {
    expect(ids(orderPortletActions(allActions, ['copy', 'refresh', 'copy']))).toEqual([
      'copy',
      'refresh',
      'pauseRefresh',
      'expand',
      'download'
    ])
  })

  it('should not add an action that the card does not show', () => {
    const shown = [{ id: 'refresh' as const }, { id: 'copy' as const }]

    expect(ids(orderPortletActions(shown, ['download', 'copy', 'expand', 'refresh']))).toEqual(['copy', 'refresh'])
  })

  it('should not change the input array', () => {
    const actions = [...allActions]

    orderPortletActions(actions, ['download'])

    expect(ids(actions)).toEqual(['pauseRefresh', 'refresh', 'expand', 'copy', 'download'])
  })
})
