import { PortletConfig } from '../types.js';
import { ColorPalette } from '../utils/colorPalettes.js';
interface TextPortletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (portlet: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => void;
    portlet?: PortletConfig | null;
    colorPalette?: ColorPalette;
    existingTitles?: string[];
}
export default function TextPortletModal({ isOpen, onClose, onSave, portlet, colorPalette, existingTitles, }: TextPortletModalProps): import("react").JSX.Element | null;
export {};
