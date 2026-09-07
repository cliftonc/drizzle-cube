import { DashboardFilter, DashboardFilterMapping, CubeMeta, PortletConfig } from '../types.js';
interface PortletFilterConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    dashboardFilters: DashboardFilter[];
    currentMapping: DashboardFilterMapping;
    onSave: (mapping: DashboardFilterMapping) => void;
    portletTitle: string;
    schema?: CubeMeta | null;
    portlet?: PortletConfig | null;
}
export default function PortletFilterConfigModal({ isOpen, onClose, dashboardFilters, currentMapping, onSave, portletTitle, schema, portlet }: PortletFilterConfigModalProps): import("react").JSX.Element | null;
export {};
