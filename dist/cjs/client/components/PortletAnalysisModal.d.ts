import { PortletConfig, ColorPalette, DashboardFilter } from '../types.js';
interface PortletAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (portlet: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => void;
    portlet?: PortletConfig | null;
    /** Initial data to display (avoids re-fetching when editing) */
    initialData?: any[];
    title: string;
    submitText: string;
    colorPalette?: ColorPalette;
    /** @deprecated Dashboard filters are no longer merged into the editor - they are applied at execution time */
    dashboardFilters?: DashboardFilter[];
}
/**
 * PortletAnalysisModal - A modal wrapper around AnalysisBuilder for portlet editing
 *
 * This replaces PortletEditModal with the modern AnalysisBuilder interface.
 * Features:
 * - Two-panel layout with results and query builder
 * - Auto-execution of queries
 * - Smart chart defaults
 * - Title input in header
 * - Initial data support (no re-fetch when editing)
 */
export default function PortletAnalysisModal({ isOpen, onClose, onSave, portlet, initialData, title: modalTitle, submitText, colorPalette }: PortletAnalysisModalProps): import("react").JSX.Element;
export {};
