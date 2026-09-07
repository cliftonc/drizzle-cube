/**
 * DashboardModals
 *
 * The four dashboard modals (add/edit portlet, add/edit text, portlet filter config,
 * delete confirmation). All read their open/target state from DashboardContext; when
 * closed they render nothing, so always mounting them is harmless.
 */
export default function DashboardModals(): import("react").JSX.Element;
