import { PortletConfig } from '../types.js';
interface PortletContainerProps {
    portlet: PortletConfig;
    editable?: boolean;
    onEdit?: (portlet: PortletConfig) => void;
    onDelete?: (portletId: string) => void;
    onRefresh?: (portletId: string) => void;
}
export default function PortletContainer({ portlet, editable, onEdit, onDelete, onRefresh }: PortletContainerProps): import("react").JSX.Element;
export {};
