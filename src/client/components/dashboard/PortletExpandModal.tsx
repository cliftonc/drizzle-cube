/**
 * PortletExpandModal
 *
 * The built-in Expand view of a dashboard card. With features.portletExpand on
 * and no onPortletExpand handler, the Expand button opens this modal. It renders
 * the chart from the Expand payload, starting at the view state of the card, and
 * shares the query cache entry of the card. A closed modal renders nothing, so
 * each Expand click mounts a new chart.
 */

import Modal from '../Modal.js'
import AnalyticsPortlet from '../AnalyticsPortlet.js'
import { useDashboardStore } from '../../stores/dashboardStore.js'

export default function PortletExpandModal() {
  const expandedPortlet = useDashboardStore(state => state.expandedPortlet)
  const closeExpandedPortlet = useDashboardStore(state => state.closeExpandedPortlet)

  if (!expandedPortlet) return null

  return (
    <Modal
      isOpen
      onClose={closeExpandedPortlet}
      title={expandedPortlet.title}
      size="fullscreen-mobile"
      noPadding
    >
      <div className="dc:h-full dc:flex dc:flex-col">
        <div className="dc:flex-1 dc:min-h-0 dc:flex dc:flex-col dc:px-2 dc:py-3 dc:md:px-4 dc:md:py-4">
          {/* eagerLoad: the modal is a fixed overlay, outside the dashboard scroll
              container that lazy loading observes, and it is visible at once */}
          <AnalyticsPortlet
            {...expandedPortlet.chartProps}
            eagerLoad
            initialViewState={expandedPortlet.viewState}
            height="100%"
          />
        </div>
      </div>
    </Modal>
  )
}
