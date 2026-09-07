/**
 * DashboardToolbar
 *
 * The bundled action toolbar: the sticky top edit bar (Edit / layout-mode toggle /
 * palette / Add Text / Add Portlet) plus the FloatingEditToolbar that appears when the
 * top bar scrolls out of view.
 *
 * Reads everything from DashboardContext. Renders nothing when `hideToolbar` is set, so
 * a host can either omit this component or pass `hideToolbar` to suppress it.
 */
export default function DashboardToolbar(): import("react").JSX.Element | null;
